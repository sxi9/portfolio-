import * as THREE from 'three';

// Glyphs used for silhouettes. The order is fixed: the cells shader emits
// (levels + 0..3) for vertical, forward diagonal, horizontal, back diagonal.
export const EDGE_GLYPHS = ['|', '/', '-', '\\'];

// Named character ramps, darkest to brightest. `measured` is built at runtime:
// every candidate is drawn in the page font and sorted by real ink coverage,
// so that ramp stays monotonic whatever font ends up being used.
export const CHARSETS = {
  classic: ' .:-=+*#%@',
  measured: null,
  dense: " .'`^,:;~-_+<>i!lI?/|()1{}[]rcvunxzjftLCJUYXZO0Qoahkbdpqwm*WMB8&%$#@",
  binary: ' .:01',
  minimal: ' .:+#',
};
export const DEFAULT_CHARSET = 'classic';

const AUTO_CANDIDATES =
  ".,:;-~=+*!ilcrtvxzsoeanu17JYTLCFS235Z4AEPVXKUHG69ODQRB0NM8W#%&@$";

function fontString(weight, px, family) {
  return `${weight} ${px}px ${family}`;
}

function drawGlyphs(ctx, glyphs, cellW, cellH, baseline) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = '#fff';
  for (let i = 0; i < glyphs.length; i++) {
    if (glyphs[i] === ' ') continue;
    ctx.save();
    ctx.beginPath();
    ctx.rect(i * cellW, 0, cellW, cellH);
    ctx.clip();
    ctx.fillText(glyphs[i], i * cellW + cellW / 2, baseline);
    ctx.restore();
  }
}

function measureCoverage(ctx, count, cellW, cellH) {
  const data = ctx.getImageData(0, 0, count * cellW, cellH).data;
  const cover = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    let sum = 0;
    for (let y = 0; y < cellH; y++) {
      let o = (y * count * cellW + i * cellW) * 4;
      for (let x = 0; x < cellW; x++, o += 4) sum += data[o];
    }
    cover[i] = sum / (255 * cellW * cellH);
  }
  return cover;
}

/**
 * Builds the glyph atlas texture: one row of cells, ramp glyphs first, then
 * the four edge glyphs. Cell size is in device pixels so the final pass can
 * copy texels 1:1 and glyphs stay as sharp as real text.
 */
export function buildAtlas({ cellW, cellH, family, weight = 700, levels = 14, charset = DEFAULT_CHARSET }) {
  const fontPx = Math.max(6, Math.round(cellH * 0.86));
  const scratch = document.createElement('canvas');
  const sctx = scratch.getContext('2d', { willReadFrequently: true });

  const setup = (ctx) => {
    ctx.font = fontString(weight, fontPx, family);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
  };

  // Vertically centre the font box inside the cell.
  setup(sctx);
  const m = sctx.measureText('M');
  const ascent = m.fontBoundingBoxAscent || fontPx * 0.95;
  const descent = m.fontBoundingBoxDescent || fontPx * 0.25;
  const baseline = Math.round((cellH + ascent - descent) / 2);

  let ramp;
  const fixed = CHARSETS[charset];
  if (fixed) {
    ramp = [...fixed];
  } else {
    const cands = [...AUTO_CANDIDATES];
    scratch.width = cands.length * cellW;
    scratch.height = cellH;
    setup(sctx);
    drawGlyphs(sctx, cands, cellW, cellH, baseline);
    const cover = measureCoverage(sctx, cands.length, cellW, cellH);
    const order = cands.map((ch, i) => ({ ch, c: cover[i] })).sort((a, b) => a.c - b.c);
    const max = order[order.length - 1].c || 1;
    // Level 0 is always blank. The rest are spread evenly over ink coverage,
    // with a slight bias so the darkest levels are not skipped.
    ramp = [' '];
    let last = -1;
    for (let k = 1; k < levels; k++) {
      const t = Math.pow(k / (levels - 1), 0.9) * max;
      let best = -1;
      let bestD = Infinity;
      for (let i = last + 1; i < order.length; i++) {
        const d = Math.abs(order[i].c - t);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      if (best < 0) break;
      ramp.push(order[best].ch);
      last = best;
    }
  }

  // Layout of the atlas row: ramp, then the four edge glyphs, then every
  // printable ASCII character (33..126) so the engine can also set real text.
  const text = Array.from({ length: 94 }, (_, i) => String.fromCharCode(33 + i));
  const glyphs = [...ramp, ...EDGE_GLYPHS, ...text];
  const canvas = document.createElement('canvas');
  canvas.width = glyphs.length * cellW;
  canvas.height = cellH;
  const ctx = canvas.getContext('2d');
  setup(ctx);
  drawGlyphs(ctx, glyphs, cellW, cellH, baseline);

  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;

  return {
    texture,
    levels: ramp.length,
    textBase: ramp.length + EDGE_GLYPHS.length,
    count: glyphs.length,
    ramp: ramp.join(''),
    fontPx,
  };
}
