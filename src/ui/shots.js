// Screenshots that arrive as text. Each [data-shot] holds a real <img>; a
// canvas on top draws the same picture in characters, and is erased cell by
// cell to "decode" it. Without JavaScript the plain image is simply shown.

import { onTheme } from './theme.js';

const RAMP = ' .:-=+*#%@';
const FONT = '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';

export function initShots({ reduced }) {
  const els = [...document.querySelectorAll('[data-shot]')];
  if (!els.length) return;
  const canHover = matchMedia('(hover: hover)').matches;
  const shots = [];

  const colours = () => {
    const cs = getComputedStyle(document.documentElement);
    return { ink: cs.getPropertyValue('--ink').trim() || '#3dff9a', bg: cs.getPropertyValue('--bg').trim() || '#020604' };
  };

  const paintCell = (s, i, c) => {
    const x = (i % s.cols) * s.cw;
    const y = Math.floor(i / s.cols) * s.ch;
    const { ctx } = s;
    ctx.globalAlpha = 1;
    ctx.fillStyle = c.bg;
    ctx.fillRect(x, y, s.cw, s.ch);
    const g = s.glyph[i];
    if (!g) return;
    ctx.globalAlpha = 0.42 + 0.58 * s.lum[i];
    ctx.fillStyle = c.ink;
    ctx.fillText(RAMP[g], x + s.cw / 2, y + s.base);
  };

  /** Brings the canvas to the state "the first k cells in `order` are erased". */
  const apply = (s, k) => {
    const c = colours();
    if (k > s.k) {
      for (let j = s.k; j < k; j++) {
        const i = s.order[j];
        s.ctx.clearRect((i % s.cols) * s.cw, Math.floor(i / s.cols) * s.ch, s.cw, s.ch);
      }
    } else {
      for (let j = k; j < s.k; j++) paintCell(s, s.order[j], c);
    }
    s.k = k;
  };

  const tick = (s) => {
    s.raf = 0;
    if (!s.ready) return;
    const n = s.cols * s.rows;
    const goal = s.target ? n : 0;
    if (s.k === goal) return;
    const step = reduced ? n : Math.max(6, Math.ceil(n / 24));
    apply(s, s.k < goal ? Math.min(goal, s.k + step) : Math.max(goal, s.k - step));
    if (s.k !== goal) s.raf = requestAnimationFrame(() => tick(s));
  };

  const setTarget = (s, on) => {
    s.target = on ? 1 : 0;
    s.el.classList.toggle('is-decoded', !!on);
    if (s.hint) s.hint.textContent = on ? 'the real thing' : canHover ? 'hover to decode' : 'tap to decode';
    if (!s.raf) s.raf = requestAnimationFrame(() => tick(s));
  };
  const refresh = (s) => setTarget(s, s.hover || s.pinned || s.autoOn);

  const build = (s) => {
    const { frame, img, canvas } = s;
    const w = frame.clientWidth;
    const h = frame.clientHeight;
    if (w < 8 || h < 8 || !img.naturalWidth) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    s.cw = Math.max(3, Math.round(s.cell * dpr));
    s.ch = Math.round(s.cw * 1.9);
    s.cols = Math.ceil(canvas.width / s.cw);
    s.rows = Math.ceil(canvas.height / s.ch);
    const n = s.cols * s.rows;

    // One sample per character cell, cropped the way object-fit: cover crops.
    const tmp = document.createElement('canvas');
    tmp.width = s.cols;
    tmp.height = s.rows;
    const t = tmp.getContext('2d', { willReadFrequently: true });
    const ir = img.naturalWidth / img.naturalHeight;
    const fr = w / h;
    let sw = img.naturalWidth;
    let sh = img.naturalHeight;
    if (ir > fr) sw = sh * fr;
    else sh = sw / fr;
    let data;
    try {
      t.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, s.cols, s.rows);
      data = t.getImageData(0, 0, s.cols, s.rows).data;
    } catch {
      canvas.remove(); // an image we may not read: leave the picture as it is
      return;
    }

    // Stretch the contrast: a dark dashboard should still fill the ramp.
    const lum = new Float32Array(n);
    const sorted = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      lum[i] = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
      sorted[i] = lum[i];
    }
    sorted.sort();
    const lo = sorted[Math.floor(n * 0.04)];
    const hi = Math.max(lo + 0.05, sorted[Math.floor(n * 0.985)]);
    s.lum = lum;
    s.glyph = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const v = Math.min(1, Math.max(0, (lum[i] - lo) / (hi - lo)));
      lum[i] = v;
      s.glyph[i] = Math.round(Math.pow(v, 0.85) * (RAMP.length - 1));
    }

    // Decode order: a left-to-right sweep with a ragged edge.
    const key = new Float32Array(n);
    let seed = 1234567;
    for (let i = 0; i < n; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      key[i] = 0.72 * ((i % s.cols) / s.cols) + 0.28 * (seed / 4294967296);
    }
    s.order = Uint32Array.from({ length: n }, (_, i) => i).sort((a, b) => key[a] - key[b]);

    const { ctx } = s;
    ctx.font = `700 ${Math.round(s.ch * 0.86)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    s.base = Math.round(s.ch * 0.78);

    const c = colours();
    const erased = s.target ? n : 0;
    for (let j = erased; j < n; j++) paintCell(s, s.order[j], c);
    s.k = erased;
    s.ready = true;
    canvas.classList.add('is-ready');
  };

  for (const el of els) {
    const frame = el.querySelector('.shot__frame');
    const img = frame?.querySelector('img');
    if (!img) continue;
    const canvas = document.createElement('canvas');
    canvas.className = 'shot__ascii';
    canvas.setAttribute('aria-hidden', 'true');
    frame.appendChild(canvas);
    const s = {
      el,
      frame,
      img,
      canvas,
      ctx: canvas.getContext('2d'),
      hint: el.querySelector('[data-shot-hint]'),
      cell: parseFloat(el.dataset.cell || '') || 6.2,
      auto: el.hasAttribute('data-shot-auto'),
      ready: false,
      k: 0,
      target: 0,
      raf: 0,
      hover: false,
      pinned: false,
      autoOn: false,
      visible: false,
    };
    shots.push(s);
    if (s.hint) s.hint.textContent = canHover ? 'hover to decode' : 'tap to decode';

    const rebuild = () => {
      if (img.complete && img.naturalWidth) build(s);
    };
    img.addEventListener('load', rebuild);
    rebuild();
    let rt = 0;
    new ResizeObserver(() => {
      clearTimeout(rt);
      rt = setTimeout(rebuild, 150);
    }).observe(frame);

    frame.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      s.hover = true;
      refresh(s);
    });
    frame.addEventListener('pointerleave', () => {
      s.hover = false;
      refresh(s);
    });
    if (!s.auto) {
      // a click or tap pins the decoded state; Enter and Space do the same
      frame.addEventListener('click', () => {
        s.pinned = !s.pinned;
        refresh(s);
      });
      frame.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        s.pinned = !s.pinned;
        refresh(s);
      });
    } else if (!reduced) {
      // the portrait decodes by itself now and then, while it is on screen
      new IntersectionObserver(([en]) => (s.visible = en.isIntersecting)).observe(frame);
      const cycle = () => {
        if (s.visible && !document.hidden) {
          s.autoOn = !s.autoOn;
          refresh(s);
        }
        setTimeout(cycle, s.autoOn ? 2800 : 6500);
      };
      setTimeout(cycle, 4200);
    }
  }

  // The characters take the theme's ink, so a theme change repaints them.
  onTheme(() => {
    for (const s of shots) {
      if (!s.ready) continue;
      const c = colours();
      const n = s.cols * s.rows;
      for (let j = s.k; j < n; j++) paintCell(s, s.order[j], c);
    }
  });
}
