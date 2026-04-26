// MIT License - Copyright (c) 2026 SimonCatBot
// See LICENSE file for details.

"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Monitor,
  Globe,
  Server,
  Shield,
  Key,
  Link,
  ChevronDown,
  ChevronRight,
  Wifi,
  WifiOff,
  Terminal,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { GatewayStatus } from "@/lib/gateway/gateway-status";
import {
  resolveDefaultSetupScenario,
  resolveGatewayConnectionWarnings,
  type ROCclawConnectionWarning,
  type ROCclawInstallContext,
} from "@/lib/rocclaw/install-context";
import type { ROCclawGatewaySettings } from "@/lib/rocclaw/settings";

export interface ConnectionPageProps {
  savedGatewayUrl: string;
  draftGatewayUrl: string;
  token: string;
  localGatewayDefaults: ROCclawGatewaySettings | null;
  localGatewayDefaultsHasToken: boolean;
  hasStoredToken: boolean;
  hasUnsavedChanges: boolean;
  installContext: ROCclawInstallContext;
  status: GatewayStatus;
  statusReason: string | null;
  error: string | null;
  testResult: { kind: "success" | "error"; message: string } | null;
  saving: boolean;
  testing: boolean;
  disconnecting: boolean;
  onGatewayUrlChange: (value: string) => void;
  onTokenChange: (value: string) => void;
  onUseLocalDefaults: () => void;
  onSaveSettings: () => void;
  onTestConnection: () => void;
  onDisconnect: () => void;
  onConnect?: () => void;
  onClearError?: () => void;
}

const resolveLocalGatewayPort = (gatewayUrl: string): number => {
  try {
    const parsed = new URL(gatewayUrl);
    const port = Number(parsed.port);
    if (Number.isFinite(port) && port > 0) return port;
  } catch {}
  return 18789;
};

