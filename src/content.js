// ---------------------------------------------------------------------------
// Everything the site says lives in this file. Edit it and the page, the
// terminal and the prerendered HTML all follow.
// ---------------------------------------------------------------------------

export const profile = {
  name: 'Siva Sastha Sai Krishna',
  first: 'Siva',
  handle: 'sxi9',
  role: 'Intelligence Analyst',
  company: 'ZeroFox',
  location: 'Bengaluru, Karnataka, India',
  coords: '12.97 N  77.59 E',
  // Rotating line under the name.
  typed: [
    'Intelligence Analyst @ ZeroFox',
    'threat intel // OSINT // dark web recon',
    'phishing infra, domain abuse, credential leaks',
    'builds security tooling and self-hosted AI',
  ],
  intro:
    'I track external threats for a living: phishing infrastructure, domain abuse, credential leaks and dark web chatter. Off the clock I build the tools I wish I had, from a ransomware leak-site monitor that crawls over Tor to a cluster that runs large language models on spare laptops and phones.',
  links: {
    github: 'https://github.com/sxi9',
    linkedin: 'https://www.linkedin.com/in/siva-sastha-sai-krishna-040719296',
    email: 'sivasasthasaikrishna@gmail.com',
    // Put the file in public/ and set e.g. './resume.pdf' to show a download link.
    resume: '',
  },
  // Put a photo in public/ and set e.g. './portrait.jpg': the identity card
  // then draws it in ASCII and resolves to the real picture now and then.
  portrait: '',
};

export const about = {
  paragraphs: [
    'I am an Intelligence Analyst at ZeroFox in Bengaluru, on the Global Customer Operations team. The work is external threat intelligence: monitoring, triaging and investigating alerts that target customer brands, executives, domains and digital assets, validating them with OSINT, and escalating the ones that are real.',
    'Before ZeroFox I worked on the AI side. At Panasonic I built the backend of a retrieval-augmented product chatbot on local LLMs, and at Boscle I worked on AI, ML and LLM security models alongside cloud and application security. That mix still shapes how I work: analyst habits, engineer tools.',
    'Outside work I build. Nearly everything I make is self-hosted and local-first, keeps its data on the machine it runs on, and is documented well enough for someone else to run.',
  ],
  facts: [
    ['role', 'Intelligence Analyst'],
    ['org', 'ZeroFox / Global Customer Operations'],
    ['base', 'Bengaluru, IN'],
    ['focus', 'external threat intel, OSINT, dark web'],
    ['builds', 'security tooling, self-hosted AI, infra'],
    ['speaks', 'Python, TypeScript, Go, Kotlin, Bash'],
  ],
};

export const experience = [
  {
    org: 'ZeroFox',
    meta: 'Full-time / Hybrid / Bengaluru, India',
    span: 'Dec 2025 - Present',
    roles: [
      { title: 'Intelligence Analyst', span: 'Sep 2026 - Present' },
      { title: 'SOC Tier-1 Analyst | Threat Analyst', span: 'Dec 2025 - Present' },
    ],
    points: [
      'Part of the Global Customer Operations team protecting enterprise, government and commercial customers from external cyber threats.',
      "Monitor, triage and investigate alerts across multiple threat surfaces targeting customer brands, executives, domains and digital assets on ZeroFox's hybrid intelligence platform.",
      'Real-time alert triage, OSINT-driven threat validation, indicator analysis and dark web reconnaissance.',
      'Escalate verified high and critical threats to customers for prompt remediation.',
    ],
    tags: [
      'domain abuse & impersonation',
      'phishing infrastructure',
      'credential leak monitoring',
      'dark web threat intel',
      'brand & executive protection',
    ],
  },
  {
    org: 'Boscle',
    meta: 'Internship / Hybrid',
    span: 'Jul 2025 - Oct 2025',
    roles: [{ title: 'AI & Cybersecurity Intern', span: 'Jul 2025 - Oct 2025' }],
    points: [
      'Research and exploration of AI, ML and LLM-based security models.',
      'Supported foundational work across cybersecurity, cloud security and application security.',
      'Documentation, implementation and technology evaluations, with hands-on time on AWS, Azure and GCP and modern security tools.',
    ],
    tags: ['AI/ML security', 'LLM security models', 'cloud security', 'application security'],
  },
  {
    org: 'GlobalXperts Technology',
    meta: 'Freelance',
    span: 'Jul 2025 - Aug 2025',
    roles: [{ title: 'Independent Consultant', span: 'Jul 2025 - Aug 2025' }],
    points: [
      'Equipment labeling and hardware setup so the network infrastructure was ready for business operations.',
      'Racked 2x Cisco C9407 switches, powered them up and set up console access.',
    ],
    tags: ['network hardware setup', 'Cisco equipment'],
  },
  {
    org: 'Panasonic India',
    meta: 'Internship / Hybrid / Greater Bengaluru Area',
    span: 'Feb 2025 - Jun 2025',
    roles: [{ title: 'Intern', span: 'Feb 2025 - Jun 2025' }],
    points: [
      "Built the backend of an AI-powered chatbot for Panasonic's Direct-to-Consumer platform: intelligent product search, recommendations and comparison.",
      'FastAPI, LangChain and ChatOllama for local LLM interaction, with a retrieval-augmented generation pipeline on ChromaDB and live product data from MongoDB.',
      'Hybrid retrieval that combines semantic vectors with keyword filters, plus intent detection and real-time comparisons.',
      'Structured answers as JSON product cards and fail-safe handling of unrelated or invalid queries.',
    ],
    tags: ['Python', 'RAG', 'FastAPI', 'LangChain', 'ChromaDB', 'MongoDB'],
  },
];

