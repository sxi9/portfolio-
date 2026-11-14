import { themes } from '../content.js';
import { allFound } from './flags.js';

const KEYS = ['ink', 'hot', 'cool', 'bg'];
const listeners = new Set();
const root = document.documentElement;

/** Palettes on offer right now: locked ones appear once every flag is found. */
export const themeNames = () => Object.keys(themes).filter((k) => !themes[k].locked || allFound());

export function currentTheme() {
  const name = root.dataset.palette;
  return themeNames().includes(name) ? name : themeNames()[0];
}

export function applyTheme(name, { persist = true } = {}) {
  const names = themeNames();
  const key = names.includes(name) ? name : names[0];
  const t = themes[key];
  root.dataset.palette = key;
  for (const k of KEYS) root.style.setProperty(`--${k}`, t[k]);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.bg);
  document.querySelectorAll('[data-theme-name]').forEach((el) => (el.textContent = key));
  if (persist) {
    try {
      const { ink, hot, cool, bg } = t;
      localStorage.setItem('sxi9-theme', JSON.stringify({ name: key, ink, hot, cool, bg }));
    } catch {
      /* private mode: the theme just will not persist */
    }
  }
  listeners.forEach((fn) => fn(t, key));
  return key;
}

export function nextTheme() {
  const names = themeNames();
  const i = names.indexOf(currentTheme());
  return applyTheme(names[(i + 1) % names.length]);
}

export function onTheme(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
