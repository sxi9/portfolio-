import * as THREE from 'three';
import { createFigure, C, mat, strut, noEdge, rng } from './common.js';

// MSP: one server, many endpoints. Heartbeats only ever travel inwards
// (agents connect outbound); now and then a command rides back out on the
// channel a heartbeat has just opened.
export function createFleet() {
  const fig = createFigure({ radius: 1.4, fov: 30, dir: [0.1, 0.42, 1], key: 3.1, fill: 0.6, amb: 0.3 });
  const rand = rng(2024);
  const orbit = new THREE.Group();
  fig.root.add(orbit);

  // the server: a stack of units with a strip of light on each
  const server = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const unit = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.42), mat.ink(i % 2 ? 0.8 : 0.62));
    unit.position.y = -0.3 + i * 0.15;
    server.add(unit);
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.43), fig.glow(i === 3 ? C.cool(1) : C.ink(1)));
    led.position.set(-0.12 + (i % 3) * 0.06, -0.3 + i * 0.15, 0);
    server.add(led);
  }
  fig.root.add(server);
  const hubPos = new THREE.Vector3(0, 0, 0);

  const bodyMat = mat.ink(0.66);
  const screenMat = mat.coolish(0.95);
  const desktop = () => {
    const g = new THREE.Group();
    const scr = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.025), screenMat);
    scr.position.y = 0.16;
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.03), bodyMat);
    neck.position.y = 0.04;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.015, 0.1), bodyMat);
    g.add(scr, neck, foot);
    return g;
  };
  const laptop = () => {
    const g = new THREE.Group();
    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.2), bodyMat);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.015), screenMat);
    lid.position.set(0, 0.1, -0.11);
    lid.rotation.x = -0.25;
    g.add(deck, lid);
    return g;
  };
  const handset = () => {
    const g = new THREE.Group();
    const slab = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.22, 0.02), screenMat);
    slab.position.y = 0.11;
    g.add(slab);
    return g;
  };
  const makers = [desktop, laptop, handset];

  const linkMat = noEdge(mat.ink(0.3));
  const agents = [];
  const tiers = [
    { r: 0.92, y: -0.42, n: 5, off: 0.2 },
    { r: 1.22, y: 0.3, n: 4, off: 0.9 },
  ];
  tiers.forEach((tier) => {
    for (let i = 0; i < tier.n; i++) {
      const a = (i / tier.n) * Math.PI * 2 + tier.off;
      const dev = makers[(i + (tier.n === 4 ? 1 : 0)) % makers.length]();
      dev.position.set(Math.cos(a) * tier.r, tier.y, Math.sin(a) * tier.r);
      dev.rotation.y = -a + Math.PI / 2;
      orbit.add(dev);
      const from = dev.position.clone().add(new THREE.Vector3(0, 0.12, 0));
      orbit.add(strut(from, hubPos, 0.005, linkMat, 4));
      const beat = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), fig.glow(C.ink(1)));
      const cmd = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 6), fig.glow(C.hot(1)));
      orbit.add(beat, cmd);
      agents.push({ from, beat, cmd, period: 2.2 + rand() * 1.6, phase: rand() * 3, every: 3 + Math.floor(rand() * 3) });
    }
  });

  fig.update = (ctx) => {
    fig.base(ctx);
    const { t, dt } = ctx;
    orbit.rotation.y += dt * 0.14;
    server.rotation.y -= dt * 0.1;

    for (const a of agents) {
      const cycle = (t + a.phase) / a.period;
      const n = Math.floor(cycle);
      const u = cycle - n;
      // heartbeat: endpoint -> server over the first 60% of the period
      const hb = Math.min(1, u / 0.6);
      a.beat.position.lerpVectors(a.from, hubPos, hb);
      a.beat.scale.setScalar(u < 0.6 ? 1 : 0.001);
      // command: server -> endpoint, only on some beats, in the remaining 40%
      const has = n % a.every === 0 && u >= 0.6;
      a.cmd.position.lerpVectors(hubPos, a.from, has ? (u - 0.6) / 0.4 : 0);
      a.cmd.scale.setScalar(has ? 1 : 0.001);
    }
  };
  return fig;
}
