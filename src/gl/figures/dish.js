import * as THREE from 'three';
import { createFigure, C, mat, strut } from './common.js';

// Contact: an uplink dish, sweeping slowly and sending rings up its boresight.
export function createDish() {
  const fig = createFigure({ radius: 1.36, fov: 30, dir: [0.1, 0.26, 1], key: 3.2, fill: 0.6, amb: 0.3 });

  const mount = new THREE.Group();
  mount.position.y = -0.95;
  fig.root.add(mount);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.1, 20), mat.ink(0.45));
  base.position.y = 0.05;
  mount.add(base);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.085, 0.72, 10), mat.ink(0.7));
  mast.position.y = 0.46;
  mount.add(mast);

  const az = new THREE.Group(); // azimuth
  az.position.y = 0.84;
  mount.add(az);
  const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.2), mat.coolish(0.95));
  az.add(yoke);

  const el = new THREE.Group(); // elevation
  az.add(el);

  // the reflector: a paraboloid of revolution, open towards +y
  const F = 0.42; // focal length
  const RIM = 0.82;
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const r = (RIM * i) / 14;
    pts.push(new THREE.Vector2(r, (r * r) / (4 * F)));
  }
  const bowl = new THREE.Mesh(
    new THREE.LatheGeometry(pts, 40),
    mat.ink(0.92, { side: THREE.DoubleSide }),
  );
  el.add(bowl);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(RIM, 0.016, 5, 48), mat.ink(1));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = (RIM * RIM) / (4 * F);
  el.add(rim);

  // feed horn at the focus, on three struts
  const focus = new THREE.Vector3(0, F + 0.04, 0);
  const strutMat = mat.ink(0.7);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    const from = new THREE.Vector3(Math.cos(a) * RIM * 0.94, (RIM * RIM * 0.88) / (4 * F), Math.sin(a) * RIM * 0.94);
    el.add(strut(from, focus, 0.012, strutMat, 5));
  }
  const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.07, 0.12, 10), mat.hot(1));
  horn.position.copy(focus);
  el.add(horn);

  // signal rings travelling along the boresight
  const rings = [];
  for (let i = 0; i < 4; i++) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 5, 56), fig.glow(i % 2 ? C.cool(1) : C.ink(1)));
    m.rotation.x = Math.PI / 2;
    el.add(m);
    rings.push(m);
  }

  el.rotation.x = 0.62; // tip the dish forward and up
  fig.update = (ctx) => {
    fig.base(ctx);
    const { t } = ctx;
    az.rotation.y = 0.5 + Math.sin(t * 0.28) * 0.7 + ctx.px * 0.2;
    el.rotation.x = 0.62 + Math.sin(t * 0.21) * 0.14;

    rings.forEach((m, i) => {
      const u = (t * 0.3 + i / rings.length) % 1;
      m.position.y = F + 0.1 + u * 1.5;
      const s = 0.12 + u * 0.62;
      m.scale.set(s, s, s * 0.5);
      m.material.color.multiplyScalar(Math.sin(u * Math.PI));
    });
  };
  return fig;
}
