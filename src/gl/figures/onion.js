import * as THREE from 'three';
import { createFigure, C, mat, noEdge, rng } from './common.js';

// LeakWatch: an onion with a wedge cut away to show its layers, a scan ring
// travelling over it, and the monitored sites circling as status blips.
export function createOnion() {
  const fig = createFigure({ radius: 1.42, fov: 30, dir: [0, 0.32, 1], key: 3.1, fill: 0.7, amb: 0.3 });
  const rand = rng(1107);

  const outline = [
    [0.0, -0.95], [0.26, -0.93], [0.56, -0.79], [0.81, -0.5], [0.93, -0.16],
    [0.92, 0.14], [0.79, 0.44], [0.56, 0.67], [0.34, 0.83], [0.17, 0.98],
    [0.08, 1.12], [0.025, 1.3],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const pts = new THREE.SplineCurve(outline).getPoints(36);

  // Solid part of each shell; the missing wedge faces front-right.
  const cut = 1.7;
  const phiStart = 0.42 + cut / 2;
  const bulb = new THREE.Group();
  const shells = [
    { s: 1.0, v: 0.95 },
    { s: 0.76, v: 0.7 },
    { s: 0.53, v: 0.5 },
  ];
  for (const { s, v } of shells) {
    const geo = new THREE.LatheGeometry(pts, 22, phiStart, Math.PI * 2 - cut);
    const m = new THREE.Mesh(geo, mat.flat(v, { side: THREE.DoubleSide }));
    m.scale.setScalar(s);
    m.position.y = -(1 - s) * 0.12;
    bulb.add(m);
  }
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), fig.glow(C.hot(1)));
  core.position.y = -0.12;
  bulb.add(core);
  fig.root.add(bulb);

  const scan = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 5, 72), fig.glow(C.cool(1)));
  scan.rotation.x = Math.PI / 2;
  fig.root.add(scan);

  // Monitored sites: mostly up, a few flagged.
  const orbits = [];
  const ringMat = noEdge(mat.ink(0.5));
  [
    { r: 1.22, tilt: [1.25, 0.2], n: 5 },
    { r: 1.32, tilt: [1.75, -0.5], n: 4 },
    { r: 1.12, tilt: [1.45, 0.9], n: 4 },
  ].forEach(({ r, tilt, n }) => {
    const g = new THREE.Group();
    g.rotation.set(tilt[0], 0, tilt[1]);
    g.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.005, 4, 96), ringMat));
    const blips = [];
    for (let i = 0; i < n; i++) {
      const roll = rand();
      const color = roll < 0.25 ? C.hot(1) : roll < 0.5 ? C.cool(1) : C.ink(1);
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 6), fig.glow(color));
      g.add(b);
      blips.push({ b, a: (i / n) * Math.PI * 2 + rand(), flick: rand() * 6 });
    }
    fig.root.add(g);
    orbits.push({ g, r, blips, speed: (0.12 + rand() * 0.14) * (rand() < 0.5 ? -1 : 1) });
  });

  fig.update = (ctx) => {
    fig.base(ctx);
    const { t } = ctx;
    bulb.rotation.y = Math.sin(t * 0.33) * 0.75;
    bulb.position.y = Math.sin(t * 0.8) * 0.02;

    const u = (Math.sin(t * 0.7) + 1) / 2;
    const y = -0.85 + u * 1.75;
    // follow the bulb's outline so the ring hugs the skin
    const k = Math.max(0.12, Math.sin(Math.min(1, (y + 0.95) / 1.9) * Math.PI) ** 0.75);
    scan.position.y = y;
    scan.scale.setScalar(0.1 + k * 0.92);

    const pulse = 0.75 + 0.25 * Math.sin(t * 3.2);
    core.scale.setScalar(pulse);

    for (const o of orbits) {
      for (const bl of o.blips) {
        const a = bl.a + t * o.speed;
        bl.b.position.set(Math.cos(a) * o.r, Math.sin(a) * o.r, 0);
        bl.b.scale.setScalar(0.8 + 0.5 * Math.max(0, Math.sin(t * 2.4 + bl.flick)));
      }
    }
  };
  return fig;
}
