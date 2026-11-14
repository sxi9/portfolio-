import { defineConfig } from 'vite';
import { fileURLToPath, pathToFileURL } from 'node:url';

const renderPath = fileURLToPath(new URL('./src/render.js', import.meta.url));

// The page content is rendered to static HTML at dev/build time from
// src/content.js, so it is there before any JavaScript runs.
function prerender() {
  let server;
  return {
    name: 'prerender-content',
    configureServer(s) {
      server = s;
    },
    transformIndexHtml: {
      order: 'pre',
      async handler(html) {
        if (!html.includes('<!--app-->')) return html;
        const mod = server
          ? await server.ssrLoadModule('/src/render.js')
          : await import(pathToFileURL(renderPath).href);
        return html.replace('<!--app-->', mod.renderApp());
      },
    },
  };
}

export default defineConfig({
  // Relative asset URLs: the build works at a domain root (Vercel, Netlify)
  // and under a sub-path (GitHub Pages project sites) without changes.
  base: './',
  plugins: [prerender()],
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
  server: { host: '127.0.0.1', port: 5173 },
  preview: { host: '127.0.0.1', port: 4173 },
});
