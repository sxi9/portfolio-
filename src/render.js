// Pure string renderers. No DOM access in here: the same functions run in
// Node (vite.config.js prerenders every page) and in the browser (the
// terminal and the GitHub pulse reuse a few of them).

import {
  profile,
  about,
  experience,
  education,
  featured,
  archive,
  categories,
  skills,
  cloud,
  census,
  certifications,
  sections,
  HERO_BANNER,
} from './content.js';

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const pad2 = (n) => String(n).padStart(2, '0');

/** A title as HTML: short hyphenated tokens (model numbers, compounds) never break across lines. */
const titleHtml = (s) =>
  esc(s).replace(/[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+/g, (m) => (m.length <= 14 ? `<span class="nb">${m}</span>` : m));
const ext = 'target="_blank" rel="noopener noreferrer"';
const PROMPT = `<span class="cmd__prompt">${esc(profile.handle)}@intel:~$</span>`;

// Where a page sits relative to the site root, and to the blog folder.
const HOME = { home: '', blog: './blog/', isHome: true };
const BLOG = { home: '../', blog: './', isHome: false };

const sectionHead = (num, title, cmd) => `
  <header class="section__head" data-reveal>
    <p class="cmd" aria-hidden="true">${PROMPT} <span class="cmd__text" data-type>${esc(cmd)}</span></p>
    <h2 class="section__title"><span class="section__num">${num}</span>${esc(title)}</h2>
  </header>`;

const tags = (list, cls = '') =>
  list.length ? `<ul class="tags ${cls}">${list.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '';

const stage = (figure, label, tl, br = 'drag to rotate', cls = '') => `
  <div class="stage ${cls}" data-figure="${figure}" role="img" aria-label="${esc(label)}">
    <span class="stage__corner stage__corner--tl"></span>
    <span class="stage__corner stage__corner--tr"></span>
    <span class="stage__corner stage__corner--bl"></span>
    <span class="stage__corner stage__corner--br"></span>
    <span class="stage__tag stage__tag--tl">${esc(tl)}</span>
    <span class="stage__tag stage__tag--br">${esc(br)}</span>
  </div>`;

/** Sections that exist on this build: the blog only shows once it has posts. */
const liveSections = (posts) => sections.filter((s) => s.id !== 'blog' || posts.length > 0);

// ------------------------------------------------------------------ chrome --

function topbar(ctx, posts, active = '') {
  const links = liveSections(posts)
    .filter((s) => s.nav)
    .map((s) => {
      // On the home page everything is an anchor. From a blog page the blog
      // link goes to the index, the rest go home.
      const href = ctx.isHome ? `#${s.id}` : s.id === 'blog' ? `${ctx.blog}index.html` : `${ctx.home}#${s.id}`;
      const on = active === s.id ? ' class="is-active" aria-current="page"' : '';
      return `<a href="${href}" data-nav="${s.id}"${on}>${esc(s.nav)}</a>`;
    })
    .join('');
  return `
  <header class="topbar" data-topbar>
    <a class="brand" href="${ctx.isHome ? '#top' : ctx.home}" aria-label="${esc(profile.name)}, ${ctx.isHome ? 'back to top' : 'home'}">
      <span class="brand__user">${esc(profile.handle)}</span><span class="brand__dim">@intel:~$</span><span class="cursor" aria-hidden="true"></span>
    </a>
    <nav class="nav" id="site-nav" aria-label="Sections">${links}</nav>
    <div class="topbar__tools">
      <button class="chip" type="button" data-action="theme" aria-label="Switch colour theme" title="Switch colour theme">
        <span class="chip__dot" aria-hidden="true"></span><span data-theme-name>phosphor</span>
      </button>
      <button class="chip chip--term" type="button" data-action="terminal" aria-label="Open the terminal" title="Open the terminal (press \`)">&gt;_</button>
      <button class="chip chip--menu" type="button" data-action="menu" aria-expanded="false" aria-controls="site-nav">menu</button>
    </div>
  </header>`;
}