// Shown under the experience timeline once it has entries, e.g.
//   { school: 'University name', degree: 'B.Tech, Computer Science', span: '2021 - 2025', note: 'optional line' }
export const education = [];

// status: live | active | experimental | wip | archived
// cat:    sec | ai | infra | web | hw
export const featured = [
  {
    id: 'leakwatch',
    figure: 'onion',
    title: 'LeakWatch',
    kicker: 'ransomware leak-site monitor over Tor',
    cat: 'sec',
    status: 'live',
    year: '2026',
    summary:
      'A self-hosted ransomware leak-site monitor in the spirit of ransomware.live and RansomLook, built from scratch with no third-party data API. It talks to the group sites itself, over Tor.',
    points: [
      'Every check fetches the site through a Tor SOCKS proxy, records status, HTTP code and latency, then hashes and diffs the page against the last snapshot.',
      'Victims are extracted by heuristics, per-site CSS selectors or custom parser modules; pagination is followed across ticks and every link is harvested and classified.',
      'Full-page screenshots through Tor with headless Chromium, and an event stream that updates the dashboard live over SSE.',
      'Challenge pages are detected and classified instead of being parsed as content; what cannot be handled goes to a human console.',
      'Watchlist and alerts, per-victim evidence snapshots, login with lockout, remote access over Tailscale.',
    ],
    stack: ['Python', 'FastAPI', 'httpx + SOCKS', 'Playwright', 'SQLite', 'APScheduler', 'SSE'],
    links: [{ label: 'live instance', href: 'https://leakwatch.hostingsignal.in/', note: 'sign-in required' }],
    source: 'private repository',
  },
  {
    id: 'investigation',
    figure: 'board',
    title: 'Cyber Investigation Board',
    kicker: 'a noir-style board for intelligence work',
    cat: 'sec',
    status: 'active',
    year: '2026',
    summary:
      'Pinned evidence cards and red-thread links, with the analyst tooling built in: IOC extraction, ATT&CK techniques, an OSINT workbench, analysis of competing hypotheses, case briefs and STIX 2.1 export.',
    points: [
      'Timeline, kill-chain and presentation views, the full ATT&CK matrix, an editable actor library and enrichment on pin.',
      'Pushes to MISP, TheHive and Jira, serves scheduled STIX feeds and ingests email and PDF.',
      'A secured multi-analyst server: accounts and roles, live sync, two-factor sign-in, OIDC single sign-on, per-file TLP access, legal hold and backups.',
      'Documented with worked cases built on public reporting, including a CISA advisory on SafePay ransomware.',
    ],
    stack: ['React', 'Vite', 'Fastify', 'SQLite', 'Leaflet', 'STIX 2.1', 'Docker + Caddy'],
    links: [{ label: 'source', href: 'https://github.com/sxi9/investigation' }],
    shot: { src: 'shots/investigation.webp', w: 1440, h: 900, alt: 'The investigation board with a sample case open: evidence cards pinned to a cork board and joined by red thread' },
  },
  {
    id: 'andro',
    figure: 'phone',
    title: 'Android Sentinel',
    kicker: 'defensive monitoring for a device you own',
    cat: 'sec',
    status: 'active',
    year: '2026',
    summary:
      'A local dashboard for your own rooted Android device: defensive monitoring and authorized mobile-app security testing in one place, over ADB.',
    points: [
      'Live system logs, every network connection and where it lands, microphone, camera, location and clipboard access, app and permission changes.',
      'An alert engine tuned to spyware and stalkerware patterns, with optional offline GeoIP and tracker lists.',
      'Self-contained SSL interception: its own CA, its own proxy (or Burp), per-app requests, a repeater and HAR export, behind an engagement scope gate with an audit log.',
      'All data stays on the machine: no cloud, no telemetry, and the web UI binds to 127.0.0.1.',
    ],
    stack: ['Python', 'FastAPI', 'ADB', 'mitmproxy', 'Frida', 'Magisk'],
    links: [{ label: 'source', href: 'https://github.com/sxi9/andro' }],
  },
  {
    id: 'samurai-scan',
    figure: 'katana',
    title: 'Samurai Scan',
    kicker: 'a Wi-Fi scanner that keeps watch',
    cat: 'sec',
    status: 'active',
    year: '2026',
    summary:
      'A native Android network scanner that guards the network instead of listing IPs once and forgetting you exist. Real Android APIs and raw sockets, everything on-device.',
    points: [
      'Live LAN discovery with an ICMP/TCP sweep, mDNS and SSDP/UPnP; fingerprinting from banners, SSH host keys, SNMP and HTTP headers.',
      'Sentry Mode re-scans in the background and notifies the moment an unknown device joins or a new port opens.',
      'Rogue-DHCP, ARP/MITM anomaly and rogue-AP detection, a security score from the real scan, UPnP exposure mapping and CVE matching.',
      'Root mode adds nmap -sV -O, arp-scan and tcpdump. No account, no cloud, no telemetry.',
    ],
    stack: ['Kotlin 2.0', 'Jetpack Compose', 'Material 3', 'Coroutines', 'Room'],
    links: [{ label: 'source', href: 'https://github.com/sxi9/samurai-scan' }],
    shot: { src: 'shots/samurai-scan.webp', w: 1348, h: 968, alt: 'Three screens of the Samurai Scan app: the dashboard, the security audit and Sentry watch' },
  },
  {
    id: 'so101',
    figure: 'arm',
    title: 'SO-101 Workcell',
    kicker: 'language-driven pick-and-place',
    cat: 'ai',
    status: 'active',
    year: '2026',
    summary:
      'Language-driven pick-and-place for the SO-101 desk arm, built and tested entirely in MuJoCo on a laptop. The model decides what; code decides how.',
    points: [
      'A vision-language planner only names objects and bins. Verified skills own the geometry, close the loop on simulator state and retry.',
      'Scripted skills: 90 of 90 pick-and-place attempts on random layouts.',
      'A SAC grasp-and-lift policy reaches 98% on nominal physics and 90% zero-shot under domain randomisation, beating the hand-written controller.',
      'The same joint-command stream drives local MuJoCo, a Cyberwave digital twin or the real arm, with LeRobot dataset export.',
    ],
    stack: ['Python', 'MuJoCo', 'Gymnasium', 'Stable-Baselines3', 'PyTorch', 'LeRobot'],
    links: [{ label: 'source', href: 'https://github.com/sxi9/so101-workcell' }],
    shot: { src: 'shots/so101.webp', w: 400, h: 300, alt: 'The simulated arm sorting coloured cubes into two bins', moving: true },
  },
  {
    id: 'home-cluster',
    figure: 'cluster',
    title: 'home-cluster',
    kicker: 'one model, many devices',
    cat: 'infra',
    status: 'experimental',
    year: '2026',
    summary:
      'Pool the RAM, GPUs and CPUs of the laptops and phones you already own into one cluster, and run a language model that is too big for any single device.',
    points: [
      'Built on the llama.cpp RPC backend: the head splits a model across every awake device and serves an OpenAI-compatible API.',
      'GPUs of any brand work together: Vulkan, CUDA, ROCm and Adreno OpenCL on Snapdragon phones.',
      'A planner fills the fastest devices first, because every token walks through every device in turn.',
      'One-command joins, an Android worker app, a standby head for failover, k3s for everything else, one dashboard.',
    ],
    stack: ['llama.cpp', 'Shell', 'Python', 'Kotlin', 'k3s', 'Tailscale'],
    links: [{ label: 'source', href: 'https://github.com/sxi9/home-cluster-' }],
    shot: { src: 'shots/home-cluster.webp', w: 1440, h: 922, alt: 'The home-cluster dashboard: tokens per second, a model split across four devices, and each device with its memory and load' },
  },
  {
    id: 'msp',
    figure: 'fleet',
    title: 'MSP',
    kicker: 'remote monitoring and management',
    cat: 'infra',
    status: 'active',
    year: '2026',
    summary:
      'A small remote monitoring and management platform for an IT provider: one Go server binary with SQLite and the dashboard inside, a desktop agent for Linux and Windows, and a Kotlin agent for Android.',
    points: [
      'Agents only ever connect outbound; commands ride on the heartbeat channel.',
      'Fleet view with status and metrics, remote commands with output, remote lock, alerts and a full audit log.',
      'Enrollment tokens with install one-liners per platform, and remote desktop through a self-hosted RustDesk relay.',
      'A written wire protocol, architecture rules and a threat model sit next to the code.',
    ],
    stack: ['Go 1.24', 'SQLite', 'Preact', 'TypeScript', 'Kotlin'],
    links: [{ label: 'source', href: 'https://github.com/sxi9/msp' }],
    shot: { src: 'shots/msp.webp', w: 1440, h: 940, alt: 'The MSP fleet view: one enrolled Linux device with status, CPU, memory and disk' },
  },
  {
    id: 'whm',
    figure: 'rack',
    title: 'WHM',
    kicker: 'a hosting control panel for a real server',
    cat: 'infra',
    status: 'active',
    year: '2026',
    summary:
      'A self-hostable, WHM-compatible hosting control panel: 30 categories and 212 functions that manage a real Linux server, from users and quotas to DNS, mail, databases and SSL.',
    points: [
      'Privilege separation by design: the API runs unprivileged, and every privileged operation is a named, schema-validated request to a small root daemon over a Unix socket.',
      'The daemon exposes an allowlisted catalog and only ever runs programs with an argument vector, never a shell string.',
      'Apache/NGINX and PHP-FPM, BIND, Exim/Dovecot, MySQL/MariaDB, ACME, backups, transfers and resellers.',
      'A plugin system with an SDK, a license server and a marketplace.',
    ],
    stack: ['Node.js 22', 'Express', 'React', 'SQLite', 'systemd'],
    links: [{ label: 'source', href: 'https://github.com/sxi9/whm' }],
    shot: { src: 'shots/whm.webp', w: 1440, h: 900, alt: 'The WHM home dashboard: a tool grid, server statistics and monitored services' },
  },
];

