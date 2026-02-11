<#
.SYNOPSIS
    OpenClaw Full Startup (Windows PowerShell) — Bridge + Agent
.DESCRIPTION
    Launches Copilot Bridge and OpenClaw Agent on Windows (native PS).
    Run: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\openclaw-start.ps1
#>
[CmdletBinding()]
param(
    [switch]$BridgeOnly,
    [switch]$AgentOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$LogDir      = Join-Path $ProjectRoot "buildLogs\openclaw"
$BridgePid   = Join-Path $LogDir "bridge.pid"
$BridgeLog   = Join-Path $LogDir "copilot_bridge.log"

if (-not (Test-Path $LogDir)) { New-Item -Path $LogDir -ItemType Directory -Force | Out-Null }

function Write-Step  { param($msg) Write-Host "[START] $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "[WARN]  $msg" -ForegroundColor Yellow }

function Test-LocalTcpPortOpen {
    param(
        [Parameter(Mandatory = $true)][int]$Port,
        [int]$TimeoutMs = 250
    )

    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async = $client.BeginConnect('127.0.0.1', $Port, $null, $null)
        if ($async.AsyncWaitHandle.WaitOne($TimeoutMs)) {
            $client.EndConnect($async)
            $client.Close()
            return $true
        }
        $client.Close()
        return $false
    } catch {
        try { $client.Close() } catch { }
        return $false
    }
}

function Refresh-PathFromRegistry {
    try {
        $env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'User') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
    } catch {
        # best-effort
    }
}

function Get-OpenClawCmdPath {
    Refresh-PathFromRegistry
    $candidate = Join-Path $env:APPDATA 'npm\openclaw.cmd'
    if (Test-Path $candidate) { return $candidate }

    $cmd = Get-Command openclaw.cmd -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    return $null
}

function Get-OpenClawCliEntryPath {
    Refresh-PathFromRegistry
    $entry = Join-Path $env:APPDATA 'npm\node_modules\openclaw\openclaw.mjs'
    if (Test-Path $entry) { return $entry }
    return $null
}

function Get-OpenClawLauncherArgs {
    # Prefer running OpenClaw under Node 22 via fnm exec when available.
    Refresh-PathFromRegistry
    $fnm = Get-Command fnm -ErrorAction SilentlyContinue
    if ($fnm) {
        return @{ FilePath = $fnm.Source; Args = @('exec','--using=v22.12.0') }
    }
    return $null
}

function Ensure-OpenClawAuthToken {
    if ($env:OPENCLAW_AUTH_TOKEN) {
        Write-Step "OPENCLAW_AUTH_TOKEN present (len: $($env:OPENCLAW_AUTH_TOKEN.Length))"
        return
    }

    # Prefer a stable token from the user-level OpenClaw config if available.
    try {
        $configPath = Join-Path $HOME '.openclaw\openclaw.json'
        if (Test-Path $configPath) {
            $cfg = Get-Content -Path $configPath -Raw -ErrorAction SilentlyContinue | ConvertFrom-Json
            $cfgToken = $cfg.gateway.auth.token
            if ($cfgToken -and ($cfgToken -is [string]) -and $cfgToken.Length -ge 16) {
                $env:OPENCLAW_AUTH_TOKEN = $cfgToken
                $env:OPENCLAW_GATEWAY_TOKEN = $cfgToken
                Write-Step "OPENCLAW_AUTH_TOKEN loaded from ~/.openclaw/openclaw.json (len: $($cfgToken.Length))"
                return
            }
        }
    } catch {
        # best-effort
    }

    Write-Warn "OPENCLAW_AUTH_TOKEN is not set. Generating a local token for the gateway..."
    $bytes = New-Object byte[] 32
    try {
        $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        $rng.GetBytes($bytes)
        $rng.Dispose()
    } catch {
        Write-Warn "Failed to generate a cryptographically strong token."
        throw
    }
    $token = ([System.BitConverter]::ToString($bytes) -replace '-','').ToLowerInvariant()

    # Set for this session.
    $env:OPENCLAW_AUTH_TOKEN = $token
    Write-Step "OPENCLAW_AUTH_TOKEN set for session (len: $($token.Length))"

    # Also set gateway token for this session (best-effort). We pass --token explicitly when starting the gateway.
    $env:OPENCLAW_GATEWAY_TOKEN = $env:OPENCLAW_AUTH_TOKEN
}