function rail(posts) {
  const ticks = liveSections(posts)
    .map(
      (s, i) => `
      <a class="rail__tick" href="#${s.id}" data-rail="${s.id}" tabindex="-1">
        <span class="rail__label">${pad2(i)} ${esc(s.label)}</span><span class="rail__mark"></span>
      </a>`,
    )
    .join('');
  return `
  <aside class="rail" aria-hidden="true">
    <div class="rail__ticks">${ticks}</div>
    <div class="rail__depth"><span>depth</span><b data-depth>0000</b><span>m</span></div>
  </aside>`;
}

// -------------------------------------------------------------------- hero --

function hero() {
  const resume = profile.links.resume
    ? `<a class="btn" href="${esc(profile.links.resume)}" ${ext}>r&eacute;sum&eacute;</a>`
    : '';
  return `
  <section class="hero" id="top" data-section="top">
    <div class="hero__text">
      <p class="eyebrow" data-reveal>// ${esc(profile.role.toLowerCase())} @ ${esc(profile.company.toLowerCase())} <span class="sep">/</span> <span class="eyebrow__coords">${esc(profile.coords)}</span></p>
      <h1 class="hero__title" data-reveal>
        <pre class="banner" aria-hidden="true">${esc(HERO_BANNER)}</pre>
        <span class="hero__name">${esc(profile.name)}</span>
      </h1>
      <p class="hero__typed" data-reveal>
        <span class="hero__caret" aria-hidden="true">&gt;</span>
        <span data-typed>${esc(profile.typed[0])}</span><span class="cursor" aria-hidden="true"></span>
      </p>
      <p class="hero__intro" data-reveal>${esc(profile.intro)}</p>
      <div class="hero__cta" data-reveal>
        <a class="btn btn--solid" href="#projects">view projects</a>
        <button class="btn" type="button" data-action="terminal">open terminal</button>
        <a class="btn" href="#contact">contact</a>
        ${resume}
      </div>
      <ul class="hero__links" data-reveal>
        <li><a href="${profile.links.github}" ${ext}>github/<b>${esc(profile.handle)}</b></a></li>
        <li><a href="${profile.links.linkedin}" ${ext}>linkedin</a></li>
        <li><a href="mailto:${profile.links.email}">email</a></li>
      </ul>
    </div>
    <div class="hero__stage">
      ${stage('globe', 'A rotating globe drawn in text characters, with signal arcs converging on Bengaluru', 'fig.00 / globe', 'drag to rotate', 'stage--hero')}
    </div>
    <a class="hero__descend" href="#about"><span>descend</span><span class="hero__arrow" aria-hidden="true">v</span></a>
  </section>`;
}

// ------------------------------------------------------------------- about --

function idCard() {
  // With a photo configured the avatar is drawn in ASCII from it; otherwise an
  // identicon is generated from the handle (see src/ui/tilt.js).
  const avatar = profile.portrait
    ? `<div class="idcard__avatar idcard__avatar--photo" data-shot data-shot-auto data-cell="3.3">
            <div class="shot__frame"><img src="${esc(profile.portrait)}" alt="Portrait of ${esc(profile.name)}" decoding="async" /></div>
          </div>`
    : `<pre class="idcard__avatar" data-identicon aria-hidden="true"></pre>`;
  return `
  <div class="idcard" data-tilt data-flip tabindex="0" role="button" aria-label="Identity card. Press to flip.">
    <div class="idcard__inner">
      <div class="idcard__face idcard__face--front">
        <div class="idcard__top"><span>FIELD ID</span><span>${esc(profile.handle.toUpperCase())}-0x09</span></div>
        <div class="idcard__main">
          ${avatar}
          <div class="idcard__who">
            <b>${esc(profile.name)}</b>
            <span>${esc(profile.role)}</span>
            <dl>
              <dt>unit</dt><dd>threat intel</dd>
              <dt>base</dt><dd>BLR / IN</dd>
              <dt>state</dt><dd class="ok">active</dd>
            </dl>
          </div>
        </div>
        <div class="idcard__bar" aria-hidden="true"></div>
        <div class="idcard__foot"><span>tap to flip</span><span>${esc(profile.coords)}</span></div>
      </div>
      <div class="idcard__face idcard__face--back">
        <div class="idcard__top"><span>OPERATING NOTES</span><span>rev 2026.11</span></div>
        <ul class="idcard__notes">
          <li>read before write</li>
          <li>local-first, self-hosted</li>
          <li>no cloud, no telemetry</li>
          <li>verify, then escalate</li>
          <li>document so others can run it</li>
        </ul>
        <div class="idcard__foot"><span>tap to flip</span><span>github.com/${esc(profile.handle)}</span></div>
      </div>
    </div>
  </div>`;
}