export const archive = [
  {
    name: 'dumpper',
    cat: 'sec',
    year: '2026',
    blurb:
      'Browser extension (Manifest V3) that captures the victim list of an open ransomware leak site into structured JSON for tracking, with 101 site profiles and no page reloads.',
    stack: ['JavaScript', 'Python'],
    href: 'https://github.com/sxi9/dumpper',
  },
  {
    name: 'oppsec',
    cat: 'sec',
    year: '2026',
    blurb:
      'A small, auditable OPSEC toolkit for an Ubuntu workstation and an Android phone: read-only posture audit, dry-run-first hardening, ADB audit, threat model.',
    stack: ['Shell'],
    href: 'https://github.com/sxi9/oppsec',
  },
  {
    name: 'samurai',
    title: 'SamurAI',
    cat: 'sec',
    year: '2026',
    blurb:
      'AI-assisted web application security scanner: reconnaissance, vulnerability checks and report writing by self-hosted models through Ollama.',
    stack: ['Python', 'Gradio', 'Ollama'],
    href: 'https://github.com/sxi9/samurai',
  },
  {
    name: 'tainttrail',
    title: 'TaintTrail',
    cat: 'sec',
    year: '2026',
    status: 'wip',
    blurb: 'Attack-path guard for AI agents, built on an embedded graph database. Work in progress.',
    stack: ['Python'],
    href: 'https://github.com/sxi9/pr-joectr',
  },
  {
    name: 'trust-gain',
    title: 'TrustGain',
    cat: 'web',
    year: '2026',
    blurb:
      'Consent-first, mutual trust verification for two strangers about to do a deal: symmetric checks, simultaneous reveal, data minimisation enforced in code.',
    stack: ['Next.js', 'TypeScript'],
    href: 'https://github.com/sxi9/trust-gain',
  },
  {
    name: 'voice-clone',
    title: 'Voice Cloning Studio',
    cat: 'ai',
    year: '2026',
    blurb:
      'Self-hosted zero-shot voice cloning in English and 11 Indian languages on your own GPU, with a Gradio studio and an OpenAI-compatible speech endpoint.',
    stack: ['Python', 'F5-TTS', 'IndicF5', 'Whisper'],
    href: 'https://github.com/sxi9/voice-clone',
  },
  {
    name: 'SAMURAI-AI',
    cat: 'ai',
    year: '2026',
    blurb:
      'A Jarvis-style desktop assistant for Windows: offline speech recognition, neural voice, PC control, live telemetry and a self-healing launcher.',
    stack: ['Python', 'Vosk', 'HTML'],
    href: 'https://github.com/sxi9/SAMURAI-AI',
  },
  {
    name: 'chat-what',
    cat: 'ai',
    year: '2026',
    blurb:
      'A personal assistant you text on WhatsApp: an LLM with tools that asks before acting, on top of deterministic state-machine menus as the fallback.',
    stack: ['Python', 'Claude API'],
    href: 'https://github.com/sxi9/chat-what',
  },
  {
    name: 'local-image-gen',
    cat: 'ai',
    year: '2026',
    blurb: 'One idempotent script that brings up ComfyUI with FLUX.1-schnell for local image generation on current NVIDIA GPUs.',
    stack: ['Shell', 'ComfyUI'],
    href: 'https://github.com/sxi9/local-image-gen',
  },
  {
    name: 'D2C_panasonic_chatbot',
    title: 'D2C Panasonic Chatbot',
    cat: 'ai',
    year: '2025',
    blurb:
      'Retrieval-augmented product recommender over 168 products in 9 categories: Chroma vector store, local Gemma 2 through Ollama, comparison tables, a Chainlit UI.',
    stack: ['Python', 'LangChain', 'Chroma', 'Ollama'],
    href: 'https://github.com/sxi9/D2C_panasonic_chatbot',
  },
  {
    name: 'vita',
    title: 'VITA',
    cat: 'ai',
    year: '2025',
    blurb: 'AI Indian Sign Language translator: real-time ISL to speech with MediaPipe and TensorFlow.',
    stack: ['Python', 'MediaPipe', 'TensorFlow'],
    href: 'https://devfolio.co/projects/vita-for-indian-sign-language-1b43',
  },
  {
    name: 'dropzone',
    title: 'Dropzone',
    cat: 'infra',
    year: '2026',
    blurb:
      'A private AirDrop for every device on your network: drag-and-drop sharing, burn-after-read notes, per-device sends, timed links and an in-browser remote desktop.',
    stack: ['Python', 'Flask', 'Vanilla JS'],
    href: 'https://github.com/sxi9/dropzone',
  },
  {
    name: 'claude-session-transfer',
    cat: 'infra',
    year: '2026',
    blurb:
      'Moves Claude Desktop sessions between accounts or PCs as portable bundles. Web UI, CLI and a tkinter window; standard library only, with a secret scanner for transcripts.',
    stack: ['Python'],
    href: 'https://github.com/sxi9/claude-session-transfer',
  },
  {
    name: 'homelab',
    title: 'Homelab on Proxmox',
    cat: 'infra',
    year: '2025',
    blurb:
      'Self-hosted services (AdGuard, OpenVPN, Immich, NxWitness) behind Cloudflare Tunnels and a reverse proxy, with monitoring.',
    stack: ['Proxmox', 'Cloudflare Tunnels'],
  },
  {
    name: 'SOCIAL-',
    title: 'Bored Chat',
    cat: 'web',
    year: '2026',
    blurb:
      'Self-hosted realtime chat on one VPS: groups, honest read receipts, invite links, web push and SSRF-guarded link previews.',
    stack: ['Next.js 15', 'Fastify', 'PostgreSQL', 'Redis', 'MinIO'],
    href: 'https://github.com/sxi9/SOCIAL-',
  },
  {
    name: 'GetMe',
    cat: 'web',
    year: '2026',
    blurb:
      'Hyperlocal delivery for Bengaluru: customer, partner and shop apps on one backend, with live tracking and a code-verified handover.',
    stack: ['TypeScript', 'Fastify', 'React', 'Capacitor'],
    href: 'https://github.com/sxi9/GetMe',
  },
  {
    name: 'vault',
    title: 'LOOT',
    cat: 'web',
    year: '2026',
    blurb:
      'QR tags for the things you own. Whoever finds an item scans the sticker, can message you and share where it was found; items can carry a 3D scan.',
    stack: ['Next.js', 'TypeScript'],
    href: 'https://github.com/sxi9/vault',
  },
  {
    name: 'JobPortalApp',
    cat: 'web',
    year: '2025',
    blurb: 'Full-stack job portal with separate flows for job seekers and employers.',
    stack: ['React', 'Vite', 'Express', 'MongoDB'],
    href: 'https://github.com/sxi9/JobPortalApp',
  },
  {
    name: 'email-broadcast',
    cat: 'web',
    year: '2025',
    blurb: 'Email broadcast API with delivery tracking and CSV export of the logs.',
    stack: ['TypeScript', 'Express', 'Prisma', 'PostgreSQL'],
    href: 'https://github.com/sxi9/email-broadcast',
  },
  {
    name: 'BYOD',
    title: 'BYOD Network Portal',
    cat: 'sec',
    year: '2025',
    blurb:
      'Network management portal over pfSense REST APIs: firewall rules, Wi-Fi control, users and active connections, with dashboards.',
    stack: ['React', 'Tailwind', 'pfSense API'],
    href: 'https://github.com/sxi9/BYOD',
  },
  {
    name: 'drone-protection',
    title: 'Drone Intrusion Detection',
    cat: 'sec',
    year: '2025',
    blurb:
      'Network monitor that flags unauthorized devices and ARP spoofing, with a device whitelist, a Flask dashboard and a curses CLI.',
    stack: ['Python', 'Scapy', 'Nmap', 'Flask'],
    href: 'https://github.com/sxi9/drone-protection',
  },
  {
    name: 'acer-bios',
    cat: 'hw',
    year: '2026',
    blurb:
      'Firmware deep-dive on an Acer Nitro 5: hidden BIOS settings, the usable-RAM cap proven three ways, boot hangs and an offline Windows boot repair.',
    stack: ['UEFI', 'Python', 'Linux'],
    href: 'https://github.com/sxi9/acer-bios',
  },
  {
    name: 'telegrambotresults',
    title: 'Result Bot',
    cat: 'web',
    year: '2024',
    blurb: 'Telegram bot that fetches college result PDFs by roll number and sends them in chat.',
    stack: ['Python', 'python-telegram-bot'],
    href: 'https://github.com/sxi9/telegrambotresults',
  },
  {
    name: 'face-recognition',
    title: 'Face Recognition Attendance',
    cat: 'ai',
    year: '2023',
    blurb: 'Attendance system that recognises faces from a camera feed and logs them to CSV, with a small GUI.',
    stack: ['Python', 'OpenCV', 'face_recognition'],
    href: 'https://github.com/sxi9/face-recognition',
  },
];

