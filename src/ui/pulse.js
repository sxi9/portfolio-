// GitHub pulse: what was pushed last, and a graph of recent public activity.
// The panel is prerendered from a snapshot (src/pulse-data.js); this replaces
// it with live data when api.github.com answers. That is the only request the
// site makes to anyone but its own host, and nothing breaks if it fails.

import { profile } from '../content.js';
import { pulseGraph, pulseRows, relTime } from '../render.js';
import { pulseSnapshot } from '../pulse-data.js';

const CACHE = 'sxi9-pulse';
const TTL = 45 * 60 * 1000; // stay well inside GitHub's anonymous rate limit

async function fetchLive() {
  const get = async (url) => {
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
    return res.json();
  };
  const user = encodeURIComponent(profile.handle);
  const repos = await get(`https://api.github.com/users/${user}/repos?sort=pushed&per_page=10&type=owner`);
  const events = [];
  for (let page = 1; page <= 3; page++) {
    const batch = await get(`https://api.github.com/users/${user}/events/public?per_page=100&page=${page}`);
    events.push(...batch);
    if (batch.length < 100) break;
  }

  // The events feed only reaches back so far, so older days keep the
  // snapshot's numbers and newer days come from the feed.
  const days = { ...pulseSnapshot.days };
  const fresh = {};
  for (const e of events) {
    const d = String(e.created_at || '').slice(0, 10);
    if (d > pulseSnapshot.asOf) fresh[d] = (fresh[d] || 0) + 1;
  }
  Object.assign(days, fresh);

  return {
    asOf: new Date().toISOString().slice(0, 10),
    repos: repos
      .filter((r) => !r.fork && !r.private && r.size > 0)
      .slice(0, 6)
      .map((r) => ({ name: r.name, pushedAt: r.pushed_at, language: r.language || '', url: r.html_url })),
    days,
  };
}

export function initPulse() {
  const root = document.querySelector('[data-pulse]');
  if (!root) return;
  const list = root.querySelector('[data-pulse-list]');
  const graph = root.querySelector('[data-pulse-graph]');
  const status = root.querySelector('[data-pulse-status]');
  const sum = root.querySelector('[data-pulse-sum]');

  const paint = (data, live) => {
    if (!data.repos?.length) return;
    list.innerHTML = pulseRows(data.repos);
    list.querySelectorAll('time').forEach((t) => (t.textContent = relTime(t.dateTime)));
    const g = pulseGraph(data.days, data.asOf);
    graph.innerHTML = g.html;
    sum.textContent = `${g.active} active days of ${16 * 7}`;
    status.textContent = live ? 'live from api.github.com' : `snapshot, ${data.asOf}`;
    root.classList.toggle('is-live', live);
  };

  paint(pulseSnapshot, false);

  try {
    const cached = JSON.parse(localStorage.getItem(CACHE) || 'null');
    if (cached && Date.now() - cached.at < TTL) {
      paint(cached.data, true);
      return;
    }
  } catch {
    /* no storage: just fetch */
  }

  fetchLive()
    .then((data) => {
      paint(data, true);
      try {
        localStorage.setItem(CACHE, JSON.stringify({ at: Date.now(), data }));
      } catch {
        /* fine */
      }
    })
    .catch(() => {
      /* offline, rate limited or blocked: the snapshot stays */
    });
}
