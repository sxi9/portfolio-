import * as THREE from 'three';
import { createFigure, C, mat, noEdge } from './common.js';
import { LAND_W, LAND_H, LAND_B64 } from '../landmask.js';

const rad = THREE.MathUtils.degToRad;

/** Matches SphereGeometry's UV layout: lon 0 on +x, 90E on -z. */
function onSphere(lat, lon, r = 1, out = new THREE.Vector3()) {
  const p = rad(lat);
  const l = rad(lon);
  return out.set(r * Math.cos(p) * Math.cos(l), r * Math.sin(p), -r * Math.cos(p) * Math.sin(l));
}

function landTexture() {
  const bin = atob(LAND_B64);
  const data = new Uint8Array(LAND_W * LAND_H * 4);
  for (let j = 0; j < LAND_H; j++) {
    for (let i = 0; i < LAND_W; i++) {
      const src = j * LAND_W + i;
      const land = (bin.charCodeAt(src >> 3) >> (7 - (src & 7))) & 1;
      const o = ((LAND_H - 1 - j) * LAND_W + i) * 4; // row 0 of the mask is the north pole
      // Cheap value noise so the continents are not one flat block of '@'.
      const n = 0.5 + 0.5 * Math.sin(i * 0.9 + Math.sin(j * 0.7) * 2.1) * Math.cos(j * 1.3 + i * 0.21);
      const v = land ? Math.round(150 + 95 * n) : 0;
      data[o] = land ? v : 2;
      data[o + 1] = land ? v : 4;
      data[o + 2] = land ? v : 20;
      data[o + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, LAND_W, LAND_H, THREE.RGBAFormat);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

const HOME = { lat: 12.97, lon: 77.59 }; // Bengaluru
const HUBS = [
  [40.71, -74.01], // New York
  [37.77, -122.42], // San Francisco
  [-23.55, -46.63], // Sao Paulo
  [51.51, -0.13], // London
  [50.11, 8.68], // Frankfurt
  [25.2, 55.27], // Dubai
  [-26.2, 28.05], // Johannesburg
  [1.35, 103.82], // Singapore
  [35.68, 139.69], // Tokyo
  [-33.87, 151.21], // Sydney
];

export function createGlobe() {
  const fig = createFigure({
    radius: 1.3,
    fov: 28,
    dir: [0, 0.22, 1],
    key: 2.9,
    fill: 0.45,
    amb: 0.5,
    backdrop: 0.95,
  });

  const tilt = new THREE.Group();
  tilt.rotation.z = rad(-18);
  const spin = new THREE.Group();
  tilt.add(spin);
  fig.root.add(tilt);

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1, 72, 40),
    new THREE.MeshLambertMaterial({ map: landTexture() }),
  );
  spin.add(earth);

  // Thin shell of "atmosphere" so the limb reads as a soft dotted halo.
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(1.085, 48, 24),
    fig.glow(C.cool(0.16), { side: THREE.BackSide, depthWrite: false }),
  );
  fig.root.add(halo);

  // Home marker with two expanding rings lying on the surface.
  const home = onSphere(HOME.lat, HOME.lon, 1.0);
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 8), fig.glow(C.hot(1)));
  pin.position.copy(home).multiplyScalar(1.015);
  spin.add(pin);
  const rings = [];
  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.11, 5, 40), fig.glow(C.hot(1)));
    ring.position.copy(home).multiplyScalar(1.012);
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), home.clone().normalize());
    spin.add(ring);
    rings.push(ring);
  }

  // Great-circle arcs from a handful of hubs, with a pulse running home.
  const arcMat = fig.glow(C.hot(0.5));
  const pulseMat = fig.glow(C.hot(1));
  const hubMat = fig.glow(C.ink(0.9));
  const arcs = [];
  const a = new THREE.Vector3();
  HUBS.forEach(([lat, lon], i) => {
    const s = onSphere(lat, lon);
    const e = home.clone();
    const angle = s.angleTo(e);
    const lift = 0.1 + 0.42 * (angle / Math.PI);
    const pts = [];
    const n = 28;
    for (let k = 0; k <= n; k++) {
      const u = k / n;
      // slerp
      const so = Math.sin(angle);
      a.copy(s)
        .multiplyScalar(Math.sin((1 - u) * angle) / so)
        .addScaledVector(e, Math.sin(u * angle) / so);
      pts.push(a.clone().multiplyScalar(1 + lift * Math.sin(Math.PI * u)));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    spin.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 44, 0.0085, 5, false), arcMat));

    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), hubMat);
    hub.position.copy(s).multiplyScalar(1.01);
    spin.add(hub);

    const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), pulseMat);
    spin.add(pulse);
    arcs.push({ curve, pulse, speed: 0.16 + (i % 4) * 0.035, phase: (i * 0.37) % 1 });
  });

  // An orbit ring and a small satellite.
  const orbit = new THREE.Group();
  orbit.rotation.set(rad(68), 0, rad(18));
  orbit.add(new THREE.Mesh(new THREE.TorusGeometry(1.27, 0.007, 5, 120), noEdge(mat.ink(0.85))));
  const sat = new THREE.Group();
  sat.add(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), noEdge(mat.ink(1))));
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.012, 0.07), noEdge(mat.coolish(1)));
  sat.add(wing);
  orbit.add(sat);
  fig.root.add(orbit);

  // Face the home longitude at the start.
  spin.rotation.y = -(Math.PI / 2 + rad(HOME.lon)) + 0.35;

  fig.keepPitch = false;
  fig.update = (ctx) => {
    fig.base(ctx);
    const { t, dt } = ctx;
    spin.rotation.y += dt * 0.07;

    const k = (t * 0.45) % 1;
    rings.forEach((ring, i) => {
      const u = (k + i * 0.5) % 1;
      const s = 0.03 + u * 0.16;
      ring.scale.set(s, s, s * 0.25);
      ring.material.color.multiplyScalar(1 - u);
    });

    for (const arc of arcs) {
      const u = (((t * arc.speed + arc.phase) % 1) + 1) % 1;
      arc.curve.getPoint(u, arc.pulse.position);
      arc.pulse.scale.setScalar(0.6 + Math.sin(u * Math.PI) * 0.9);
    }

    const ang = t * 0.42;
    sat.position.set(Math.cos(ang) * 1.27, Math.sin(ang) * 1.27, 0);
    sat.rotation.z = ang;

    // A gentle lean towards the pointer.
    tilt.rotation.x = THREE.MathUtils.lerp(tilt.rotation.x, ctx.py * 0.12, 0.06);
  };

  return fig;
}
