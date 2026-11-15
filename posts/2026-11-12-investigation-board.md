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

A feature list says what a tool can do. Driving it through real cases says what it is like to use. I built two from public reporting and wrote down everything that got in the way. Every screenshot below comes from those two walkthroughs.

### Case one: look-alike Okta and ServiceNow portals

On 19 October 2026 Dataminr's TRACE team reported a phishing campaign against B2B e-commerce providers, built on sign-in portals that pair a vendor's name with "okta" or "servicenow" ([Dataminr](https://www.dataminr.com/resources/intel-brief/okta-themed-phishing-campain-targets-e-commerce-providers/)). The brief lists 13 domains. The walkthrough turns it into a case in thirteen steps, using only facts from the brief.

![Extract IOCs dialog with the brief's indicator list pasted in and thirteen defanged domains recognised, all ticked.](./inv-vishing-extract.webp "Step 2. The brief's indicator list pasted into Extract IOCs: all thirteen defanged domains are recognised, typed and ready to pin.")

![The board with indicator and actor cards joined by red threads, and the thread editor open on the right.](./inv-vishing-threads.webp "Step 6. Threads carry a relation: “controls” from operator to infrastructure, “linked to” for evidence, “suspected” where the source hedges. Each thread records why the two cards are connected.")

![The analysis of competing hypotheses matrix: exhibits down the side, three hypotheses across, cells marked consistent or inconsistent.](./inv-vishing-ach.webp "Step 9. Analysis of competing hypotheses. Repeated targeting and vendor-specific domains are consistent with an organised crew and inconsistent with an opportunistic actor.")

![The finished vishing case board with clustered cards, threads and the export buttons highlighted.](./inv-vishing-board.webp "Step 13. The finished board, ready to print as a case brief, export as a STIX 2.1 bundle for MISP or OpenCTI, or save as case JSON.")

### Case two: SafePay ransomware, CISA AA26-293A

On 20 October 2026 the FBI, CISA, the US Secret Service and partners in Germany and the UK published a joint advisory on SafePay ransomware, active since August 2024 with at least 600 victims ([CISA](https://www.cisa.gov/news-events/cybersecurity-advisories/aa26-293a)). It lists nine IP addresses, ten file hashes, five CVEs and four Windows hostnames. I used this case to put every feature of the board to work.

This is the whole case being built, frame by frame from the walkthrough:

<figure class="prose__fig">
<a href="./inv-safepay-timelapse.webp" target="_blank" rel="noopener"><picture><source srcset="./inv-safepay-timelapse.webp" media="(prefers-reduced-motion: no-preference)" /><img src="./inv-safepay-timelapse-still.webp" alt="Time-lapse of the SafePay case: an empty template board fills with indicator cards, clusters, threads, a kill chain and a STIX import, step by step." width="960" height="600" loading="lazy" decoding="async" /></picture></a>
<figcaption>The SafePay case from the empty template to the finished board, in fourteen steps of the walkthrough. With reduced motion turned on, only the finished board is shown.</figcaption>
</figure>

![Extract IOCs dialog listing CVEs, SHA-256 hashes and IP addresses taken from the advisory.](./inv-safepay-extract.webp "S02. The advisory's indicator tables pasted into Extract IOCs. Nine IP addresses, six SHA-256 hashes and five CVEs are recognised and typed, twenty cards in one click.")

![The OSINT workbench open on an IP address, with live reverse DNS and RDAP results and a column of launcher links.](./inv-safepay-osint.webp "S09. OSINT on the command-and-control address 88.119.167[.]239. Reverse DNS and RDAP answer live (UAB Bacloud, Lithuania, AS61272); the other services open as launchers.")

![The board with a duplicate technique card selected and the merge control in the side panel.](./inv-safepay-merge.webp "S12. Merging a duplicate ATT&CK technique card: threads are re-pointed, and tags, tasks and comments are combined.")

![The kill-chain view: technique cards arranged in ATT&CK tactic lanes from left to right, with evidence threaded underneath.](./inv-safepay-killchain.webp "S15. The advisory's thirteen techniques in their ATT&CK tactic lanes, from Initial Access to Impact.")

![A new case laid out on a grid after importing a STIX bundle, with the import button highlighted.](./inv-safepay-stix.webp "S22. The exported STIX 2.1 bundle imported back as a new case: indicators, vulnerabilities, attack patterns, relationships and groupings all return. Bundles from MISP or OpenCTI take the same path.")

### What the cases broke

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

The feature guide and the tutorial are not written by hand. Scripts drive the built app in headless Chromium, assert each feature, take the screenshots, and write a pass or fail line per feature. The screenshots in this post are those captures.

The source, the walkthroughs and both worked cases are on [GitHub](https://github.com/sxi9/investigation): the [vishing walkthrough](https://github.com/sxi9/investigation/blob/HEAD/docs/TUTORIAL.md) and the [SafePay case file](https://github.com/sxi9/investigation/blob/HEAD/docs/CASE-SAFEPAY.md) go through every step.
