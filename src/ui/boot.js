// The boot sequence: a second and a half of firmware theatre while the 3D
// chunk downloads. Plays once per tab, never with reduced motion, and any
// key, click or tap skips it. index.html decides whether it runs.

const LINES = [
  'sxi9 firmware 2026.11 / cold start',
  '',
  '[ <b>ok</b> ] mount /intel',
  '[ <b>ok</b> ] load glyph atlas: jetbrains mono',
  '[ <b>ok</b> ] compile shaders: cells, glyph',
  '[ <b>ok</b> ] link figures: globe onion board phone katana arm cluster fleet rack dish',
  '[ <b>ok</b> ] anchor character grid to document',
  '[ <b>ok</b> ] open shaft / depth 0000 m',
  '',
  'ready. <b>welcome.</b>',
];

export function runBoot() {
  const root = document.documentElement;
  const el = document.querySelector('[data-boot]');
  if (!el || !root.classList.contains('booting')) {
    root.classList.remove('booting');
    return Promise.resolve(false);
  }
  const log = el.querySelector('[data-boot-log]');

  return new Promise((resolve) => {
    let i = 0;
    let timer = 0;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      window.removeEventListener('keydown', finish);
      window.removeEventListener('pointerdown', finish);
      try {
        sessionStorage.setItem('sxi9-booted', '1');
      } catch {
        /* ignore */
      }
      el.classList.add('is-done');
      root.classList.remove('booting');
      setTimeout(() => el.remove(), 600);
      resolve(true);
    };

    const step = () => {
      if (i >= LINES.length) {
        timer = setTimeout(finish, 420);
        return;
      }
      log.innerHTML += `${LINES[i++]}\n`;
      timer = setTimeout(step, 70 + Math.random() * 110);
    };

    window.addEventListener('keydown', finish);
    window.addEventListener('pointerdown', finish);
    timer = setTimeout(step, 120);
  });
}