function aboutSection() {
  const facts = about.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
  return `
  <section class="section" id="about" data-section="about">
    ${sectionHead('01', 'profile', 'cat about.md')}
    <div class="about">
      <div class="panel about__text" data-reveal>
        ${about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
      </div>
      <div class="about__side" data-reveal>
        ${idCard()}
        <dl class="facts panel panel--flush">${facts}</dl>
      </div>
    </div>
  </section>`;
}

// -------------------------------------------------------------- experience --

function educationBlock() {
  if (!education.length) return '';
  const rows = education
    .map(
      (e) => `
      <li>
        <div><b>${esc(e.school)}</b><span>${esc(e.span || '')}</span></div>
        <p>${esc(e.degree || '')}</p>
        ${e.note ? `<p class="edu__note">${esc(e.note)}</p>` : ''}
      </li>`,
    )
    .join('');
  return `
    <div class="panel edu" data-reveal>
      <h3><span aria-hidden="true">./</span>education</h3>
      <ul class="edu__list">${rows}</ul>
    </div>`;
}

function experienceSection() {
  const items = experience
    .map(
      (job) => `
      <li class="job" data-reveal>
        <span class="job__node" aria-hidden="true"></span>
        <article class="panel">
          <header class="job__head">
            <h3>${esc(job.org)}</h3>
            <span class="job__span">${esc(job.span)}</span>
          </header>
          <p class="job__meta">${esc(job.meta)}</p>
          <ul class="job__roles">
            ${job.roles.map((r) => `<li><b>${esc(r.title)}</b><span>${esc(r.span)}</span></li>`).join('')}
          </ul>
          <ul class="bullets">${job.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
          ${tags(job.tags)}
        </article>
      </li>`,
    )
    .join('');
  return `
  <section class="section" id="experience" data-section="experience">
    ${sectionHead('02', 'ops log', 'tail -n 4 experience.log')}
    <ol class="timeline">${items}</ol>
    ${educationBlock()}
  </section>`;
}

// ---------------------------------------------------------------- projects --

const STATUS_LABEL = {
  live: 'live',
  active: 'active',
  experimental: 'experimental',
  wip: 'in progress',
  archived: 'archived',
};

/** The real screenshot. src/ui/shots.js draws it as characters on top. */
function shot(p, i) {
  if (!p.shot) return '';
  const s = p.shot;
  return `
    <figure class="project__shot shot" data-shot style="--ar:${s.w}/${s.h}" data-reveal>
      <div class="shot__frame" tabindex="0" role="button" aria-label="${esc(p.title)}: ${s.moving ? 'recording' : 'screenshot'}, drawn as text. Activate to see the real image.">
        <img src="./${esc(s.src)}" alt="${esc(s.alt)}" width="${s.w}" height="${s.h}" loading="lazy" decoding="async" />
      </div>
      <figcaption><span>exhibit ${pad2(i + 1)} / ${s.moving ? 'recording' : 'screenshot'}</span><span class="shot__hint" data-shot-hint></span></figcaption>
    </figure>`;
}

