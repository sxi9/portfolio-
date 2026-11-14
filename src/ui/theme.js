import { themes } from '../content.js';

const KEYS = ['ink', 'hot', 'cool', 'bg'];
const listeners = new Set();
const root = document.documentElement;

export const themeNames = Object.keys(themes);

export function currentTheme() {
  const name = root.dataset.palette;
  return themes[name] ? name : themeNames[0];
}

export function applyTheme(name, { persist = true } = {}) {
  const key = themes[name] ? name : themeNames[0];
  const t = themes[key];
  root.dataset.palette = key;
  for (const k of KEYS) root.style.setProperty(`--${k}`, t[k]);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.bg);
  document.querySelectorAll('[data-theme-name]').forEach((el) => (el.textContent = key));
  if (persist) {
    try {
      localStorage.setItem('sxi9-theme', JSON.stringify({ name: key, ...t }));
    } catch {
      /* private mode: the theme just will not persist */
    }
  }
  listeners.forEach((fn) => fn(t, key));
  return key;
}

export function nextTheme() {
  const i = themeNames.indexOf(currentTheme());
  return applyTheme(themeNames[(i + 1) % themeNames.length]);
}

export function onTheme(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
