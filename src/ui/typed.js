// The rotating line under the name: type, hold, erase, next.

export function initTyped(lines, { reduced }) {
  const el = document.querySelector('[data-typed]');
  if (!el || reduced || lines.length < 2) return;

  let line = 0;
  let pos = lines[0].length;
  let dir = -1; // start by erasing the prerendered first line
  let timer;

  const tick = () => {
    const text = lines[line];
    if (dir < 0) {
      pos--;
      el.textContent = text.slice(0, Math.max(pos, 0));
      if (pos <= 0) {
        dir = 1;
        line = (line + 1) % lines.length;
        timer = setTimeout(tick, 260);
        return;
      }
      timer = setTimeout(tick, 16);
    } else {
      pos++;
      el.textContent = text.slice(0, pos);
      if (pos >= text.length) {
        dir = -1;
        timer = setTimeout(tick, 2600);
        return;
      }
      timer = setTimeout(tick, 34 + Math.random() * 40);
    }
  };
  timer = setTimeout(tick, 3200);

  document.addEventListener('visibilitychange', () => {
    clearTimeout(timer);
    if (!document.hidden) timer = setTimeout(tick, 600);
  });
}
