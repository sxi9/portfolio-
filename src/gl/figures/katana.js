import * as THREE from 'three';
import { createFigure, C, mat, noEdge, rng } from './common.js';

// Samurai Scan: a katana held over the network it guards. Scan rings spread
// across the floor and light up each device they pass; one is a stranger.
export function createKatana() {
  const fig = createFigure({ radius: 1.3, fov: 30, dir: [0, 0.34, 1], key: 3.2, fill: 0.5, amb: 0.26 });
  const rand = rng(7001);

  // ---- the sword, modelled along +x with the edge facing down -----------
  const sword = new THREE.Group();
  const x0 = -0.5;
  const x1 = 1.28;
  const sag = (x) => 0.13 * Math.pow((x - x0) / (x1 - x0), 2); // sori: rises to the tip
  const shape = new THREE.Shape();
  const n = 26;
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const y = sag(x) + 0.065; // back of the blade
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  for (let i = n - 2; i >= 0; i--) {
    const x = x0 + ((x1 - x0) * i) / n;
    const w = 0.13 - 0.03 * (i / n);
    shape.lineTo(x, sag(x) + 0.065 - w); // cutting edge, tapering
  }
  shape.closePath();
  const bladeGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.024,
    bevelSegments: 1,
    curveSegments: 4,
  });
  bladeGeo.translate(0, 0, -0.01);
  sword.add(new THREE.Mesh(bladeGeo, mat.shiny(0.95, { shininess: 140 })));

  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.07), mat.coolish(0.9));
  collar.position.set(x0 + 0.03, 0, 0);
  sword.add(collar);

  const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 20), mat.ink(0.55));
  guard.rotation.z = Math.PI / 2;
  guard.position.x = x0 - 0.03;
  sword.add(guard);

  const gripLen = 0.6;
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.068, gripLen, 10), mat.ink(0.3));
  grip.rotation.z = Math.PI / 2;
  grip.position.x = x0 - 0.05 - gripLen / 2;
  sword.add(grip);
  const wrapMat = mat.ink(0.85);
  for (let i = 0; i < 8; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.017, 5, 12), wrapMat);
    ring.rotation.y = Math.PI / 2;
    ring.rotation.x = i % 2 ? 0.45 : -0.45;
    ring.position.x = x0 - 0.1 - (i / 7) * (gripLen - 0.1);
    sword.add(ring);
  }
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.078, 10, 8), mat.ink(0.7));
  pommel.position.x = x0 - 0.06 - gripLen;
  sword.add(pommel);

  const hold = new THREE.Group(); // pose
  const roll = new THREE.Group(); // twist about the blade's own axis
  sword.position.x = -0.28;
  roll.add(sword);
  hold.add(roll);
  hold.rotation.z = 0.52;
  hold.position.y = 0.22;
  fig.root.add(hold);

  // ---- the network on the floor ------------------------------------------
  const floorY = -0.8;
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 4, 80), fig.glow(C.cool(1)));
    m.rotation.x = Math.PI / 2;
    m.position.y = floorY;
    fig.root.add(m);
    rings.push(m);
  }
  const devices = [];
  for (let i = 0; i < 10; i++) {
    const stranger = i === 6;
    const a = (i / 10) * Math.PI * 2 + rand() * 0.4;
    const r = 0.32 + rand() * 0.8;
    const size = 0.06 + rand() * 0.05;
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(size, size * (0.6 + rand()), size),
      stranger ? mat.hot(1) : mat.flat(0.7),
    );
    body.position.set(Math.cos(a) * r, floorY + size / 2, Math.sin(a) * r * 0.9);
    fig.root.add(body);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), fig.glow(stranger ? C.hot(1) : C.ink(1)));
    lamp.position.copy(body.position);
    lamp.position.y += size * 0.9;
    fig.root.add(lamp);
    devices.push({ lamp, r: Math.hypot(body.position.x, body.position.z), stranger });
  }
  const router = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.08, 10), noEdge(mat.coolish(1)));
  router.position.y = floorY + 0.04;
  fig.root.add(router);

  const MAXR = 1.22;
  fig.update = (ctx) => {
    fig.base(ctx);
    const { t } = ctx;
    roll.rotation.x = Math.sin(t * 0.7) * 0.85;
    hold.rotation.y = Math.sin(t * 0.33) * 0.35;
    hold.position.y = 0.22 + Math.sin(t * 0.9) * 0.025;

    rings.forEach((ring, i) => {
      const u = (t * 0.28 + i / 3) % 1;
      const r = 0.08 + u * MAXR;
      ring.scale.set(r, r, 1);
      ring.material.color.multiplyScalar(1 - u * u);
      ring.userData.r = r;
    });

    for (const d of devices) {
      // a device flashes as a ring front sweeps over it
      let hit = 0;
      for (const ring of rings) hit = Math.max(hit, 1 - Math.min(1, Math.abs(ring.userData.r - d.r) / 0.16));
      const s = d.stranger ? 0.9 + 0.5 * Math.abs(Math.sin(t * 5)) : 0.35 + hit * 1.2;
      d.lamp.scale.setScalar(s);
    }
  };
  return fig;
}
