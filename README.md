# rocCLAW

**Focused operator studio for OpenClaw.** A clean, tabbed dashboard to connect to your gateway, manage agents, run chats, monitor system metrics, configure cron jobs, and handle exec approvals — all from one interface.

[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?logo=discord&logoColor=white)](https://discord.gg/EFkFHbZw)
[![Node](https://img.shields.io/badge/Node.js-20.9%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)

---

## What it looks like

```
┌─────────────────────────────────────────────────────────────┐
│  ⬡ rocCLAW          [● Connected]           [⚙ Settings]   │
├───────────────┬─────────────────────────────────────────────┤
│               │  [Agents] [Chat] [System] [Tokens] [⚙]       │
│  ● Kapu       │  ┌─────────────────────────────────────────┐ │
│    running    │  │  Kapu                            [⫶][✎]│ │
│               │  │  Model: claude-3-5-sonnet  Thinking: low│ │
│  ● Simon      │  ├─────────────────────────────────────────┤ │
│    idle       │  │                                          │ │
│               │  │  Hi Kapu, how's it going?               │ │
│  ○ Debbie     │  │                                          │ │
│    offline    │  │  → Running...                            │ │
│               │  │                                          │ │
│  [+ New Agent]│  │  ────────────────────────────────────    │ │
│               │  │  [Message Kapu...]              [Send ➤]│ │
│  Filter: [All]│  └─────────────────────────────────────────┘ │
└───────────────┴─────────────────────────────────────────────┘
```

---

## How it works

rocCLAW is a **server-side dashboard** — it never exposes a direct gateway WebSocket to the browser.

```
Browser  ──HTTP/SSE──►  rocCLAW Server  ──WebSocket──►  OpenClaw Gateway
                        (Next.js + ws)                    (your AI runtime)
                        • owns gateway connection
                        • stores SQLite outbox
                        • redacts tokens from browser
                        • enforces rate limits
```

All browser↔gateway traffic flows through the server. The browser subscribes to a server-owned SSE stream (`/api/runtime/stream`) and sends intents through HTTP routes (`/api/intents/*`). The server maintains a **SQLite outbox** with an event projection store — events are written to the outbox, deduplicated, and replayed to new browser connections on demand.

---

## Key concepts

| Term | What it means in rocCLAW |
|------|--------------------------|
| **Gateway** | The OpenClaw WebSocket server that runs your agents. rocCLAW connects to it, it doesn't run it. |
| **Agent** | A named AI assistant with its own identity, workspace directory, personality files, and session history. Multiple agents can run concurrently. |
| **Session** | A running instance of an agent. The main session is the persistent conversation; you can start new sessions to get a fresh context. |
| **Intent** | An HTTP call from the browser to rocCLAW's server, which translates it into a gateway WebSocket message (e.g., sending a chat message, creating an agent). |
| **Outbox** | rocCLAW's SQLite event store. Every gateway event is written here so the browser can replay events when it reconnects. |

---

## Features

### Agents

Create, rename, and delete agents. Each agent has:

- **Identity** — A unique name displayed in the sidebar. Personality files (`SOUL.md`, `AGENTS.md`, `USER.md`, `IDENTITY.md`) live in the agent's workspace on the gateway host.
- **Avatar** — Auto-generated from the agent ID via [Multiavatar](https://github.com/multiavatar/Multiavatar). Shuffle to regenerate.
- **Model & thinking level** — Per-session overrides for model choice and thinking depth.
- **Permissions** — Sandbox mode, workspace access, tools profile, and per-tool allow/deny lists. See [Permissions & Sandboxing](docs/permissions-sandboxing.md) for the full model.

### Chat

Real-time messaging via SSE streaming. Chat header controls:

- **New session** — Starts a fresh conversation context for the agent.
- **Model picker** — Override the default model for this session.
- **Thinking level** — `off`, `low`, `medium`, `high`. Controls how much internal reasoning the model shows.
- **Tool calls** — Toggle visibility of tool-use traces in the transcript.
- **Thinking traces** — Toggle visibility of the model's internal reasoning steps.
- **Stop run** — Halt the current agent run.

### System Metrics

Live gauges for CPU, memory, GPU, disk, and network. Data comes from the machine running the rocCLAW server (not the gateway host, unless they're the same machine).

### Cron Jobs

Schedule agent runs on a cron expression. The flow is: **template → task → schedule → review**. Schedules survive gateway restarts and can be run immediately or on a timer.

### Exec Approvals

When an agent tries to run a shell command, rocCLAW shows an approval card in chat:

- **Allow once** — Approves this exact command for this run only.
- **Allow always** — Adds the command pattern to the agent's permanent allowlist.
- **Deny** — Blocks this command this time.

Approvals are enforced by the gateway, not by rocCLAW — they persist even if rocCLAW is offline.

### Token Usage

Per-agent token consumption dashboard. Tracks input/output token counts per session.

---

## Prerequisites

- **Node.js ≥ 20.9.0** (with npm ≥ 10.x)
- **OpenClaw Gateway** running somewhere reachable from rocCLAW
- **OpenClaw auth token** — get it with `openclaw config get gateway.auth.token`

> [!NOTE]
> rocCLAW is a UI-only dashboard. It does not build or run the OpenClaw gateway. It reads your existing `~/.openclaw/openclaw.json` and communicates with the gateway over its WebSocket API. If you want to work on the gateway itself, see [openclaw/openclaw](https://github.com/openclaw/openclaw).

---

## Quick start

```bash
git clone https://github.com/simonCatBot/rocclaw.git
cd rocclaw
npm install

# Verify native dependencies (better-sqlite3). Runs automatically before
# npm run dev — but run manually if you see SQLite errors:
npm run verify:native-runtime:repair

npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then:

1. Enter your **Upstream URL** (`ws://localhost:18789` for a local gateway)
2. Enter your **Gateway token** (`openclaw config get gateway.auth.token`)
3. Click **Connect**

Your agents will load in the sidebar. Click one to open chat.

---

## Gateway URL reference

The **Upstream URL** is the WebSocket address of your OpenClaw Gateway — not of rocCLAW. It tells rocCLAW where to find the gateway.

| Gateway location | Upstream URL |
|-----------------|-------------|
| Same machine (default) | `ws://localhost:18789` |
| Same machine, custom port | `ws://localhost:<port>` |
| Tailscale tailnet | `wss://<gateway-host>.ts.net` |
| SSH tunnel (see below) | `ws://localhost:18789` |
| Cloud VM with TLS | `wss://<vm-ip-or-domain>` |

> [!TIP]
> Use `ws://` for plain HTTP, `wss://` for TLS. Mixing these up is the most common cause of `EPROTO` connection errors.

### Finding your gateway port

```bash
openclaw config get gateway.port
```

### Using Tailscale

Both machines need to be on the same Tailscale tailnet. On the gateway machine, make sure OpenClaw is bound to the Tailscale interface:

```bash
openclaw config get gateway.bind
```

Set it to your Tailscale IP (e.g. `100.x.x.x`) or hostname (e.g. `my-server.ts.net`), then restart the gateway. Then use `wss://my-server.ts.net` as the Upstream URL from rocCLAW.

### Using an SSH tunnel

If Tailscale isn't available, tunnel the gateway port to your local machine:

```bash
# On your laptop — tunnels remote port 18789 to your localhost
ssh -L 18789:127.0.0.1:18789 user@gateway-host
```

Keep the tunnel running, then connect rocCLAW to `ws://localhost:18789`.

---

## Configuration

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port rocCLAW listens on |
| `OPENCLAW_STATE_DIR` | `~/.openclaw` | OpenClaw config directory (used to auto-detect gateway URL/token) |
| `STUDIO_ACCESS_TOKEN` | _(none)_ | Require a bearer token to access the Studio UI (required when binding to a public interface) |
| `OPENCLAW_SKIP_NATIVE_RUNTIME_VERIFY` | _(none)_ | Set to `1` to skip the `better-sqlite3` native dep check (not recommended) |

### File locations

| What | Where |
|------|-------|
| Gateway config | `~/.openclaw/openclaw.json` |
| Studio settings | `~/.openclaw/rocclaw/settings.json` |
| Runtime event database | `~/.openclaw/rocclaw/runtime.db` |
| Exec approvals policy | `~/.openclaw/exec-approvals.json` |

---

## Permissions at a glance

rocCLAW exposes four layers of agent control. For the full model, see [Permissions & Sandboxing](docs/permissions-sandboxing.md).

| Setting | Options | What it controls |
|---------|---------|-----------------|
| **Command mode** | Off / Ask / Auto | Whether exec commands require user approval, are allowed silently, or are disabled |
| **Sandbox mode** | Off / Non-main / All | Whether sessions run inside a sandbox; `non-main` sandboxes everything except the main session |
| **Workspace access** | None / Read-only / Read-write | What the agent's sandbox can see of its workspace directory |
| **Tools profile** | Minimal / Coding / Messaging / Full | Which tool groups are available (runtime, web, file access) |

> [!WARNING]
> **Workspace access `Read-only` does more than it sounds.** When set to `ro`, OpenClaw also **disables** the agent's `write`, `edit`, and `apply_patch` tools inside sandboxed sessions — even if those tools are nominally allowed by the tools profile. See the [Permissions doc](docs/permissions-sandboxing.md#workspace-access-sandboxworkspaceaccess) for details.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (auto-repairs native deps) |
| `npm run dev:turbo` | Start with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checker |
| `npm run test` | Run unit tests (Vitest, `tests/unit/**/*.test.ts`) |
| `npm run e2e` | Run Playwright end-to-end tests (requires `npx playwright install`) |
| `npm run verify:native-runtime:repair` | Rebuild `better-sqlite3` for your Node version |
| `npm run cleanup:ux-artifacts` | Clear UX audit artifacts before committing |

---

## Documentation

| Doc | What it covers |
|-----|---------------|
| [UI Guide](docs/ui-guide.md) | Connection flow, agent surfaces, chat, settings tabs (Personality, Capabilities, Automations, Advanced), agent creation defaults |
| [Chat Streaming](docs/pi-chat-streaming.md) | Server-owned SSE transport, event outbox, replay/resume, history backfill, degraded reads |
| [Permissions & Sandboxing](docs/permissions-sandboxing.md) | Full model: sandbox modes, workspace access, tools profiles, per-tool allow/deny, exec approvals, sandbox tool policy, debugging checklist |
| [Color System](docs/color-system.md) | Design tokens and Tailwind CSS variables |
| [Architecture](ARCHITECTURE.md) | Full technical architecture, runtime durability model, history model, removed legacy surfaces |

---

## Troubleshooting

### "Connect" fails

1. Verify your gateway is running: `openclaw status`
2. Check the URL uses `ws://` (no TLS) or `wss://` (TLS) matching your gateway's configuration
3. Confirm the token is correct: `openclaw config get gateway.auth.token`
4. If the gateway is remote, check that your network/firewall allows outbound WebSocket connections to that port

### EPROTO errors

Use `ws://` for non-TLS endpoints and `wss://` for TLS. This error means the client tried to open a plain WebSocket to a TLS endpoint, or vice versa.

### 401 Unauthorized (rocCLAW itself)

`ROCCLAW_ACCESS_TOKEN` is separate from the gateway token. If you set it on the server, clients must pass it as a bearer token. If you're on the same machine, you likely don't need it.

### 401 Unauthorized (gateway)

The gateway token is wrong or expired. Run `openclaw config get gateway.auth.token` again and paste it fresh.

### SQLite / native dependency errors

```bash
npm run verify:native-runtime:repair
```

If that fails, install build tools:
- **macOS:** `xcode-select --install`
- **Ubuntu/Debian:** `sudo apt install build-essential python3`
- **Alpine:** `apk add python3 make g++`

### Node version mismatch

`node` and `npm` must be from the same installation:

```bash
node --version
npm --version
```

If using nvm: `nvm use` reads `.nvmrc` automatically.

### Gateway connection drops

The server reconnects automatically with exponential back-off (1s → 15s max). If drops are frequent, check the gateway machine's resource usage — memory or GPU pressure can cause the gateway to OOM or restart.

### Agent won't respond to messages

1. Check the agent's status in the sidebar (● = running, ○ = offline)
2. Check for a pending exec approval card in the chat — the agent may be waiting for you to approve a command
3. Try a new session (chat header → New session) to reset the conversation context
4. Check the gateway logs on the host machine

### Sandbox not working as expected

Read the [Permissions & Sandboxing](docs/permissions-sandboxing.md) debug checklist. The short version:

1. Check `sandbox.mode` and `sandbox.workspaceAccess` in the agent's Capabilities tab
2. Remember that `workspaceAccess = Read-only` also disables file write/edit tools in sandbox
3. Confirm `group:runtime` is not denied in the agent's tools profile if you're expecting exec commands to work

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, testing commands, commit conventions, and PR guidelines.

## License

See [LICENSE](LICENSE)
