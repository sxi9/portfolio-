import * as THREE from 'three';
import { createFigure, C, mat, boxFrame, rng } from './common.js';

// WHM: a rack of servers. Status lights blink, and every so often one unit
// slides out for service and goes back in.
export function createRack() {
  const fig = createFigure({ radius: 1.34, fov: 30, dir: [0.1, 0.2, 1], key: 3.1, fill: 0.65, amb: 0.3 });
  const rand = rng(2087);
  const rack = new THREE.Group();
  fig.root.add(rack);

  const W = 0.92;
  const H = 1.96;
  const Dp = 0.7;
  rack.add(boxFrame(W, H, Dp, 0.045, mat.ink(0.5)));
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(W + 0.14, 0.05, Dp + 0.14), mat.ink(0.32));
  plinth.position.y = -H / 2 - 0.03;
  rack.add(plinth);

  const UNITS = 9;
  const uh = 0.17;
  const gap = (H - 0.12 - UNITS * uh) / (UNITS - 1);
  const units = [];
  const leds = [];
  for (let i = 0; i < UNITS; i++) {
    const g = new THREE.Group();
    const tall = i === 2 || i === 6; // a couple of 2U storage boxes, darker
    const body = new THREE.Mesh(new THREE.BoxGeometry(W - 0.1, uh, Dp - 0.08), mat.ink(tall ? 0.5 : 0.78));
    g.add(body);
    // vent slot across the face
    const vent = new THREE.Mesh(new THREE.BoxGeometry((W - 0.1) * 0.52, uh * 0.42, 0.012), mat.ink(0.14));
    vent.position.set(0.12, 0, (Dp - 0.08) / 2 + 0.003);
    g.add(vent);
    // handles
    for (const s of [-1, 1]) {
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.03, uh * 0.7, 0.04), mat.ink(1));
      h.position.set((s * (W - 0.16)) / 2, 0, (Dp - 0.08) / 2 + 0.02);
      g.add(h);
    }
    // three status lights
    for (let k = 0; k < 3; k++) {
      const roll = rand();
      const color = roll < 0.14 ? C.hot(1) : roll < 0.45 ? C.cool(1) : C.ink(1);
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.02), fig.glow(color));
      led.position.set(-(W - 0.1) / 2 + 0.1 + k * 0.06, 0, (Dp - 0.08) / 2 + 0.012);
      g.add(led);
      leds.push({ led, f: 1 + rand() * 5, ph: rand() * 6.28, duty: 0.35 + rand() * 0.5 });
    }
    g.position.y = -H / 2 + 0.06 + uh / 2 + i * (uh + gap);
    rack.add(g);
    units.push(g);
  }

  let serviced = 4;
  let phase = 0;
  fig.update = (ctx) => {
    fig.base(ctx);
    const { t, dt } = ctx;
    rack.rotation.y = -0.55 + Math.sin(t * 0.3) * 0.38;

    for (const l of leds) {
      const on = (Math.sin(t * l.f + l.ph) + 1) / 2 < l.duty;
      l.led.scale.setScalar(on ? 1 : 0.25);
    }

    // slide one unit out, hold, slide back, pick another
    phase += dt * 0.32;
    if (phase >= 1) {
      phase = 0;
      units[serviced].position.z = 0;
      serviced = (serviced + 3) % UNITS;
    }
    const outAmt = Math.sin(Math.min(1, Math.max(0, (phase - 0.15) / 0.7)) * Math.PI);
    units[serviced].position.z = Math.pow(outAmt, 0.6) * 0.3;
  };
  return fig;
}
