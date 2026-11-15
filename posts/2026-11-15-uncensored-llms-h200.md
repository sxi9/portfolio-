---
title: "Abliterated GLM-5.3-Flash on an H200, and how threat actors use uncensored models"
date: 2026-11-15T18:00
kind: threat intel
summary: What I ran on rented H200s for authorized testing, what abliteration changes inside a model, and how attackers are using safety-removed open weights in 2026, with sources.
tags: [llm, threat-intel, ai-security, gpu]
figure: gpu
---

I have been running uncensored open-weight models on rented NVIDIA H200s for authorized penetration testing. The latest was an abliterated build of Z.ai's GLM-5.3-Flash, driven as a coding agent. This post covers that lab, what "abliterated" means at the level of the weights, and what public threat reporting says about how attackers use the same class of model.

Everything here ran on hardware I rented, against systems I own or am authorized to test. No prompts or model output from those sessions are published.

> **In short.** Abliteration removes a model's refusals for a few thousand dollars of compute and costs it almost no capability. Attackers use safety-removed models for phishing, malware scaffolding and agent-driven intrusion work, and they hijack other people's exposed model servers. With GLM-5.3, the open model underneath is now close to the frontier at exploit development.

## The lab

### Round one: a specialist and a generalist on one GPU

The first build is written up in my [H200 brief](https://github.com/sxi9/uncensored-llm) and powered [SamurAI](https://github.com/sxi9/samurai), a scanner for authorized web testing.

- **Hardware:** one NVIDIA H200 with 141 GB of memory, rented on NVIDIA Brev.
- **Serving:** vLLM failed on the instance's CUDA 13.0 and driver 580 stack. FlashAttention 3, the FlashInfer backend and eager mode all crashed. Ollama worked first time.
- **Models:** WhiteRabbitNeo 33B for security analysis (Q4_K_M, about 19 GB) and an abliterated Qwen2.5-72B-Instruct for report writing (Q4_K_M, about 47 GB). Together about 66 GB, with room to spare.

The finding I keep coming back to: a stock instruct model with a "you are allowed to answer this" system prompt still refused ordinary pentest questions. The refusal lives in the weights, so changing the behaviour means changing the weights.

### Round two: GLM-5.3-Flash Uncensored as an agent

GLM-5.3-Flash has 320 billion parameters, of which 18 billion are active for each token. It combines sparse and linear attention, is natively multimodal, and is released under the MIT license ([model card](https://huggingface.co/zai-org/GLM-5.3-Flash)). The full GLM-5.3 has 753 billion parameters and needs almost a terabyte of GPU memory at FP8 ([Include Security](https://blog.includesecurity.com/2026/10/abliterated-models-in-appsec-pentesting/)). Flash, once quantized, runs on a single H200 box.

I served a refusal-removed build of Flash from a rented H200 box and added it to OpenCode as a custom provider. OpenCode then drove it as a coding agent with shell and file-editing tools.

![OpenCode's model picker open over an agent session. Under the heading My Server, GLM-5.3 Flash Uncensored is selected; OpenCode's own Nemotron 3.5 Super VL Free is listed above it.](./opencode-glm-picker.webp "OpenCode with the self-hosted GLM-5.3 Flash Uncensored selected under the “My Server” provider, mid-session. The agent behind the menu is patching a numbered probe script.")

The box it ran on:

![btop on the GPU host: AMD EPYC CPU panel at idle, 141 GiB of RAM with 103 GiB cached, a 712 GiB root disk, network graphs, and a process list including llama-server, ollama, piper, ffmpeg, jupyter-lab, grafana, influxd, telegraf, two cloudflared processes, frpc, netbird and orbit.](./h200-btop.webp "btop on the GPU host during the run. The public IP is redacted.")

What the screenshot shows:

- **Serving:** llama.cpp's `llama-server` and Ollama were both running.
- **The rest of the lab:** a speech pipeline (Piper text-to-speech and ffmpeg), a Jupyter server and a few Python services.
- **Ways in:** two Cloudflare tunnels, an frp client and a NetBird mesh node.
- **Watching it:** Fleet's osquery agent (`orbit`) and a Telegraf, InfluxDB and Grafana stack.
- **Memory:** 141 GiB of system RAM, 103 GiB of it page cache.

Three ways into one GPU box are also three things to secure. Each tunnel needs the same authentication an open port would.

## What "abliterated" means

In 2024, Arditi and colleagues showed that refusal in open chat models is carried by a single direction in the model's internal activations ([arXiv:2406.11717](https://arxiv.org/abs/2406.11717)). Across 13 models, erasing that direction stopped the model refusing harmful instructions. Adding it made the model refuse harmless ones.

Abliteration applies that finding to the weights. The direction is estimated by comparing the model's activations on prompts it refuses with prompts it answers, and it is then projected out of the weight matrices. Nothing is retrained, and the edit is permanent: every copy of the edited weights behaves the same way, on any runtime.

Anthropic measured the effect on this exact model family ([Anthropic, September 2026](https://www.anthropic.com/research/glm-5-3-and-the-spread-of-advanced-cyber-capabilities)):

| | GLM-5.3 | GLM-5.3-Flash |
| --- | --- | --- |
| Mean refusal rate, original | 95% | 95% |
| Mean refusal rate, abliterated | 6% | 14% |
| Compute to abliterate | about 2,200 GPU hours (about $4,400) | about 600 GPU hours |

The refusal rates are averaged over three harmful-request benchmarks: JailbreakBench, HarmBench and StrongREJECT. Capability barely moved. GPQA-Diamond scores were identical, and the abliterated GLM-5.3 scored a few percent lower on the subset of CyberGym that was tested.

## How threat actors are using these models

### The supply is large, and it persists

A 10a Labs study counted 3,471 original uncensored models on Hugging Face between January 2024 and March 2026 ([arXiv:2609.05241](https://arxiv.org/abs/2609.05241)). Each was repackaged 2.4 times on average, and three actors produced 52% of the 8,164 compressed redistributions. Once a model is quantized and mirrored to other accounts and registries such as Ollama, removing the original does not remove the model. Of 1,643 GitHub applications the authors found integrating uncensored models, 25% were explicitly malicious.

Getting one takes a single command. Cisco Talos pointed out in 2025 that Ollama ships uncensored models in its own library ([Talos](https://blog.talosintelligence.com/cybercriminal-abuse-of-large-language-models)).

### Packaged criminal LLMs sell phishing first

Unit 42 tested two current products in November 2025 ([Unit 42](https://unit42.paloaltonetworks.com/dilemma-of-ai-malicious-llms/)):

- **WormGPT 4** costs $50 a month, $175 a year or $220 for life, and its source code is for sale too. Its Telegram channel had more than 500 subscribers. Asked for a script to encrypt PDF files on Windows, it wrote a PowerShell script using AES-256 and a ransom note with a 72-hour deadline.
- **KawaiiGPT** is free on GitHub and took Unit 42 under five minutes to set up. Its output was "simple and rudimentary", but it covered phishing lures, a lateral-movement script and exfiltration over email.

Google's threat intelligence group saw the same emphasis across the underground: almost every notable AI tool advertised on forums sold itself on phishing support ([GTIG, November 2025](https://cloud.google.com/blog/topics/threat-intelligence/threat-actor-usage-of-ai-tools)). Buyers get scammed as well. Talos found that the seller of FraudGPT had no working product.

### A ransomware operator running the same stack

In September 2026 SOCRadar found an exposed staging server holding the live workspace of an operator of the n0n ransomware ([SOCRadar, November 2026](https://socradar.io/blog/dark-web-profile-n0n-ransomware)). The operator worked in OpenCode, configured with 154 model entries across seven providers, including "uncensored" and "abliterated" models and a self-hosted Qwen 27B on a rented GPU server. Key-status checks showed more than $7,216 of API spending by October 22, 2026, mostly on safety-removed models. The agent ran on the same box as the C2 panel, behind Cloudflare, and "produced hundreds of numbered, iteratively patched scripts". SOCRadar saw no fully autonomous attack system: a human directed the operation, and the AI supported it.

That is close to my lab: the same agent harness, safety-removed weights, a rented GPU and Cloudflare in front. The difference is authorization and targets. It also shows what an agent leaves behind. My own session was patching `probe9` when I took the screenshot above. Expect directories of numbered, patched scripts on a compromised staging box.

### Malware that asks a model what to do

In June 2025 the Russian state actor APT28 used new malware against Ukraine that Google tracks as PROMPTSTEAL and CERT-UA reported as LAMEHUG ([GTIG](https://cloud.google.com/blog/topics/threat-intelligence/threat-actor-usage-of-ai-tools)). It carried no hard-coded commands. It asked Qwen2.5-Coder-32B-Instruct, through Hugging Face's API and probably with stolen tokens, to write Windows commands for collecting documents and system information, then ran them blindly. Google calls it the first malware it has seen querying an LLM in live operations. A second sample, PROMPTFLUX, asked Gemini to rewrite its own VBScript to evade signatures, but was still experimental.

Both depended on someone else's API, and that is how they were found.

**My assessment:** with capable open weights, the next version of this needs no third-party API at all, and the provider-side visibility that produced these reports goes with it.

### Hijacking other people's models

Attackers do not always run their own GPUs. SentinelLABS and Censys found about 175,000 Ollama hosts reachable from the internet across 130 countries ([The Hacker News, January 2026](https://thehackernews.com/2026/01/researchers-find-175000-publicly.html)). More than 48% advertised tool calling, and 201 were running uncensored prompt templates. Ollama listens only on localhost by default, so each of those exposures is a configuration change someone made.

Pillar Security's honeypots recorded 35,000 attack sessions between December 2025 and January 2026 in a campaign it named Operation Bizarre Bazaar ([Pillar Security](https://www.pillar.security/blog/operation-bizarre-bazaar-first-attributed-llmjacking-campaign-with-commercial-marketplace-monetization)). The targets were unauthenticated Ollama on port 11434 and OpenAI-compatible APIs on port 8000. The stolen access was resold through a marketplace at 40 to 60% below retail prices.

### Capability caught up this year

Early in 2026, the honest answer was that local models were not good enough. Check Point's review of underground forums concluded that "local models still underperform, finetuning remains aspirational, and commercial models remain the productive choice even for actors with explicit malicious intent" ([Check Point Research, March 2026](https://research.checkpoint.com/2026/ai-threat-landscape-digest-january-february-2026/)).

GLM-5.3 changed that. In Anthropic's tests it developed end-to-end exploits in 50 of 410 attempts on ExploitBench, against 56 of 410 for Claude Mythos Preview. CAISI estimates it trails the US frontier by about four months on an aggregate of cyber benchmarks. In a simulated attack setting, its safeguards gave way 64% of the time to a deceptive cover story, 92% of the time to prefilled reasoning and 100% of the time once abliterated, over 50 samples per condition. Anthropic calls the release "a meaningful step change in the cyber capabilities available to attackers".

Independent testing is more measured. Include Security ran base and abliterated GLM-5.3 through OpenCode on authorized source-code and web testing ([Include Security, October 2026](https://blog.includesecurity.com/2026/10/abliterated-models-in-appsec-pentesting/)). The base model did not refuse any of their requests. The abliterated model's exploits worked first time in four of five cases, against two of five for the base model, and it pushed into post-exploitation without being asked. It also found 26% fewer issues in source review, and the authors warn that it may take destructive or out-of-scope actions.

**My assessment:** for authorized testing, abliteration buys little on GLM-5.3, because the base model already engages, and it adds risk. For an attacker it removes the last remaining check, on a model that is now close to the frontier.

## What defenders can do

- **Treat inference endpoints as servers.** Keep Ollama on localhost. Put authentication and rate limits in front of anything that must be reachable, and keep MCP servers off the internet entirely, as Pillar recommends. Scan your own ranges for ports 11434, 8000 and 8080.
- **Watch for software that talks to model APIs.** PROMPTSTEAL called Hugging Face's inference API from victim machines. Alert when servers or endpoints reach model APIs, or a local port 11434, and nothing on them should.
- **Stop using writing quality as a phishing signal.** Nearly every criminal AI product leads with phishing. Rely on sender authentication and out-of-band checks for payment changes.
- **Treat safety-removed weights as untrusted software.** Pickle-based model files can run code when they are loaded, and Talos notes that malware has already been found in models on Hugging Face. Prefer safetensors or GGUF, pin file hashes, and run third-party builds in isolation.
- **Collect agent workspaces during incident response.** A configuration like the n0n operator's lists the model providers, API keys and spending, and the numbered script directories record what the agent tried.

## A note on running these models

Running uncensored models is legal and useful for testers. Include Security's warning applies to my lab as much as to anyone's: an agent that never refuses also never pushes back on going out of scope. Scope gates, sandboxing and logging matter more with these models.

## Sources

- Arditi et al., [Refusal in Language Models Is Mediated by a Single Direction](https://arxiv.org/abs/2406.11717), arXiv:2406.11717, June 2024.
- Anthropic, [GLM-5.3 and the spread of advanced cyber capabilities](https://www.anthropic.com/research/glm-5-3-and-the-spread-of-advanced-cyber-capabilities), 29 September 2026.
- Include Security, [Abliterated Models in Appsec Pentesting](https://blog.includesecurity.com/2026/10/abliterated-models-in-appsec-pentesting/), 30 October 2026.
- Z.ai, [GLM-5.3-Flash model card](https://huggingface.co/zai-org/GLM-5.3-Flash), Hugging Face.
- 10a Labs, [Uncensored Open-weight Models: Redistribution as the Persistence Layer](https://arxiv.org/abs/2609.05241), arXiv:2609.05241, 4 September 2026.
- Check Point Research, [AI Threat Landscape Digest, January–February 2026](https://research.checkpoint.com/2026/ai-threat-landscape-digest-january-february-2026/), 29 March 2026.
- SOCRadar, [Dark Web Profile: n0n Ransomware](https://socradar.io/blog/dark-web-profile-n0n-ransomware), 12 November 2026.
- Unit 42, [research on the malicious LLMs WormGPT 4 and KawaiiGPT](https://unit42.paloaltonetworks.com/dilemma-of-ai-malicious-llms/), 25 November 2025.
- Google Threat Intelligence Group, [AI Threat Tracker: Advances in Threat Actor Usage of AI Tools](https://cloud.google.com/blog/topics/threat-intelligence/threat-actor-usage-of-ai-tools), 5 November 2025.
- Cisco Talos, [Cybercriminal abuse of large language models](https://blog.talosintelligence.com/cybercriminal-abuse-of-large-language-models), 25 June 2025.
- The Hacker News, [Researchers Find 175,000 Publicly Exposed Ollama AI Servers Across 130 Countries](https://thehackernews.com/2026/01/researchers-find-175000-publicly.html) (SentinelLABS and Censys), 29 January 2026.
- Pillar Security, [Operation Bizarre Bazaar](https://www.pillar.security/blog/operation-bizarre-bazaar-first-attributed-llmjacking-campaign-with-commercial-marketplace-monetization), 28 January 2026.
