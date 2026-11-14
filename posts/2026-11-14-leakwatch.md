---
title: How LeakWatch watches ransomware leak sites
date: 2026-11-14
kind: case study
summary: A self-hosted monitor that reads the leak sites itself, over Tor, and keeps the evidence. The design rules, the check pipeline, and what the pipeline does when a page fights back.
tags: [threat-intel, tor, python, fastapi]
project: leakwatch
figure: onion
---

Public trackers such as ransomware.live and RansomLook are very good. They are also somebody else's view of the leak sites. I wanted first-hand data: what a page said, when it changed, and a screenshot that proves it. LeakWatch is the tool that came out of that. It is a single process on one machine that visits each monitored site through Tor and keeps what it finds.

## Four rules I kept

| Rule | Why |
| --- | --- |
| The core scraper never calls a third-party API | The point is first-hand data from the sites themselves. External feeds are used only to compare against, in a separate database. |
| One process, SQLite, no external services | It has to run on a laptop. Everything is files under one data directory. |
| Pages are patched in place, not reloaded | Full re-renders made the dashboard flicker. Sections refresh on their own. |
| The server does the expensive work once | Cached payloads keep page loads under two seconds. |

## The check pipeline

Every thirty seconds a scheduler picks the sites that are due and runs the same pipeline on each. At most four checks run at once.

1. **Fetch** the page through the Tor SOCKS proxy, as plain HTTP or in a headless Chromium, with any cookies stored for that site.
2. **Record the failure** if there is one. A timeout or a 5xx means offline, a 4xx means blocked, and the retry delay grows with each failure in a row.
3. **Look for a challenge page** before anything is parsed. A CAPTCHA form is not content, and treating it as content produces garbage victims.
4. **Classify the page**: normal, blocked, seized, a login wall, JavaScript only, a bare file listing, or empty.
5. **Parse** with the most specific parser available. The order is a hand-written selector, a pinned site profile, a custom parser module, a detected profile, embedded JSON, and only then generic heuristics.
6. **Harvest every link** and sort it: download, another hidden service, clearnet, contact, or an internal page.
7. **Follow pagination** up to a per-run budget, and store a pointer so the next tick resumes where this one stopped.
8. **Hash the text and diff it** against the last snapshot. A change stores a new snapshot and the added lines.
9. **Take a screenshot** if the page changed, a new post appeared, or the last one is stale. Identical files are stored once.
10. **Emit events**, which reach every open dashboard over Server-Sent Events.

Three details in there are worth pointing out.

**The pipeline changes its own mind about how to fetch.** If the raw HTML yields few posts and thin text, the page is rendered in Chromium. When the rendered page yields more victims, the site is switched to browser mode for good, and an event says so.

**Every row remembers which parser produced it.** Knowing whether a victim came from a site profile or from the generic fallback is what makes a template change on the site visible.

**A file listing is not a list of victims.** Some sites are just directory indexes. Links are harvested from those, but a file name is never promoted to an organisation name.

## When the page fights back

Leak sites sit behind bot challenges, proof-of-work gates and plain breakage. LeakWatch classifies a challenge first and only then decides what to do with it. A site showing one is marked as such rather than as online, a screenshot is kept, and nothing is parsed from it.

Automatic handling is opt-in, can be capped, and is logged attempt by attempt. Whatever it cannot handle goes to a person: a visible browser window, routed through Tor, opens on the machine. You complete the challenge yourself, the session cookies are stored for that site, and every later fetch reuses them until they expire.

The human console stays the final fallback for everything, so it does not depend on any of the automation.

## Keeping the evidence

A victim row on its own is a claim. For every victim that a site profile parses, LeakWatch keeps the raw HTML of the card as parsed, the full HTML of the victim's own page when one is opened, and a screenshot cropped to just that entry. Raw HTML is shown escaped, with a copy button. It is never rendered live.

## The shape of it

The backend is one FastAPI process on asyncio. SQLite and the parsers are synchronous, so routes hand them to threads. Tor fetches use httpx; Chromium is driven through Playwright. A scheduler runs the periodic jobs and an in-memory event bus feeds the live stream. The dashboard is plain JavaScript with no build step.

It also guards itself. There is a login with roles, an audit log, and a lockout after repeated failures. Remote access runs through Tailscale and the same login.

A live instance runs at [leakwatch.hostingsignal.in](https://leakwatch.hostingsignal.in/), behind a sign-in. The source is private.
