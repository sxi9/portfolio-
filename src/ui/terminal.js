// A small command console over the same content the page shows.
// Open with the backtick key, the button in the top bar, or the hero button.

import { profile, about, experience, education, featured, archive, skills, certifications, sections, categories } from '../content.js';
import { esc } from '../render.js';
import { themeNames, currentTheme, applyTheme } from './theme.js';
import { submit, found, TOTAL } from './flags.js';

const CHARSETS = ['classic', 'measured', 'dense', 'binary', 'minimal'];
const pad = (s, n) => String(s).padEnd(n, ' ');

// Flag two of three: listed by `ls -a`, printed by `cat .flag`, still encoded.
const DOTFLAG = 'ZmxhZ3tlbnVtZXJhdGVfYmVmb3JlX3lvdV9leHBsb2l0fQ==';

const HINTS = [
  'The first never left the building. Read what the page is made of.',
  'The second sits in a file you have not listed yet. Not everything shows without -a.',
  'The third hides in the dark under the toolkit. Bring a light, and move it slowly.',
];

const TROPHY = String.raw`
      ___________
     '._==_==_=_.'
     .-\:      /-.
    | (|:.     |) |
     '-|:.     |-'
       \::.    /
        '::. .'
          ) (
        _.' '._
       '-------'`;

