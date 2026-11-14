import * as THREE from 'three';
import { buildAtlas, DEFAULT_CHARSET } from './atlas.js';
import { FULLSCREEN_VERT, CELLS_FRAG, GLYPH_FRAG } from './shaders.js';

// Supersampling per character cell. Cells are 1:2, so 4x8 keeps texels square.
const SSX = 4;
const SSY = 8;

// Shared by every figure camera so the cells pass can linearise depth.
export const FIG_NEAR = 0.1;
export const FIG_FAR = 60;

const hexToVec3 = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const damp = (cur, target, lambda, dt) => cur + (target - cur) * (1 - Math.exp(-lambda * dt));

function fullscreenTriangle() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  return g;
}

/**
 * Renders every 3D scene on the page as text.
 *
 * One canvas the size of the viewport follows the scroll position inside an
 * absolutely positioned layer. The character grid is anchored to the
 * *document*, not the viewport, so glyphs scroll exactly like real text and a
 * figure never swims against the DOM element it is attached to.
 *
 * Per frame:
 *   1. the ambient world and each visible figure are drawn into one small
 *      supersampled target (a figure draws into the rect of its DOM "stage"),
 *   2. the cells pass reduces that to one texel per character
 *      (ink colour + glyph index),
 *   3. the glyph pass stamps atlas glyphs onto the canvas 1:1.
 */
export class AsciiEngine {
  constructor({ layer, family, theme, reducedMotion = false, ambient = null }) {
    this.layer = layer;
    this.family = family;
    this.reduced = reducedMotion;
    this.ambient = ambient;
    this.stages = [];
    this.maxDpr = 2;
    this.charset = DEFAULT_CHARSET;
    this.time = 0;
    this.glitchAmount = 0;
    this.glitchDecay = 2.5;
    this.fade = 0;
    this.running = false;
    this.mouse = { x: -1e5, y: -1e5, on: 0, target: 0, nx: 0, ny: 0 };
    this.metrics = { ms: 16, frames: 0, slow: 0 };
    this.onFrame = null;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'ascii-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    layer.appendChild(this.canvas);

    this.probe = document.createElement('div');
    this.probe.className = 'lvh-probe';
    document.body.appendChild(this.probe);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(1);
    this.renderer.autoClear = false;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.setClearColor(0x000000, 1);

    const gl = this.renderer.getContext();
    const floatOk =
      this.renderer.extensions.has('EXT_color_buffer_float') ||
      this.renderer.extensions.has('EXT_color_buffer_half_float');
    this.sceneType = floatOk ? THREE.HalfFloatType : THREE.UnsignedByteType;
    this.gl = gl;
    this.maxSide = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096, 8192);

    this.sceneRT = null;
    this.cellsRT = null;
    this.atlas = null;

    this.quadScene = new THREE.Scene();
    this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(fullscreenTriangle(), null);
    this.quad.frustumCulled = false;
    this.quadScene.add(this.quad);

