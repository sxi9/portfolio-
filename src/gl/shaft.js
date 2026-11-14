import * as THREE from 'three';
import { C, rng } from './figures/common.js';

const rad = THREE.MathUtils.degToRad;

/**
 * The ambient world: an endless service shaft the page descends through.
 *
 * The camera looks horizontally at the far wall and moves down as the page
 * scrolls. The far wall is tied 1:1 to the document, so it behaves like the
 * paper the content is printed on; everything nearer slides past faster.
 *
 * Composition, front to back:
 *   - side walls with plates, ledges and pipes, lit from inside the shaft and
 *     fading into fog, so they frame the page without sitting behind the text
 *   - motes hanging in the air at every depth (the parallax you notice most)
 *   - a far wall that is almost lost in the dark, picked out by ring beams
 *     and status lights
 *
 * Decoration repeats every `P` units and is re-centred around the camera; the
 * continuous parts (walls, pipes) simply follow it.
 */
export function createShaft() {
  const D = 13; // camera to far wall
  const P = 32; // vertical period of the decoration
  const X0 = 6; // half-width the far wall is modelled at (scaled to fit)
  const FOV = 50;
  const rand = rng(90210);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 1.5, D + 2.6);

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 90);
  scene.add(camera);
  const lamp = new THREE.PointLight(0xffffff, 26, 0, 2);
  camera.add(lamp);

  // Each side wall gets its own light from across the shaft, so the walls read
  // as lit surfaces and only the fog makes them recede.
  const fromRight = new THREE.DirectionalLight(0xffffff, 1.5);
  fromRight.position.set(1, 0.15, 0.2);
  const fromLeft = new THREE.DirectionalLight(0xffffff, 1.5);
  fromLeft.position.set(-1, 0.15, 0.2);
  // Straight down: only ledges catch it.
  const sky = new THREE.DirectionalLight(0xffffff, 1.3);
  sky.position.set(0, 1, 0);
  scene.add(fromRight, fromLeft, sky, new THREE.AmbientLight(0xffffff, 0.03));

  const shell = new THREE.Group(); // follows the camera exactly
  const world = new THREE.Group(); // snaps in steps of P
  scene.add(shell, world);

  const left = new THREE.Group();
  const right = new THREE.Group();
  right.scale.x = -1;
  const far = new THREE.Group();
  world.add(left, right, far);

  const shellLeft = new THREE.Group();
  const shellRight = new THREE.Group();
  shellRight.scale.x = -1;
  const shellFar = new THREE.Group();
  shell.add(shellLeft, shellRight, shellFar);

  const wallMat = new THREE.MeshLambertMaterial({ color: C.ink(0.2) });
  const farMat = new THREE.MeshLambertMaterial({ color: C.ink(0.5) });
  const beamMat = new THREE.MeshLambertMaterial({ color: C.ink(0.85) });
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const dummy = new THREE.Object3D();
  const tmpColor = new THREE.Color();
  const TALL = P * 3;

  // -- continuous shells -------------------------------------------------
  for (const g of [shellLeft, shellRight]) {
    const wall = new THREE.Mesh(boxGeo, wallMat);
    wall.scale.set(1, TALL, D + 6);
    wall.position.set(-0.5, 0, -D / 2 + 3);
    g.add(wall);
  }
  const farWall = new THREE.Mesh(boxGeo, farMat);
  farWall.scale.set(X0 * 2 + 2, TALL, 1);
  farWall.position.set(0, 0, -D - 0.5);
  shellFar.add(farWall);

  const pipeGeo = new THREE.CylinderGeometry(1, 1, TALL, 10, 1, true);
  const pipeMat = new THREE.MeshLambertMaterial({ color: C.ink(0.7) });
  const sidePipes = [
    { z: -4.6, r: 0.2, off: 0.32 },
    { z: -5.15, r: 0.09, off: 0.18 },
    { z: -9.4, r: 0.26, off: 0.4 },
  ];
  for (const g of [shellLeft, shellRight]) {
    for (const p of sidePipes) {
      const m = new THREE.Mesh(pipeGeo, pipeMat);
      m.scale.set(p.r, 1, p.r);
      m.position.set(p.off, 0, p.z);
      g.add(m);
    }
  }

  // -- repeating decoration ---------------------------------------------
  const plateMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const tint = (out, v) => (rand() < 0.12 ? out.copy(C.coolish(v)) : out.copy(C.ink(v)));

  const makeSide = (group, shift) => {
    const n = 64;
    const mesh = new THREE.InstancedMesh(boxGeo, plateMat, n * 3);
    let k = 0;
    for (let i = 0; i < n; i++) {
      const prot = 0.06 + rand() * rand() * 0.55;
      const h = 0.4 + rand() * rand() * 3.6;
      const len = 0.5 + rand() * 2.8;
      const z = -1.6 - rand() * (D - 2.6);
      const y = (rand() - 0.5) * P;
      tint(tmpColor, 0.25 + rand() * 0.75);
      for (let c = -1; c <= 1; c++) {
        dummy.position.set(prot / 2, y + c * P + shift, z);
        dummy.scale.set(prot, h, len);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(k, dummy.matrix);
        mesh.setColorAt(k, tmpColor);
        k++;
      }
    }
    mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    group.add(mesh);
  };
  makeSide(left, 0);
  makeSide(right, 4.3);

  {
    // Far wall plates: mostly swallowed by the fog, which is the point.
    const n = 40;
    const mesh = new THREE.InstancedMesh(boxGeo, plateMat, n * 3);
    let k = 0;
    for (let i = 0; i < n; i++) {
      const w = 0.6 + rand() * rand() * 3.4;
      const h = 0.4 + rand() * rand() * 3.6;
      const prot = 0.1 + rand() * rand() * 0.8;
      const x = (rand() * 2 - 1) * (X0 - w / 2);
      const y = (rand() - 0.5) * P;
      tint(tmpColor, 0.3 + rand() * 0.7);
      for (let c = -1; c <= 1; c++) {
        dummy.position.set(x, y + c * P, -D + prot / 2);
        dummy.scale.set(w, h, prot);
        dummy.updateMatrix();
        mesh.setMatrixAt(k, dummy.matrix);
        mesh.setColorAt(k, tmpColor);
        k++;
      }
    }
    mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    far.add(mesh);
  }

  // Ring beams every quarter period, thin ledges in between on the sides.
  {
    const beams = 4;
    const ledges = 16;
    const side = (group) => {
      const mesh = new THREE.InstancedMesh(boxGeo, beamMat, ledges * 3);
      let k = 0;
      for (let i = 0; i < ledges; i++) {
        const big = i % 4 === 0;
        for (let c = -1; c <= 1; c++) {
          dummy.position.set(big ? 0.32 : 0.12, (i / ledges - 0.5) * P + c * P, -D / 2 + 0.4);
          dummy.scale.set(big ? 0.64 : 0.24, big ? 0.36 : 0.09, D + 0.8);
          dummy.updateMatrix();
          mesh.setMatrixAt(k++, dummy.matrix);
        }
      }
      mesh.frustumCulled = false;
      group.add(mesh);
    };
    side(left);
    side(right);
    const mesh = new THREE.InstancedMesh(boxGeo, beamMat, beams * 3);
    let k = 0;
    for (let i = 0; i < beams; i++) {
      for (let c = -1; c <= 1; c++) {
        dummy.position.set(0, (i / beams - 0.5) * P + c * P, -D + 0.32);
        dummy.scale.set(X0 * 2 + 1, 0.36, 0.64);
        dummy.updateMatrix();
        mesh.setMatrixAt(k++, dummy.matrix);
      }
    }
    mesh.frustumCulled = false;
    far.add(mesh);
  }

  // Status lights: unlit and unfogged, so each is one bright glyph.
  const leds = [];
  const ledMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
  const makeLeds = (group, n, place) => {
    const mesh = new THREE.InstancedMesh(boxGeo, ledMat, n * 3);
    mesh.frustumCulled = false;
    let k = 0;
    for (let i = 0; i < n; i++) {
      const roll = rand();
      const base = roll < 0.2 ? C.hot(1) : roll < 0.5 ? C.cool(1) : C.ink(1);
      const s = 0.07 + rand() * 0.06;
      const info = { mesh, idx: [], base, f: 0.4 + rand() * 2.2, ph: rand() * 6.28, duty: 0.3 + rand() * 0.55 };
      const pos = place();
      for (let c = -1; c <= 1; c++) {
        dummy.position.set(pos.x, pos.y + c * P, pos.z);
        dummy.scale.set(pos.sx ?? s, s, pos.sz ?? s);
        dummy.updateMatrix();
        mesh.setMatrixAt(k, dummy.matrix);
        mesh.setColorAt(k, base);
        info.idx.push(k);
        k++;
      }
      leds.push(info);
    }
    group.add(mesh);
    return mesh;
  };
  const ledMeshes = [
    makeLeds(left, 22, () => ({ x: 0.06, y: (rand() - 0.5) * P, z: -3.6 - rand() * (D - 4.6), sx: 0.08 })),
    makeLeds(right, 22, () => ({ x: 0.06, y: (rand() - 0.5) * P, z: -3.6 - rand() * (D - 4.6), sx: 0.08 })),
    makeLeds(far, 34, () => ({ x: (rand() * 2 - 1) * (X0 - 0.4), y: (rand() - 0.5) * P, z: -D + 0.08, sz: 0.08 })),
  ];

  // Motes: specks hanging in the air at every depth. They barely move on their
  // own; scrolling is what sends them past at different speeds.
  const motes = [];
  const MOTES = 150;
  const moteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const moteMesh = new THREE.InstancedMesh(boxGeo, moteMat, MOTES * 3);
  moteMesh.frustumCulled = false;
  for (let i = 0; i < MOTES; i++) {
    const roll = rand();
    motes.push({
      u: rand() * 2 - 1, // -1..1 across the shaft
      y: (rand() - 0.5) * P,
      z: -2.2 - rand() * (D - 3.2),
      s: 0.035 + rand() * 0.05,
      drift: (rand() - 0.5) * 0.25,
      ph: rand() * 6.28,
    });
    const col = roll < 0.1 ? C.hot(0.9) : roll < 0.3 ? C.cool(0.9) : C.ink(0.5 + rand() * 0.5);
    for (let c = 0; c < 3; c++) moteMesh.setColorAt(i * 3 + c, col);
  }
  moteMesh.instanceColor.needsUpdate = true;
  world.add(moteMesh);

  let halfW = -1;
  let clock = 0;

  function update(view) {
    const { t, dt } = view;
    camera.aspect = view.fullW / view.fullH;
    camera.setViewOffset(view.fullW, view.fullH, 0, view.yOff, view.viewW, view.viewH);

    // Fit the shaft to the viewport: side walls hug the edges of the screen.
    const tanH = Math.tan(rad(FOV / 2)) * camera.aspect;
    // On tall, narrow screens the walls would only be two bright slivers, so
    // they are pushed just outside the view and the motes carry the depth.
    const cover = camera.aspect > 1.15 ? 0.76 : camera.aspect > 0.75 ? 0.9 : 1.06;
    const X = D * tanH * cover;
    if (Math.abs(X - halfW) > 1e-3) {
      halfW = X;
      left.position.x = shellLeft.position.x = -X;
      right.position.x = shellRight.position.x = X;
      far.scale.x = shellFar.scale.x = X / X0;
    }

    // One document pixel = one pixel on the far wall.
    const ppu = view.fullH / (2 * D * Math.tan(rad(FOV / 2)));
    const y = -view.centrePx / ppu;
    clock += dt;
    const bob = view.reduced ? 0 : Math.sin(clock * 0.35) * 0.05;
    camera.position.set(view.mouseX * 0.55, y + bob - view.mouseY * 0.25, 0);
    camera.rotation.set(-view.mouseY * 0.02, -view.mouseX * 0.035, 0);
    shell.position.y = y;
    world.position.y = Math.round(y / P) * P;

    if (!view.reduced) {
      for (const led of leds) {
        const on = (Math.sin(t * led.f + led.ph) + 1) / 2 < led.duty ? 1 : 0.1;
        tmpColor.copy(led.base).multiplyScalar(on);
        for (const k of led.idx) led.mesh.setColorAt(k, tmpColor);
      }
      for (const m of ledMeshes) m.instanceColor.needsUpdate = true;
    }

    const inner = X - 0.9;
    for (let i = 0; i < MOTES; i++) {
      const m = motes[i];
      const yy = m.y + Math.sin(t * 0.3 + m.ph) * 0.25 + ((t * m.drift) % P);
      const xx = m.u * inner + Math.cos(t * 0.21 + m.ph) * 0.12;
      for (let c = -1; c <= 1; c++) {
        dummy.position.set(xx, yy + c * P, m.z);
        dummy.scale.setScalar(m.s);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        moteMesh.setMatrixAt(i * 3 + c + 1, dummy.matrix);
      }
    }
    moteMesh.instanceMatrix.needsUpdate = true;
  }

  return { scene, camera, update, resize() {} };
}
