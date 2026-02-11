<#
.SYNOPSIS
    OpenClaw Windows (PowerShell) Setup — Anamnese-App DevSecOps Agent
.DESCRIPTION
    Fallback setup for native Windows. WSL2 is the recommended primary runtime.
    Run: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\openclaw-setup-windows.ps1
#>
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step  { param($msg) Write-Host "[SETUP] $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "[WARN]  $msg" -ForegroundColor Yellow }
function Write-Fail  { param($msg) Write-Host "[FAIL]  $msg" -ForegroundColor Red; exit 1 }

function Enable-FnmInSession {
    $fnm = Get-Command fnm -ErrorAction SilentlyContinue
    if (-not $fnm) { return }
    try {
        # Required on Windows so `fnm use` actually takes effect in the current shell.
        fnm env --use-on-cd | Out-String | Invoke-Expression
        Write-Step "fnm env initialized for this PowerShell session."
    } catch {
        Write-Warn "Could not initialize fnm env in this session. Node switching may not apply until a new terminal."
    }
}

function Refresh-PathFromRegistry {
    try {
        $env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'User') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
    } catch {
        # best-effort
    }
}

$NodeRequired = "22.12.0"
$OpenClawRequired = "2026.2.9"
$ProjectRoot  = Split-Path -Parent (Split-Path -Parent $PSCommandPath)

# ── Step 1: Check/Install fnm ───────────────────────────────────────────
Write-Step "Checking fnm (Fast Node Manager)..."
$fnmPath = Get-Command fnm -ErrorAction SilentlyContinue
if (-not $fnmPath) {
    Write-Step "Installing fnm via winget..."
    try {
        winget install Schniz.fnm --silent --accept-package-agreements --accept-source-agreements
        Refresh-PathFromRegistry
    } catch {
        Write-Fail "fnm installation failed. Install manually: winget install Schniz.fnm"
    }
}

Refresh-PathFromRegistry
$null = Enable-FnmInSession

# ── Step 2: Node.js ────────────────────────────────────────────────────
Write-Step "Checking Node.js version..."
$null = Enable-FnmInSession
$currentNode = try { (node --version) } catch { "none" }
if ($currentNode -notlike "v$NodeRequired*") {
    Write-Step "Installing Node.js $NodeRequired..."
    fnm install $NodeRequired
    $null = Enable-FnmInSession
    fnm use $NodeRequired --install-if-missing
    $null = Enable-FnmInSession
    fnm default $NodeRequired
} else {
    Write-Step "Node.js $currentNode meets requirement."
}

try {
    fnm exec --using="v$NodeRequired" node --version
} catch {
    node --version
}
npm --version

# ── Step 3: OpenClaw ───────────────────────────────────────────────────
Write-Step "Checking OpenClaw installation..."
$openclawCmd = Get-Command openclaw -ErrorAction SilentlyContinue
if (-not $openclawCmd) {
    Write-Step "Installing OpenClaw globally..."
    npm install -g openclaw@$OpenClawRequired
} else {
    Write-Step "OpenClaw already installed: $($openclawCmd.Source)"
}

$openClawVersion = try { openclaw --version } catch { "unknown" }
Write-Step "OpenClaw version: $openClawVersion"
if ($openClawVersion -notlike "$OpenClawRequired*") {
    Write-Warn "OpenClaw version differs from pinned setup target ($OpenClawRequired). If you see issues, reinstall: npm install -g openclaw@$OpenClawRequired"
}

# ── Step 4: GitHub CLI ─────────────────────────────────────────────────
$ghPath = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghPath) {
    Write-Step "Installing GitHub CLI..."
    winget install GitHub.cli --silent --accept-package-agreements --accept-source-agreements
} else {
    Write-Step "GitHub CLI already installed."
}

# ── Step 5: OpenClaw config ────────────────────────────────────────────
$openClawDir = Join-Path $env:USERPROFILE ".openclaw"
if (-not (Test-Path $openClawDir)) {
    New-Item -Path $openClawDir -ItemType Directory -Force | Out-Null
}

$workspaceConfig = Join-Path $ProjectRoot ".openclaw\openclaw.json"
$targetConfig    = Join-Path $openClawDir "openclaw.json"

if (Test-Path $workspaceConfig) {
    Write-Step "Workspace OpenClaw agent config found (God Mode): $workspaceConfig"
} else {
    Write-Warn "Workspace agent config missing at $workspaceConfig (expected for God Mode)."
}

if (-not (Test-Path $targetConfig)) {
    Write-Step "User-level OpenClaw config missing; running non-interactive onboarding (mode=local, loopback, port=18789)..."
    try {
        openclaw onboard --non-interactive --accept-risk --mode local --gateway-auth token --gateway-bind loopback --gateway-port 18789 --skip-channels --skip-skills --skip-ui --skip-daemon --skip-health | Out-Null
        Write-Step "Onboarding complete: $targetConfig"
    } catch {
        Write-Warn "Onboarding failed. You can retry later with: openclaw onboard"
    }
} else {
    Write-Step "User-level OpenClaw config present: $targetConfig"
}

Write-Step "Setting default OpenClaw agent workspace to this repo..."
try {
    openclaw config set agents.defaults.workspace "$ProjectRoot" | Out-Null
    Write-Step "Agent workspace set: $ProjectRoot"
} catch {
    Write-Warn "Could not set agents.defaults.workspace. You can run: openclaw config set agents.defaults.workspace \"$ProjectRoot\""
}

