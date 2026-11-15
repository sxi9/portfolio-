// Regenerates src/ui/samurai-frames.js: the samurai that runs across the hero
// banner. A posed skeleton is drawn as line art, one character per cell, with
// the glyph chosen from each stroke's direction ( / | \ _ - ), the same
// vocabulary as the figlet lettering it morphs out of.
//
//   node scripts/build-samurai.mjs          (writes the file)
//   node scripts/build-samurai.mjs --print  (also prints the frames)

import { writeFileSync } from 'node:fs';

const COLS = 30;
const ROWS = 10;
const FRAMES = 12;
const CW = 10; // a character cell in drawing units (cells are twice as tall as wide)
const CH = 20;
const rad = (d) => (d * Math.PI) / 180;

function pose(p) {
  const f = 2 * Math.PI * p;
  const ground = ROWS * CH - 6;
  const thigh = 44;
  const shin = 46;
  const bob = 8 * Math.sin(f) ** 2; // highest in flight, lowest at mid-stance
  const legs = [0, Math.PI].map((off) => {
    const s = Math.sin(f + off);
    const c = Math.cos(f + off);
    return { th: rad(38 * s + 4), kn: rad(14 + 96 * Math.max(0, c) ** 1.4) };
  });
  const hip = { x: COLS * CW * 0.6, y: ground - (thigh + shin) * 0.9 - bob };
  const lean = rad(30);
  const torso = 56;
  const neck = { x: hip.x + Math.sin(lean) * torso, y: hip.y - Math.cos(lean) * torso };
  const shoulder = { x: hip.x + Math.sin(lean) * (torso - 10), y: hip.y - Math.cos(lean) * (torso - 10) };
  const head = { x: neck.x + 9, y: neck.y - 12 };
  return { f, ground, thigh, shin, legs, hip, lean, neck, shoulder, head };
}

/** Two-segment limb: a1 from straight down (+ = forward), a2 bends back. */
function limb(from, a1, l1, a2, l2) {
  const k = { x: from.x + Math.sin(a1) * l1, y: from.y + Math.cos(a1) * l1 };
  const a = a1 - a2;
  return [k, { x: k.x + Math.sin(a) * l2, y: k.y + Math.cos(a) * l2 }, a];
}

function frame(p) {
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(' '));
  const put = (r, c, ch) => {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) grid[r][c] = ch;
  };
  const stroke = (a, b, force) => {
    const ang = ((Math.atan2(-(b.y - a.y), b.x - a.x) * 180) / Math.PI + 360) % 180;
    const x0 = a.x / CW;
    const y0 = a.y / CH;
    const x1 = b.x / CW;
    const y1 = b.y / CH;
    const steps = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 3) + 1;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      const r = Math.floor(y);
      let g;
      if (force) g = force;
      else if (ang < 22 || ang >= 158) g = y - r > 0.55 ? '_' : '-';
      else if (ang < 68) g = '/';
      else if (ang < 112) g = '|';
      else g = '\\';
      put(r, Math.floor(x), g);
    }
  };
  const at = (q, ch) => put(Math.floor(q.y / CH), Math.floor(q.x / CW), ch);

  const P = pose(p);
  const legs = P.legs.map((L) => limb(P.hip, L.th, P.thigh, L.kn, P.shin));
  // back leg first, so the front one draws over it
  const order = Math.sin(P.f) > 0 ? [1, 0] : [0, 1];

  // the sword: hand low and behind the body, blade trailing back and up
  const sa = rad(-26 + 6 * Math.sin(P.f + Math.PI));
  const [selb, shand] = limb(P.shoulder, sa, 24, rad(38), 22);
  const ba = rad(194 + 3 * Math.sin(P.f));
  const tip = { x: shand.x + Math.cos(ba) * 130, y: shand.y - Math.sin(ba) * 130 };
  stroke(shand, tip);
  stroke(P.shoulder, selb);
  stroke(selb, shand);
  at(shand, '+');

  for (const i of order) {
    const [knee, ankle, shinA] = legs[i];
    // hakama: the trouser leg is wide, so the thigh is drawn twice
    stroke(P.hip, knee);
    stroke({ x: P.hip.x + 9, y: P.hip.y }, { x: knee.x + 8, y: knee.y });
    stroke(knee, ankle);
    const foot = { x: ankle.x + Math.cos(shinA) * 14, y: ankle.y - Math.sin(shinA) * 4 };
    stroke(ankle, foot, '_');
  }
  // hakama: the flared hem between the knees
  const [k0] = legs[0];
  const [k1] = legs[1];
  const left = k0.x < k1.x ? k0 : k1;
  const right = k0.x < k1.x ? k1 : k0;
  stroke({ x: left.x, y: Math.max(left.y, right.y) }, { x: right.x, y: Math.max(left.y, right.y) }, '_');

  // torso, drawn double for weight
  stroke(P.hip, P.neck);
  stroke({ x: P.hip.x + 9, y: P.hip.y }, { x: P.neck.x + 9, y: P.neck.y });

  // free arm swings against the legs
  const sw = rad(-55 * Math.sin(P.f) + 10);
  const [elb, hand] = limb(P.shoulder, sw, 26, rad(-95), 22);
  stroke(P.shoulder, elb);
  stroke(elb, hand);

  // head, topknot and the headband tails
  at(P.head, 'O');
  at({ x: P.head.x, y: P.head.y - 16 }, P.f % (2 * Math.PI) < Math.PI ? '^' : '^');
  const tr = Math.floor(P.head.y / CH);
  const tc = Math.floor(P.head.x / CW);
  const wave = Math.sin(P.f * 2) > 0;
  put(tr, tc - 1, '=');
  put(tr - (wave ? 1 : 0), tc - 2, '~');
  put(tr - (wave ? 0 : 1), tc - 3, '~');
  return grid.map((row) => row.join('').replace(/\s+$/, ''));
}

const frames = Array.from({ length: FRAMES }, (_, i) => frame(i / FRAMES));
if (process.argv.includes('--print')) {
  for (let r = 0; r < ROWS; r++) console.log([0, 2, 4, 6, 8, 10].map((i) => (frames[i][r] || '').padEnd(COLS)).join(' | '));
}
const body = frames.map((f) => '  [\n' + f.map((l) => '    ' + JSON.stringify(l) + ',').join('\n') + '\n  ],').join('\n');
writeFileSync(
  new URL('../src/ui/samurai-frames.js', import.meta.url),
  `// Generated by scripts/build-samurai.mjs: a ${FRAMES}-frame run cycle, ${COLS} x ${ROWS} cells.
export const SAMURAI_W = ${COLS};
export const SAMURAI_H = ${ROWS};
export const SAMURAI_FRAMES = [
${body}
];
`,
);
