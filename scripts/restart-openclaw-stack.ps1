# Restart OpenClaw Stack with GitHub Auth
# =========================================

Write-Host "`n=== OpenClaw Stack Restart (mit GitHub Copilot Auth) ===" -ForegroundColor Cyan

# Step 1: Stop all current services
Write-Host "`n[1/4] Stoppe alte Services..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object {
    $cmdline = (Get-WmiObject Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue).CommandLine
    if ($cmdline -and ($cmdline -like "*copilot-bridge*" -or $cmdline -like "*proxy*" -or $cmdline -like "*openclaw*gateway*")) {
        Write-Host "  Stopping PID $($_.Id)" -ForegroundColor Gray
        taskkill /F /PID $_.Id 2>&1 | Out-Null
    }
}
Start-Sleep -Seconds 2
Write-Host "  Services gestoppt" -ForegroundColor Green

# Step 2: Verify GitHub token
Write-Host "`n[2/4] Prüfe GitHub Token..." -ForegroundColor Yellow
$ghToken = $null

if ($env:GITHUB_TOKEN) {
    $ghToken = $env:GITHUB_TOKEN
    Write-Host "  Token aus GITHUB_TOKEN: $($ghToken.Substring(0,20))..." -ForegroundColor Green
} elseif ($env:GITHUB_COPILOT_TOKEN) {
    $ghToken = $env:GITHUB_COPILOT_TOKEN
    Write-Host "  Token aus GITHUB_COPILOT_TOKEN: $($ghToken.Substring(0,20))..." -ForegroundColor Green
} else {
    try {
        $ghToken = (gh auth token 2>&1 | Out-String).Trim()
        if ($ghToken -match '^gh[op]_\w+') {
            Write-Host "  Token von gh CLI: $($ghToken.Substring(0,20))..." -ForegroundColor Green
        } else {
            $ghToken = $null
        }
    } catch {
        $ghToken = $null
    }
}

if (-not $ghToken) {
    Write-Host "`n  FEHLER: Kein GitHub Token gefunden!" -ForegroundColor Red
    Write-Host "  Bitte erst einloggen:" -ForegroundColor Yellow
    Write-Host "    gh auth login --scopes copilot --web" -ForegroundColor Gray
    Write-Host "  ODER Token setzen:" -ForegroundColor Yellow
    Write-Host "    `$env:GITHUB_TOKEN = 'dein_token'" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Export token for services
$env:GITHUB_TOKEN = $ghToken

# Step 3: Start Copilot Bridge
Write-Host "`n[3/4] Starte Services..." -ForegroundColor Yellow
Write-Host "  [A] GitHub Copilot Bridge (Port 18790)..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "$PSScriptRoot\copilot-bridge.cjs" -WindowStyle Hidden
Start-Sleep -Seconds 3

# Verify bridge is running
try {
    $bridgeTest = Invoke-WebRequest -Uri "http://127.0.0.1:18790/v1/models" -UseBasicParsing -TimeoutSec 5
    Write-Host "    OK (Status: $($bridgeTest.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "    FEHLER: Bridge nicht erreichbar!" -ForegroundColor Red
    exit 1
}

# Step 4: Start Proxy Write-Host "  [B] Anthropic->OpenAI Proxy (Port 18791)..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "$PSScriptRoot\anthropic-to-openai-proxy.cjs" -WindowStyle Hidden
Start-Sleep -Seconds 2

# Verify proxy
try {
    $proxyTest = Invoke-WebRequest -Uri "http://127.0.0.1:18791" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
} catch {
    if ($_.Exception.Response.StatusCode -eq 405) {
        Write-Host "    OK (Method Not Allowed = expected)" -ForegroundColor Green
    } else {
        Write-Host "    WARNUNG: Proxy möglicherweise nicht OK" -ForegroundColor Yellow
    }
}

# Step 5: Start OpenClaw Gateway
Write-Host "  [C] OpenClaw Gateway (Port 18789)..." -ForegroundColor Cyan
$env:ANTHROPIC_BASE_URL = "http://127.0.0.1:18791"
$env:ANTHROPIC_API_KEY = "github-copilot-proxy-$($ghToken.Substring(0,10))"
$env:OPENCLAW_AUTH_TOKEN = (Get-Content -Raw "$HOME\.openclaw\openclaw.json" | ConvertFrom-Json).gateway.auth.token

Start-Process -FilePath "openclaw" -ArgumentList "gateway","--port","18789","--bind","loopback","--token","$env:OPENCLAW_AUTH_TOKEN","run" -WindowStyle Hidden
Start-Sleep -Seconds 8

Write-Host "    Gateway gestartet" -ForegroundColor Green

# Step 6: Final status
Write-Host "`n[4/4] Status Check..." -ForegroundColor Yellow
$services = @(
    @{ Name="Copilot Bridge"; Port=18790; Path="/v1/models" },
    @{ Name="Proxy"; Port=18791; Path="/" },
    @{ Name="Gateway"; Port=18789; Path="/" }
)

foreach ($svc in $services) {
    try {
        $test = Invoke-WebRequest -Uri "http://127.0.0.1:$($svc.Port)$($svc.Path)" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        Write-Host "  ✓ $($svc.Name) (Port $($svc.Port)): RUNNING" -ForegroundColor Green
    } catch {
        if ($_ -match "websocket|upgrade|405") {
            Write-Host "  ✓ $($svc.Name) (Port $($svc.Port)): RUNNING" -ForegroundColor Green
        } else {
            Write-Host "  × $($svc.Name) (Port $($svc.Port)): OFFLINE" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== STACK READY ===" -ForegroundColor Green
Write-Host ""
Write-Host "OpenClaw nutzt jetzt GitHub Copilot via Bridge!" -ForegroundColor Cyan
Write-Host "Telegram Bot: @Jasminstr_bot" -ForegroundColor Gray
Write-Host ""
Write-Host "Nächster Schritt:" -ForegroundColor Yellow
Write-Host "  1. Starte Bot in Telegram: /start" -ForegroundColor Gray
Write-Host "  2. Teste: openclaw message send --channel telegram -t 738627638 -m `"Test`" --json" -ForegroundColor Gray
Write-Host ""
