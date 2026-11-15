// The hero banner. SAMURAI, in figlet letters, scrambles into a samurai who
// runs across the banner; the name re-forms in the dust behind him. It loops
// while the hero is on screen. With reduced motion the name simply stays.

import { SAMURAI_W, SAMURAI_H, SAMURAI_FRAMES } from './samurai-frames.js';

const NOISE = '!<>-_\\/[]{}=+*^?#%@';
const HOLD = 3600; // ms the name stays put
const MORPH = 750; // ms for the name to turn into the samurai
const SPEED = 26; // columns per second
const FPS = 18; // run-cycle frames per second
const SETTLE = 160; // ms a revealed cell flickers before it settles
const START_X = 0; // where he forms, in columns
const BLADE = 3; // columns from his sprite's left edge to the blade tip

const DUST = ['.', ',', '`', "'"];

function hash(a, b, c) {
  let h = (a * 374761393 + b * 668265263 + c * 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function initBanner({ reduced }) {
  const el = document.querySelector('[data-banner]');
  if (!el || reduced || !SAMURAI_FRAMES.length) return;

  const lines = el.textContent.split('\n');
  const cols = Math.max(...lines.map((l) => l.length));
  const rows = Math.max(lines.length, SAMURAI_H);
  const name = Array.from({ length: rows }, (_, r) => (lines[r - (rows - lines.length)] || '').padEnd(cols).split(''));
  const top = rows - SAMURAI_H; // grid row of the sprite's first row
  const sprite = SAMURAI_FRAMES.map((f) => f.map((l) => l.padEnd(SAMURAI_W).split('')));
  const groundRow = SAMURAI_H - 1;

  const grid = Array.from({ length: rows }, () => new Array(cols).fill(' '));
  const noise = () => NOISE[(Math.random() * NOISE.length) | 0];
  let dust = [];
  let lastFrame = -1;
  let cycle = 0;
  let start = 0;
  let raf = 0;
  let running = false;
  let shown = '';

  const spriteAt = (f, x, r, c) => {
    const sc = c - x;
    const sr = r - top;
    if (sr < 0 || sr >= SAMURAI_H || sc < 0 || sc >= SAMURAI_W) return ' ';
    return sprite[f][sr][sc];
  };

  const draw = () => {
    const text = grid.map((row) => row.join('')).join('\n');
    if (text !== shown) {
      el.textContent = text;
      shown = text;
    }
  };

  const tick = (now) => {
    raf = running ? requestAnimationFrame(tick) : 0;
    const t = now - start;

    // 1. the name, at rest
    if (t < HOLD) {
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) grid[r][c] = name[r][c];
      draw();
      return;
    }

    // 2. the letters scramble into the samurai, cell by cell, left to right
    if (t < HOLD + MORPH) {
      const u = (t - HOLD) / MORPH;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const a = name[r][c];
          const b = spriteAt(0, START_X, r, c);
          if (a === b) {
            grid[r][c] = a;
            continue;
          }
          const at = 0.12 + 0.55 * (c / cols) + 0.25 * hash(r, c, cycle);
          grid[r][c] = u < at - 0.16 ? a : u < at ? noise() : b;
        }
      }
      draw();
      return;
    }

    // 3. he runs; behind the blade tip the name comes back
    const e = t - HOLD - MORPH;
    const x = START_X + Math.floor((e / 1000) * SPEED);
    if (x > cols) {
      cycle++;
      start = now; // loop
      dust = [];
      lastFrame = -1;
      return;
    }
    const f = Math.floor((e / 1000) * FPS) % sprite.length;

    // a planted foot kicks up dust behind it
    if (f !== lastFrame) {
      lastFrame = f;
      const g = sprite[f][groundRow];
      for (let sc = 0; sc < SAMURAI_W; sc++) {
        if (g[sc] !== ' ' && Math.random() < 0.5) dust.push({ r: rows - 1, c: x + sc - 1, born: now });
      }
      if (Math.random() < 0.6) dust.push({ r: rows - 2, c: x + 10 + ((Math.random() * 6) | 0), born: now, up: true });
    }
    dust = dust.filter((d) => now - d.born < 520);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // column c is revealed once the blade tip has passed it
        const reveal = ((c - START_X - BLADE) / SPEED) * 1000;
        let ch = ' ';
        if (e >= reveal + SETTLE) ch = name[r][c];
        else if (e >= reveal && name[r][c] !== ' ') ch = noise();
        grid[r][c] = ch;
      }
    }
    for (const d of dust) {
      const age = (now - d.born) / 520;
      const c = d.c - Math.floor(age * 3);
      const r = d.up ? d.r - Math.floor(age * 2) : d.r;
      if (r >= 0 && c >= 0 && c < cols && grid[r][c] === ' ') grid[r][c] = DUST[Math.min(DUST.length - 1, (age * DUST.length) | 0)];
    }
    for (let r = top; r < rows; r++) {
      for (let c = Math.max(0, x); c < Math.min(cols, x + SAMURAI_W); c++) {
        const s = spriteAt(f, x, r, c);
        if (s !== ' ') grid[r][c] = s;
      }
    }
    draw();
  };

  const play = () => {
    if (running) return;
    running = true;
    start = performance.now();
    raf = requestAnimationFrame(tick);
  };
  const pause = () => {
    running = false;
    cancelAnimationFrame(raf);
    // leave the name, not half a samurai, on screen
    el.textContent = shown = name.map((row) => row.join('')).join('\n');
  };

  let visible = true;
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible && !document.hidden) play();
    else pause();
  }).observe(el);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else if (visible) play();
  });
}