function project(p, i, posts) {
  const study = posts.find((x) => x.project === p.id);
  const links = (p.links || [])
    .map(
      (l) =>
        `<a class="btn btn--sm${l.label.startsWith('live') ? ' btn--solid' : ''}" href="${l.href}" ${ext}>${esc(l.label)}${l.note ? `<small>${esc(l.note)}</small>` : ''}</a>`,
    )
    .concat(study ? [`<a class="btn btn--sm" href="${HOME.blog}${study.slug}.html">${esc(study.kind)}</a>`] : [])
    .join('');
  const source = p.source ? `<span class="project__source">source: ${esc(p.source)}</span>` : '';
  const cls = [`project`, i % 2 ? 'project--flip' : '', p.shot ? 'project--shot' : ''].filter(Boolean).join(' ');
  return `
  <article class="${cls}" id="p-${p.id}" data-project="${p.id}">
    <div class="project__body panel" data-reveal>
      <header class="project__head">
        <span class="project__index">${pad2(i + 1)}</span>
        <span class="project__cat">${esc(categories[p.cat])}</span>
        <span class="status status--${p.status}">${esc(STATUS_LABEL[p.status])}</span>
      </header>
      <h3 class="project__title">${esc(p.title)}</h3>
      <p class="project__kicker">${esc(p.kicker)}</p>
      <p class="project__summary">${esc(p.summary)}</p>
      <button class="more" type="button" data-more aria-expanded="false" aria-controls="more-${p.id}">details</button>
      <ul class="bullets project__more" id="more-${p.id}">${p.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      ${tags(p.stack)}
      <div class="project__links">${links}${source}</div>
    </div>
    <div class="project__stage" data-reveal>
      ${stage(p.figure, `${p.title}: an animated 3D model drawn in text characters`, `fig.${pad2(i + 1)} / ${p.figure}`)}
    </div>
    ${shot(p, i)}
  </article>`;
}

function projectsSection(posts) {
  return `
  <section class="section section--wide" id="projects" data-section="projects">
    ${sectionHead('03', 'arsenal', 'ls -t projects/ | head -8')}
    <p class="section__lead" data-reveal>Eight things I have built recently. Each has its own model: every scene on this page is real 3D geometry, rendered as text by a shader. The screenshots are real too. They arrive as text and decode when you point at them.</p>
    <div class="projects">${featured.map((p, i) => project(p, i, posts)).join('')}</div>
  </section>`;
}

// ------------------------------------------------------------ github pulse --

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY = 86400000;
const dayKey = (ms) => new Date(ms).toISOString().slice(0, 10);

/**
 * A contribution graph in characters: one column per week, one row per
 * weekday, two characters per day so the cells come out roughly square.
 * `days` maps 'YYYY-MM-DD' (UTC) to a count.
 */
export function pulseGraph(days, endIso, weeks = 16) {
  const end = Date.parse(`${endIso}T00:00:00Z`);
  const endDow = (new Date(end).getUTCDay() + 6) % 7; // Monday = 0
  const start = end - endDow * DAY - (weeks - 1) * 7 * DAY;
  let max = 0;
  let total = 0;
  let active = 0;
  for (let t = start; t <= end; t += DAY) {
    const n = days[dayKey(t)] || 0;
    if (n > max) max = n;
    total += n;
    if (n) active++;
  }
  const glyph = ['··', '::', '==', '##', '@@'];
  const level = (n) => (n <= 0 ? 0 : Math.min(4, 1 + Math.floor(3.999 * Math.sqrt(n / max))));

  // month names above the first column of each month (a column is 3 wide)
  const slots = new Array(weeks).fill('   ');
  let lastMonth = -1;
  let pending = -1;
  for (let w = 0; w < weeks; w++) {
    const m = new Date(start + w * 7 * DAY).getUTCMonth();
    if (m !== lastMonth) {
      pending = m;
      lastMonth = m;
    }
    // a name needs a blank column before it, or two would run together
    if (pending >= 0 && (w === 0 || slots[w - 1] === '   ')) {
      slots[w] = MONTHS[pending];
      pending = -1;
    }
  }
  const head = `    ${slots.join('')}`;
  const lines = [head.replace(/\s+$/, '')];
  const names = ['mon', '', 'wed', '', 'fri', '', ''];
  for (let d = 0; d < 7; d++) {
    let line = names[d].padEnd(4, ' ');
    for (let w = 0; w < weeks; w++) {
      const t = start + (w * 7 + d) * DAY;
      if (t > end) {
        line += '   ';
        continue;
      }
      const lv = level(days[dayKey(t)] || 0);
      line += (lv === 0 ? `<i>${glyph[0]}</i>` : `<b class="l${lv}">${glyph[lv]}</b>`) + ' ';
    }
    lines.push(line.replace(/\s+$/, ''));
  }
  return { html: lines.join('\n'), total, active, max };
}

