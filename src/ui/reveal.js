// Scroll-in reveals, and the "typed" command line above each section title.

export function initReveal({ reduced }) {
  const items = [...document.querySelectorAll('[data-reveal]')];
  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const typeOut = (el) => {
    const text = el.dataset.full;
    let i = 0;
    const tick = () => {
      el.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(tick, 22 + Math.random() * 38);
    };
    tick();
  };

  // Empty the command lines up front, but remember what they said.
  document.querySelectorAll('[data-type]').forEach((el) => {
    el.dataset.full = el.textContent;
    el.textContent = '';
  });

  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const el = en.target;
        io.unobserve(el);
        el.classList.add('is-in');
        el.querySelectorAll('[data-type]').forEach((t) => setTimeout(() => typeOut(t), 180));
      }
    },
    { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
  );

  // Stagger siblings a little so a row of panels does not land as one block.
  const seen = new Map();
  for (const el of items) {
    const n = seen.get(el.parentElement) || 0;
    seen.set(el.parentElement, n + 1);
    el.style.setProperty('--d', `${Math.min(n, 5) * 70}ms`);
    io.observe(el);
  }
}
