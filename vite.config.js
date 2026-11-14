import { defineConfig } from 'vite';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadPosts } from './build/posts.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const postsDir = join(root, 'posts');
const START = '<!--app:start-->';
const END = '<!--app:end-->';

const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * Renders the whole site to static HTML from src/content.js and posts/*.md,
 * so every page is readable before (and without) any JavaScript.
 *
 *   index.html          <- the home page, injected into the shell
 *   blog/index.html     <- derived from the built home page
 *   blog/<slug>.html    <- one per Markdown file in posts/
 */
function site() {
  let server;

  const load = async () => {
    const [render, data] = server
      ? await Promise.all([server.ssrLoadModule('/src/render.js'), server.ssrLoadModule('/src/pulse-data.js')])
      : await Promise.all([
          import(pathToFileURL(join(root, 'src/render.js')).href),
          import(pathToFileURL(join(root, 'src/pulse-data.js')).href),
        ]);
    return { render, pulse: data.pulseSnapshot, posts: loadPosts(postsDir, { drafts: !!server }) };
  };

  /** Turns the home page's shell into another page one folder down. */
  const derive = (shell, { body, meta, prefix }) => {
    const a = shell.indexOf(START);
    const b = shell.indexOf(END);
    const head = a >= 0 ? shell.slice(0, a) : shell.slice(0, shell.indexOf('<!--app-->'));
    const tail = a >= 0 ? shell.slice(b + END.length) : shell.slice(shell.indexOf('<!--app-->') + '<!--app-->'.length);
    const fix = (s) =>
      s
        .replace(/="\.\//g, `="${prefix}`)
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${attr(meta.title)}</title>`)
        .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${attr(meta.description)}$2`)
        .replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/, `$1${attr(meta.title)}$2`)
        .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${attr(meta.description)}$2`)
        .replace(/<html ([^>]*)>/, `<html $1 data-page="blog" data-home="${prefix}">`);
    return `${fix(head)}${START}${body}${END}${fix(tail)}`;
  };

  /** Every blog page as [fileName, html], given a shell and a path prefix. */
  const blogPages = ({ render, posts }, shell, prefix) => {
    const pages = [
      ['index.html', derive(shell, { body: render.renderBlogIndex({ posts }), meta: render.pageMeta('index'), prefix })],
    ];
    for (const post of posts) {
      pages.push([
        `${post.slug}.html`,
        derive(shell, { body: render.renderPost({ post, posts }), meta: render.pageMeta('post', post), prefix }),
      ]);
    }
    return pages;
  };

  return {
    name: 'sxi9-site',

    configureServer(s) {
      server = s;
      // a new or edited post reloads the page
      s.watcher.add(postsDir);
      const reload = (file) => {
        if (file.startsWith(postsDir)) (s.hot || s.ws).send({ type: 'full-reload' });
      };
      s.watcher.on('add', reload).on('change', reload).on('unlink', reload);

      // /blog/, /blog/index.html and /blog/<slug>.html in development
      s.middlewares.use(async (req, res, next) => {
        const url = (req.url || '').split('?')[0];
        const m = url.match(/^\/blog\/(?:([a-z0-9-]+)\.html)?$/);
        if (!m) return next();
        try {
          const ctx = await load();
          const shell = readFileSync(join(root, 'index.html'), 'utf8');
          const page = blogPages(ctx, shell, '/').find(([name]) => name === `${m[1] || 'index'}.html`);
          if (!page) return next();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(await s.transformIndexHtml(url, page[1]));
        } catch (err) {
          next(err);
        }
      });
    },

    transformIndexHtml: {
      order: 'pre',
      async handler(html) {
        if (!html.includes('<!--app-->')) return html;
        const { render, posts, pulse } = await load();
        return html.replace('<!--app-->', `${START}${render.renderApp({ posts, pulse })}${END}`);
      },
    },

    // After the bundle is on disk the home page knows its hashed assets, so
    // the blog pages are cut from it.
    async writeBundle(options) {
      const out = options.dir || join(root, 'dist');
      const shell = readFileSync(join(out, 'index.html'), 'utf8');
      const ctx = await load();
      mkdirSync(join(out, 'blog'), { recursive: true });
      for (const [name, html] of blogPages(ctx, shell, '../')) writeFileSync(join(out, 'blog', name), html);
      this.info?.(`blog: ${ctx.posts.length} post(s)`);
    },
  };
}

export default defineConfig({
  // Relative asset URLs: the build works at a domain root (Vercel, Netlify)
  // and under a sub-path (GitHub Pages project sites) without changes.
  base: './',
  plugins: [site()],
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
  server: { host: '127.0.0.1', port: 5173 },
  preview: { host: '127.0.0.1', port: 4173 },
});
