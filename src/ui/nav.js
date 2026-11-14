// Top bar state, the mobile menu, the section highlight and the depth rail.

const pad = (n, w) => String(n).padStart(w, '0');

export function initNav() {
  const bar = document.querySelector('[data-topbar]');
  const nav = document.getElementById('site-nav');
  const menuBtn = document.querySelector('[data-action="menu"]');
  const depth = document.querySelector('[data-depth]');
  const links = [...document.querySelectorAll('[data-nav]')];
  const ticks = [...document.querySelectorAll('[data-rail]')];
  const sections = [...document.querySelectorAll('[data-section]')];
  // The archive is part of "projects" as far as the top nav is concerned.
  const navAlias = { archive: 'projects', top: null };

  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'close' : 'menu';
  };
  menuBtn?.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav?.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY;
      bar?.classList.toggle('is-scrolled', y > 24);
      // Eight CSS pixels to the metre: an arbitrary but steady scale.
      if (depth) depth.textContent = pad(Math.max(0, Math.round(y / 8)), 4);
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setActive = (id) => {
    const navId = id in navAlias ? navAlias[id] : id;
    links.forEach((a) => {
      const on = a.dataset.nav === navId;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    ticks.forEach((a) => a.classList.toggle('is-active', a.dataset.rail === id));
  };

  // Whichever section crosses the middle of the viewport is the current one.
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) if (en.isIntersecting) setActive(en.target.dataset.section);
    },
    { rootMargin: '-45% 0px -54% 0px' },
  );
  // Pages without sections (the blog) keep the link the server marked active.
  if (!sections.length) return;
  sections.forEach((s) => io.observe(s));
  setActive('top');
}
