import * as THREE from 'three';
import { createFigure, C, mat, ease, rng } from './common.js';

// SO-101 Workcell: a desk arm sorting cubes into two bins, forever.
// "Red and blue go to the left bin, green to the right bin": here that is
// hot and cool to the left, ink to the right. The joints are solved with
// two-link inverse kinematics every frame, so the motion is real.
export function createArm() {
  const fig = createFigure({ radius: 1.2, fov: 30, dir: [0.36, 0.44, 1], key: 3.1, fill: 0.6, amb: 0.3 });
  const cell = new THREE.Group();
  cell.position.set(0, -0.46, -0.4);
  fig.root.add(cell);

  // ---- furniture -----------------------------------------------------------
  const table = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.05, 1.2), mat.ink(0.15));
  table.position.set(0, -0.025, 0.42);
  cell.add(table);

  const BIN = { w: 0.42, h: 0.17, x: 0.74, z: 0.42 };
  const binMat = mat.ink(0.72);
  const makeBin = (side) => {
    const g = new THREE.Group();
    const wall = (sx, sy, sz, x, y, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), binMat);
      m.position.set(x, y, z);
      g.add(m);
    };
    const t = 0.022;
    wall(BIN.w, t, BIN.w, 0, t / 2, 0);
    wall(BIN.w, BIN.h, t, 0, BIN.h / 2, BIN.w / 2);
    wall(BIN.w, BIN.h, t, 0, BIN.h / 2, -BIN.w / 2);
    wall(t, BIN.h, BIN.w, BIN.w / 2, BIN.h / 2, 0);
    wall(t, BIN.h, BIN.w, -BIN.w / 2, BIN.h / 2, 0);
    g.position.set(side * BIN.x, 0, BIN.z);
    cell.add(g);
  };
  makeBin(-1);
  makeBin(1);

  // ---- the arm --------------------------------------------------------------
  const SHOULDER_Y = 0.2;
  const L1 = 0.62;
  const L2 = 0.6;
  const L3 = 0.2;
  const armMat = mat.ink(0.9);
  const jointMat = mat.coolish(0.95);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.23, 0.1, 16), mat.ink(0.5));
  base.position.y = 0.05;
  cell.add(base);

  const yaw = new THREE.Group();
  yaw.position.y = 0.1;
  cell.add(yaw);
  const turret = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.26), armMat);
  turret.position.y = 0.05;
  yaw.add(turret);

  const joint = (parent, y) => {
    const g = new THREE.Group();
    g.position.y = y;
    parent.add(g);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.25, 12), jointMat);
    hub.rotation.z = Math.PI / 2;
    g.add(hub);
    return g;
  };
  const limb = (parent, len, w) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, w * 0.8), armMat);
    m.position.y = len / 2;
    parent.add(m);
  };

  const shoulder = joint(yaw, SHOULDER_Y - 0.1);
  limb(shoulder, L1, 0.16);
  const elbow = joint(shoulder, L1);
  limb(elbow, L2, 0.13);
  const wrist = joint(elbow, L2);
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.13), armMat);
  palm.position.y = 0.06;
  wrist.add(palm);
  const fingers = [-1, 1].map((s) => {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.04, L3 - 0.06, 0.09), mat.ink(0.6));
    f.position.set(s * 0.08, 0.06 + (L3 - 0.06) / 2, 0);
    wrist.add(f);
    return { f, s };
  });

  /** Puts the fingertips at (x, y, z) in cell space, gripper pointing down. */
  const reach = (x, y, z) => {
    const r = Math.hypot(x, z);
    const h = y + L3 - SHOULDER_Y;
    const d = Math.min(Math.hypot(r, h), L1 + L2 - 0.002);
    const phi = Math.acos(THREE.MathUtils.clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
    const alpha = Math.atan2(r, h);
    const beta = Math.acos(THREE.MathUtils.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const t1 = alpha - beta;
    const t2 = Math.PI - phi;
    yaw.rotation.y = Math.atan2(x, z);
    shoulder.rotation.x = t1;
    elbow.rotation.x = t2;
    wrist.rotation.x = Math.PI - t1 - t2;
  };
  const grip = (open) => {
    for (const { f, s } of fingers) f.position.x = s * (0.09 + open * 0.045);
  };

  // ---- the job --------------------------------------------------------------
  const CUBE = 0.14;
  const kinds = [
    { color: mat.hot(1), bin: -1 },
    { color: mat.cool(1), bin: -1 },
    { color: mat.ink(1), bin: 1 },
  ];
  const cubes = kinds.map((k) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(CUBE, CUBE, CUBE), k.color);
    cell.add(m);
    return { m, bin: k.bin, home: new THREE.Vector3(), rest: new THREE.Vector3() };
  });

  let rand = rng(31);
  let round = 0;
  const layout = () => {
    rand = rng(31 + round * 97);
    round++;
    // three slots across the front of the table, shuffled, with some jitter
    const slots = [-0.3, 0, 0.3].sort(() => rand() - 0.5);
    cubes.forEach((c, i) => {
      c.home.set(slots[i] + (rand() - 0.5) * 0.08, CUBE / 2, 0.52 + rand() * 0.24);
      c.m.position.copy(c.home);
      c.m.rotation.set(0, rand() * 1.2, 0);
      c.m.scale.setScalar(1);
      c.rest.set(c.bin * BIN.x + (i === 1 ? 0.1 : -0.08), 0.022 + CUBE / 2, BIN.z + (i === 1 ? 0.08 : -0.08));
    });
  };
  layout();

  const HOME = new THREE.Vector3(0, 0.62, 0.42);
  const HOVER = 0.34;
  const tip = HOME.clone();
  const from = new THREE.Vector3();
  const to = new THREE.Vector3();
  let steps = [];
  let si = 0;
  let st = 0;
  let open = 1;
  let held = null;

  const plan = () => {
    steps = [];
    for (const c of cubes) {
      const above = new THREE.Vector3(c.home.x, HOVER, c.home.z);
      const at = new THREE.Vector3(c.home.x, CUBE * 0.55, c.home.z);
      const overBin = new THREE.Vector3(c.rest.x, 0.44, c.rest.z);
      const inBin = new THREE.Vector3(c.rest.x, c.rest.y + 0.06, c.rest.z);
      steps.push(
        { to: above, dur: 0.7 },
        { to: at, dur: 0.45 },
        { dur: 0.25, grip: 0, take: c },
        { to: above, dur: 0.4 },
        { to: overBin, dur: 0.85 },
        { to: inBin, dur: 0.4 },
        { dur: 0.22, grip: 1, drop: c },
        { to: overBin, dur: 0.35 },
      );
    }
    steps.push({ to: HOME.clone(), dur: 0.7 }, { dur: 0.9, reset: true });
    si = 0;
    st = 0;
    from.copy(tip);
  };
  plan();

  fig.update = (ctx) => {
    fig.base(ctx);
    let dt = ctx.dt;

    while (dt > 0 && steps.length) {
      const step = steps[si];
      const left = step.dur - st;
      const use = Math.min(dt, left);
      st += use;
      dt -= use;
      const u = ease.inOut(Math.min(1, st / step.dur));
      if (step.to) tip.lerpVectors(from, to.copy(step.to), u);
      if (step.grip !== undefined) open = step.grip === 0 ? 1 - u : u;
      if (step.reset) {
        for (const c of cubes) c.m.scale.setScalar(Math.max(0.001, 1 - u));
      }
      if (st >= step.dur - 1e-6) {
        if (step.take) held = step.take;
        if (step.drop) {
          held.m.position.copy(held.rest);
          held.m.rotation.set(0, 0, 0);
          held = null;
        }
        if (step.reset) {
          layout();
          plan();
          continue;
        }
        si++;
        st = 0;
        from.copy(tip);
        if (si >= steps.length) plan();
      }
    }

    reach(tip.x, tip.y, tip.z);
    grip(open);
    if (held) {
      held.m.position.set(tip.x, tip.y + CUBE * 0.1, tip.z);
      held.m.rotation.y = yaw.rotation.y;
    }
  };
  return fig;
}
