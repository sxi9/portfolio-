import './styles.css';
import { profile, themes } from './content.js';
import { applyTheme, currentTheme, nextTheme, onTheme } from './ui/theme.js';
import { runBoot } from './ui/boot.js';
import { initNav } from './ui/nav.js';
import { initReveal } from './ui/reveal.js';
import { initTyped } from './ui/typed.js';
import { initTilt } from './ui/tilt.js';
import { initArchive } from './ui/archive.js';
import { initTagSphere } from './ui/tagsphere.js';
import { initTerminal } from './ui/terminal.js';
import { initShots } from './ui/shots.js';
import { initPulse } from './ui/pulse.js';

window.__sxi9 = true; // tells the inline script in index.html that we made it

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let engine = null;

applyTheme(currentTheme(), { persist: false });
onTheme((t) => {
  engine?.setTheme(t);
  engine?.glitch(0.55, 2.6);
});

initNav();
initArchive();
initTilt({ reduced, seed: profile.handle });
initTagSphere({ reduced });
initShots({ reduced });
initPulse();
const terminal = initTerminal({ getEngine: () => engine });

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action], [data-copy]');
  if (!el) return;
  if (el.dataset.copy) {
    navigator.clipboard?.writeText(el.dataset.copy).then(
      () => {
        el.textContent = 'copied';
        el.classList.add('is-done');
        setTimeout(() => {
          el.textContent = 'copy';
          el.classList.remove('is-done');
        }, 1600);
      },
      () => {},
    );
    return;
  }
  const action = el.dataset.action;
  if (action === 'theme') nextTheme();
  else if (action === 'terminal') terminal.toggle();
  else if (action === 'terminal-close') terminal.close();
});

// The 3D layer is a separate chunk: fetch it while the boot sequence plays.
const scene = import('./gl/start.js')
  .then(({ startScene }) => startScene({ theme: themes[currentTheme()], reduced }))
  .then((e) => {
    engine = e;
    if (import.meta.env.DEV) window.__engine = e;
    return e;
  })
  .catch((err) => {
    console.warn('[sxi9] 3D layer disabled:', err.message);
    document.documentElement.classList.add('no-webgl');
    return null;
  });

runBoot().then((played) => {
  initReveal({ reduced });
  initTyped(profile.typed, { reduced });
  scene.then((e) => {
    if (!e) return;
    if (!document.hidden) e.start();
    if (played) e.glitch(0.85, 1.5);
  });
});
