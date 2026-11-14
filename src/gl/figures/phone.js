import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createFigure, C, mat, strut, rng } from './common.js';

// Android Sentinel: a handset with a live log scrolling on its screen, a scan
// bar sweeping it, and its outbound connections drawn as links to nearby
// hosts. One of them is flagged.
export function createPhone() {
  const fig = createFigure({ radius: 1.36, fov: 30, dir: [0, 0.12, 1], key: 3.0, fill: 0.6, amb: 0.3 });
  const rand = rng(8765);

  const device = new THREE.Group();
  fig.root.add(device);

  const W = 0.9;
  const H = 1.86;
  device.add(new THREE.Mesh(new RoundedBoxGeometry(W, H, 0.11, 3, 0.085), mat.ink(0.6)));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.1, H - 0.12), mat.cool(0.16));
  screen.position.z = 0.0565;
  device.add(screen);

  // log lines
  const rows = [];
  const rowH = 0.105;
  const top = H / 2 - 0.22;
  const span = H - 0.4;
  const count = Math.floor(span / rowH);
  for (let i = 0; i < count; i++) {
    const hot = i === 4 || i === 11;
    const w = 0.22 + rand() * 0.46;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, 0.04),
      fig.glow(hot ? C.hot(1) : C.ink(0.5 + rand() * 0.4)),
    );
    m.position.set(-(W - 0.22) / 2 + w / 2, 0, 0.058);
    device.add(m);
    rows.push({ m, i });
  }
  const scanBar = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.12, 0.05), fig.glow(C.cool(1)));
  scanBar.position.z = 0.059;
  device.add(scanBar);
  const camDot = new THREE.Mesh(new THREE.CircleGeometry(0.022, 10), fig.glow(C.ink(1)));
  camDot.position.set(0, H / 2 - 0.1, 0.058);
  device.add(camDot);

  // connections to hosts around the device
  const hosts = [];
  const linkMat = fig.glow(C.ink(0.42));
  const flagMat = fig.glow(C.hot(0.55));
  const origin = new THREE.Vector3(0, 0.2, -0.02);
  const targets = [
    [-1.12, 0.92, -0.25], [1.14, 0.78, -0.3], [-1.18, -0.16, 0.12],
    [1.2, -0.3, 0.05], [-0.95, -0.98, -0.2], [0.98, -1.0, -0.15],
  ];
  targets.forEach((p, i) => {
    const flagged = i === 3;
    const pos = new THREE.Vector3(...p);
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.15, 0.15),
      flagged ? mat.hot(1) : mat.flat(0.8),
    );
    box.position.copy(pos);
    fig.root.add(box);
    fig.root.add(strut(origin, pos, 0.006, flagged ? flagMat : linkMat, 5));
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), fig.glow(flagged ? C.hot(1) : C.ink(1)));
    fig.root.add(dot);
    hosts.push({ box, pos, dot, speed: 0.35 + rand() * 0.45, phase: rand() });
  });

  fig.update = (ctx) => {
    fig.base(ctx);
    const { t, dt } = ctx;
    device.rotation.y = -0.42 + Math.sin(t * 0.45) * 0.4 + ctx.px * 0.15;
    device.rotation.x = 0.08 + Math.sin(t * 0.31) * 0.05;

    // each line climbs and re-enters at the bottom, like a tailing log
    const total = count * rowH;
    for (const r of rows) {
      const yy = (((r.i * rowH - t * 0.16) % total) + total) % total;
      r.m.position.y = top - yy;
    }
    scanBar.position.y = H / 2 - 0.14 - ((t * 0.55) % 1) * (H - 0.28);
    camDot.scale.setScalar(Math.sin(t * 4) > 0.2 ? 1 : 0.35);

    for (const h of hosts) {
      const u = (t * h.speed + h.phase) % 1;
      h.dot.position.lerpVectors(origin, h.pos, u);
      h.box.rotation.x += dt * 0.6;
      h.box.rotation.y += dt * 0.8;
    }
  };
  return fig;
}