export function relTime(iso, now = Date.now()) {
  const s = Math.max(0, (now - Date.parse(iso)) / 1000);
  if (s < 90) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 86400 * 14) return `${Math.round(s / 86400)} d ago`;
  if (s < 86400 * 70) return `${Math.round(s / (86400 * 7))} wk ago`;
  return `${Math.round(s / (86400 * 30))} mo ago`;
}

export function pulseRows(repos) {
  return repos
    .map(
      (r) =>
        `<li><a href="${esc(r.url)}" ${ext}>${esc(r.name)}</a><span>${esc(r.language || '')}</span><time datetime="${esc(r.pushedAt)}">${esc(String(r.pushedAt).slice(0, 10))}</time></li>`,
    )
    .join('');
}

function pulsePanel(pulse) {
  if (!pulse) return '';
  const g = pulseGraph(pulse.days, pulse.asOf);
  return `
    <div class="pulse panel" data-pulse data-reveal>
      <div class="pulse__col">
        <h3><span aria-hidden="true">./</span>last pushed <small data-pulse-status>snapshot, ${esc(pulse.asOf)}</small></h3>
        <ul class="pulse__list" data-pulse-list>${pulseRows(pulse.repos)}</ul>
      </div>
      <div class="pulse__col">
        <h3><span aria-hidden="true">./</span>activity <small>public activity per day, 16 weeks</small></h3>
        <pre class="pulse__graph" data-pulse-graph aria-hidden="true">${g.html}</pre>
        <p class="pulse__sum" data-pulse-sum>${g.active} active days of ${16 * 7}</p>
      </div>
    </div>`;
}

// ----------------------------------------------------------------- archive --

function archiveRow(a) {
  const title = a.title || a.name;
  const inner = `
      <span class="row__cat">${esc(a.cat)}</span>
      <span class="row__year">${esc(a.year)}</span>
      <span class="row__name">${esc(title)}${a.status === 'wip' ? '<i>wip</i>' : ''}</span>
      <span class="row__blurb">${esc(a.blurb)}</span>
      <span class="row__stack">${a.stack.map(esc).join(' / ')}</span>
      <span class="row__go" aria-hidden="true">${a.href ? '-&gt;' : ''}</span>`;
  return a.href
    ? `<li class="row" data-cat="${a.cat}"><a class="row__link" href="${a.href}" ${ext}>${inner}</a></li>`
    : `<li class="row" data-cat="${a.cat}"><div class="row__link">${inner}</div></li>`;
}

function archiveSection(pulse) {
  const filters = Object.entries(categories)
    .map(
      ([k, v], i) =>
        `<button type="button" class="filter${i === 0 ? ' is-on' : ''}" data-filter="${k}" aria-pressed="${i === 0}">${esc(v)}</button>`,
    )
    .join('');
  return `
  <section class="section" id="archive" data-section="archive">
    ${sectionHead('04', 'archive', 'find ~/src -maxdepth 1 -type d')}
    ${pulsePanel(pulse)}
    <div class="archive panel panel--flush" data-reveal>
      <div class="archive__bar">
        <div class="filters" role="group" aria-label="Filter projects by category">${filters}</div>
        <span class="archive__count"><b data-count>${archive.length}</b> entries</span>
      </div>
      <ul class="archive__list">${archive.map(archiveRow).join('')}</ul>
      <button class="archive__all" type="button" data-archive-all>show all ${archive.length}</button>
    </div>
  </section>`;
}

