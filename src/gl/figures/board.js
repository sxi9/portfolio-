import * as THREE from 'three';
import { createFigure, C, mat, strut, rng } from './common.js';

// Cyber Investigation Board: evidence cards hanging in space, pinned and tied
// together with red thread, turning slowly around the case at the centre.
export function createBoard() {
  const fig = createFigure({ radius: 1.32, fov: 30, dir: [0.1, 0.2, 1], key: 3.0, fill: 0.7, amb: 0.34 });
  const rand = rng(424242);
  const web = new THREE.Group();
  fig.root.add(web);

  const cardMats = [mat.ink(0.95), mat.ink(0.62), mat.coolish(0.8)];
  const pinMat = fig.glow(C.hot(1));
  const threadMat = fig.glow(C.hot(0.62));
  const out = new THREE.Vector3();
  const pins = [];
  const cards = [];

  const N = 12;
  for (let i = 0; i < N; i++) {
    // spread on a sphere, flattened a little so it stays board-like
    const y = 1 - (2 * (i + 0.5)) / N;
    const r = Math.sqrt(1 - y * y);
    const a = i * 2.39996 + rand() * 0.5;
    const R = 0.74 + rand() * 0.3;
    out.set(Math.cos(a) * r, y * 0.82, Math.sin(a) * r).multiplyScalar(R);

    const w = 0.3 + rand() * 0.2;
    const h = 0.2 + rand() * 0.14;
    const card = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.018), cardMats[i % cardMats.length]);
    card.position.copy(out);
    card.lookAt(out.clone().multiplyScalar(2));
    card.rotateZ((rand() - 0.5) * 0.5);
    web.add(card);
    cards.push({ card, base: out.clone(), ph: rand() * 6.28 });

    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 6), pinMat);
    const local = new THREE.Vector3(0, h / 2 - 0.03, 0.02);
    card.updateMatrix();
    pin.position.copy(local).applyMatrix4(card.matrix);
    web.add(pin);
    pins.push(pin.position.clone());
  }

  // The case itself.
  const hub = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), mat.flat(1));
  web.add(hub);
  const centre = new THREE.Vector3();

  // Threads: a chain through every card, a few chords, and spokes to the case.
  const links = [];
  const link = (a, b) => {
    web.add(strut(a, b, 0.0075, threadMat, 5));
    links.push([a, b]);
  };
  for (let i = 0; i < N - 1; i++) link(pins[i], pins[i + 1]);
  for (let i = 0; i < 6; i++) link(pins[Math.floor(rand() * N)], pins[Math.floor(rand() * N)]);
  for (let i = 0; i < N; i += 3) link(pins[i], centre);

  const tracer = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), fig.glow(C.hot(1)));
  web.add(tracer);

  fig.update = (ctx) => {
    fig.base(ctx);
    const { t, dt } = ctx;
    web.rotation.y += dt * 0.22;
    web.rotation.x = Math.sin(t * 0.25) * 0.12;
    hub.rotation.y -= dt * 0.9;
    hub.rotation.x += dt * 0.5;

    // one lead being followed at a time
    const seg = Math.floor(t * 0.9) % links.length;
    const u = (t * 0.9) % 1;
    tracer.position.lerpVectors(links[seg][0], links[seg][1], u);
    tracer.scale.setScalar(0.7 + Math.sin(u * Math.PI) * 0.8);
  };
  return fig;
}
