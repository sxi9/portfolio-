# sxi9 / portfolio

The portfolio of **Siva Sastha Sai Krishna** (`sxi9`), Intelligence Analyst.

Every scene on the page is real 3D geometry in [three.js](https://threejs.org), and every pixel of it is
drawn as text: a custom two-pass shader turns the render into a grid of characters, anchored to the
document so the glyphs scroll like the page they are printed on.

![The hero: an ASCII globe with signal arcs converging on Bengaluru](public/og.png)

## Run it

```bash
npm install
```

```bash
npm run dev
```

Open http://127.0.0.1:5173. For a production build:

```bash
npm run build
```

```bash
npm run preview
```

The build lands in `dist/` and uses relative asset URLs, so it works at a domain root and under a
sub-path without configuration.

## Change the content

Everything the site says lives in **`src/content.js`**: profile, about, experience, the eight featured
projects, the archive, skills, certifications, the colour themes. Edit that file and the page, the
terminal and the prerendered HTML all follow.

| To do this | Edit |
| --- | --- |
| Change the intro, links or the rotating line | `profile` |
| Add a job | `experience` (newest first) |
| Add a featured project | `featured`: give it a `figure` from the list below |
| Add a smaller project | `archive` |
| Add or recolour a theme | `themes`: four colours each (`ink`, `hot`, `cool`, `bg`) |
| Replace the big name banner | `HERO_BANNER` (any figlet output works) |
| Show a screenshot on a featured project | add `shot: { src, w, h, alt }` and put the image in `public/shots/` |

Four slots are wired up and stay hidden until they have something in them:

| Slot | How to fill it |
| --- | --- |
| R&eacute;sum&eacute; link | put the PDF in `public/` and set `profile.links.resume` (for example `'./resume.pdf'`) |
| ASCII portrait on the identity card | put a photo in `public/` and set `profile.portrait` (for example `'./portrait.jpg'`) |
| Education | add entries to `education` |
| Certificate verification links | add `href` to an entry in `certifications` |

Things worth checking, because they were carried over from older sources rather than confirmed:

- **Certifications** come from the previous portfolio (September 2025).
- **Contact email** is the one published on the previous portfolio. There is no phone number.
- **The two case studies** in `posts/` were written from the repositories' own documentation. Read
  them before you publish: they speak in your voice.
- `og:image` in `index.html` is a relative URL. Once the site has a home, make it absolute so link
  previews work everywhere.

## Write a post

The blog is a folder of Markdown files. Add one to `posts/` and it becomes a page, appears in the
"field notes" section on the home page, and shows up in the terminal's `blog` command.

```markdown
---
title: What I learned running a honeypot for a month
date: 2026-12-01
kind: note
summary: One or two sentences for the card and the link preview.
tags: [honeypot, linux]
figure: rack
---

The post itself, in Markdown. Headings start at `##`.
```

- The file name is the address: `posts/2026-12-01-honeypot.md` becomes `blog/honeypot.html`.
- `kind` is free text shown as a badge (`note`, `case study`, `write-up`).
- `figure` is optional: any model from the table below turns up next to the title.
- `project: <id>` links a post to a featured project, which then gets a button to it.
- `draft: true` keeps a post out of the build but visible in `npm run dev`.
- Images go in `public/blog/` and are referenced as `![alt](./picture.png)`.

With no files in `posts/`, the section and the nav link disappear on their own.

## The figures

A featured project shows one of these models next to its card (`figure: 'onion'`, and so on).

| Name | What it is | Used for |
| --- | --- | --- |
| `globe` | Earth from a real land mask, arcs converging on Bengaluru | hero |
| `onion` | cut-away onion, scan ring, orbiting site status | LeakWatch |
| `board` | evidence cards tied with red thread | Cyber Investigation Board |
| `phone` | handset with a live log and outbound connections | Android Sentinel |
| `katana` | a katana over a scanned network | Samurai Scan |
| `arm` | desk arm sorting cubes with real inverse kinematics | SO-101 Workcell |
| `cluster` | laptops and phones passing a token around | home-cluster |
| `fleet` | endpoints sending heartbeats to a server | MSP |
| `rack` | a server rack with a unit sliding out for service | WHM |
| `dish` | an uplink dish sending rings | contact |
| `chip` | a BIOS flash chip on its board, with a read head and a coin cell | the firmware write-up |

To add one, write `src/gl/figures/<name>.js` (copy a short one such as `dish.js`), register it in
`src/gl/figures/index.js`, and reference it from `content.js`. A figure is a three.js scene built
with the helpers in `figures/common.js`. Colour is semantic rather than literal: grey is the theme's
ink, red its hot accent, blue its cool accent, so a figure never needs to know which theme is active.

## The terminal

Press `` ` `` (or the `>_` button). `help` lists everything; a few highlights:

| Command | Does |
| --- | --- |
| `ls`, `ls -a` | featured projects, or all of them |
| `open leakwatch` | jump to a project (or open its link) |
| `blog`, `read leakwatch` | list the posts, open one |
| `cd projects` | scroll to a section |
| `flags`, `hint` | three flags are hidden on the site; finding all of them unlocks a theme |
| `theme amber` | `phosphor`, `amber`, `ice`, `ronin` |
| `charset measured` | swap the character ramp: `classic`, `measured`, `dense`, `binary`, `minimal` |
| `fetch` | a system summary, including the live character grid size |

## Things that move

**Screenshots that decode.** A featured project with a `shot` shows the real screenshot, drawn as
characters. Pointing at it (or tapping it) erases the characters cell by cell and leaves the image.
Without JavaScript the plain image is shown.

**GitHub pulse.** The panel above the archive lists the most recently pushed public repositories and
an activity graph. It is prerendered from a snapshot in `src/pulse-data.js`, then replaced with live
data from `api.github.com` in the visitor's browser (cached for 45 minutes). This is the only request
the site makes to another host. To switch it off, remove the `initPulse()` call in `src/main.js`.

**Hidden flags.** One is in the page source, one behind the terminal, and one is printed by the
ASCII layer only where the cursor's light falls. The checks are hashes in `src/ui/flags.js`; to
change a flag, change the text where it is hidden and its hash there.

## Deploy

**Vercel or Netlify.** Import the repository. Both detect Vite; the build command is `npm run build`
and the output directory is `dist`. No other settings.

**GitHub Pages.** A workflow is included at `.github/workflows/pages.yml`. In the repository go to
Settings, then Pages, set the source to "GitHub Actions", then run "Deploy to GitHub Pages" from the
Actions tab. To publish on every push, uncomment the `push` trigger in that file.

## How the rendering works

```
 3D scenes ──► small supersampled target ──► cells pass ──► glyph pass ──► canvas
 (shaft + figures)   (4 x 8 samples per cell)   (1 texel per character:   (atlas glyphs
                                                 ink colour + glyph index)  copied 1:1)
```

- **One canvas, document-anchored.** The canvas is the size of the viewport and follows the scroll
  position inside an absolutely positioned layer. The character grid is fixed to the document, not
  the viewport, so glyphs move exactly like real text and never shimmer while scrolling.
- **Figures draw into DOM rectangles.** Each `<div class="stage" data-figure="...">` is a window: the
  engine renders that figure's scene into the element's rectangle, so layout stays in CSS.
- **The cells pass** box-filters the supersampled block behind each character, maps brightness to a
  glyph from a ramp, picks the theme colour from the semantic channel, and draws silhouettes with
  `| / - \` wherever the depth buffer says a shape ends.
- **The glyph pass** copies atlas texels 1:1 in device pixels, which is why the characters are as
  sharp as the DOM text around them.
- **The ambient world** is an endless shaft the page descends through. Its far wall is tied 1:1 to
  the document; everything nearer slides past faster.

Text is prerendered: `vite.config.js` runs `src/render.js` at build time and writes the content into
`index.html` and one page per post under `blog/`, so every page is readable before (and without)
JavaScript. three.js loads as a separate
chunk while the boot sequence plays.

Fallbacks: no WebGL 2 gives a static backdrop and placeholders; `prefers-reduced-motion` freezes the
figures and skips the boot sequence and the typing effects; sustained slow frames lower the canvas
resolution automatically.

## Layout of the repository

```
index.html              shell; content is injected at build time
vite.config.js          renders the home page and every blog page to static HTML
posts/                  blog posts in Markdown
build/posts.js          Markdown and front matter -> post objects (build time only)
src/content.js          every word on the site
src/render.js           content -> HTML (runs in Node and in the browser)
src/pulse-data.js       fallback snapshot for the GitHub pulse
src/styles.css          the text layer
src/main.js             wiring
src/ui/                 boot sequence, nav and depth rail, terminal, themes, id card, tag cloud,
                        screenshot decoder, GitHub pulse, flags
src/gl/engine.js        the renderer described above
src/gl/shaders.js       cells pass and glyph pass
src/gl/atlas.js         glyph atlas and character ramps
src/gl/shaft.js         the ambient world
src/gl/figures/         one file per 3D model
public/shots/           project screenshots
scripts/                regenerates the globe's land mask
```

## Credits

[three.js](https://threejs.org) (MIT), [JetBrains Mono](https://www.jetbrains.com/lp/mono/) (OFL 1.1),
[marked](https://marked.js.org) (MIT, build time only), land mask derived from
[Natural Earth](https://www.naturalearthdata.com) 110m data (public domain).
No analytics and no cookies. The GitHub pulse is the one request to another host.