export function initTerminal({ getEngine }) {
  const root = document.querySelector('[data-terminal]');
  if (!root) return { open() {}, close() {}, toggle() {} };
  const out = root.querySelector('[data-term-out]');
  const form = root.querySelector('[data-term-form]');
  const input = root.querySelector('[data-term-in]');
  const prompt = `${profile.handle}@intel:~$`;
  // '' on the home page, '../' on a blog page
  const home = document.documentElement.dataset.home || '';
  const onHome = !document.documentElement.dataset.page;
  const blogBase = onHome ? './blog/' : './';
  const history = [];
  let hi = 0;
  let opener = null;
  let greeted = false;

  let posts = [];
  try {
    posts = JSON.parse(document.getElementById('posts-data')?.textContent || '[]');
  } catch {
    posts = [];
  }

  const print = (html, cls = 't-out') => {
    const div = document.createElement('div');
    div.className = cls;
    div.innerHTML = html;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
    return div;
  };
  const echo = (cmd) => {
    const div = print(esc(cmd), 't-cmd');
    div.dataset.prompt = prompt;
  };

  /** Scrolls to an element on this page, or goes to it on the home page. */
  const goto = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return true;
    }
    if (!onHome) {
      window.location.href = `${home}#${id}`;
      return true;
    }
    return false;
  };

  const findProject = (q) => {
    const k = q.toLowerCase();
    return (
      featured.find((p) => p.id === k || p.title.toLowerCase() === k) ||
      featured.find((p) => p.id.includes(k) || p.title.toLowerCase().includes(k)) ||
      archive.find((a) => a.name.toLowerCase() === k || (a.title || '').toLowerCase() === k) ||
      archive.find((a) => a.name.toLowerCase().includes(k) || (a.title || '').toLowerCase().includes(k))
    );
  };

  const flagStatus = () => {
    const have = found();
    const row = (n, where) => `  [${have.has(n) ? '<b>x</b>' : ' '}] flag ${n}  ${have.has(n) ? 'captured' : where}`;
    return [
      `<b>${have.size} of ${TOTAL}</b> captured`,
      row(1, 'in the page itself'),
      row(2, 'behind this terminal'),
      row(3, 'in the ASCII layer'),
      '',
      have.size >= TOTAL
        ? 'All three. The <b>ghost</b> theme is yours: <b>theme ghost</b>.'
        : 'Submit one with <b>flag flag{...}</b>. Stuck? <b>hint</b>.',
    ].join('\n');
  };

  const commands = {
    help: {
      run: () =>
        [
          '<b>who</b>',
          `  ${pad('whoami', 22)}one line about me`,
          `  ${pad('about', 22)}the longer version`,
          `  ${pad('experience', 22)}where I have worked`,
          `  ${pad('skills', 22)}toolkit by area`,
          `  ${pad('certs', 22)}certifications`,
          `  ${pad('contact', 22)}how to reach me`,
          '<b>work</b>',
          `  ${pad('ls [-a]', 22)}featured projects (-a: everything)`,
          `  ${pad('open &lt;name&gt;', 28)}jump to a project, or open its link`,
          `  ${pad('blog', 22)}case studies and notes`,
          `  ${pad('read &lt;post&gt;', 28)}open a post`,
          `  ${pad('cd &lt;section&gt;', 28)}scroll to a section`,
          '<b>this page</b>',
          `  ${pad('theme [name]', 22)}${themeNames().join(' | ')}`,
          `  ${pad('charset [name]', 22)}${CHARSETS.join(' | ')}`,
          `  ${pad('fetch', 22)}system summary`,
          `  ${pad('flags', 22)}three are hidden on this site`,
          `  ${pad('clear', 22)}clear the screen`,
          `  ${pad('exit', 22)}close the terminal (or press Esc)`,
        ].join('\n'),
    },
    whoami: {
      run: () =>
        `<b>${esc(profile.name)}</b> (${esc(profile.handle)})\n${esc(profile.role)} at ${esc(profile.company)} / ${esc(profile.location)}`,
    },
    about: { run: () => about.paragraphs.map(esc).join('\n\n') },
    experience: {
      run: () =>
        experience
          .map(
            (j) =>
              `<b>${esc(j.org)}</b>  <u>${esc(j.span)}</u>\n` +
              j.roles.map((r) => `  ${esc(r.title)}  (${esc(r.span)})`).join('\n') +
              '\n' +
              j.points.map((p) => `  - ${esc(p)}`).join('\n'),
          )
          .concat(
            education.length
              ? [`<b>education</b>\n${education.map((e) => `  ${esc(e.school)}  ${esc(e.degree || '')}  (${esc(e.span || '')})`).join('\n')}`]
              : [],
          )
          .join('\n\n'),
    },
    skills: {
      run: () => skills.map((g) => `<b>${esc(g.title)}</b>\n  ${g.items.map(esc).join(', ')}`).join('\n'),
    },
    certs: {
      run: () =>
        certifications
          .map((c) => `<b>${esc(c.name)}</b>  ${esc(c.by)}${c.when ? `, ${esc(c.when)}` : ''}`)
          .join('\n'),
    },
    contact: {
      run: () =>
        [
          `mail      <a href="mailto:${profile.links.email}">${esc(profile.links.email)}</a>`,
          `github    <a href="${profile.links.github}" target="_blank" rel="noopener noreferrer">${esc(profile.links.github)}</a>`,
          `linkedin  <a href="${profile.links.linkedin}" target="_blank" rel="noopener noreferrer">${esc(profile.links.linkedin)}</a>`,
          profile.links.resume
            ? `resume    <a href="${esc(home + profile.links.resume.replace(/^\.\//, ''))}" target="_blank" rel="noopener noreferrer">download</a>`
            : '',
          `base      ${esc(profile.location)}`,
        ]
          .filter(Boolean)
          .join('\n'),
    },
    ls: {
      run: (args) => {
        const all = args.some((a) => /^-\w*a/.test(a));
        const rows = featured.map(
          (p) => `<b>${pad(p.id, 16)}</b>${pad(categories[p.cat], 9)}${p.status === 'live' ? '<i>live</i>  ' : '      '}${esc(p.kicker)}`,
        );
        if (all) {
          rows.unshift('<u>.flag</u>', '');
          rows.push('');
          archive.forEach((a) => rows.push(`${pad(a.name, 26)}${pad(a.cat, 7)}${a.year}`));
        } else {
          rows.push('', `${archive.length} more in the archive: try <b>ls -a</b>`);
        }
        return rows.join('\n');
      },
    },
    cat: {
      run: (args) => {
        const f = (args[0] || '').replace(/^\.\//, '');
        if (!f) return 'usage: cat &lt;file&gt;';
        if (f === '.flag') return `${DOTFLAG}\n<u>encoded, not encrypted.</u>`;
        if (f === 'about.md' || f === 'about') return commands.about.run();
        if (f === 'skills.json') return commands.skills.run();
        if (f === 'experience.log') return commands.experience.run();
        return `cat: ${esc(f)}: No such file`;
      },
    },
    base64: {
      hidden: true,
      run: (args) => {
        const decode = args[0] === '-d' || args[0] === '--decode';
        const text = (decode ? args.slice(1) : args).join(' ');
        if (!text) return 'usage: base64 [-d] &lt;text&gt;';
        try {
          return esc(decode ? atob(text) : btoa(text));
        } catch {
          return 'base64: invalid input';
        }
      },
    },
    flags: { run: flagStatus },
    flag: {
      hidden: true,
      run: (args) => {
        const value = args.join(' ');
        if (!value) return flagStatus();
        const res = submit(value);
        if (!res.ok) return '<i>Not a flag.</i> They look like flag{...}.';
        if (res.already) return `Flag ${res.n} again. You already have it: ${res.count} of ${TOTAL}.`;
        getEngine()?.glitch(0.9, 1.8);
        if (res.complete) {
          return `<b>${esc(TROPHY)}</b>\n\n<b>Flag ${res.n} captured. That is all ${TOTAL}.</b>\nYou read the source, enumerated before exploiting, and brought a light.\nThe <b>ghost</b> theme is unlocked: <b>theme ghost</b>.`;
        }
        return `<b>Flag ${res.n} captured.</b> ${res.count} of ${TOTAL}.`;
      },
    },
    hint: {
      hidden: true,
      run: () => {
        const have = found();
        const open = [1, 2, 3].filter((n) => !have.has(n));
        if (!open.length) return 'Nothing left to find.';
        return open.map((n) => `flag ${n}: ${HINTS[n - 1]}`).join('\n');
      },
    },
    blog: {
      run: () => {
        if (!posts.length) return 'No posts yet.';
        return posts
          .map((p) => `<b>${pad(p.slug, 22)}</b>${pad(p.date, 14)}${esc(p.title)}`)
          .concat(['', 'Open one with <b>read &lt;name&gt;</b>.'])
          .join('\n');
      },
    },
    read: {
      hidden: true,
      run: (args) => {
        const q = (args[0] || '').toLowerCase();
        if (!q) return commands.blog.run();
        const p = posts.find((x) => x.slug === q) || posts.find((x) => x.slug.includes(q) || x.title.toLowerCase().includes(q));
        if (!p) return `read: no post matches "${esc(q)}". Try <b>blog</b>.`;
        window.location.href = `${blogBase}${p.slug}.html`;
        return `opening ${esc(p.title)}`;
      },
    },
    open: {
      run: (args) => {
        const q = args.join(' ');
        if (!q) return 'usage: open &lt;project&gt;   (try: open leakwatch)';
        if (profile.links[q]) {
          window.open(q === 'email' ? `mailto:${profile.links.email}` : profile.links[q], '_blank', 'noopener');
          return `opening ${esc(q)}`;
        }
        const p = findProject(q);
        if (!p) return `open: no project matches "${esc(q)}". Try <b>ls -a</b>.`;
        if (p.id && goto(`p-${p.id}`)) return `<b>${esc(p.title)}</b>: ${esc(p.summary)}`;
        if (p.href) {
          window.open(p.href, '_blank', 'noopener');
          return `opening ${esc(p.href)}`;
        }
        return `<b>${esc(p.title || p.name)}</b>: ${esc(p.blurb)}`;
      },
    },
    cd: {
      run: (args) => {
        const q = (args[0] || '').replace(/^[#/~.]+/, '').toLowerCase();
        if (!q) return goto('top') ? '~' : '';
        const s = sections.find((x) => x.id === q || x.nav === q || x.label === q);
        if (s && goto(s.id)) return `/${s.id}`;
        return `cd: no such section: ${esc(q)}\nsections: ${sections.map((x) => x.id).join('  ')}`;
      },
    },
    theme: {
      run: (args) => {
        const names = themeNames();
        const name = args[0];
        if (!name) return `current: <b>${currentTheme()}</b>\navailable: ${names.join('  ')}`;
        if (name === 'ghost' && !names.includes(name)) return 'theme: <i>ghost is locked.</i> It answers to <b>flags</b>.';
        if (!names.includes(name)) return `theme: unknown theme "${esc(name)}". Available: ${names.join('  ')}`;
        applyTheme(name);
        return `theme set to <b>${name}</b>`;
      },
    },
    charset: {
      run: (args) => {
        const engine = getEngine();
        if (!engine) return 'charset: the 3D layer is not running';
        const name = args[0];
        if (!name) return `current: <b>${engine.charset}</b>  ramp: "${esc(engine.atlas.ramp)}"\navailable: ${CHARSETS.join('  ')}`;
        if (!CHARSETS.includes(name)) return `charset: unknown set "${esc(name)}". Available: ${CHARSETS.join('  ')}`;
        engine.setCharset(name);
        engine.glitch(0.7, 2.2);
        return `charset set to <b>${name}</b>  ramp: "${esc(engine.atlas.ramp)}"`;
      },
    },
    fetch: {
      run: () => {
        const engine = getEngine();
        const grid = engine ? `${engine.cols} x ${engine.rows} cells @ ${engine.cellW}x${engine.cellH}px` : 'offline';
        return [
          `<b>${esc(profile.handle)}</b>@<b>intel</b>`,
          '-----------',
          `<b>name</b>      ${esc(profile.name)}`,
          `<b>role</b>      ${esc(profile.role)}, ${esc(profile.company)}`,
          `<b>base</b>      ${esc(profile.location)}`,
          `<b>projects</b>  ${featured.length} featured, ${archive.length} archived`,
          `<b>posts</b>     ${posts.length}`,
          `<b>renderer</b>  three.js -> ASCII, ${grid}`,
          `<b>theme</b>     ${currentTheme()}`,
          `<b>flags</b>     ${found().size} of ${TOTAL}`,
          `<b>trackers</b>  0`,
        ].join('\n');
      },
    },
    clear: {
      run: () => {
        out.innerHTML = '';
        return '';
      },
    },
    exit: {
      run: () => {
        api.close();
        return '';
      },
    },
    pwd: { hidden: true, run: () => '/home/sxi9' },
    date: { hidden: true, run: () => esc(new Date().toString()) },
    echo: { hidden: true, run: (args) => esc(args.join(' ')) },
    sudo: { hidden: true, run: () => '<i>sxi9 is not in the sudoers file. This incident will be reported.</i>' },
    uname: { hidden: true, run: () => 'AsciiOS 2026.11 webgl2 glyph/1' },
  };
  const alias = {
    '?': 'help',
    man: 'help',
    exp: 'experience',
    work: 'experience',
    projects: 'ls',
    dir: 'ls',
    goto: 'cd',
    neofetch: 'fetch',
    cls: 'clear',
    quit: 'exit',
    close: 'exit',
    whois: 'whoami',
    certifications: 'certs',
    themes: 'theme',
    notes: 'blog',
    posts: 'blog',
    hints: 'hint',
    ctf: 'flags',
  };
  const names = Object.keys(commands).filter((k) => !commands[k].hidden);

  const run = (line) => {
    const raw = line.trim();
    if (!raw) return;
    echo(raw);
    history.push(raw);
    hi = history.length;
    const [name, ...args] = raw.split(/\s+/);
    const key = alias[name.toLowerCase()] || name.toLowerCase();
    const cmd = commands[key];
    if (!cmd) {
      // a bare flag typed at the prompt counts as a submission
      if (/^flag\{.*\}$/.test(raw)) {
        print(commands.flag.run([raw]));
        return;
      }
      print(`${esc(name)}: command not found. Type <b>help</b>.`);
      return;
    }
    const res = cmd.run(args);
    if (res) print(res);
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value;
    input.value = '';
    run(v);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      if (!history.length) return;
      e.preventDefault();
      hi = Math.max(0, hi - 1);
      input.value = history[hi];
    } else if (e.key === 'ArrowDown') {
      if (!history.length) return;
      e.preventDefault();
      hi = Math.min(history.length, hi + 1);
      input.value = history[hi] || '';
    } else if (e.key === 'Tab') {
      const v = input.value.trim().toLowerCase();
      if (!v || v.includes(' ')) return;
      const hits = names.filter((n) => n.startsWith(v));
      if (hits.length) e.preventDefault();
      if (hits.length === 1) input.value = `${hits[0]} `;
      else if (hits.length > 1) print(hits.join('  '));
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      out.innerHTML = '';
    }
  });

  root.addEventListener('pointerup', (e) => {
    // click anywhere in the window to type, unless text is being selected
    if (e.target.closest('a, button')) return;
    if (String(window.getSelection())) return;
    input.focus({ preventScroll: true });
  });

  const api = {
    isOpen: () => !root.hidden,
    open() {
      if (!root.hidden) return;
      opener = document.activeElement;
      root.hidden = false;
      if (!greeted) {
        greeted = true;
        print(`<b>${esc(profile.handle)}</b> console. Type <b>help</b> for commands, <b>ls</b> for projects, <b>Esc</b> to close.`);
      }
      input.focus({ preventScroll: true });
    },
    close() {
      if (root.hidden) return;
      root.hidden = true;
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    },
    toggle() {
      if (root.hidden) api.open();
      else api.close();
    },
    run,
  };

  window.addEventListener('keydown', (e) => {
    const typing = /^(input|textarea|select)$/i.test(e.target.tagName) || e.target.isContentEditable;
    if (e.key === 'Escape' && !root.hidden) {
      api.close();
    } else if (e.key === '`' && !e.ctrlKey && !e.metaKey && !e.altKey && (!typing || e.target === input)) {
      e.preventDefault();
      api.toggle();
    }
  });

  return api;
}
