// Category filter for the project archive, plus the "show all" and per-project
// "details" toggles that keep the page short on phones.

export function initArchive() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-more]');
    if (!btn) return;
    const open = btn.closest('.project').classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(open));
  });

  const root = document.querySelector('.archive');
  if (!root) return;
  const buttons = [...root.querySelectorAll('[data-filter]')];
  const rows = [...root.querySelectorAll('.row')];
  const count = root.querySelector('[data-count]');

  const apply = (cat) => {
    let n = 0;
    for (const row of rows) {
      const show = cat === 'all' || row.dataset.cat === cat;
      row.hidden = !show;
      if (show) n++;
    }
    for (const b of buttons) {
      const on = b.dataset.filter === cat;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    }
    if (count) count.textContent = String(n);
  };

  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-archive-all]')) {
      root.classList.add('is-all');
      return;
    }
    const b = e.target.closest('[data-filter]');
    if (b) {
      root.classList.add('is-all'); // a filter is a request to see every match
      apply(b.dataset.filter);
    }
  });
}