function Test-GitHubAuth {
    try {
        gh auth status 2>&1 | Out-Null
        return $true
    } catch {
        return $false
    }
}

# ── Pre-flight ─────────────────────────────────────────────────────────
Write-Step "Pre-flight checks..."
$nodeVer = try { node --version } catch { "none" }
Write-Step "Node.js: $nodeVer"

try {
    gh auth status 2>&1 | Out-Null
    Write-Step "GitHub CLI: authenticated"
} catch {
    Write-Warn "GitHub CLI: NOT authenticated. Run: gh auth login"
}

# ── Start Copilot Bridge ──────────────────────────────────────────────
function Start-CopilotBridge {
    # If already running, don't start a second instance.
    try {
        $existing = Invoke-WebRequest -Uri "http://127.0.0.1:18790/health" -UseBasicParsing -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($existing -and $existing.StatusCode -eq 200) {
            Write-Step "Copilot Bridge already running (health OK)."
            return
        }
    } catch { }

    $bridgeScript = Join-Path $ProjectRoot "scripts\copilot-bridge.cjs"
    if (-not (Test-Path $bridgeScript)) {
        Write-Warn "Copilot Bridge not found at $bridgeScript"
        return
    }

    if (-not (Test-GitHubAuth)) {
        Write-Warn "Skipping Copilot Bridge start: GitHub CLI not authenticated. Run: gh auth login"
        return
    }

    Write-Step "Starting Copilot Bridge on 127.0.0.1:18790..."
    $proc = Start-Process -FilePath "node" -ArgumentList $bridgeScript `
        -RedirectStandardOutput $BridgeLog `
        -RedirectStandardError (Join-Path $LogDir "copilot_bridge.err.log") `
        -WindowStyle Hidden -PassThru

    $proc.Id | Out-File -FilePath $BridgePid -Force
    Write-Step "Copilot Bridge started (PID $($proc.Id))"

    # Wait for ready
    $ready = $false
    for ($i = 0; $i -lt 10; $i++) {
        Start-Sleep -Seconds 1
        try {
            $response = Invoke-WebRequest -Uri "http://127.0.0.1:18790/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Step "Copilot Bridge: UP"
                $ready = $true
                break
            }
        } catch { }
    }
    if (-not $ready) {
        Write-Warn "Copilot Bridge may not be ready. Check: $BridgeLog"
    }
}

# ── Start OpenClaw Gateway ────────────────────────────────────────────
function Start-OpenClawGateway {
    $openclawCmd = Get-OpenClawCmdPath
    $openclawEntry = Get-OpenClawCliEntryPath
    if (-not $openclawCmd -and -not $openclawEntry) {
        Write-Warn "openclaw not found. Run: npm install -g openclaw@latest"
        return
    }

    $fnmLauncher = Get-OpenClawLauncherArgs

    Ensure-OpenClawAuthToken

    $configPath = Join-Path $HOME '.openclaw\openclaw.json'
    if (-not (Test-Path $configPath)) {
        Write-Warn "OpenClaw config missing at $configPath. Running non-interactive onboard (mode=local)..."

        $setupOut = Join-Path $LogDir 'openclaw_onboard.out.log'
        $setupErr = Join-Path $LogDir 'openclaw_onboard.err.log'
        try {
            Remove-Item -Force -ErrorAction SilentlyContinue $setupOut, $setupErr
        } catch { }

        try {
            # Non-interactive onboarding requires explicit risk acknowledgement.
            $onboardArgs = @(
                'onboard',
                '--non-interactive',
                '--accept-risk',
                '--mode','local',
                '--gateway-auth','token',
                '--gateway-bind','loopback',
                '--gateway-port','18789',
                '--gateway-token',$env:OPENCLAW_AUTH_TOKEN,
                '--skip-channels',
                '--skip-skills',
                '--skip-ui',
                '--skip-daemon',
                '--skip-health'
            )

            if ($fnmLauncher -and $openclawEntry) {
                $setupProc = Start-Process -FilePath $fnmLauncher.FilePath -ArgumentList @($fnmLauncher.Args + @('node',$openclawEntry) + $onboardArgs) -RedirectStandardOutput $setupOut -RedirectStandardError $setupErr -WindowStyle Hidden -PassThru
            } elseif ($openclawCmd) {
                $setupProc = Start-Process -FilePath $openclawCmd -ArgumentList $onboardArgs -RedirectStandardOutput $setupOut -RedirectStandardError $setupErr -WindowStyle Hidden -PassThru
            } else {
                throw 'No usable OpenClaw launcher found for onboard.'
            }

            if (-not ($setupProc.WaitForExit(120000))) {
                try { $setupProc.Kill() } catch { }
                throw 'openclaw setup timed out after 120s.'
            }
            if ($setupProc.ExitCode -ne 0) {
                throw "openclaw onboard failed with exit code $($setupProc.ExitCode)."
            }
        } catch {
            Write-Warn "OpenClaw onboard failed: $($_.Exception.Message)"
            try {
                if (Test-Path $setupErr) { Get-Content -Path $setupErr -Tail 120 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host $_ } }
                if (Test-Path $setupOut) { Get-Content -Path $setupOut -Tail 120 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host $_ } }
            } catch { }
            return
        }

        if (-not (Test-Path $configPath)) {
            Write-Warn "OpenClaw setup finished but config still missing at $configPath"
            return
        }
        Write-Step "OpenClaw onboard complete."
    }

    # If already listening, don't start a second instance.
    if (Test-LocalTcpPortOpen -Port 18789 -TimeoutMs 200) {
        Write-Step "OpenClaw Gateway already listening on 18789."
        return
    }

    Write-Step "Starting OpenClaw Gateway (God Mode)..."
    Set-Location $ProjectRoot

    $gatewayLog = Join-Path $LogDir "openclaw_agent.log"
    $gatewayErr = Join-Path $LogDir "openclaw_agent.err.log"

    # Prefer loopback-only bind by default.
    $gatewayArgs = @('gateway','--allow-unconfigured','--auth','token','--bind','loopback','--port','18789','--force','run')

    # Explicitly pass token as a flag too (in addition to env) to avoid env propagation surprises.
    if ($env:OPENCLAW_AUTH_TOKEN) {
        $gatewayArgs = @('gateway','--allow-unconfigured','--auth','token','--token',$env:OPENCLAW_AUTH_TOKEN,'--bind','loopback','--port','18789','--force','run')
    }

    try {
        if ($fnmLauncher) {
            if (-not $openclawEntry) {
                throw "OpenClaw CLI entry not found at expected global install location."
            }

            # Log the runtime node version used by fnm for evidence.
            $fnmNodeVer = (& $fnmLauncher.FilePath @($fnmLauncher.Args + @('node','--version')) 2>$null)
            if ($fnmNodeVer) { Write-Step "fnm Node.js: $fnmNodeVer" }

            # Run the CLI entrypoint directly under Node 22 to avoid cmd.exe quoting issues.
            $proc = Start-Process -FilePath $fnmLauncher.FilePath -ArgumentList @($fnmLauncher.Args + @('node',$openclawEntry) + $gatewayArgs) `
                -RedirectStandardOutput $gatewayLog `
                -RedirectStandardError $gatewayErr `
                -WindowStyle Hidden -PassThru
        } else {
            # Fallback: run openclaw.cmd directly without fnm.
            if (-not $openclawCmd) {
                throw "openclaw.cmd not found; cannot start gateway without fnm."
            }
            $proc = Start-Process -FilePath $openclawCmd -ArgumentList $gatewayArgs `
                -RedirectStandardOutput $gatewayLog `
                -RedirectStandardError $gatewayErr `
                -WindowStyle Hidden -PassThru
        }

        Write-Step "OpenClaw Gateway started (PID $($proc.Id))"
    } catch {
        Write-Warn "Failed to start OpenClaw Gateway: $($_.Exception.Message)"
        Write-Warn "Check logs: $gatewayErr"
        return
    }

    # Readiness check: avoid potentially hanging CLI health checks by probing TCP with a short timeout.
    $portReady = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Milliseconds 500
        if (Test-LocalTcpPortOpen -Port 18789 -TimeoutMs 250) {
            $portReady = $true
            break
        }
    }

    if ($portReady) {
        Write-Step "OpenClaw Gateway: port 18789 is accepting TCP connections."

        # Best-effort: run 'gateway health' with a hard timeout (do not block startup if it hangs).
        $healthOut = Join-Path $LogDir 'openclaw_gateway_health.out.log'
        $healthErr = Join-Path $LogDir 'openclaw_gateway_health.err.log'
        try {
            $healthArgs = @('gateway','--port','18789','--auth','token','health')
            if ($env:OPENCLAW_AUTH_TOKEN) {
                $healthArgs = @('gateway','--port','18789','--auth','token','--token',$env:OPENCLAW_AUTH_TOKEN,'health')
            }

            $quotedCmd = '"' + $openclawCmd + '"'
            $cmdLine = ($quotedCmd + ' ' + ($healthArgs -join ' '))

            if ($fnmLauncher) {
                $healthProc = Start-Process -FilePath $fnmLauncher.FilePath -ArgumentList @($fnmLauncher.Args + @('cmd','/d','/c',$cmdLine)) -RedirectStandardOutput $healthOut -RedirectStandardError $healthErr -WindowStyle Hidden -PassThru
            } else {
                $healthProc = Start-Process -FilePath $openclawCmd -ArgumentList $healthArgs -RedirectStandardOutput $healthOut -RedirectStandardError $healthErr -WindowStyle Hidden -PassThru
            }

            if (-not ($healthProc.WaitForExit(2000))) {
                try { $healthProc.Kill() } catch { }
                Write-Warn "Gateway health probe timed out; leaving gateway running."
            } elseif ($healthProc.ExitCode -eq 0) {
                Write-Step "OpenClaw Gateway: health OK."
            } else {
                Write-Warn "Gateway health probe failed (exit $($healthProc.ExitCode))."
            }
        } catch {
            Write-Warn "Gateway health probe threw: $($_.Exception.Message)"
        }

        return
    }

    Write-Warn "OpenClaw Gateway did not become ready (port 18789 not accepting connections). Dumping last log lines..."
    try {
        if (Test-Path $gatewayErr) {
            Get-Content -Path $gatewayErr -Tail 120 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host $_ }
        }
        if (Test-Path $gatewayLog) {
            Get-Content -Path $gatewayLog -Tail 120 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host $_ }
        }
    } catch { }
}

# ── Main ──────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  OpenClaw God Mode - Anamnese-App DevSecOps Agent" -ForegroundColor Cyan
Write-Host "  Copilot Model Bridge + Autonomous Shell Agent" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

if ($BridgeOnly) {
    Start-CopilotBridge
} elseif ($AgentOnly) {
    Start-OpenClawGateway
} else {
    Start-CopilotBridge
    Start-OpenClawGateway
    Write-Host ""
    Write-Step "All services running:"
    Write-Host "  Copilot Bridge:  http://127.0.0.1:18790/health"
    Write-Host "  OpenClaw Agent:  http://127.0.0.1:18789"
    Write-Host ""
    Write-Host "  curl localhost:18790/v1/models      # Available models"
    Write-Host "  curl localhost:18790/metrics         # Usage stats"
}