export const categories = {
  all: 'all',
  sec: 'security',
  ai: 'ai / ml',
  infra: 'infra',
  web: 'web',
  hw: 'hardware',
};

export const skills = [
  {
    id: 'intel',
    title: 'threat intelligence',
    items: [
      'alert triage',
      'OSINT validation',
      'indicator analysis',
      'dark web reconnaissance',
      'phishing infrastructure',
      'domain abuse & impersonation',
      'credential leak monitoring',
      'brand & executive protection',
      'MITRE ATT&CK',
      'STIX 2.1',
      'MISP',
      'VirusTotal',
      'Shodan',
    ],
  },
  {
    id: 'sectools',
    title: 'security tooling',
    items: ['Nmap', 'Wireshark', 'Burp Suite', 'Metasploit', 'Nessus', 'mitmproxy', 'Frida', 'ADB', 'Tor', 'tcpdump'],
  },
  {
    id: 'ai',
    title: 'ai / ml',
    items: [
      'RAG',
      'LangChain',
      'Ollama',
      'llama.cpp',
      'ChromaDB',
      'PyTorch',
      'TensorFlow',
      'MediaPipe',
      'Stable-Baselines3',
      'MuJoCo',
      'Whisper',
      'Hugging Face',
    ],
  },
  {
    id: 'code',
    title: 'languages',
    items: ['Python', 'TypeScript', 'JavaScript', 'Go', 'Kotlin', 'Bash', 'C', 'SQL'],
  },
  {
    id: 'build',
    title: 'backend / frontend',
    items: [
      'FastAPI',
      'Flask',
      'Fastify',
      'Express',
      'Node.js',
      'React',
      'Next.js',
      'Jetpack Compose',
      'SQLite',
      'PostgreSQL',
      'MongoDB',
      'MySQL',
      'Redis',
      'Playwright',
    ],
  },
  {
    id: 'infra',
    title: 'infra / cloud',
    items: [
      'Linux',
      'Docker',
      'k3s',
      'systemd',
      'Tailscale',
      'Cloudflare Tunnels',
      'Proxmox',
      'Caddy',
      'AWS',
      'Azure',
      'GCP',
      'pfSense',
      'Cisco hardware',
    ],
  },
];