function CommandBlock({
  label,
  command,
  copiedCommand,
  onCopy,
}: {
  label?: string;
  command: string;
  copiedCommand: string | null;
  onCopy: (value: string) => void;
}) {
  return (
    <div>
      {label && (
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      )}
      <div className="ui-command-surface flex items-center gap-2 rounded-md px-3 py-2.5">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm">
          {command}
        </code>
        <button
          type="button"
          className="ui-btn-icon ui-command-copy h-8 w-8 shrink-0"
          onClick={() => onCopy(command)}
        >
          {copiedCommand === command ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function ConnectionPage({
  savedGatewayUrl,
  draftGatewayUrl,
  token,
  localGatewayDefaults,
  localGatewayDefaultsHasToken,
  hasStoredToken,
  hasUnsavedChanges,
  installContext,
  status,
  statusReason,
  error,
  testResult,
  saving,
  testing,
  disconnecting,
  onGatewayUrlChange,
  onTokenChange,
  onUseLocalDefaults,
  onSaveSettings,
  onTestConnection,
  onDisconnect,
  onConnect,
  onClearError,
}: ConnectionPageProps) {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [showAdvancedSetup, setShowAdvancedSetup] = useState(false);

  const localPort = useMemo(
    () => resolveLocalGatewayPort(draftGatewayUrl || savedGatewayUrl),
    [draftGatewayUrl, savedGatewayUrl]
  );

  const scenario = useMemo(
    () => resolveDefaultSetupScenario({
      installContext,
      gatewayUrl: draftGatewayUrl || savedGatewayUrl,
    }),
    [installContext, draftGatewayUrl, savedGatewayUrl]
  );

  const localGatewayCommand = `openclaw gateway --port ${localPort}`;
  const gatewayServeCommand = `tailscale serve --yes --bg --https 443 http://127.0.0.1:${localPort}`;
  const rocclawServeCommand = "tailscale serve --yes --bg --https 443 http://127.0.0.1:3000";

  const rocclawSshTarget = installContext.tailscale.dnsName || "<rocclaw-host>";
  const rocclawTunnelCommand = `ssh -L 3000:127.0.0.1:3000 ${rocclawSshTarget}`;
  const gatewayTunnelCommand = `ssh -L ${localPort}:127.0.0.1:${localPort} user@<gateway-host>`;

  const gatewayConfigCommands = [
    `openclaw config set gateway.port ${localPort}`,
    `openclaw config set gateway.host 127.0.0.1`,
  ];

  const warnings = useMemo<ROCclawConnectionWarning[]>(() => {
    return resolveGatewayConnectionWarnings({
      gatewayUrl: draftGatewayUrl,
      installContext,
      scenario,
      hasStoredToken,
      hasLocalGatewayToken: localGatewayDefaultsHasToken,
    });
  }, [draftGatewayUrl, hasStoredToken, installContext, localGatewayDefaultsHasToken, scenario]);

  const actionBusy = saving || testing || disconnecting;

  const urlValidationError = (() => {
    const url = draftGatewayUrl.trim();
    if (!url) return null;
    if (!/^wss?:\/\//i.test(url)) return "URL must start with ws:// or wss://";
    try {
      new URL(url);
    } catch {
      return "Invalid URL format";
    }
    return null;
  })();

  const isConnected = status === "connected";

  const tokenHelper = hasStoredToken
    ? "A token is already stored. Leave blank to keep it."
    : localGatewayDefaultsHasToken
      ? "A local token is available. Leave blank to use it."
      : "Enter the gateway token.";

  const copyCommand = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedCommand(value);
      window.setTimeout(() => setCopiedCommand((prev) => prev === value ? null : prev), 1200);
    } catch {
      // Silently fail — clipboard API may not be available
    }
  };

  const handleCopy = (value: string) => {
    void copyCommand(value);
  };

  // Resolve banner state
  const probeHealthy = installContext.localGateway.probeHealthy;
  const cliAvailable = installContext.localGateway.cliAvailable;
  const localGatewayUrl = installContext.localGateway.url;

  return (
    <div className="ui-panel ui-depth-workspace flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-border/50 bg-surface-1/30 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="ui-card p-1.5 sm:p-2 rounded-lg">
            <Link className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-foreground">Connection</h1>
            <p className="hidden xs:block text-xs text-muted-foreground">Configure how rocCLAW connects to OpenClaw</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">

          {/* Environment Detection Banner */}
          {isConnected ? (
            <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
              <Wifi className="h-5 w-5 shrink-0 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Connected to OpenClaw</p>
                <p className="text-xs text-muted-foreground">{savedGatewayUrl}</p>
              </div>
              <button
                type="button"
                className="ui-btn-ghost h-9 px-4 text-xs font-semibold text-foreground"
                onClick={() => void onDisconnect()}
                disabled={actionBusy}
              >
                {disconnecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Disconnect
              </button>
            </div>
          ) : probeHealthy ? (
            <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
              <Monitor className="h-5 w-5 shrink-0 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Local gateway detected</p>
                <p className="text-xs text-muted-foreground">
                  {localGatewayUrl ? `at ${localGatewayUrl}` : "Ready to connect"}
                </p>
              </div>
              <button
                type="button"
                className="ui-btn-primary h-9 px-4 text-xs font-semibold"
                onClick={() => {
                  if (localGatewayDefaults) onUseLocalDefaults();
                  onConnect?.();
                }}
                disabled={actionBusy}
              >
                Connect
              </button>
            </div>
          ) : cliAvailable ? (
            <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <Terminal className="h-5 w-5 shrink-0 text-amber-500" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Gateway found but not responding</p>
                <p className="text-xs text-muted-foreground">
                  Try starting it with <code className="font-mono">openclaw gateway</code>
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-1/50 px-4 py-3">
              <WifiOff className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">No local gateway detected</p>
                <p className="text-xs text-muted-foreground">
                  Start the gateway with <code className="font-mono">openclaw gateway</code>
                </p>
              </div>
            </div>
          )}

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Column — Getting Started */}
            <div className="space-y-4 sm:space-y-6">
              <div className="ui-card p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="ui-card p-2 rounded-lg">
                    <Server className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Getting Started</p>
                    <p className="text-xs text-muted-foreground">
                      {scenario === "same-computer"
                        ? "rocCLAW and OpenClaw on the same machine"
                        : scenario === "same-cloud-host"
                          ? "rocCLAW and OpenClaw on same cloud machine"
                          : "Connecting to a remote OpenClaw gateway"}
                    </p>
                  </div>
                </div>

                {/* Step 1: Start the gateway */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">1. Start the gateway</p>
                  <CommandBlock
                    command={localGatewayCommand}
                    copiedCommand={copiedCommand}
                    onCopy={handleCopy}
                  />
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap gap-2">
                  {localGatewayDefaults && (
                    <button
                      type="button"
                      className="ui-btn-secondary h-9 px-4 text-xs font-semibold"
                      onClick={onUseLocalDefaults}
                    >
                      Use Local Defaults
                    </button>
                  )}
                </div>
              </div>

              {/* CLI update warning */}
              {installContext.rocclawCli.installed && installContext.rocclawCli.updateAvailable && (
                <div className="ui-alert-danger rounded-md px-4 py-2 text-sm">
                  openclaw-rocclaw CLI {installContext.rocclawCli.currentVersion?.trim() || "current"} is installed, but {installContext.rocclawCli.latestVersion?.trim() || "a newer version"} is available. Run <code className="font-mono">npx -y openclaw-rocclaw@latest</code> to update.
                </div>
              )}

              {/* Public host security warning */}
              {installContext.rocclawHost.publicHosts.length > 0 && (
                <div className="ui-alert-danger rounded-md px-4 py-2 text-sm">
                  This rocCLAW is bound beyond loopback. <code className="font-mono">ROCCLAW_ACCESS_TOKEN</code> is required and each browser must visit <code className="font-mono">/?access_token=...</code> once.
                </div>
              )}

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="space-y-2">
                  {warnings.map((warning) => (
                    <div
                      key={warning.id}
                      className={
                        warning.tone === "warn"
                          ? "ui-alert-danger rounded-md px-4 py-2 text-sm"
                          : "ui-card rounded-md px-4 py-2 text-sm text-muted-foreground"
                      }
                    >
                      {warning.message}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column — Connection Form */}
            <div className="space-y-4 sm:space-y-6">
              <div className="ui-card p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="ui-card p-2 rounded-lg">
                    <Key className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Gateway URL & Token</p>
                    <p className="text-xs text-muted-foreground">Enter your connection details</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="gateway-url" className="text-xs font-medium text-muted-foreground">
                      Gateway URL
                    </label>
                    <input
                      id="gateway-url"
                      type="text"
                      value={draftGatewayUrl}
                      onChange={(e) => onGatewayUrlChange(e.target.value)}
                      placeholder={`ws://localhost:${localPort}`}
                      className={`ui-input h-11 w-full rounded-md px-4 text-sm ${urlValidationError ? "border-red-500/60" : ""}`}
                      spellCheck={false}
                      aria-invalid={!!urlValidationError}
                      aria-describedby={urlValidationError ? "gateway-url-error" : undefined}
                    />
                    {urlValidationError && (
                      <p id="gateway-url-error" className="mt-1 text-xs text-red-500">
                        {urlValidationError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="gateway-token" className="text-xs font-medium text-muted-foreground">
                        Token
                      </label>
                      {hasStoredToken ? (
                        <span className="ui-chip text-[10px] font-semibold bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                          Stored
                        </span>
                      ) : localGatewayDefaultsHasToken ? (
                        <span className="ui-chip text-[10px] font-semibold bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">
                          Auto-detected
                        </span>
                      ) : null}
                    </div>
                    <div className="relative">
                      <input
                        id="gateway-token"
                        type={showToken ? "text" : "password"}
                        value={token}
                        onChange={(e) => onTokenChange(e.target.value)}
                        placeholder={hasStoredToken || localGatewayDefaultsHasToken ? "keep existing" : "gateway token"}
                        className="ui-input h-11 w-full rounded-md px-4 pr-10 text-sm"
                        spellCheck={false}
                      />
                      <button
                        type="button"
                        aria-label={showToken ? "Hide token" : "Show token"}
                        className="absolute inset-y-0 right-0 my-auto h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground"
                        onClick={() => setShowToken((prev) => !prev)}
                      >
                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">{tokenHelper}</p>

                {hasUnsavedChanges && (
                  <p className="text-xs font-mono font-semibold text-muted-foreground">
                    Unsaved changes
                  </p>
                )}

                {/* Primary action button */}
                <div className="pt-2 space-y-3">
                  <button
                    type="button"
                    className="ui-btn-primary w-full h-11 text-sm font-semibold tracking-wide"
                    onClick={() => {
                      if (isConnected) {
                        void onDisconnect();
                      } else {
                        void onSaveSettings();
                      }
                    }}
                    disabled={actionBusy || (!isConnected && (!draftGatewayUrl.trim() || !!urlValidationError))}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> : null}
                    {disconnecting ? <Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> : null}
                    {isConnected ? "Disconnect" : "Connect"}
                  </button>

                  {/* Test Connection — secondary text link */}
                  {!isConnected && (
                    <div className="text-center">
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                        onClick={() => void onTestConnection()}
                        disabled={actionBusy || !draftGatewayUrl.trim() || !!urlValidationError}
                      >
                        {testing ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin mr-1 inline" />
                            Testing…
                          </>
                        ) : (
                          "Test Connection"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="ui-card p-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      status === "connected"
                        ? "bg-green-500"
                        : status === "connecting" || status === "reconnecting"
                          ? "bg-yellow-500 animate-pulse"
                          : "bg-muted"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {status === "connected" && "Connected to OpenClaw"}
                      {status === "connecting" && "Connecting..."}
                      {status === "reconnecting" && "Reconnecting — retrying automatically..."}
                      {status === "error" && "Connection Error"}
                      {status === "disconnected" && "Disconnected"}
                    </p>
                    {statusReason && (
                      <p className="text-xs text-muted-foreground">{statusReason}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Test result display */}
              {testResult && (
                <div
                  className={`flex items-start gap-2 rounded-lg px-4 py-3 ${
                    testResult.kind === "error"
                      ? "border border-red-500/30 bg-red-500/10"
                      : "border border-green-500/30 bg-green-500/10"
                  }`}
                >
                  {testResult.kind === "error" ? (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  ) : (
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                  )}
                  <p
                    className={`text-xs font-medium ${
                      testResult.kind === "error" ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    {testResult.message}
                  </p>
                </div>
              )}

              {/* Error display */}
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <p className="flex-1 text-xs font-medium text-red-400">{error}</p>
                  {onClearError && (
                    <button
                      type="button"
                      className="text-red-400 hover:text-red-300"
                      onClick={onClearError}
                      aria-label="Dismiss error"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Collapsible Advanced Setup */}
          <div className="ui-card">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-foreground hover:bg-surface-1/50 rounded-lg"
              onClick={() => setShowAdvancedSetup((prev) => !prev)}
              aria-expanded={showAdvancedSetup}
            >
              {showAdvancedSetup ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              Advanced Setup
            </button>
            {showAdvancedSetup && (
              <div className="border-t border-border/50 px-4 py-4 space-y-5">
                {/* SSH Tunnel */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">SSH Tunnel</p>
                  </div>
                  <div className="space-y-3">
                    <CommandBlock
                      label="Gateway tunnel (from your local machine)"
                      command={gatewayTunnelCommand}
                      copiedCommand={copiedCommand}
                      onCopy={handleCopy}
                    />
                    <CommandBlock
                      label="rocCLAW tunnel (from your local machine)"
                      command={rocclawTunnelCommand}
                      copiedCommand={copiedCommand}
                      onCopy={handleCopy}
                    />
                  </div>
                </div>

                {/* Tailscale Serve */}
                {installContext.tailscale.installed && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">Tailscale Serve</p>
                    </div>
                    <div className="space-y-3">
                      <CommandBlock
                        label="Expose gateway via Tailscale"
                        command={gatewayServeCommand}
                        copiedCommand={copiedCommand}
                        onCopy={handleCopy}
                      />
                      <CommandBlock
                        label="Expose rocCLAW via Tailscale"
                        command={rocclawServeCommand}
                        copiedCommand={copiedCommand}
                        onCopy={handleCopy}
                      />
                    </div>
                  </div>
                )}

                {/* rocCLAW remote exposure */}
                {installContext.rocclawHost.remoteShell && (
                  <div className="ui-card rounded-md px-4 py-2 text-sm text-muted-foreground">
                    This rocCLAW is running in a remote shell. Use Tailscale Serve or an SSH tunnel to access it from your browser.
                  </div>
                )}

                {/* Gateway config commands */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Terminal className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">Gateway Configuration</p>
                  </div>
                  <div className="space-y-3">
                    {gatewayConfigCommands.map((cmd) => (
                      <CommandBlock
                        key={cmd}
                        command={cmd}
                        copiedCommand={copiedCommand}
                        onCopy={handleCopy}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
