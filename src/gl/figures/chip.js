import * as THREE from 'three';
import { createFigure, C, mat, noEdge, rng } from './common.js';

// Firmware: the flash chip that holds the BIOS, on a corner of the board,
// with the coin cell you pull to reset CMOS. A read head sweeps the chip and
// bytes leave along the traces.
export function createChip() {
  const fig = createFigure({ radius: 1.16, fov: 30, dir: [0.25, 0.66, 1], key: 3.1, fill: 0.6, amb: 0.3 });
  const rand = rng(2401);
  const board = new THREE.Group();
  board.position.y = -0.18;
  fig.root.add(board);

  const pcb = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 1.5), mat.ink(0.14));
  pcb.position.y = -0.025;
  board.add(pcb);

  // the chip: an eight-pin package, four legs a side
  const W = 0.94;
  const Dp = 0.6;
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, 0.22, Dp), mat.ink(0.7));
  body.position.y = 0.135;
  board.add(body);
  const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 12), fig.glow(C.hot(1)));
  dot.position.set(-W / 2 + 0.11, 0.25, Dp / 2 - 0.11);
  board.add(dot);
  for (let i = 0; i < 2; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.42 - i * 0.12, 0.008, 0.035), fig.glow(C.ink(0.55)));
    line.position.set(0.06 - i * 0.06, 0.25, -0.06 + i * 0.11);
    board.add(line);
  }

  const legMat = mat.ink(1);
  const traceMat = noEdge(mat.ink(0.42));
  const traces = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const x = -W / 2 + 0.12 + i * ((W - 0.24) / 3);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.2), legMat);
      leg.position.set(x, 0.05, side * (Dp / 2 + 0.07));
      board.add(leg);
      // a trace from the leg out towards the board edge, with one bend
      const z0 = side * (Dp / 2 + 0.17);
      const z1 = side * (0.54 + rand() * 0.16);
      const x1 = x + (rand() - 0.5) * 0.5 + (i - 1.5) * 0.16;
      const a = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.012, Math.abs(z1 - z0)), traceMat);
      a.position.set(x, 0.006, (z0 + z1) / 2);
      const b = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x) + 0.03, 0.012, 0.03), traceMat);
      b.position.set((x + x1) / 2, 0.006, z1);
      board.add(a, b);
      const pulse = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.03, 0.06),
        fig.glow(i === 2 && side > 0 ? C.hot(1) : C.cool(1)),
      );
      board.add(pulse);
      traces.push({ pulse, pts: [new THREE.Vector3(x, 0.03, z0), new THREE.Vector3(x, 0.03, z1), new THREE.Vector3(x1, 0.03, z1)], speed: 0.35 + rand() * 0.4, phase: rand() });
    }
  }

  // the coin cell and a few passives, so it reads as a board and not a slab
  const cell = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.07, 28), mat.shiny(0.9));
  cell.position.set(0.64, 0.05, -0.45);
  const holder = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.022, 5, 28), mat.ink(0.5));
  holder.rotation.x = Math.PI / 2;
  holder.position.set(0.64, 0.03, -0.45);
  board.add(cell, holder);
  for (let i = 0; i < 7; i++) {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.05), mat.coolish(0.8));
    cap.position.set(-0.86 + rand() * 0.3, 0.03, -0.62 + rand() * 1.24);
    cap.rotation.y = rand() < 0.5 ? 0 : Math.PI / 2;
    board.add(cap);
  }

  // the read head: a bar of light that sweeps the top of the package
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.012, Dp - 0.06), fig.glow(C.cool(1)));
  head.position.y = 0.255;
  board.add(head);

  const p = new THREE.Vector3();
  fig.update = (ctx) => {
    fig.base(ctx);
    const { t, dt } = ctx;
    board.rotation.y += dt * 0.2;
    head.position.x = Math.sin(t * 1.1) * (W / 2 - 0.06);
    dot.scale.setScalar(Math.sin(t * 3.5) > 0 ? 1 : 0.45);

    for (const tr of traces) {
      const u = (((t * tr.speed + tr.phase) % 1) + 1) % 1;
      // two straight segments; spend time on each in proportion to its length
      const l0 = tr.pts[0].distanceTo(tr.pts[1]);
      const l1 = tr.pts[1].distanceTo(tr.pts[2]);
      const d = u * (l0 + l1);
      if (d < l0) p.lerpVectors(tr.pts[0], tr.pts[1], d / l0);
      else p.lerpVectors(tr.pts[1], tr.pts[2], (d - l0) / Math.max(l1, 1e-4));
      tr.pulse.position.copy(p);
      tr.pulse.scale.setScalar(0.6 + Math.sin(u * Math.PI) * 0.7);
    }
  };
  return fig;
}