// The short list that floats in the 3D tag cloud next to the skill panels.
export const cloud = [
  'OSINT', 'ATT&CK', 'STIX 2.1', 'MISP', 'Tor', 'Nmap', 'Burp', 'Frida',
  'Python', 'Go', 'Kotlin', 'TypeScript', 'FastAPI', 'React', 'SQLite',
  'Docker', 'k3s', 'RAG', 'llama.cpp', 'PyTorch', 'MuJoCo', 'Linux',
];

// Primary language of the public repositories on github.com/sxi9 (Nov 2026).
// Repositories with no detected language are left out.
export const census = [
  ['Python', 14],
  ['JavaScript', 8],
  ['TypeScript', 7],
  ['Shell', 4],
  ['HTML', 3],
  ['Go', 1],
  ['Kotlin', 1],
];

// Add `href` to any entry to link its verification page.
export const certifications = [
  { name: 'Certified in Cybersecurity (CC)', by: 'ISC2' },
  { name: 'Fortinet Certified Associate in Cybersecurity', by: 'Fortinet' },
  { name: 'IBM Cybersecurity', by: 'IBM' },
  { name: 'Cyber Security & Ethical Hacking', by: 'Quantum Learning', when: 'Nov 2023' },
  { name: 'Data Science with Python', by: 'Simplilearn', when: 'May 2023' },
];

