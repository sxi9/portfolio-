import * as THREE from 'three';
import { createFigure, C, mat, strut, noEdge } from './common.js';

// home-cluster: laptops and phones around a head node. A token visits every
// device in turn, because that is how a model split across them really runs:
// each token walks through each device, one after the other.
export function createCluster() {
  const fig = createFigure({ radius: 1.34, fov: 30, dir: [0.15, 0.72, 1], key: 3.1, fill: 0.6, amb: 0.3 });
  const ring = new THREE.Group();
  fig.root.add(ring);

  const bodyMat = mat.ink(0.62);
  const screenMat = mat.coolish(0.95);

  const laptop = () => {
    const g = new THREE.Group();
    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.03, 0.3), bodyMat);
    deck.position.y = 0.015;
    const lid = new THREE.Group();
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.29, 0.02), screenMat);
    panel.position.y = 0.145;
    lid.add(panel);
    lid.position.set(0, 0.03, -0.15);
    lid.rotation.x = -0.3;
    g.add(deck, lid);
    return g;
  };
  const phone = () => {
    const g = new THREE.Group();
    const slab = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.3, 0.022), screenMat);
    slab.position.y = 0.16;
    slab.rotation.x = -0.28;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.02, 0.1), bodyMat);
    foot.position.y = 0.01;
    g.add(slab, foot);
    return g;
  };

  // head node in the middle: a small tower with a lit core
  const head = new THREE.Group();
  head.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.46, 0.3), mat.ink(0.85)));
  const core = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.31), fig.glow(C.ink(1)));
  core.position.y = 0.08;
  head.add(core);
  head.position.y = 0.23;
  ring.add(head);

  const kinds = [laptop, phone, laptop, phone, laptop, phone];
  const R = 0.98;
  const stops = [new THREE.Vector3(0, 0.52, 0)];
  const meters = [];
  const linkMat = noEdge(mat.ink(0.38));
  kinds.forEach((make, i) => {
    const a = (i / kinds.length) * Math.PI * 2 + 0.4;
    const d = make();
    d.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
    d.rotation.y = -a + Math.PI / 2; // face the middle
    ring.add(d);
    const above = d.position.clone().setY(0.42);
    stops.push(above);
    ring.add(strut(new THREE.Vector3(0, 0.3, 0), d.position.clone().setY(0.1), 0.006, linkMat, 5));

    // how much of the model this device is holding
    const meter = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1, 0.05), fig.glow(C.ink(1)));
    meter.position.copy(d.position).multiplyScalar(1.22);
    ring.add(meter);
    meters.push({ meter, share: 0.12 + ((i * 37) % 5) * 0.045 });
  });
  stops.push(stops[0].clone());

  // floor disc, to seat the whole thing
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(1.36, 1.36, 0.02, 48), noEdge(mat.ink(0.13)));
  floor.position.y = -0.012;
  ring.add(floor);

  const token = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), fig.glow(C.cool(1)));
  ring.add(token);
  const trail = [0, 1, 2].map((i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.032 - i * 0.006, 8, 6), fig.glow(C.cool(0.7 - i * 0.18)));
    ring.add(m);
    return m;
  });

  const segs = stops.length - 1;
  const at = (u, out) => {
    const f = (((u % 1) + 1) % 1) * segs;
    const i = Math.min(segs - 1, Math.floor(f));
    const k = f - i;
    out.lerpVectors(stops[i], stops[i + 1], k);
    out.y += Math.sin(k * Math.PI) * 0.22; // hop
    return i;
  };

  ring.position.y = -0.3;
  fig.update = (ctx) => {
    fig.base(ctx);
    const { t, dt } = ctx;
    ring.rotation.y += dt * 0.16;

    const u = t * 0.11;
    const seg = at(u, token.position);
    trail.forEach((m, i) => at(u - 0.012 * (i + 1), m.position));

    meters.forEach((mt, i) => {
      // the device the token is heading for works; the rest idle
      const busy = seg === i ? 1 : 0;
      const hgt = mt.share + busy * 0.16 + Math.sin(t * 3 + i) * 0.012;
      mt.meter.scale.y += (hgt - mt.meter.scale.y) * 0.12;
      mt.meter.position.y = mt.meter.scale.y / 2;
    });
    core.scale.x = 0.7 + 0.3 * Math.abs(Math.sin(t * 2.2));
  };
  return fig;
}
