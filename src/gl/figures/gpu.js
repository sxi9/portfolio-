import * as THREE from 'three';
import { createFigure, C, mat, noEdge, rng } from './common.js';

// An H200-style SXM module, seen from above: the GPU die between six HBM
// stacks, power stages along one edge, the board connectors along the other.
// Memory stacks light up as they are read, bytes run into the die, and tokens
// rise off it.
export function createGpu() {
  const fig = createFigure({ radius: 1.14, fov: 30, dir: [0.22, 0.74, 1], key: 3.1, fill: 0.6, amb: 0.3 });
  const rand = rng(1410);
  const module = new THREE.Group();
  module.position.y = -0.04;
  fig.root.add(module);

  const board = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.05, 1.5), mat.ink(0.14));
  board.position.y = -0.025;
  module.add(board);

  // mounting holes in the corners
  const ringMat = noEdge(mat.ink(0.55));
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.016, 5, 16), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(sx * 0.98, 0.006, sz * 0.63);
      module.add(ring);
    }
  }

  // the package: substrate, interposer, die
  const substrate = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.06, 1.02), mat.ink(0.36));
  substrate.position.y = 0.03;
  module.add(substrate);
  const interposer = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.03, 0.86), mat.ink(0.5));
  interposer.position.y = 0.075;
  module.add(interposer);
  const die = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.1, 0.62), mat.ink(0.88));
  die.position.y = 0.14;
  module.add(die);
  const core = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, 0.44), fig.glow(C.ink(1)));
  core.position.y = 0.196;
  module.add(core);

  // six HBM stacks, three each side of the die
  const stacks = [];
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const z = (i - 1) * 0.27;
      const x = sx * 0.39;
      const stack = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.12, 0.22), mat.coolish(0.9));
      stack.position.set(x, 0.15, z);
      module.add(stack);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.012, 0.15), fig.glow(C.cool(1)));
      lamp.position.set(x, 0.216, z);
      module.add(lamp);
      const pulse = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.03, 0.045), fig.glow(C.cool(1)));
      module.add(pulse);
      stacks.push({ lamp, pulse, from: new THREE.Vector3(x, 0.2, z), to: new THREE.Vector3(sx * 0.21, 0.2, z * 0.7), ph: rand() });
    }
  }

  // power stages along the front edge, connector strips along the back
  const vrmMat = mat.ink(0.68);
  for (let i = 0; i < 12; i++) {
    const vrm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.11), vrmMat);
    vrm.position.set(-0.84 + i * 0.153, 0.04, 0.6);
    module.add(vrm);
  }
  const connMat = mat.ink(0.3);
  for (const x of [-0.5, 0.5]) {
    const conn = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.05, 0.1), connMat);
    conn.position.set(x, 0.025, -0.64);
    module.add(conn);
  }
  // a few small parts so the board reads as a board
  for (let i = 0; i < 9; i++) {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.05), mat.ink(0.55));
    const side = rand() < 0.5 ? -1 : 1;
    cap.position.set(side * (0.8 + rand() * 0.18), 0.025, -0.45 + rand() * 0.9);
    cap.rotation.y = rand() < 0.5 ? 0 : Math.PI / 2;
    module.add(cap);
  }

  // tokens rising off the die
  const tokens = [];
  for (let i = 0; i < 9; i++) {
    const tok = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), fig.glow(i % 4 === 0 ? C.hot(1) : C.ink(1)));
    module.add(tok);
    tokens.push({ tok, ph: i / 9, x: (rand() - 0.5) * 0.26, z: (rand() - 0.5) * 0.36, spin: rand() * 6 });
  }

  fig.update = (ctx) => {
    fig.base(ctx);
    const { t, dt } = ctx;
    module.rotation.y += dt * 0.18;

    // stacks are read in a rotating order; a read sends a pulse to the die
    const lead = (t * 1.6) % stacks.length;
    stacks.forEach((s, i) => {
      const d = (i - lead + stacks.length) % stacks.length;
      const on = d < 1.2 ? 1 : 0.18;
      s.lamp.scale.setScalar(on > 0.5 ? 1 : 0.55);
      const u = (((t * 1.4 + s.ph) % 1) + 1) % 1;
      s.pulse.position.lerpVectors(s.from, s.to, u);
      s.pulse.scale.setScalar(on > 0.5 ? 1 : 0.001);
    });

    core.scale.x = 0.75 + 0.25 * Math.abs(Math.sin(t * 2.6));

    for (const k of tokens) {
      const u = (((t * 0.32 + k.ph) % 1) + 1) % 1;
      k.tok.position.set(k.x * (1 + u), 0.24 + u * 0.95, k.z * (1 + u));
      k.tok.rotation.y = k.spin + t;
      k.tok.scale.setScalar(Math.max(0.001, Math.sin(u * Math.PI)) * 1.1);
    }
  };
  return fig;
}