export const sections = [
  { id: 'top', label: 'surface', nav: null },
  { id: 'about', label: 'profile', nav: 'about' },
  { id: 'experience', label: 'ops log', nav: 'experience' },
  { id: 'projects', label: 'arsenal', nav: 'projects' },
  { id: 'archive', label: 'archive', nav: null },
  { id: 'skills', label: 'toolkit', nav: 'skills' },
  { id: 'blog', label: 'field notes', nav: 'blog' }, // only shown when posts/ has posts
  { id: 'contact', label: 'signal', nav: 'contact' },
];

// Colour themes. `ink`, `hot` and `cool` also drive the ASCII shader.
export const themes = {
  phosphor: { ink: '#3dff9a', hot: '#ff4d5e', cool: '#5ecbff', bg: '#020604' },
  amber: { ink: '#ffb52e', hot: '#ff5a3c', cool: '#ffe9a8', bg: '#070401' },
  ice: { ink: '#7fd8ff', hot: '#ff6b8b', cool: '#b9a6ff', bg: '#02050a' },
  ronin: { ink: '#ff5d73', hot: '#ffd166', cool: '#f6c6cf', bg: '#080203' },
  // locked: not offered until every hidden flag has been found
  ghost: { ink: '#d6ccff', hot: '#ff6ad5', cool: '#7df9ff', bg: '#06050c', locked: true },
};

export const HERO_BANNER = String.raw` ________  ___  ___      ___ ________
|\   ____\|\  \|\  \    /  /|\   __  \
\ \  \___|\ \  \ \  \  /  / | \  \|\  \
 \ \_____  \ \  \ \  \/  / / \ \   __  \
  \|____|\  \ \  \ \    / /   \ \  \ \  \
    ____\_\  \ \__\ \__/ /     \ \__\ \__\
   |\_________\|__|\|__|/       \|__|\|__|
   \|_________|`;