// ------------------------------------------------------------------ skills --

function skillsSection() {
  const groups = skills
    .map(
      (g) => `
      <div class="panel skillset" data-reveal>
        <h3><span aria-hidden="true">./</span>${esc(g.title)}</h3>
        ${tags(g.items)}
      </div>`,
    )
    .join('');
  const max = Math.max(...census.map((c) => c[1]));
  const bars = census
    .map(([lang, n]) => {
      const w = Math.round((n / max) * 24);
      return `<li><span class="census__lang">${esc(lang)}</span><span class="census__bar" aria-hidden="true">${'#'.repeat(w)}<i>${'.'.repeat(24 - w)}</i></span><span class="census__n">${n}</span></li>`;
    })
    .join('');
  const certs = certifications
    .map((c) => {
      const name = c.href ? `<a href="${esc(c.href)}" ${ext}>${esc(c.name)}</a>` : esc(c.name);
      return `<li><b>${name}</b><span>${esc(c.by)}${c.when ? ` / ${esc(c.when)}` : ''}</span></li>`;
    })
    .join('');
  const cloudHtml = cloud.map((t) => `<span>${esc(t)}</span>`).join('');
  return `
  <section class="section" id="skills" data-section="skills">
    ${sectionHead('05', 'toolkit', 'cat skills.json | jq keys')}
    <div class="skills">
      <div class="skills__groups">${groups}</div>
      <div class="skills__side">
        <div class="tagsphere" data-tagsphere data-reveal aria-hidden="true">${cloudHtml}</div>
        <div class="panel census" data-reveal>
          <h3><span aria-hidden="true">./</span>repo census <small>public repositories by primary language</small></h3>
          <ul class="census__list">${bars}</ul>
        </div>
        <div class="panel certs" data-reveal>
          <h3><span aria-hidden="true">./</span>certifications</h3>
          <ul class="certs__list">${certs}</ul>
        </div>
      </div>
    </div>
    <div class="glyph-slot" data-glyph-slot aria-hidden="true"></div>
  </section>`;
}

// -------------------------------------------------------------------- blog --

function postList(posts, ctx, limit = Infinity) {
  return `
    <ul class="notes">
      ${posts
        .slice(0, limit)
        .map(
          (p) => `
      <li class="note" data-reveal>
        <a class="note__link panel" href="${ctx.blog}${p.slug}.html">
          <p class="note__meta"><span class="note__kind">${esc(p.kind)}</span><time datetime="${esc(p.date)}">${esc(p.dateText)}</time><span>${p.minutes} min read</span></p>
          <h3 class="note__title">${titleHtml(p.title)}</h3>
          <p class="note__summary">${esc(p.summary)}</p>
          ${tags(p.tags)}
          <span class="note__go" aria-hidden="true">read -&gt;</span>
        </a>
      </li>`,
        )
        .join('')}
    </ul>`;
}

function blogSection(posts, num) {
  if (!posts.length) return '';
  const more =
    posts.length > 4 ? `<p class="notes__all" data-reveal><a class="btn" href="${HOME.blog}index.html">all ${posts.length} notes</a></p>` : '';
  return `
  <section class="section" id="blog" data-section="blog">
    ${sectionHead(num, 'field notes', 'ls -t blog/')}
    <p class="section__lead" data-reveal>Case studies and notes: how the things above were built, and what went wrong on the way.</p>
    ${postList(posts, HOME, 4)}
    ${more}
  </section>`;
}

// ----------------------------------------------------------------- contact --

