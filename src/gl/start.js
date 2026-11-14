// Entry point of the 3D layer. Loaded as its own chunk so the text paints
// before three.js has even arrived.

import { AsciiEngine, webglAvailable } from './engine.js';
import { createShaft } from './shaft.js';
import { FIGURES } from './figures/index.js';
import { hiddenNote } from './note.js';

const FAMILY = '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function startScene({ theme, reduced }) {
  if (!webglAvailable()) throw new Error('WebGL 2 is not available');

  // The atlas is drawn with the page font, so wait for it (but not forever).
  try {
    await Promise.race([document.fonts.load('700 16px "JetBrains Mono"'), wait(1800)]);
  } catch {
    /* fall back to whatever monospace the system has */
  }

  const engine = new AsciiEngine({
    layer: document.getElementById('ascii-layer'),
    family: FAMILY,
    theme,
    reducedMotion: reduced,
    ambient: createShaft(),
  });

  document.querySelectorAll('[data-figure]').forEach((el) => {
    const make = FIGURES[el.dataset.figure];
    if (make) engine.addStage(el, make);
  });

  engine.setNote(document.querySelector('[data-glyph-slot]'), hiddenNote());

  // The caller starts the loop (after the boot sequence), so nothing is
  // rendered behind a screen nobody can see through.

  // If the web font lands after the first atlas was drawn, redraw it.
  document.fonts.ready.then(() => engine.layout(true));
  return engine;
}
