# Install Guide -- rocCLAW on Ubuntu 24.04

This guide walks through installing rocCLAW and the OpenClaw gateway on a fresh Ubuntu 24.04 machine. rocCLAW is a web-based operator dashboard that proxies all communication between your browser and the OpenClaw gateway.

---

## Prerequisites

| Dependency       | Minimum Version | Purpose                                        |
|------------------|-----------------|-------------------------------------------------|
| Node.js          | 20.9.0          | Runtime for Next.js server and build tooling    |
| npm              | (bundled)       | Package manager (ships with Node.js)            |
| build-essential  | any             | C/C++ compiler for native modules (better-sqlite3, ws) |
| python3          | 3.x             | Required by node-gyp during native compilation  |
| git              | any             | Clone the repository (source installs only)     |

---

## Step 1: Install Node.js

### Option A: nvm (recommended)

nvm lets you install and switch between Node.js versions without sudo.

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Load nvm into the current shell
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Install the version pinned in .nvmrc
nvm install 20.9.0
nvm use 20.9.0

# Verify
node --version   # should print v20.9.0 or later
npm --version
```

### Option B: NodeSource apt repository

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node --version   # should print v20.x
```

---

## Step 2: Install Build Dependencies

`better-sqlite3` is a native C++ addon compiled during `npm install`. It requires a C++ toolchain and Python 3.

```bash
sudo apt update
sudo apt install -y build-essential python3
```

If you also plan to clone the repo, install git:

```bash
sudo apt install -y git
```

---

## Step 3: Install rocCLAW

### Option A: npm global (quickest)

Run rocCLAW directly without cloning the repository:

```bash
npx openclaw-rocclaw@latest
```

This downloads the latest published package, compiles native dependencies, and starts the server on `http://localhost:3000`.

### Option B: From source (development)

```bash
git clone https://github.com/simoncatbot/rocclaw.git
cd rocclaw
npm install
npm run dev
```

`npm run dev` automatically repairs native module ABI mismatches on startup (via `verify-native-runtime.mjs --repair`). The dev server runs at `http://localhost:3000` with hot reload.

### Option C: From source (production)

```bash
git clone https://github.com/simoncatbot/rocclaw.git
cd rocclaw
npm install
npm run build
node server/index.js
```

Or use the combined command:

```bash
npm run start   # runs: next build && node server/index.js
```

The production server binds to `127.0.0.1` and `::1` on port 3000 by default. Native modules are verified in check mode on startup -- if they fail, rebuild with `npm run verify:native-runtime:repair`.

---

## Step 4: Install and Start the OpenClaw Gateway

rocCLAW connects to the OpenClaw gateway over WebSocket. Install the gateway separately if it is not already running.

```bash
# Install the OpenClaw CLI (if not already installed)
npm install -g openclaw

# Start the gateway on the default port
openclaw gateway --port 18789
```

The gateway listens on `ws://localhost:18789` by default. For a same-machine setup where both rocCLAW and the gateway run on the same host, no further network configuration is needed.

To verify the gateway is running:

```bash
openclaw status --json
openclaw sessions --json
```

To read the gateway auth token (rocCLAW needs this to connect):

```bash
openclaw config get gateway.auth.token
```

---

## Step 5: Connect rocCLAW to the Gateway

### Method A: Auto-detection (easiest)

If the OpenClaw CLI is installed and the gateway is running on the same machine, rocCLAW automatically detects the gateway URL and auth token from `~/.openclaw/openclaw.json` on startup. No manual configuration is needed.

### Method B: Manual (via the UI)

1. Open `http://localhost:3000` in your browser.
2. Click the **Connection** tab.
3. Enter the gateway URL (e.g., `ws://localhost:18789`).
4. Enter the gateway auth token.
5. Click **Connect**.

Settings are saved to `~/.openclaw/openclaw-rocclaw/settings.json` and persist across restarts.

### Method C: Setup script

The interactive setup script prompts for the gateway URL and token, then writes `settings.json`:

```bash
npm run rocclaw:setup
```

It auto-detects the token from the OpenClaw CLI if available. To overwrite existing settings, add `--force`:

```bash
npm run rocclaw:setup -- --force
```

---

## Remote Access

rocCLAW binds to loopback (`127.0.0.1` / `::1`) by default, so it is not reachable from other machines. Two methods for remote access:

### Tailscale Serve (recommended)

Tailscale exposes rocCLAW over HTTPS on your tailnet with no port forwarding or firewall changes.

```bash
# Install Tailscale (if not already installed)
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Serve rocCLAW over HTTPS on port 443
tailscale serve --yes --bg --https 443 http://127.0.0.1:3000

# Find your tailnet hostname
tailscale status
```

Open `https://<your-machine>.your-tailnet.ts.net` from any device on your tailnet.

If the gateway is on a different machine, also forward the gateway port:

```bash
# On the gateway host
tailscale serve --yes --bg --tcp 18789 tcp://127.0.0.1:18789
```

Then set the gateway URL in rocCLAW to `ws://<gateway-host>.your-tailnet.ts.net:18789`.

### SSH tunnel

Forward the rocCLAW port from your local machine to the remote host:

```bash
# Forward rocCLAW (port 3000)
ssh -L 3000:127.0.0.1:3000 user@remote-host
```