function contactSection(num) {
  const short = (u) => u.replace(/^https?:\/\/(www\.)?/, '');
  const resume = profile.links.resume
    ? `<li>
            <span class="contact__k">r&eacute;sum&eacute;</span>
            <a href="${esc(profile.links.resume)}" ${ext}>download</a>
          </li>`
    : '';
  return `
  <section class="section section--contact" id="contact" data-section="contact">
    ${sectionHead(num, 'signal', 'ping siva')}
    <div class="contact">
      <div class="contact__body" data-reveal>
        <p class="contact__lead">Working on threat intelligence, security tooling or something self-hosted and strange? I am happy to compare notes.</p>
        <ul class="contact__list">
          <li>
            <span class="contact__k">mail</span>
            <a href="mailto:${profile.links.email}">${esc(profile.links.email)}</a>
            <button class="copy" type="button" data-copy="${esc(profile.links.email)}">copy</button>
          </li>
          <li>
            <span class="contact__k">github</span>
            <a href="${profile.links.github}" ${ext}>${esc(short(profile.links.github))}</a>
          </li>
          <li>
            <span class="contact__k">linkedin</span>
            <a href="${profile.links.linkedin}" ${ext}>${esc(short(profile.links.linkedin))}</a>
          </li>
          ${resume}
          <li>
            <span class="contact__k">base</span>
            <span>${esc(profile.location)}</span>
          </li>
        </ul>
      </div>
      <div class="contact__stage" data-reveal>
        ${stage('dish', 'A satellite dish drawn in text characters, sending out signal rings', 'fig.09 / uplink')}
      </div>
    </div>
  </section>`;
}

function footer(ctx) {
  const ctf = ctx.isHome
    ? `<p class="footer__ctf">Three flags are hidden on this site. Open the terminal and type <kbd>flags</kbd>.</p>`
    : '';
  return `
  <footer class="footer">
    <p>${esc(profile.name)} <span class="sep">/</span> ${new Date().getFullYear()}</p>
    <p>three.js + a custom ASCII shader <span class="sep">/</span> no trackers, no cookies <span class="sep">/</span> press <kbd>\`</kbd> for the terminal</p>
    ${ctf}
  </footer>`;
}

function terminal() {
  return `
  <div class="terminal" data-terminal hidden>
    <div class="terminal__bar">
      <span class="terminal__title">${esc(profile.handle)}@intel: ~</span>
      <button type="button" class="terminal__close" data-action="terminal-close" aria-label="Close the terminal">x</button>
    </div>
    <div class="terminal__out" data-term-out role="log" aria-live="polite"></div>
    <form class="terminal__form" data-term-form autocomplete="off">
      <label class="terminal__prompt" for="term-in">${esc(profile.handle)}@intel:~$</label>
      <input id="term-in" class="terminal__in" data-term-in type="text" spellcheck="false" autocapitalize="off" autocorrect="off" aria-label="Terminal command" />
    </form>
  </div>`;
}

/** The post list as data, so the terminal can list and open posts on any page. */
const postsData = (posts) =>
  `<script type="application/json" id="posts-data">${JSON.stringify(
    posts.map((p) => ({ slug: p.slug, title: p.title, date: p.dateText, kind: p.kind })),
  ).replace(/</g, '\\u003c')}</script>`;

function boot() {
  return `<div class="boot" data-boot aria-hidden="true"><pre class="boot__log" data-boot-log></pre><p class="boot__skip">press any key to skip</p></div>`;
}

// Flag one of three. Anyone reading the page source has earned it.
const SOURCE_NOTE = `<!--
  You read the source. Good instinct.
  flag 1 of 3: flag{always_read_the_source}
  The second answers to the terminal. The third only shows under a light.
-->`;

// ------------------------------------------------------------------- pages --

