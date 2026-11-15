// Build-time only: turns posts/*.md into post objects. Never imported by the
// browser bundle (vite.config.js is the only caller).

import { readdirSync, readFileSync, existsSync, openSync, readSync, closeSync } from 'node:fs';
import { join, basename } from 'node:path';
import { Marked } from 'marked';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** `key: value` lines between two `---` fences; `[a, b]` makes a list. */
function frontMatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (/^\[.*\]$/.test(v)) {
      v = v
        .slice(1, -1)
        .split(',')
        .map((x) => x.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else if (v === 'true' || v === 'false') {
      v = v === 'true';
    } else {
      v = v.replace(/^["']|["']$/g, '');
    }
    meta[kv[1]] = v;
  }
  return { meta, body: src.slice(m[0].length) };
}

/** Width and height of a PNG, GIF or WebP file, read from its header. */
function imageSize(file) {
  let fd;
  try {
    fd = openSync(file, 'r');
    const b = Buffer.alloc(32);
    readSync(fd, b, 0, 32, 0);
    if (b.toString('ascii', 1, 4) === 'PNG') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    if (b.toString('ascii', 0, 3) === 'GIF') return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
    if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
      const kind = b.toString('ascii', 12, 16);
      if (kind === 'VP8L') {
        const v = b.readUInt32LE(21);
        return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 };
      }
      if (kind === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
      if (kind === 'VP8X') return { w: b.readUIntLE(24, 3) + 1, h: b.readUIntLE(27, 3) + 1 };
    }
  } catch {
    /* unknown or missing: the image just has no size attributes */
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
  return null;
}

function makeMarked(imageDir) {
  const marked = new Marked({ gfm: true });
  const img = ({ href, title, text }) => {
    // './picture.png' in a post is public/blog/picture.png
    const local = imageDir && /^\.\/[^/]+$/.test(href) ? imageSize(join(imageDir, basename(href))) : null;
    const size = local ? ` width="${local.w}" height="${local.h}"` : '';
    return `<img src="${esc(href)}" alt="${esc(text || '')}"${size}${title ? ` title="${esc(title)}"` : ''} loading="lazy" decoding="async">`;
  };
  const seen = new Map();
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        let id = slugify(html) || 'section';
        const n = seen.get(id) || 0;
        seen.set(id, n + 1);
        if (n) id += `-${n + 1}`;
        // Post titles are the page's h1, so headings inside start at h2.
        const level = Math.min(6, Math.max(2, depth));
        return `<h${level} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${html}</h${level}>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const external = /^https?:\/\//i.test(href);
        const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${esc(href)}"${title ? ` title="${esc(title)}"` : ''}${attrs}>${text}</a>`;
      },
      image(token) {
        return img(token);
      },
      // An image alone in its paragraph becomes a figure: the title is the
      // caption, and the picture links to the full-size file.
      paragraph({ tokens }) {
        const only = tokens.filter((t) => !(t.type === 'text' && !t.text.trim()));
        if (only.length === 1 && only[0].type === 'image') {
          const t = only[0];
          const caption = t.title ? `<figcaption>${esc(t.title)}</figcaption>` : '';
          return `<figure class="prose__fig"><a href="${esc(t.href)}" target="_blank" rel="noopener">${img({ ...t, title: '' })}</a>${caption}</figure>\n`;
        }
        return `<p>${this.parser.parseInline(tokens)}</p>\n`;
      },
      table(token) {
        // wide tables scroll inside their own box, never the page
        const head = token.header.map((c) => `<th>${this.parser.parseInline(c.tokens)}</th>`).join('');
        const rows = token.rows
          .map((r) => `<tr>${r.map((c) => `<td>${this.parser.parseInline(c.tokens)}</td>`).join('')}</tr>`)
          .join('');
        return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>\n`;
      },
    },
  });
  return marked;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function prettyDate(iso) {
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : String(iso);
}

/**
 * Reads every Markdown file in `dir`. The file name (minus an optional
 * leading date) is the slug: `2026-12-01-my-post.md` -> `my-post`.
 * Posts with `draft: true` are skipped unless `drafts` is set.
 */
export function loadPosts(dir, { drafts = false, imageDir = '' } = {}) {
  if (!existsSync(dir)) return [];
  const posts = [];
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith('.md') || file.startsWith('_')) continue;
    const { meta, body } = frontMatter(readFileSync(join(dir, file), 'utf8'));
    if (meta.draft && !drafts) continue;
    const base = file.replace(/\.md$/, '');
    const dated = base.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
    const slug = slugify(meta.slug || (dated ? dated[2] : base));
    // A time after the date (2026-11-15T18:00) orders posts written on the same day.
    const date = String(meta.date || (dated ? dated[1] : '1970-01-01'));
    const words = body.split(/\s+/).filter(Boolean).length;
    posts.push({
      slug,
      file,
      title: meta.title || slug,
      date,
      dateText: prettyDate(date),
      kind: meta.kind || 'note',
      summary: meta.summary || '',
      tags: Array.isArray(meta.tags) ? meta.tags : meta.tags ? [meta.tags] : [],
      project: meta.project || '',
      figure: meta.figure || '',
      draft: !!meta.draft,
      minutes: Math.max(1, Math.round(words / 210)),
      html: makeMarked(imageDir).parse(body),
    });
  }
  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)));
  return posts;
}
