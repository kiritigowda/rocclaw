# rocCLAW

A focused operator studio for OpenClaw. Connect to your Gateway, manage agents, view system metrics, and control your AI operations from one clean interface.

[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?logo=discord&logoColor=white)](https://discord.gg/EFkFHbZw)

## Features

- **Agent Management** - Create, configure, and monitor your AI agents
- **Identity Display** - Each agent shows their unique identity name (e.g., Kapu, Simon, Debbie)
- **System Metrics** - Real-time CPU, memory, GPU, disk, and network monitoring
- **Tabbed Interface** - Clean layout with Agents and System Metrics tabs (Chat, Tokens, Settings available on demand)
- **Custom Branding** - Personalized logo support

## Quick Start

### Requirements
- Node.js 20.9+ (LTS recommended)
- OpenClaw Gateway URL + token
- Tailscale (optional, for remote access)

### Run Locally

```bash
# Clone the repository
git clone https://github.com/simonCatBot/rocclaw.git
cd rocclaw

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:3000

### Connect to Gateway

1. Set **Upstream URL**: `ws://localhost:18789` (or your gateway URL)
2. Set **Upstream Token**: Get from `openclaw config get gateway.auth.token`
3. Click **Connect**

## Setup Scenarios

### Local Development
Both Gateway and rocCLAW running on the same machine:
```
Upstream URL: ws://localhost:18789
```

### Remote Gateway
Gateway on a cloud VM, rocCLAW on your laptop:

**With Tailscale:**
```
Upstream URL: wss://<gateway-host>.ts.net
```

**With SSH Tunnel:**
```bash
ssh -L 18789:127.0.0.1:18789 user@<gateway-host>
```
Then use `ws://localhost:18789`

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| Upstream URL | `ws://localhost:18789` | OpenClaw Gateway WebSocket URL |
| Upstream Token | - | Gateway authentication token |
| ROCCLAW_ACCESS_TOKEN | - | Required when binding to public host |

### File Locations

- OpenClaw config: `~/.openclaw/openclaw.json`
- rocCLAW settings: `~/.openclaw/rocclaw/settings.json`
- Runtime database: `~/.openclaw/rocclaw/runtime.db`

## Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run ESLint
```

### Project Structure

```
rocclaw/
├── src/              # Source code
│   ├── features/     # Feature modules (agents, system)
│   ├── components/   # Shared components
│   └── lib/          # Utilities and helpers
├── public/           # Static assets (logo, favicon)
├── docs/             # Documentation
├── tests/            # Test files
└── server/           # Server runtime
```

## Documentation

- [UI Guide](docs/ui-guide.md) - Agent creation, cron jobs, approvals
- [Chat Streaming](docs/pi-chat-streaming.md) - Runtime event streaming
- [Permissions](docs/permissions-sandboxing.md) - Security and sandboxing
- [Color System](docs/color-system.md) - UI design tokens
- [Architecture](ARCHITECTURE.md) - Technical architecture

## Troubleshooting

### Connection Issues
- **"Connect" fails**: Verify upstream URL/token in settings
- **EPROTO error**: Use `ws://` for non-TLS, `wss://` for TLS endpoints
- **401 Unauthorized**: Set `ROCCLAW_ACCESS_TOKEN` when binding to public host

### Runtime Issues
- **SQLite errors**: Run `npm run verify:native-runtime:repair`
- **Node version mismatch**: Ensure `node` and `npm` point to same runtime

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and commit conventions.

## License

See [LICENSE](LICENSE)

---

⭐ Star this repo if you find it useful!