/** The home page. `posts` come from build/posts.js, `pulse` from src/pulse-data.js. */
export function renderApp({ posts = [], pulse = null } = {}) {
  const hasBlog = posts.length > 0;
  return [
    SOURCE_NOTE,
    boot(),
    topbar(HOME, posts),
    rail(posts),
    '<main id="main">',
    hero(),
    aboutSection(),
    experienceSection(),
    projectsSection(posts),
    archiveSection(pulse),
    skillsSection(),
    blogSection(posts, '06'),
    contactSection(hasBlog ? '07' : '06'),
    '</main>',
    footer(HOME),
    terminal(),
    postsData(posts),
  ].join('\n');
}

/** blog/index.html */
export function renderBlogIndex({ posts = [] } = {}) {
  return [
    topbar(BLOG, posts, 'blog'),
    '<main id="main" class="page">',
    `<section class="section section--page">
      <header class="section__head">
        <p class="cmd" aria-hidden="true">${PROMPT} <span class="cmd__text">ls -t blog/</span></p>
        <h1 class="section__title">field notes</h1>
      </header>
      <p class="section__lead">Case studies and notes: how things were built, and what went wrong on the way.</p>
      ${posts.length ? postList(posts, BLOG) : '<p class="section__lead">Nothing here yet.</p>'}
      <p class="page__back"><a class="btn" href="${BLOG.home}">back to the site</a></p>
    </section>`,
    '</main>',
    footer(BLOG),
    terminal(),
    postsData(posts),
  ].join('\n');
}

/** blog/<slug>.html */
export function renderPost({ post, posts = [] }) {
  const i = posts.findIndex((p) => p.slug === post.slug);
  const newer = i > 0 ? posts[i - 1] : null;
  const older = i >= 0 && i < posts.length - 1 ? posts[i + 1] : null;
  const proj = featured.find((p) => p.id === post.project);
  const figure = post.figure
    ? `<div class="post__stage">${stage(post.figure, `${post.title}: an animated 3D model drawn in text characters`, `fig / ${post.figure}`)}</div>`
    : '';
  const projLink = proj
    ? `<a class="btn btn--sm" href="${BLOG.home}#p-${proj.id}">the project: ${esc(proj.title)}</a>`
    : '';
  return [
    topbar(BLOG, posts, 'blog'),
    '<main id="main" class="page">',
    `<article class="post">
      <header class="post__head${figure ? ' post__head--fig' : ''}">
        <div class="post__intro">
          <p class="cmd" aria-hidden="true">${PROMPT} <span class="cmd__text">cat blog/${esc(post.slug)}.md</span></p>
          <p class="post__meta"><span class="note__kind">${esc(post.kind)}</span><time datetime="${esc(post.date)}">${esc(post.dateText)}</time><span>${post.minutes} min read</span></p>
          <h1 class="post__title">${titleHtml(post.title)}</h1>
          ${post.summary ? `<p class="post__summary">${esc(post.summary)}</p>` : ''}
          ${tags(post.tags)}
        </div>
        ${figure}
      </header>
      <div class="prose panel">
${post.html}
      </div>
      <footer class="post__foot">
        <div class="post__links">
          <a class="btn btn--sm" href="${BLOG.blog}index.html">all notes</a>
          ${projLink}
        </div>
        <nav class="post__nav" aria-label="More notes">
          ${older ? `<a href="${BLOG.blog}${older.slug}.html"><span>older</span><b>${titleHtml(older.title)}</b></a>` : '<span></span>'}
          ${newer ? `<a class="post__next" href="${BLOG.blog}${newer.slug}.html"><span>newer</span><b>${titleHtml(newer.title)}</b></a>` : ''}
        </nav>
      </footer>
    </article>`,
    '</main>',
    footer(BLOG),
    terminal(),
    postsData(posts),
  ].join('\n');
}

/** <title> and description for the generated pages. */
export function pageMeta(kind, post) {
  if (kind === 'post') {
    return { title: `${post.title} / ${profile.name}`, description: post.summary || profile.intro };
  }
  return {
    title: `Field notes / ${profile.name}`,
    description: `Case studies and notes by ${profile.name} (${profile.handle}).`,
  };
}
