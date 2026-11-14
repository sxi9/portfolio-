// Pure string renderers. No DOM access in here: the same functions run in
// Node (vite.config.js prerenders the page into index.html) and in the
// browser (the terminal reuses a few of them).

import {
  profile,
  about,
  experience,
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
const ext = 'target="_blank" rel="noopener noreferrer"';
const PROMPT = `<span class="cmd__prompt">${esc(profile.handle)}@intel:~$</span>`;

const sectionHead = (num, title, cmd) => `
  <header class="section__head" data-reveal>
    <p class="cmd" aria-hidden="true">${PROMPT} <span class="cmd__text" data-type>${esc(cmd)}</span></p>
    <h2 class="section__title"><span class="section__num">${num}</span>${esc(title)}</h2>
  </header>`;

const tags = (list, cls = '') =>
  `<ul class="tags ${cls}">${list.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;

const stage = (figure, label, tl, br = 'drag to rotate', cls = '') => `
  <div class="stage ${cls}" data-figure="${figure}" role="img" aria-label="${esc(label)}">
    <span class="stage__corner stage__corner--tl"></span>
    <span class="stage__corner stage__corner--tr"></span>
    <span class="stage__corner stage__corner--bl"></span>
    <span class="stage__corner stage__corner--br"></span>
    <span class="stage__tag stage__tag--tl">${esc(tl)}</span>
    <span class="stage__tag stage__tag--br">${esc(br)}</span>
  </div>`;

// ------------------------------------------------------------------ chrome --

function topbar() {
  const links = sections
    .filter((s) => s.nav)
    .map((s) => `<a href="#${s.id}" data-nav="${s.id}">${esc(s.nav)}</a>`)
    .join('');
  return `
  <header class="topbar" data-topbar>
    <a class="brand" href="#top" aria-label="${esc(profile.name)}, back to top">
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

function rail() {
  const ticks = sections
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
  return `
  <div class="idcard" data-tilt data-flip tabindex="0" role="button" aria-label="Identity card. Press to flip.">
    <div class="idcard__inner">
      <div class="idcard__face idcard__face--front">
        <div class="idcard__top"><span>FIELD ID</span><span>${esc(profile.handle.toUpperCase())}-0x09</span></div>
        <div class="idcard__main">
          <pre class="idcard__avatar" data-identicon aria-hidden="true"></pre>
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

function project(p, i) {
  const links = (p.links || [])
    .map(
      (l) =>
        `<a class="btn btn--sm${l.label.startsWith('live') ? ' btn--solid' : ''}" href="${l.href}" ${ext}>${esc(l.label)}${l.note ? `<small>${esc(l.note)}</small>` : ''}</a>`,
    )
    .join('');
  const source = p.source ? `<span class="project__source">source: ${esc(p.source)}</span>` : '';
  return `
  <article class="project${i % 2 ? ' project--flip' : ''}" id="p-${p.id}" data-project="${p.id}">
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
  </article>`;
}

function projectsSection() {
  return `
  <section class="section section--wide" id="projects" data-section="projects">
    ${sectionHead('03', 'arsenal', 'ls -t projects/ | head -8')}
    <p class="section__lead" data-reveal>Eight things I have built recently. Each one has its own model below: every scene on this page is real 3D geometry, rendered as text by a shader.</p>
    <div class="projects">${featured.map(project).join('')}</div>
  </section>`;
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

function archiveSection() {
  const filters = Object.entries(categories)
    .map(
      ([k, v], i) =>
        `<button type="button" class="filter${i === 0 ? ' is-on' : ''}" data-filter="${k}" aria-pressed="${i === 0}">${esc(v)}</button>`,
    )
    .join('');
  return `
  <section class="section" id="archive" data-section="archive">
    ${sectionHead('04', 'archive', 'find ~/src -maxdepth 1 -type d')}
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
    .map(
      (c) =>
        `<li><b>${esc(c.name)}</b><span>${esc(c.by)}${c.when ? ` / ${esc(c.when)}` : ''}</span></li>`,
    )
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
  </section>`;
}

// ----------------------------------------------------------------- contact --

function contactSection() {
  const short = (u) => u.replace(/^https?:\/\/(www\.)?/, '');
  return `
  <section class="section section--contact" id="contact" data-section="contact">
    ${sectionHead('06', 'signal', 'ping siva')}
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

function footer() {
  return `
  <footer class="footer">
    <p>${esc(profile.name)} <span class="sep">/</span> ${new Date().getFullYear()}</p>
    <p>three.js + a custom ASCII shader <span class="sep">/</span> no trackers, no cookies <span class="sep">/</span> press <kbd>\`</kbd> for the terminal</p>
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

function boot() {
  return `<div class="boot" data-boot aria-hidden="true"><pre class="boot__log" data-boot-log></pre><p class="boot__skip">press any key to skip</p></div>`;
}

export function renderApp() {
  return [
    boot(),
    topbar(),
    rail(),
    '<main id="main">',
    hero(),
    aboutSection(),
    experienceSection(),
    projectsSection(),
    archiveSection(),
    skillsSection(),
    contactSection(),
    '</main>',
    footer(),
    terminal(),
  ].join('\n');
}
