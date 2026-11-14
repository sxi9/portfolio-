// Skills as a slowly turning sphere of real, selectable-by-screen-reader-free
// text. Each tag is positioned by hand every frame: a point on a Fibonacci
// sphere, rotated, then projected with a little perspective.

export function initTagSphere({ reduced }) {
  const root = document.querySelector('[data-tagsphere]');
  if (!root || reduced) return;
  const tags = [...root.children];
  const n = tags.length;
  if (!n) return;

  const pts = tags.map((el, i) => {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(1 - y * y);
    const a = i * Math.PI * (3 - Math.sqrt(5));
    return { el, x: Math.cos(a) * r, y, z: Math.sin(a) * r };
  });

  root.classList.add('is-live');
  let rx = 0.3;
  let ry = 0;
  let vx = 0;
  let vy = 0.0035;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let visible = false;
  let raf = 0;
  let w = 0;
  let h = 0;

  const measure = () => {
    w = root.clientWidth;
    h = root.clientHeight;
  };
  measure();
  new ResizeObserver(measure).observe(root);

  const frame = () => {
    raf = visible ? requestAnimationFrame(frame) : 0;
    if (!dragging) {
      ry += vy;
      rx += vx;
      vx *= 0.94;
      vy += (0.0035 * Math.sign(vy || 1) - vy) * 0.02; // drift back to an idle spin
    }
    rx = Math.max(-1.1, Math.min(1.1, rx));
    const cx = Math.cos(rx);
    const sx = Math.sin(rx);
    const cy = Math.cos(ry);
    const sy = Math.sin(ry);
    const R = Math.min(w * 0.41, h * 0.44);
    for (const p of pts) {
      const x1 = p.x * cy + p.z * sy;
      const z1 = -p.x * sy + p.z * cy;
      const y1 = p.y * cx - z1 * sx;
      const z2 = p.y * sx + z1 * cx;
      const k = 1.9 / (2.5 - z2); // perspective: near tags are bigger
      const s = 0.62 + (z2 + 1) * 0.32;
      p.el.style.transform = `translate(-50%, -50%) translate3d(${(x1 * R * k).toFixed(1)}px, ${(y1 * R * k * 0.92).toFixed(1)}px, 0) scale(${s.toFixed(3)})`;
      // tags on the far side fade right back so the near ones stay legible
      p.el.style.opacity = Math.max(0.07, Math.pow((z2 + 1) / 2, 2.2)).toFixed(3);
      p.el.style.zIndex = String(Math.round((z2 + 1) * 50));
    }
  };

  new IntersectionObserver(
    ([en]) => {
      visible = en.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    },
    { rootMargin: '80px' },
  ).observe(root);

  root.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    try {
      root.setPointerCapture(e.pointerId);
    } catch {
      /* fine */
    }
  });
  root.addEventListener('pointermove', (e) => {
    if (!dragging) {
      if (e.pointerType === 'mouse') {
        // without a button held, the pointer just steers the idle spin
        const r = root.getBoundingClientRect();
        vy = ((e.clientX - r.left) / r.width - 0.5) * 0.02;
      }
      return;
    }
    vy = (e.clientX - lastX) * 0.006;
    vx = (e.clientY - lastY) * 0.004;
    ry += vy;
    rx += vx;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  const end = () => (dragging = false);
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', end);
}
