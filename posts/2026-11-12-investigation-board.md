---
title: Building an investigation board, then breaking it with real cases
date: 2026-11-12
kind: case study
summary: A noir cork board for intelligence work, taken from a design file to a secured multi-analyst app. Most of what improved it came from running two real cases through it.
tags: [threat-intel, osint, react, stix]
project: investigation
figure: board
---

The Cyber Investigation Board is a cork board for intelligence work. Evidence goes on cards, cards are pinned, and red thread links them. Around that sit the tools an analyst reaches for: IOC extraction, ATT&CK techniques, an OSINT workbench, analysis of competing hypotheses, case briefs and STIX 2.1 export.

## From a design file to an app

The interface started as design files, not as code. A converter turns the design's template dialect into plain JSX, one folder per page, and applies a short list of patches for routing and the server. It parses the templates with a real DOM, in headless Chromium, so what it reads is what a browser would build.

The generated pages are thin. Each has a template, the design's own logic class, and a small React host that renders the template from the logic's state. Editing the design and re-running the converter regenerates all of it.

## Version two: a server that can be trusted with cases

The first version lived entirely in the browser, which works for one person but not for a team. Version two adds a small server, built on Fastify and SQLite, that serves the pages and the API from one origin.

The security work is the unglamorous kind:

- **Passwords** are hashed with scrypt, compared in constant time, and checked against a common-password list. An unknown user name takes as long to reject as a wrong password.
- **Sessions** use a 256-bit random token that is stored hashed. The cookie is `HttpOnly` and `SameSite=Strict`, with a twelve-hour absolute limit and a fifteen-minute idle limit.
- **Enrichment keys never reach the browser.** Lookups go through a server-side proxy with an allow-list, and a provider is only allowed once its key is configured.
- **Cases carry controls**: roles, two-factor sign-in, OIDC single sign-on, per-file TLP access, legal hold, retention and scheduled backups.

## Running real cases through it

A feature list says what a tool can do. Driving it through real cases says what it is like to use. I built two from public reporting: a wave of vendor-themed vishing against e-commerce SaaS providers, and the SafePay ransomware case from a CISA advisory. Then I wrote down everything that got in the way.

Some of it was plain bugs. Board export, the case brief and the one-pager all crashed when a case contained a cluster, and the passphrase lock screen crashed on load, so an encrypted case could not be reopened.

The more interesting findings were about what an analyst actually pastes in:

- **Hostnames and file names were not indicators.** The advisory lists Windows computer names and dozens of file names. None could become indicator cards, so they ended up in a note.
- **SHA-1 and SHA-256 were both just "hash".** The card did not say which, and the STIX export had to guess from the length.
- **Extracting twice made duplicates.** Running extraction over overlapping text created cards that then had to be merged by hand.
- **Shared infrastructure was not flagged.** Several addresses in the advisory belong to large CDN and SaaS ranges. Pinning them like any other indicator invites a bad blocklist. An ownership lookup on pin, with a badge, prevents that.
- **Most OSINT lookups are blocked in a browser.** Cross-origin rules stop them, which is the real reason the server-side proxy exists.
- **A short ATT&CK list is worse than none.** Techniques from the advisory came in as bare IDs that the kill-chain view could not place, so the full matrix went in.

None of these show up in a demo with tidy sample data. All of them came from working through real reporting.

## Proving it still works

The feature guide and the tutorial are not written by hand. Scripts drive the built app in headless Chromium, assert each feature, take the screenshots, and write a pass or fail line per feature.

The source, the walkthroughs and both worked cases are on [GitHub](https://github.com/sxi9/investigation).
