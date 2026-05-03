<div align="center">

<img src="public/logo.png" alt="rocCLAW" width="280" />

# rocCLAW

**Run AI agents on your hardware. Use cloud only when you need it.**

The operator dashboard for [OpenClaw](https://github.com/openclaw) — manage a hybrid fleet of local and cloud agents from any browser. Your GPUs stay busy, your cloud tokens go only where they matter.

[![Node.js](https://img.shields.io/badge/Node.js-20.9%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![GitHub Release](https://img.shields.io/github/v/release/simoncatbot/rocclaw?include_prereleases&logo=github)](https://github.com/simoncatbot/rocclaw/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

<div align="center">
<img src="public/screenshots/bot-family.png" alt="A hybrid fleet of AI agents — local and cloud, managed from one dashboard" width="680" />
</div>

---

## Table of Contents

- [Why rocCLAW?](#why-rocclaw)
- [Local + Cloud Hybrid Fleet](#-local--cloud-hybrid-fleet)
- [Quick Start](#quick-start)
- [What You Can Do](#what-you-can-do)
- [Use Cases](#-use-cases)
- [Monitor Your Hardware](#-monitor-your-hardware)
- [Built-in Skills](#-built-in-skills)
- [Dashboard at a Glance](#-dashboard-at-a-glance)
- [Installation](#installation)
- [Setup Guides](#setup-guides)
- [Tested Configurations](#tested-configurations)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)

---

## Why rocCLAW?

Most AI tools wait for you to type a prompt, return a response, and stop. An agent is different — it takes an objective, breaks it into steps, executes across tools and systems, and keeps running on a schedule without manual intervention. OpenClaw agents can monitor log files, run CI pipelines, triage issues, sync data between services, and operate continuously on schedules you define.

The problem: running agents around the clock on cloud models gets expensive. If an agent is checking system health every five minutes or processing a queue of routine tasks, those tokens add up — especially when open-weight models running on your own hardware can handle the same work at zero marginal cost.

**rocCLAW lets you build a hybrid agent fleet.** Local models handle the daily workload at zero token cost. Cloud models step in only for the tasks that need them — complex reasoning, multi-step planning, deep context. You control the split per-agent, and the dashboard shows you exactly where every token goes.

Point rocCLAW at any OpenClaw gateway — on your desk, across the network, or SSH-tunneled from a remote server — and your entire fleet is right there. Chat, configure, schedule, monitor. No SSH, no terminal juggling, no guessing what your agents are doing.

```
Browser (React)  <── HTTP / SSE ──>  rocCLAW Server  <── WebSocket ──>  OpenClaw Gateway
                                     (Next.js + SQLite)                  (your hardware)
```

Your browser never talks to the gateway directly. rocCLAW proxies everything securely — authentication, event replay, rate limiting — and your tokens never leave the server.

---

## 🏗️ Local + Cloud Hybrid Fleet

Not every task needs a cloud model. Run local LLMs for the bulk of the work and reserve cloud tokens for what actually needs them.

<!-- TODO: Add screenshot showing the token usage dashboard with per-agent/per-model breakdown -->

**Local agents** run on your hardware with open-weight models via [Ollama](https://ollama.com), vLLM, or any local provider. They handle the predictable workload — log monitoring, scheduled reports, file processing, data syncing, health checks. Zero token cost, and they retain memory across sessions so they improve without burning cloud credits.

**Cloud agents** use high-capability models (Claude, GPT, Gemini) for the hard stuff — complex reasoning, multi-step planning, code generation that needs deep context. You only pay when you need the horsepower.

**Per-agent model selection** — Assign each agent exactly the model it needs. Your cron agent runs locally on Kimi K2. Your planning agent calls Claude. Pair it with the right [built-in skills](#-built-in-skills) — Plan First and Agent Debate for cloud agents, ReAct Loop and GitHub for local. Mix and match.

**Token usage dashboards** — See spend per agent, per model, in real time. Know exactly which agents are consuming cloud tokens and whether they should be. No surprise bills.

**The result:** maximum hardware utilization, minimum cloud spend. Your local GPUs run warm instead of idle. Your cloud tokens go to tasks that actually need them.

---

## Quick Start

**Prerequisites:** Node.js 20.9+ and a running OpenClaw gateway.

```bash
git clone https://github.com/simonCatBot/rocclaw.git
cd rocclaw
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), enter your gateway URL (`ws://127.0.0.1:18789`), paste your token, and click **Save Settings**.

```bash
openclaw config get gateway.auth.token   # Get your token
```

Other install options: [npm](#installation) · [pre-built package](#installation) · [full install guide](docs/INSTALL.md) · [setup guides →](#setup-guides)

---

## What You Can Do

<!-- TODO: Add screenshot showing the chat interface with thinking traces -->

**Chat with any agent** — Real-time streaming with thinking traces, tool call visibility, and inline exec approvals. Approve or deny shell commands right in the chat — allow-once, allow-always, or deny.

<!-- TODO: Add screenshot showing the tasks/cron dashboard -->

**Put agents on autopilot** — Schedule recurring jobs with drag-and-drop — run every 5 minutes, daily at 9am, or any cron expression. Agents retain context across sessions and act on heartbeat schedules independently. A local agent running health checks or log analysis costs nothing per invocation.

<!-- TODO: Add screenshot showing the agent configuration panel -->

**Configure without SSH** — Edit any agent's personality files (SOUL, IDENTITY, USER, AGENTS, TOOLS, HEARTBEAT, MEMORY) and permissions directly in the browser. Set per-agent model selection to route work to local or cloud.

**Access from anywhere** — Connect to any gateway via LAN, Tailscale, or SSH tunnel. Your gateway stays secure; you stay mobile.

**Stay in control** — Three-layer security: network policy, cookie-based auth, and a method allowlist on the gateway adapter. Ed25519 device identity for cryptographic authentication. Per-agent controls for exec mode, sandbox isolation, workspace access, and tool profiles. See [Permissions & Sandboxing](docs/permissions-sandboxing.md) for details.

---

## 💡 Use Cases

A hybrid fleet makes sense anywhere you have repetitive work alongside tasks that need deeper reasoning.

- **DevOps & infrastructure** — A local agent monitors logs, restarts failed services, and runs nightly backups on a cron schedule. A cloud agent investigates complex outages that require cross-referencing multiple systems and writing incident reports.
- **Software development** — Local agents handle CI runs, lint fixes, dependency updates, and issue triage. Cloud agents take on architecture planning, complex refactors, and code review that requires deep context across large codebases.
- **Data pipelines** — Local agents run ETL jobs, validate incoming data, and generate daily summary reports. Cloud agents analyze anomalies, build dashboards from unstructured data, and write the queries that require multi-step reasoning.
- **System administration** — Local agents check disk usage, rotate credentials, sync configurations across servers. Cloud agents draft migration plans, debug networking issues, and handle tasks that require understanding the full topology.
- **Research & analysis** — Local agents collect data, scrape sources on a schedule, and organize findings into structured formats. Cloud agents synthesize across sources, identify patterns, and produce the final analysis.

---

## 📊 Monitor Your Hardware

<!-- TODO: Add screenshot showing system metrics and graph view -->

When your agents run on local hardware, you need to see how that hardware is doing. rocCLAW provides live system metrics so you know whether your GPUs are earning their keep or sitting idle.

**Live gauges** — CPU, memory, GPU utilization, VRAM, disk, and network. Works for local machines **and** remote gateways — "Remote" vs "Local" labels are applied automatically.

**Time-series graphs** — Track resource usage over 5m, 10m, or 30m windows. Spot bottlenecks, see when your GPU is maxed out, and decide whether a task should move to cloud.

**AMD GPU support** — ROCm-first detection with automatic sysfs fallback. Full metrics for RDNA 3 / 3.5 GPUs including VRAM, temperature, power draw, and clock speeds. See [tested GPU configurations](#gpu-configurations) below.

**Token usage tracking** — Per-agent and per-model breakdowns. See exactly which agents are consuming cloud tokens and how much each model costs you.

---

## 🧠 Built-in Skills

<div align="center">
<table>
<tr>
<td align="center"><img src="public/screenshots/bot-before-skills.png" alt="Agent before skills — basic tools" width="300" /><br/><em>Before: basic tools</em></td>
<td align="center"><strong>+ Skills</strong><br/>→</td>
<td align="center"><img src="public/screenshots/bot-after-skills.png" alt="Agent after skills — rocket scientist" width="300" /><br/><em>After: rocket scientist</em></td>
</tr>
</table>
</div>

Same agent, same hardware. The right skills change what it can do.

rocCLAW ships with 12 featured skills you can assign per-agent directly from the dashboard — no config files, no CLI. Give your local agent the skills it needs for routine work, and equip your cloud agent for complex reasoning.

| Category | Skill | What it does |
|----------|-------|-------------|
| **Agent Behavior** | Proactive Agent | Anticipates needs, self-schedules crons, maintains a working buffer |
| | Self-Improving Agent | Self-reflection, self-criticism, self-learning — evaluates and improves permanently |
| **Problem Solving** | Plan First | Generates a detailed plan before execution (Plan-and-Solve research) |
| | ReAct Loop | Interleaves reasoning with actions, observing results to inform next steps |
| **Quality & Accuracy** | Agent Debate | Multiple agents debate answers to reduce hallucinations |
| | Self-Critique | Structured self-review against quality criteria before finalizing |
| **Development** | Team Code | Coordinate multiple agents as a dev team working in parallel |
| | Skill Creator | Build new skills from scratch, validated against the AgentSkills spec |
| | GitHub | Issues, PRs, CI runs, code review via `gh` CLI |
| | Git Workflows | Rebasing, bisecting, worktrees, reflog recovery, merge conflicts |
| **Multi-Agent** | Agent Team Orchestration | Defined roles, task lifecycles, handoff protocols, review workflows |
| | Multi-Agent Collaboration | Intent recognition, intelligent routing, reflection across agent teams |

Skills are **per-agent** — assign different combinations to each agent to match its role in your fleet. Need more? Browse and install additional skills from [ClawHub](https://clawhub.ai) — integrated directly into rocCLAW with one-click install.

---

## 📋 Dashboard at a Glance

<!-- TODO: Add screenshot showing the full dashboard with multiple tabs open -->

9 toggleable tabs, shown side-by-side:

| Tab | What it does |
|-----|-------------|
| **Agents** | Fleet grid with search, filter, status indicators, and avatars |
| **Chat** | Real-time streaming chat with thinking traces and tool calls |
| **Skills** | Assign built-in skills per-agent and manage skill configurations |
| **Connection** | Gateway setup with guided install for Local, Client, Cloud, and Remote |
| **System** | Live CPU, GPU (AMD ROCm + fallback), memory, disk, and network gauges |
| **Graph** | Time-series charts with 5m / 10m / 30m ranges |
| **Tasks** | Cron job kanban board with drag-and-drop scheduling |
| **Tokens** | Per-agent and per-model token usage tracking |
| **Settings** | Appearance, gateway, model, and agent configuration |

---

## Installation

### npm (recommended)

```bash
npm install -g @simoncatbot/rocclaw
rocclaw
```

### Pre-built package

Download from [GitHub Releases](https://github.com/simoncatbot/rocclaw/releases):

```bash
# Linux/macOS
curl -L -o rocclaw.tar.gz https://github.com/simoncatbot/rocclaw/releases/latest/download/rocclaw-linux-x64.tar.gz
tar -xzf rocclaw.tar.gz && cd rocclaw
npm ci --include=dev && node server/index.js
```

### From source

```bash
git clone https://github.com/simonCatBot/rocclaw.git
cd rocclaw
npm install
npm run dev
```

For detailed Ubuntu setup with SSH tunnels, Tailscale, and environment variables, see the [full install guide](docs/INSTALL.md).

---

## Setup Guides

<details>
<summary><strong>Same-Machine Setup</strong></summary>

For running OpenClaw and rocCLAW on the same machine:

```bash
# Configure the gateway
openclaw config set gateway.bind lan
openclaw config set gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback true
openclaw config set gateway.controlUi.dangerouslyDisableDeviceAuth true
openclaw gateway restart

# Get your token
openclaw config get gateway.auth.token
```

Start with `npm run dev`, open [http://localhost:3000](http://localhost:3000), enter the URL and token, then click **Save Settings**.

> **Note:** The `dangerously*` flags relax security checks. Only use on trusted local networks.

</details>

<details>
<summary><strong>Remote Gateway via Tailscale</strong></summary>

On the gateway machine:

```bash
ip addr show tailscale0 | grep inet  # Find your Tailscale IP (100.x.x.x)
openclaw config set gateway.bind 100.x.x.x
openclaw gateway restart
```

On your local machine, start rocCLAW and enter `wss://my-gateway.ts.net` as the gateway URL. Use `wss://` (WebSocket Secure) when connecting via Tailscale.

</details>

<details>
<summary><strong>Remote Gateway via SSH Tunnel</strong></summary>

```bash
ssh -L 18789:127.0.0.1:18789 user@gateway-host
```

Keep the terminal open, then connect rocCLAW to `ws://localhost:18789`.

</details>

---

## Agent Personality Files

Every agent has 7 personality files that define its behavior — all editable from the dashboard:

`IDENTITY.md` → name, creature type, vibe, emoji, avatar · `SOUL.md` → core truths, boundaries, personality · `USER.md` → context about you (name, pronouns, timezone) · `AGENTS.md` → operating rules and workflows · `TOOLS.md` → tool usage guidelines · `HEARTBEAT.md` → periodic check configuration · `MEMORY.md` → persistent memory and learned context

---

## Tested Configurations

### Operating Systems

| OS | Version | Status |
|----|---------|--------|
| **Ubuntu** | 24.04 LTS (Noble Numbat) | ✅ Tested |
| **Ubuntu** | 22.04 LTS (Jammy Jellyfish) | ✅ Tested |
| Linux (generic) | Kernel 6.x+ | ✅ GPU fallback via sysfs |

### GPU Configurations

rocCLAW supports AMD GPU monitoring with ROCm-first detection and a sysfs fallback for systems without ROCm installed.

| APU / GPU | Architecture | Detection | Notes |
|-----------|-------------|-----------|-------|
| **Ryzen AI MAX+ 395** (Strix Halo) | RDNA 3.5 (gfx1151) | ROCm + device ID | 40 CU variant auto-detected as 8060S; 32 CU as 8050S |
| **Ryzen AI 300 series** (Strix Point) | RDNA 3.5 (gfx1150) | ROCm + device ID | 16 CU → 890M, 12 CU → 880M; handles rocm-smi index mismatches |
| **Radeon RX 7900 XTX** | RDNA 3 (gfx1100) | ROCm | Full VRAM, temp, power, and clock metrics |
| **Other AMD GPUs** | Varies | ROCm or sysfs fallback | `lspci` + DRM sysfs on Linux when ROCm is unavailable |

ROCm is checked first (`rocminfo` + `rocm-smi`). If unavailable, rocCLAW falls back to `lspci` + DRM sysfs for basic GPU info — no ROCm install required.

---

## Development

```bash
npm run dev          # Dev server with hot reload
npm run build        # Production build
npm run start        # Build + start production server
npm run typecheck    # TypeScript strict checking
npm run lint         # ESLint
npm run test         # Unit tests (Vitest)
npm run e2e          # E2E tests (Playwright)
```

Run all checks before submitting:

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

See [Contributing](docs/CONTRIBUTING.md) for full development setup.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Control ui requires device identity` | Run `openclaw config set gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback true && openclaw config set gateway.controlUi.dangerouslyDisableDeviceAuth true && openclaw gateway restart` |
| Connection test passes but dashboard won't load | Use `127.0.0.1` or `localhost` in the gateway URL, not a LAN IP |
| SQLite errors on startup | Run `npm run dev` (auto-repairs native deps) or `npx scripts/verify-native-runtime.mjs --repair` |
| Agent won't respond (shows offline) | Try "New Session" in the chat header |
| 401 errors | Regenerate token: `openclaw config get gateway.auth.token` |
| GPU not detected | ROCm is checked first (`rocminfo` + `rocm-smi`); if unavailable, falls back to `lspci` + DRM sysfs on Linux |

---

## Documentation

| Document | Description |
|----------|-------------|
| [Install Guide](docs/INSTALL.md) | Step-by-step Ubuntu setup with SSH tunnels, Tailscale, env vars |
| [Architecture](docs/ARCHITECTURE.md) | Technical deep-dive: data flow, API routes, durability model, security |
| [Contributing](docs/CONTRIBUTING.md) | Development setup, testing, commit conventions, PR guidelines |
| [Permissions & Sandboxing](docs/permissions-sandboxing.md) | Security model, sandbox modes, exec approvals, tool policies |
| [Changelog](docs/CHANGELOG.md) | Release history |

---

<div align="center">

[Documentation](docs/) &middot; [Issues](../../issues) &middot; [Discord](https://discord.gg/EFkFHbZw)

</div>

---

> **Disclaimer:** rocCLAW is a community project and is not affiliated with, endorsed by, or an official product of AMD.

**Acknowledgments:** Agents built using [Ollama](https://ollama.com) models — [Kimi K2](https://ollama.com/library/kimi-k2), [GLM 5.1](https://ollama.com/library/glm4), and [Claude](https://www.anthropic.com/claude).