# ── Step 6: Skills installation ────────────────────────────────────────
Write-Step "Installing OpenClaw skills..."
$skills = @("gitclaw", "github-pr", "buildlog", "security-audit")
foreach ($skill in $skills) {
    try {
        npx clawhub@latest install $skill
        Write-Step "  Installed: $skill"
    } catch {
        Write-Warn "  Failed to install: $skill"
    }
}

# ── Step 7: Auth check ────────────────────────────────────────────────
Write-Step "Checking GitHub authentication..."
try {
    gh auth status 2>&1 | Out-Null
    Write-Step "GitHub CLI authenticated."
} catch {
    Write-Warn "GitHub CLI NOT authenticated. Run: gh auth login"
}

$sshKey = Join-Path $env:USERPROFILE ".ssh\id_ed25519"
if (Test-Path $sshKey) {
    Write-Step "SSH key found."
} else {
    Write-Warn "No SSH key at $sshKey. Generate with: ssh-keygen -t ed25519"
}

# ── Step 8: Auth token ────────────────────────────────────────────────
if (-not $env:OPENCLAW_AUTH_TOKEN) {
    # Prefer loading the stable gateway token from the user-level OpenClaw config.
    try {
        if (Test-Path $targetConfig) {
            $cfg = Get-Content -Path $targetConfig -Raw -ErrorAction SilentlyContinue | ConvertFrom-Json
            $cfgToken = $cfg.gateway.auth.token
            if ($cfgToken -and ($cfgToken -is [string]) -and $cfgToken.Length -ge 16) {
                $env:OPENCLAW_AUTH_TOKEN = $cfgToken
                $env:OPENCLAW_GATEWAY_TOKEN = $cfgToken
                Write-Step "Loaded OPENCLAW_AUTH_TOKEN from user config for this session (len: $($cfgToken.Length))."
            } else {
                Write-Warn "No gateway token found in user config. openclaw-start.ps1 will generate/use one when starting the gateway."
            }
        } else {
            Write-Warn "User config not found; token will be handled on first gateway start."
        }
    } catch {
        Write-Warn "Could not load token from user config. openclaw-start.ps1 will handle token generation at runtime."
    }
}

# ── Step 9: Copilot Bridge verification ────────────────────────────────
$bridgeScript = Join-Path $ProjectRoot "scripts\copilot-bridge.cjs"
if (Test-Path $bridgeScript) {
    Write-Step "Copilot Bridge script found: $bridgeScript"
    try {
        node --check $bridgeScript 2>&1 | Out-Null
        Write-Step "Copilot Bridge syntax OK (node --check)."
    } catch {
        Write-Warn "Copilot Bridge syntax check failed."
    }
} else {
    Write-Warn "Copilot Bridge not found at $bridgeScript"
}

# ── Step 10: Copilot API token test ────────────────────────────────────
Write-Step "Testing GitHub authentication for Copilot Bridge..."
try {
    $ghToken = gh auth token 2>&1
    if ($ghToken -and $ghToken.Length -gt 10) {
        Write-Step "GitHub token available (length: $($ghToken.Length))"
        Write-Step "Copilot Bridge can exchange this token for a Copilot session token."
    } else {
        Write-Warn "GitHub token not available. Copilot Bridge will not work until you login."
        Write-Warn "Run: gh auth login"
    }
} catch {
    Write-Warn "Could not retrieve GitHub token. Copilot Bridge requires: gh auth login"
}

# ── Step 11: Pre-push hook install ─────────────────────────────────────
$hookSource = Join-Path $ProjectRoot "scripts\git-pre-push-hook.sh"
$hookTarget = Join-Path $ProjectRoot ".git\hooks\pre-push"
if (Test-Path $hookSource) {
    if (-not (Test-Path $hookTarget)) {
        Write-Step "Installing pre-push hook..."
        Copy-Item -Path $hookSource -Destination $hookTarget -Force
        Write-Step "Pre-push hook installed."
    } else {
        Write-Step "Pre-push hook already installed."
    }
} else {
    Write-Warn "Pre-push hook source not found."
}

# ── Summary ────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " OpenClaw Windows Setup Complete" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Node.js:    $(node --version)"
Write-Host " npm:        $(npm --version)"
Write-Host " OpenClaw:   $openClawVersion"
Write-Host " User Config:      $targetConfig"
Write-Host " Workspace Config: $workspaceConfig"
Write-Host ""
Write-Host " Services:" -ForegroundColor Cyan
Write-Host "   OpenClaw Gateway:  127.0.0.1:18789"
Write-Host "   Copilot Bridge:    127.0.0.1:18790"
Write-Host ""
Write-Host " Available Copilot Models:" -ForegroundColor Cyan
Write-Host "   gpt-4o, claude-sonnet, claude-haiku, o1, o3-mini"
Write-Host ""
Write-Host " Next steps:" -ForegroundColor Yellow
Write-Host "   1. Restart terminal (to pick up env vars)"
Write-Host "   2. cd $ProjectRoot"
Write-Host "   3. npm run openclaw:start"
Write-Host "   4. (or) npm run openclaw:start:bridge-only"
Write-Host "   5. Connect channels (WhatsApp/Telegram): openclaw configure --section channels" -ForegroundColor Yellow
Write-Host "      Then send: openclaw message send --channel whatsapp -t <E.164> -m \"...\"" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
