import * as THREE from 'three';
import { FIG_NEAR, FIG_FAR } from '../engine.js';

// Colour is semantic, not literal (see shaders.js): grey is the theme's ink,
// red its "hot" accent and blue its "cool" accent. Values are linear.
const col = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace);

export const C = {
  ink: (v = 1) => col(v, v, v),
  hot: (v = 1) => col(v, v * 0.06, v * 0.06),
  cool: (v = 1) => col(v * 0.08, v * 0.12, v),
  // partly tinted, for surfaces that should lean towards an accent
  coolish: (v = 1) => col(v * 0.55, v * 0.6, v),
  hotish: (v = 1) => col(v, v * 0.5, v * 0.5),
};

export const mat = {
  ink: (v = 1, opts = {}) => new THREE.MeshLambertMaterial({ color: C.ink(v), ...opts }),
  hot: (v = 1, opts = {}) => new THREE.MeshLambertMaterial({ color: C.hot(v), ...opts }),
  cool: (v = 1, opts = {}) => new THREE.MeshLambertMaterial({ color: C.cool(v), ...opts }),
  coolish: (v = 1, opts = {}) => new THREE.MeshLambertMaterial({ color: C.coolish(v), ...opts }),
  flat: (v = 1, opts = {}) => new THREE.MeshLambertMaterial({ color: C.ink(v), flatShading: true, ...opts }),
  shiny: (v = 1, opts = {}) =>
    new THREE.MeshPhongMaterial({ color: C.ink(v), specular: C.ink(1), shininess: 90, ...opts }),
};

export const ease = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  smooth: (t) => t * t * (3 - 2 * t),
};

export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const lerp = (a, b, t) => a + (b - a) * t;

/** Small deterministic PRNG so every visitor sees the same layout. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BACKDROP_GEO = new THREE.PlaneGeometry(2, 2);

/**
 * Common scaffolding for a figure: scene, camera, lights, a rig the visitor
 * can turn, and a soft dark backdrop that pushes the ambient world back.
 *
 *   scene
 *   └─ rig     yaw / pitch from dragging
 *      └─ root   the figure's own motion; build geometry in here
 */
export function createFigure({
  radius = 1.2,
  fov = 30,
  pad = 1.06,
  dir = [0, 0.18, 1],
  key = 3.0,
  fill = 0.55,
  amb = 0.3,
  backdrop = 0.92,
  yaw0 = 0,
} = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, FIG_NEAR, FIG_FAR);
  const viewDir = new THREE.Vector3(...dir).normalize();

  const rig = new THREE.Group();
  rig.rotation.order = 'XYZ';
  const root = new THREE.Group();
  rig.add(root);
  scene.add(rig);

  const keyLight = new THREE.DirectionalLight(0xffffff, key);
  keyLight.position.set(-2.6, 3.2, 4);
  const fillLight = new THREE.DirectionalLight(0xffffff, fill);
  fillLight.position.set(3.5, -1.2, -2.5);
  const ambLight = new THREE.AmbientLight(0xffffff, amb);
  scene.add(keyLight, fillLight, ambLight);

  // Not flagged `transparent`: it has to draw before the opaque geometry, so it
  // sits in the opaque list (first, via renderOrder) with blending set by hand.
  const backMat = new THREE.ShaderMaterial({
    transparent: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    depthTest: false,
    depthWrite: false,
    uniforms: { uStrength: { value: backdrop } },
    vertexShader: /* glsl */ `
      varying vec2 vP;
      void main() { vP = position.xy; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vP;
      uniform float uStrength;
      void main() {
        float a = uStrength * smoothstep(1.0, 0.62, length(vP));
        gl_FragColor = vec4(0.0, 0.0, 0.0, a);
      }
    `,
  });
  const back = new THREE.Mesh(BACKDROP_GEO, backMat);
  back.frustumCulled = false;
  back.renderOrder = -100;
  scene.add(back);

  // Unlit materials do not react to the lights, so they fade by colour.
  // They also skip the depth buffer: the silhouette pass outlines whatever
  // wrote depth, and thin glowing details look better without an outline.
  const glows = [];
  const glow = (color, opts = {}) => {
    const m = new THREE.MeshBasicMaterial({ color: color.clone(), depthWrite: false, ...opts });
    glows.push({ m, base: color.clone(), gain: 1 });
    return m;
  };
  let prepared = false;
  const prepare = () => {
    prepared = true;
    scene.traverse((o) => {
      if (o.isMesh && o.material && o.material.depthWrite === false && o !== back) o.renderOrder = 10;
    });
  };

  const fig = {
    scene,
    camera,
    rig,
    root,
    radius,
    yaw0,
    lights: { key: keyLight, fill: fillLight, amb: ambLight },
    glow,
    glows,
    /** Call first in update(): fits the camera, applies drag and the fade. */
    base(ctx) {
      if (!prepared) prepare();
      const half = THREE.MathUtils.degToRad(camera.fov) / 2;
      const fit = Math.min(half, Math.atan(Math.tan(half) * ctx.aspect));
      const dist = (radius / Math.sin(fit)) * pad;
      camera.position.copy(viewDir).multiplyScalar(dist);
      camera.lookAt(0, 0, 0);

      rig.rotation.x = ctx.pitch;
      rig.rotation.y = ctx.yaw;

      const r = ease.out(clamp01(ctx.reveal));
      keyLight.intensity = key * r;
      fillLight.intensity = fill * r;
      ambLight.intensity = amb * r;
      backMat.uniforms.uStrength.value = backdrop * r;
      for (const g of glows) g.m.color.copy(g.base).multiplyScalar(r * g.gain);
      rig.scale.setScalar(lerp(0.9, 1, r));
      return r;
    },
    update() {},
  };
  return fig;
}

/** Lit, but excluded from the silhouette pass (for thin parts). */
export function noEdge(material) {
  material.depthWrite = false;
  return material;
}

/** A cylinder between two points; handy for links, struts and threads. */
export function strut(a, b, radius, material, radial = 6) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, radial, 1), material);
  mesh.position.copy(a).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

/** Hollow box frame made of twelve thin bars. */
export function boxFrame(w, h, d, t, material) {
  const g = new THREE.Group();
  const add = (sx, sy, sz, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
    m.position.set(x, y, z);
    g.add(m);
  };
  for (const sy of [-1, 1]) {
    for (const sz of [-1, 1]) add(w + t, t, t, 0, (sy * h) / 2, (sz * d) / 2);
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) add(t, h + t, t, (sx * w) / 2, 0, (sz * d) / 2);
  }
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) add(t, t, d + t, (sx * w) / 2, (sy * h) / 2, 0);
  }
  return g;
}