    this.cellsMat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: CELLS_FRAG,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
      uniforms: {
        tScene: { value: null },
        tDepth: { value: null },
        uGrid: { value: new THREE.Vector2(1, 1) },
        uSS: { value: new THREE.Vector2(SSX, SSY) },
        uLevels: { value: 10 },
        uInk: { value: new THREE.Vector3(1, 1, 1) },
        uHot: { value: new THREE.Vector3(1, 0, 0) },
        uCool: { value: new THREE.Vector3(0, 0.5, 1) },
        uTime: { value: 0 },
        uGlitch: { value: 0 },
        uRowOrigin: { value: 0 },
        uMouse: { value: new THREE.Vector2(-1e5, -1e5) },
        uMouseOn: { value: 0 },
        uGamma: { value: 0.72 },
        uGain: { value: 1.0 },
        uBlack: { value: 0.018 },
        uDither: { value: 0.55 },
        uInkFloor: { value: 0.42 },
        uEdge: { value: 1.0 },
        uNear: { value: FIG_NEAR },
        uFar: { value: FIG_FAR },
      },
    });

    this.glyphMat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: GLYPH_FRAG,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
      uniforms: {
        tCells: { value: null },
        tAtlas: { value: null },
        uCanvasPx: { value: new THREE.Vector2(1, 1) },
        uCellPx: { value: new THREE.Vector2(8, 16) },
        uGrid: { value: new THREE.Vector2(1, 1) },
        uSubY: { value: 0 },
        uBg: { value: new THREE.Vector3(0, 0, 0) },
        uCellGlow: { value: 0.035 },
        uFade: { value: 0 },
      },
    });

    this.setTheme(theme);
    this.layout(true);

    this._onResize = () => {
      clearTimeout(this._rt);
      this._rt = setTimeout(() => this.layout(false), 120);
    };
    window.addEventListener('resize', this._onResize, { passive: true });
    window.addEventListener('orientationchange', this._onResize, { passive: true });

    this._onPointer = (e) => {
      if (e.pointerType === 'touch') return;
      this.mouse.cx = e.clientX;
      this.mouse.cy = e.clientY;
      this.mouse.target = 1;
      this.mouse.nx = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.ny = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', this._onPointer, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => (this.mouse.target = 0));

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop();
      else this.start();
    });

    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.stop();
    });
    this.canvas.addEventListener('webglcontextrestored', () => {
      this.layout(true);
      this.start();
    });

    this.io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          const st = this.stages.find((s) => s.el === en.target);
          if (st) st.near = en.isIntersecting;
        }
      },
      { rootMargin: '360px 0px 360px 0px' },
    );
  }

  // ---------------------------------------------------------------- theme --

  setTheme(theme) {
    if (!theme) return;
    this.theme = theme;
    this.cellsMat.uniforms.uInk.value.copy(hexToVec3(theme.ink));
    this.cellsMat.uniforms.uHot.value.copy(hexToVec3(theme.hot));
    this.cellsMat.uniforms.uCool.value.copy(hexToVec3(theme.cool));
    this.glyphMat.uniforms.uBg.value.copy(hexToVec3(theme.bg));
  }

  setCharset(name) {
    this.charset = name;
    this.layout(true);
  }

  glitch(amount = 0.6, decay = 2.5) {
    if (this.reduced) return;
    this.glitchAmount = Math.max(this.glitchAmount, amount);
    this.glitchDecay = decay;
  }

  // --------------------------------------------------------------- layout --

  layout(force) {
    const vw = Math.max(1, document.documentElement.clientWidth);
    // A frame that grows to fit its content can report a "viewport" as tall as
    // the whole page. Keep the canvas to a screenful either way.
    const lvh = Math.min(Math.max(this.probe.offsetHeight || 0, window.innerHeight), 3200);
    // Stay inside what the GPU can allocate, and under ~20 megapixels.
    const tall = lvh + Math.round(Math.min(150, lvh * 0.14)) * 2;
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      this.maxDpr,
      this.maxSide / vw,
      this.maxSide / tall,
      Math.sqrt(20e6 / (vw * tall)),
    );
    if (!force && vw === this.vw && lvh === this.lvh && dpr === this.dpr) return;
    this.vw = vw;
    this.lvh = lvh;
    this.dpr = dpr;

    this.margin = Math.round(Math.min(150, lvh * 0.14));
    const fontCss = vw < 560 ? 9.5 : vw < 1100 ? 10.4 : vw < 1800 ? 11.2 : 12.1;
    this.cellH = Math.max(8, Math.round(fontCss * 1.16 * dpr));
    this.cellW = Math.max(4, Math.round(this.cellH * 0.5));

    const cw = Math.round(vw * dpr);
    const ch = Math.round((lvh + this.margin * 2) * dpr);
    this.canvasW = cw;
    this.canvasH = ch;
    this.renderer.setSize(cw, ch, false);
    this.canvas.style.width = `${cw / dpr}px`;
    this.canvas.style.height = `${ch / dpr}px`;

    this.cols = Math.ceil(cw / this.cellW);
    this.rows = Math.ceil(ch / this.cellH) + 1;
    this.targetW = this.cols * SSX;
    this.targetH = this.rows * SSY;

    this.sceneRT?.dispose();
    this.cellsRT?.dispose();
    this.sceneRT = new THREE.WebGLRenderTarget(this.targetW, this.targetH, {
      type: this.sceneType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: true,
      stencilBuffer: false,
      generateMipmaps: false,
    });
    const depthTex = new THREE.DepthTexture(this.targetW, this.targetH);
    depthTex.minFilter = THREE.NearestFilter;
    depthTex.magFilter = THREE.NearestFilter;
    this.sceneRT.depthTexture = depthTex;

    this.cellsRT = new THREE.WebGLRenderTarget(this.cols, this.rows, {
      type: THREE.UnsignedByteType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    });

    this.atlas?.texture.dispose();
    this.atlas = buildAtlas({
      cellW: this.cellW,
      cellH: this.cellH,
      family: this.family,
      charset: this.charset,
    });

    const cu = this.cellsMat.uniforms;
    cu.tScene.value = this.sceneRT.texture;
    cu.tDepth.value = this.sceneRT.depthTexture;
    cu.uGrid.value.set(this.cols, this.rows);
    cu.uLevels.value = this.atlas.levels;

    const gu = this.glyphMat.uniforms;
    gu.tCells.value = this.cellsRT.texture;
    gu.tAtlas.value = this.atlas.texture;
    gu.uCanvasPx.value.set(cw, ch);
    gu.uCellPx.value.set(this.cellW, this.cellH);
    gu.uGrid.value.set(this.cols, this.rows);

    this.ambient?.resize?.({ aspect: vw / lvh, vw, lvh });
    // Resizing the canvas clears it, so repaint in the same task: no blank
    // flash on resize or when the resolution steps down.
    this.frame(0, true);
  }

  // --------------------------------------------------------------- stages --

  /**
   * Attaches a figure to a DOM element. `make` is called the first time the
   * element comes near the viewport and must return a figure object.
   */
  addStage(el, make) {
    const st = {
      el,
      make,
      fig: null,
      near: false,
      reveal: 0,
      seen: false,
      hover: false,
      dragging: false,
      yaw: 0,
      pitch: 0,
      vyaw: 0,
      vpitch: 0,
      px: 0,
      py: 0,
      lastX: 0,
      lastY: 0,
    };
    this.stages.push(st);
    this.io.observe(el);

    el.addEventListener('pointerenter', () => (st.hover = true));
    el.addEventListener('pointerleave', () => (st.hover = false));
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      st.px = ((e.clientX - r.left) / r.width) * 2 - 1;
      st.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (st.dragging) {
        const dx = e.clientX - st.lastX;
        const dy = e.clientY - st.lastY;
        st.lastX = e.clientX;
        st.lastY = e.clientY;
        st.vyaw = dx * 0.012;
        st.vpitch = dy * 0.008;
        st.yaw += st.vyaw;
        st.pitch = clamp(st.pitch + st.vpitch, -0.9, 0.9);
      }
    });
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      st.dragging = true;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      st.vyaw = 0;
      st.vpitch = 0;
      el.classList.add('is-dragging');
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* not capturable */
      }
    });
    const end = () => {
      st.dragging = false;
      el.classList.remove('is-dragging');
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    return st;
  }

  // ---------------------------------------------------------------- loop --

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(tick);
      // rAF timestamps can predate performance.now() on the first tick.
      const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000));
      const rawMs = now - this.last;
      this.last = now;
      this.frame(dt);
      this.trackPerf(rawMs);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  trackPerf(ms) {
    const m = this.metrics;
    m.frames++;
    if (m.frames < 45 || ms > 250) return; // warm-up, tab switches
    m.ms = m.ms * 0.94 + ms * 0.06;
    if (m.ms > 30) m.slow++;
    else m.slow = Math.max(0, m.slow - 2);
    if (m.slow > 90 && this.maxDpr > 1) {
      // Sustained slow frames: trade glyph sharpness for speed, once per step.
      this.maxDpr = Math.max(1, this.maxDpr - 0.5);
      m.slow = 0;
      m.frames = 0;
      this.layout(false);
    }
  }

  frame(dt, still = false) {
    if (!this.sceneRT) return;
    const { renderer, dpr, cellW, cellH, cols, rows, targetW, targetH } = this;
    if (!still) this.time += dt;
    const t = this.time;

    // Park the canvas over the viewport, snapped to device pixels.
    const sy = window.scrollY;
    const topCss = Math.round((sy - this.margin) * dpr) / dpr;
    this.canvas.style.transform = `translate3d(0,${topCss}px,0)`;
    const T = Math.round(topCss * dpr);
    const r0 = Math.floor(T / cellH);
    const sub = T - r0 * cellH;

    // Smoothed interaction state.
    const m = this.mouse;
    m.on = damp(m.on, m.target, 6, dt || 0.016);
    if (m.cx !== undefined) {
      m.x = (m.cx * dpr) / cellW;
      m.y = ((m.cy + sy) * dpr - r0 * cellH) / cellH;
    }
    this.fade = Math.min(1, this.fade + (dt || 0.016) * 1.4);
    this.glitchAmount = Math.max(0, this.glitchAmount - (dt || 0) * this.glitchDecay);

    // 1a. ambient world over the whole target ----------------------------
    const rt = this.sceneRT;
    rt.viewport.set(0, 0, targetW, targetH);
    rt.scissor.set(0, 0, targetW, targetH);
    rt.scissorTest = false;
    renderer.setRenderTarget(rt);
    renderer.clear(true, true, false);

    if (this.ambient) {
      const fullH = rows * cellH + 2 * cellH;
      const fullW = cols * cellW;
      const centre = (sy + this.lvh / 2) * dpr;
      const yOff = r0 * cellH - (centre - fullH / 2);
      this.ambient.update({
        dt: this.reduced ? 0 : dt,
        t: this.reduced ? 0 : t,
        fullW,
        fullH,
        yOff,
        viewW: fullW,
        viewH: rows * cellH,
        centrePx: centre,
        mouseX: m.nx * m.on,
        mouseY: m.ny * m.on,
        reduced: this.reduced,
        progress: this.scrollProgress(sy),
      });
      renderer.render(this.ambient.scene, this.ambient.camera);
      // Figures get their own depth range; clearing here also keeps the
      // silhouette pass from outlining the background.
      renderer.clear(false, true, false);
    }

    // 1b. figures, each into the rect of its stage element ----------------
    const tw = cellW / SSX;
    const th = cellH / SSY;
    for (const st of this.stages) {
      if (!st.near) {
        st.reveal = Math.max(0, st.reveal - (dt || 0) * 2);
        continue;
      }
      const r = st.el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      const x0 = r.left * dpr;
      const y0 = (r.top + sy) * dpr - r0 * cellH;
      const w = r.width * dpr;
      const h = r.height * dpr;
      const tx0 = Math.floor(x0 / tw);
      const tx1 = Math.ceil((x0 + w) / tw);
      const ty0 = Math.floor(y0 / th);
      const ty1 = Math.ceil((y0 + h) / th);
      if (tx1 <= 0 || ty1 <= 0 || tx0 >= targetW || ty0 >= targetH) continue;

      if (!st.fig) {
        st.fig = st.make();
        st.yaw = st.fig.yaw0 ?? 0;
      }
      const fig = st.fig;

      // In view (not merely near): let it fade in.
      const inView = r.bottom > -40 && r.top < window.innerHeight + 40;
      st.reveal = clamp(st.reveal + (dt || 0.016) * (inView ? 1.6 : -1.2), 0, 1);

      if (!st.dragging) {
        st.yaw += st.vyaw;
        st.pitch = clamp(st.pitch + st.vpitch, -0.9, 0.9);
        const k = Math.exp(-4 * (dt || 0.016));
        st.vyaw *= k;
        st.vpitch *= k;
        if (!fig.keepPitch) st.pitch = damp(st.pitch, 0, 0.8, dt || 0.016);
      }

      fig.update({
        dt: this.reduced ? 0 : dt,
        t: this.reduced ? 0 : t,
        reveal: this.reduced ? 1 : st.reveal,
        hover: st.hover,
        dragging: st.dragging,
        px: st.hover ? st.px : 0,
        py: st.hover ? st.py : 0,
        yaw: st.yaw,
        pitch: st.pitch,
        aspect: w / h,
      });

      const cam = fig.camera;
      cam.aspect = w / h;
      cam.setViewOffset(w, h, tx0 * tw - x0, ty0 * th - y0, (tx1 - tx0) * tw, (ty1 - ty0) * th);

      rt.viewport.set(tx0, targetH - ty1, tx1 - tx0, ty1 - ty0);
      const sx0 = clamp(tx0, 0, targetW);
      const sx1 = clamp(tx1, 0, targetW);
      const sy0 = clamp(targetH - ty1, 0, targetH);
      const sy1 = clamp(targetH - ty0, 0, targetH);
      rt.scissor.set(sx0, sy0, sx1 - sx0, sy1 - sy0);
      rt.scissorTest = true;
      renderer.setRenderTarget(rt);
      renderer.render(fig.scene, cam);
    }
    rt.scissorTest = false;

    // 2. one texel per character ------------------------------------------
    const cu = this.cellsMat.uniforms;
    cu.uTime.value = t;
    cu.uGlitch.value = this.glitchAmount;
    cu.uRowOrigin.value = r0;
    cu.uMouse.value.set(m.x ?? -1e5, m.y ?? -1e5);
    cu.uMouseOn.value = this.reduced ? 0 : m.on;
    this.quad.material = this.cellsMat;
    renderer.setRenderTarget(this.cellsRT);
    renderer.render(this.quadScene, this.quadCam);

    // 3. glyphs -----------------------------------------------------------
    const gu = this.glyphMat.uniforms;
    gu.uSubY.value = sub;
    gu.uFade.value = this.fade;
    this.quad.material = this.glyphMat;
    renderer.setRenderTarget(null);
    renderer.setViewport(0, 0, this.canvasW, this.canvasH);
    renderer.render(this.quadScene, this.quadCam);

    this.onFrame?.(dt, t);
  }

  scrollProgress(sy) {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    return clamp(sy / max, 0, 1);
  }
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}