Then open `http://localhost:3000` in your local browser.

If the gateway is on a different machine from rocCLAW, also forward the gateway port:

```bash
# Forward both rocCLAW and the gateway
ssh -L 3000:127.0.0.1:3000 -L 18789:127.0.0.1:18789 user@remote-host
```

---

## Environment Variables

| Variable                              | Default              | Description                                                  |
|---------------------------------------|----------------------|--------------------------------------------------------------|
| `PORT`                                | `3000`               | HTTP port for the rocCLAW server                             |
| `HOST`                                | `127.0.0.1`          | Bind address. Set to `0.0.0.0` for LAN access (requires `ROCCLAW_ACCESS_TOKEN`) |
| `ROCCLAW_ACCESS_TOKEN`                | (none)               | Cookie-based access token. Required when binding to a public/non-loopback address |
| `NEXT_PUBLIC_GATEWAY_URL`             | `ws://127.0.0.1:18789` | Default gateway URL when no saved settings exist            |
| `OPENCLAW_STATE_DIR`                  | `~/.openclaw`        | Override the base directory for all OpenClaw/rocCLAW state   |
| `OPENCLAW_SKIP_NATIVE_RUNTIME_VERIFY` | (unset)             | Set to `1` to skip the native module ABI check on startup    |

To set these, either export them in your shell or create a `.env` file in the project root (see `.env.example`).

---

## Files and Directories

rocCLAW creates these paths automatically on first run. All paths are relative to the state directory (`~/.openclaw` by default).

| Path                                         | Purpose                                                      |
|----------------------------------------------|--------------------------------------------------------------|
| `~/.openclaw/openclaw-rocclaw/settings.json`  | Gateway URL, token, and UI preferences                       |
| `~/.openclaw/openclaw-rocclaw/device.json`    | Ed25519 keypair for gateway authentication (file mode `0600`) |
| `~/.openclaw/openclaw-rocclaw/state.db`       | SQLite database (WAL mode) for event projection and outbox   |
| `~/.openclaw/openclaw.json`                   | Shared OpenClaw config (gateway port, auth token). Written by the OpenClaw CLI, read by rocCLAW for auto-detection |

---

## Troubleshooting

### 1. Wrong Node.js version

**Symptom**: Startup crashes or `npm install` fails with syntax errors.

**Fix**: rocCLAW requires Node.js 20.9.0 or later. Check with `node --version`. If using nvm:

```bash
nvm install 20.9.0
nvm use 20.9.0
```

### 2. Missing build-essential

**Symptom**: `npm install` fails with errors like `gyp ERR! build error` or `make: not found`.

**Fix**:

```bash
sudo apt install -y build-essential python3
rm -rf node_modules
npm install
```

### 3. Native module ABI mismatch

**Symptom**: Error on startup: `The module was compiled against a different Node.js version` or `NODE_MODULE_VERSION mismatch`.

This happens when you switch Node.js versions after `npm install`.

**Fix**:

```bash
npm run verify:native-runtime:repair
```

Or manually rebuild:

```bash
rm -rf node_modules
npm install
```

### 4. No gateway running

**Symptom**: rocCLAW loads but shows "Disconnected" or "Connection failed" in the UI.

**Fix**: Start the gateway:

```bash
openclaw gateway --port 18789
```

Verify it is running:

```bash
openclaw status --json
```

### 5. Missing gateway token

**Symptom**: rocCLAW connects but the gateway rejects the handshake.

**Fix**: The gateway requires an auth token. Retrieve it and enter it in the Connection tab:

```bash
openclaw config get gateway.auth.token
```

Or re-run the setup script:

```bash
npm run rocclaw:setup -- --force
```

### 6. Device identity error

**Symptom**: Errors mentioning Ed25519, device identity, or challenge-response signing.

**Fix**: Delete the device keypair file and restart. rocCLAW generates a new one automatically:

```bash
rm ~/.openclaw/openclaw-rocclaw/device.json
```

Ensure the directory has correct permissions:

```bash
ls -la ~/.openclaw/openclaw-rocclaw/device.json
# Should show -rw------- (0600)
```

### 7. Port already in use

**Symptom**: `Error: listen EADDRINUSE: address already in use :::3000`.

**Fix**: Either stop the other process using port 3000, or start rocCLAW on a different port:

```bash
PORT=3001 npm run dev
```

### 8. LAN IP in gateway URL

**Symptom**: rocCLAW is on the same machine as the gateway, but the gateway URL is set to a LAN IP (e.g., `ws://192.168.1.50:18789`) and connections fail or are slow.

**Fix**: When both services are on the same machine, always use `ws://localhost:18789` or `ws://127.0.0.1:18789`. The gateway typically binds to loopback only.

### 9. Public binding without access token

**Symptom**: Server refuses to start with the error: `Refusing to bind ROCclaw to public host "0.0.0.0" without ROCCLAW_ACCESS_TOKEN`.

**Fix**: When binding to a non-loopback address (e.g., `HOST=0.0.0.0`), you must set an access token:

```bash
ROCCLAW_ACCESS_TOKEN=your-secret-token HOST=0.0.0.0 npm run dev
```

Then open the dashboard once with the token in the URL to set the auth cookie:

```
http://<your-ip>:3000/?access_token=your-secret-token
```
