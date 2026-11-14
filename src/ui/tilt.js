// The identity card: leans towards the pointer, flips on click or Enter, and
// carries an ASCII identicon derived from the handle.

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mirror-symmetric glyph block, the same for the same seed every time. */
export function identicon(seed, cols = 11, rows = 7) {
  const ramp = ' .:+x#@';
  let state = hash(seed);
  const next = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
  const half = Math.ceil(cols / 2);
  const lines = [];
  for (let y = 0; y < rows; y++) {
    const left = [];
    for (let x = 0; x < half; x++) {
      // denser towards the middle so it reads as one shape
      const bias = 0.25 + 0.6 * (x / (half - 1)) * (1 - Math.abs(y - (rows - 1) / 2) / rows);
      const r = next();
      left.push(r < bias ? ramp[2 + Math.floor(next() * (ramp.length - 2))] : r < bias + 0.12 ? '.' : ' ');
    }
    const right = left.slice(0, cols - half).reverse();
    lines.push(left.concat(right).join(''));
  }
  return lines.join('\n');
}

export function initTilt({ reduced, seed }) {
  document.querySelectorAll('[data-identicon]').forEach((el) => (el.textContent = identicon(seed)));

  document.querySelectorAll('[data-flip]').forEach((card) => {
    const flip = () => {
      const on = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', String(on));
    };
    card.setAttribute('aria-pressed', 'false');
    card.addEventListener('click', flip);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        flip();
      }
    });
  });

  if (reduced) return;
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.classList.add('is-tilting');
      card.style.setProperty('--ry', `${(x * 16).toFixed(2)}deg`);
      card.style.setProperty('--rx', `${(-y * 12).toFixed(2)}deg`);
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-tilting');
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--rx', '0deg');
    });
  });
}
