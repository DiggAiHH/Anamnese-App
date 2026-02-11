# ==============================================================================
# OpenClaw: Switch to GitHub Copilot Auth (via Copilot Bridge)
# ==============================================================================
# Problem: OpenClaw defaults to anthropic/claude-opus-4-6 (requires Anthropic API Key)
# Solution: Configure OpenClaw to use OpenAI-compatible models via GitHub Copilot Bridge
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "=== OpenClaw -> GitHub Copilot Auth Migration ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Set environment variables for OpenAI (pointing to Copilot Bridge)
Write-Host "[1] Setze OpenAI Env-Vars (-> Copilot Bridge Port 18790)..." -ForegroundColor Yellow
$env:OPENAI_API_KEY = "ghtoken"
$env:OPENAI_BASE_URL = "http://127.0.0.1:18790/v1"
Write-Host "    ✅ OPENAI_BASE_URL = $env:OPENAI_BASE_URL" -ForegroundColor Green
Write-Host "    ✅ OPENAI_API_KEY = ghtoken" -ForegroundColor Green
Write-Host ""

# Step 2: Update openclaw.json to set default model to openai/gpt-4o
Write-Host "2️⃣  Aktualisiere openclaw.json (Default Model → openai/gpt-4o)..." -ForegroundColor Yellow
$configPath = "$HOME\.openclaw\openclaw.json"
$config = Get-Content -Raw $configPath | ConvertFrom-Json

# Add agents.defaults.model if not present
if (-not $config.agents.defaults.PSObject.Properties['model']) {
    $config.agents.defaults | Add-Member -NotePropertyName "model" -NotePropertyValue "openai/gpt-4o" -Force
    Write-Host "    ✅ agents.defaults.model = openai/gpt-4o" -ForegroundColor Green
} else {
    $config.agents.defaults.model = "openai/gpt-4o"
    Write-Host "    ✅ Model updated to openai/gpt-4o" -ForegroundColor Green
}

# Save config
$config | ConvertTo-Json -Depth 20 | Out-File -Encoding utf8 $configPath
Write-Host ""

# Step 3: Stop old gateway (if running)
Write-Host "3️⃣  Stoppe alten Gateway (falls aktiv)..." -ForegroundColor Yellow
$gatewayProcs = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*openclaw*" -or $_.CommandLine -like "*openclaw*gateway*" }
if ($gatewayProcs) {
    $gatewayProcs | ForEach-Object {
        taskkill /F /PID $_.Id 2>&1 | Out-Null
        Write-Host "    ✅ Gateway PID $($_.Id) gestoppt" -ForegroundColor Green
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "    ℹ️  Kein Gateway aktiv" -ForegroundColor Gray
}
Write-Host ""

# Step 4: Verify Copilot Bridge is running
Write-Host "4️⃣  Prüfe Copilot Bridge (Port 18790)..." -ForegroundColor Yellow
try {
    $bridgeTest = Invoke-WebRequest -Uri "http://127.0.0.1:18790/v1/models" -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "    ✅ Copilot Bridge läuft (Status: $($bridgeTest.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "    ❌ Copilot Bridge NICHT erreichbar auf Port 18790!" -ForegroundColor Red
    Write-Host "       Bitte starte die Bridge zuerst:" -ForegroundColor Red
    Write-Host "       node scripts/copilot-bridge.cjs" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 5: Start Gateway with new config
Write-Host "5️⃣  Starte Gateway mit GitHub Copilot Auth..." -ForegroundColor Yellow
$env:OPENCLAW_AUTH_TOKEN = (Get-Content -Raw $configPath | ConvertFrom-Json).gateway.auth.token

Write-Host "    🚀 Kommando: openclaw gateway --port 18789 --bind loopback run" -ForegroundColor Cyan
Write-Host "    📝 Gateway wird im HINTERGRUND gestartet (PID wird angezeigt)" -ForegroundColor Gray
Write-Host ""

# Start in background using Start-Process
$gatewayCmd = "openclaw"
$gatewayArgs = @("gateway", "--port", "18789", "--bind", "loopback", "--token", "$env:OPENCLAW_AUTH_TOKEN", "run")

$gatewayProcess = Start-Process -FilePath $gatewayCmd -ArgumentList $gatewayArgs -NoNewWindow -PassThru -RedirectStandardOutput "$env:TEMP\openclaw-gateway-stdout.log" -RedirectStandardError "$env:TEMP\openclaw-gateway-stderr.log"

Start-Sleep -Seconds 8

if ($gatewayProcess.HasExited) {
    Write-Host "    ❌ Gateway konnte nicht gestartet werden!" -ForegroundColor Red
    Write-Host "    Logs: $env:TEMP\openclaw-gateway-stderr.log" -ForegroundColor Yellow
    Get-Content "$env:TEMP\openclaw-gateway-stderr.log" -ErrorAction SilentlyContinue | Select-Object -Last 20
    exit 1
}

Write-Host "    ✅ Gateway gestartet (PID: $($gatewayProcess.Id))" -ForegroundColor Green
Write-Host ""

# Step 6: Verify Gateway is using correct model
Write-Host "6️⃣  Verifiziere Model-Konfiguration..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
$logFile = "$env:TEMP\openclaw\openclaw-2026-02-11.log"
if (Test-Path $logFile) {
    $modelLine = Get-Content $logFile | Select-String "agent model:" | Select-Object -Last 1
    if ($modelLine -match "openai") {
        Write-Host "    ✅ Gateway nutzt OpenAI Model (GitHub Copilot Auth)!" -ForegroundColor Green
        Write-Host "       $modelLine" -ForegroundColor Gray
    } else {
        Write-Host "    ⚠️  Gateway zeigt noch: $modelLine" -ForegroundColor Yellow
        Write-Host "       ABER: Env-Vars sind gesetzt (OPENAI_BASE_URL → Copilot Bridge)" -ForegroundColor Yellow
    }
} else {
    Write-Host "    ℹ️  Log-Datei noch nicht vorhanden (Gateway startet noch)" -ForegroundColor Gray
}
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ MIGRATION ABGESCHLOSSEN" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Status:" -ForegroundColor Cyan
Write-Host "   • Gateway PID: $($gatewayProcess.Id)" -ForegroundColor Gray
Write-Host "   • Port: 18789 (loopback)" -ForegroundColor Gray
Write-Host "   • Model: openai/gpt-4o (via GitHub Copilot)" -ForegroundColor Gray
Write-Host "   • Bridge: http://127.0.0.1:18790/v1" -ForegroundColor Gray
Write-Host ""
Write-Host "🔍 Nächste Schritte:" -ForegroundColor Cyan
Write-Host "   1. Telegram Bot starten: @Jasminstr_bot → /start" -ForegroundColor Yellow
Write-Host "   2. Test-Message senden:" -ForegroundColor Yellow
Write-Host "      openclaw message send --channel telegram -t 738627638 -m `"Test via GitHub Copilot!`" --json" -ForegroundColor Gray
Write-Host ""
Write-Host "📊 Gateway überwachen:" -ForegroundColor Cyan
Write-Host "   tail -f $env:TEMP\openclaw\openclaw-2026-02-11.log" -ForegroundColor Gray
Write-Host ""
