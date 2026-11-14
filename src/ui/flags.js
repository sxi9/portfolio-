// The three hidden flags. Only hashes live here, so reading this file does
// not hand them over: one is in the page source, one behind the terminal,
// one in the ASCII layer.

const KEY = 'sxi9-flags';
const HASHES = { '299574dd': 1, c3e24873: 2, '271f885e': 3 };
export const TOTAL = 3;

export function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function found() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return new Set(Array.isArray(list) ? list.filter((n) => n >= 1 && n <= TOTAL) : []);
  } catch {
    return new Set();
  }
}

export const allFound = () => found().size >= TOTAL;

/** Checks a submitted flag. Returns which one it was, if any. */
export function submit(value) {
  const n = HASHES[fnv1a(String(value).trim())];
  if (!n) return { ok: false };
  const have = found();
  const already = have.has(n);
  have.add(n);
  try {
    localStorage.setItem(KEY, JSON.stringify([...have].sort()));
  } catch {
    /* progress just will not persist */
  }
  return { ok: true, n, already, count: have.size, complete: have.size >= TOTAL };
}
