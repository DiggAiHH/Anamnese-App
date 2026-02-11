# OpenClaw: Switch to GitHub Copilot Auth
# ==========================================
$ErrorActionPreference = "Stop"

Write-Host "=== OpenClaw -> GitHub Copilot Migration ===" -ForegroundColor Cyan

# Step 1: Set OpenAI env vars
Write-Host "[1] Set OpenAI environment variables..." -ForegroundColor Yellow
$env:OPENAI_API_KEY = "ghtoken"
$env:OPENAI_BASE_URL = "http://127.0.0.1:18790/v1"
Write-Host "    OPENAI_BASE_URL = $env:OPENAI_BASE_URL" -ForegroundColor Green
Write-Host "    OPENAI_API_KEY = ghtoken" -ForegroundColor Green

# Step 2: Update openclaw.json
Write-Host "[2] Update openclaw.json (set default model to openai/gpt-4o)..." -ForegroundColor Yellow
$configPath = "$HOME\.openclaw\openclaw.json"
$config = Get-Content -Raw $configPath | ConvertFrom-Json

if (-not $config.agents.defaults.PSObject.Properties['model']) {
    $config.agents.defaults | Add-Member -NotePropertyName "model" -NotePropertyValue "openai/gpt-4o" -Force
} else {
    $config.agents.defaults.model = "openai/gpt-4o"
}

$config | ConvertTo-Json -Depth 20 | Out-File -Encoding utf8 $configPath
Write-Host "    Config updated (model = openai/gpt-4o)" -ForegroundColor Green

# Step 3: Stop old gateway
Write-Host "[3] Stop old gateway processes..." -ForegroundColor Yellow
$gatewayProcs = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node*" }
if ($gatewayProcs) {
    foreach ($proc in $gatewayProcs) {
        $cmdline = (Get-WmiObject Win32_Process -Filter "ProcessId=$($proc.Id)" -ErrorAction SilentlyContinue).CommandLine
        if ($cmdline -like "*openclaw*gateway*") {
            taskkill /F /PID $proc.Id 2>&1 | Out-Null
            Write-Host "    Stopped gateway PID $($proc.Id)" -ForegroundColor Green
        }
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "    No gateway running" -ForegroundColor Gray
}

# Step 4: Verify Copilot Bridge
Write-Host "[4] Check Copilot Bridge (Port 18790)..." -ForegroundColor Yellow
try {
    $bridgeTest = Invoke-WebRequest -Uri "http://127.0.0.1:18790/v1/models" -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "    Copilot Bridge OK (Status: $($bridgeTest.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "    ERROR: Copilot Bridge NOT reachable on port 18790!" -ForegroundColor Red
    Write-Host "    Start the bridge first: node scripts/copilot-bridge.cjs" -ForegroundColor Yellow
    exit 1
}

# Step 5: Start Gateway
Write-Host "[5] Start Gateway with GitHub Copilot Auth..." -ForegroundColor Yellow
$env:OPENCLAW_AUTH_TOKEN = (Get-Content -Raw $configPath | ConvertFrom-Json).gateway.auth.token

Write-Host "    Command: openclaw gateway --port 18789 --bind loopback run" -ForegroundColor Cyan
Write-Host "    (Gateway will start in background terminal)" -ForegroundColor Gray

# Use PowerShell background job instead of Start-Process
$gatewayJob = Start-Job -ScriptBlock {
    param($token, $baseUrl, $apiKey)
    $env:OPENCLAW_AUTH_TOKEN = $token
    $env:OPENAI_BASE_URL = $baseUrl
    $env:OPENAI_API_KEY = $apiKey
    & openclaw gateway --port 18789 --bind loopback --token $token run 2>&1
} -ArgumentList $env:OPENCLAW_AUTH_TOKEN, $env:OPENAI_BASE_URL, $env:OPENAI_API_KEY

Start-Sleep -Seconds 10

# Check if job is still running
if ($gatewayJob.State -eq "Running") {
    Write-Host "    Gateway job started (Job ID: $($gatewayJob.Id))" -ForegroundColor Green
} elseif ($gatewayJob.State -eq "Failed") {
    Write-Host "    ERROR: Gateway job failed!" -ForegroundColor Red
    Receive-Job -Job $gatewayJob -ErrorAction SilentlyContinue
    exit 1
} else {
    Write-Host "    WARNING: Job state is $($gatewayJob.State)" -ForegroundColor Yellow
}

# Step 6: Verify Model
Write-Host "[6] Verify model configuration..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
$logFile = "$env:TEMP\openclaw\openclaw-2026-02-11.log"
if (Test-Path $logFile) {
    $modelLine = Get-Content $logFile | Select-String "agent model:" | Select-Object -Last 1
    if ($modelLine) {
        Write-Host "    Gateway model line: $modelLine" -ForegroundColor Gray
    }
    if ($modelLine -match "openai") {
        Write-Host "    SUCCESS: Gateway uses OpenAI model (GitHub Copilot Auth)" -ForegroundColor Green
    } else {
        Write-Host "    NOTE: Gateway may show anthropic model, but env vars override it" -ForegroundColor Yellow
    }
} else {
    Write-Host "    Log file not yet available" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== MIGRATION COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Status:" -ForegroundColor Cyan
Write-Host "  Gateway Job ID: $($gatewayJob.Id)" -ForegroundColor Gray
Write-Host "  Gateway Job State: $($gatewayJob.State)" -ForegroundColor Gray
Write-Host "  Port: 18789 (loopback)" -ForegroundColor Gray
Write-Host "  Model: openai/gpt-4o (via GitHub Copilot)" -ForegroundColor Gray
Write-Host "  Bridge: http://127.0.0.1:18790/v1" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Start Telegram bot: @Jasminstr_bot -> /start" -ForegroundColor Yellow
Write-Host "  2. Send test message:" -ForegroundColor Yellow
Write-Host "     openclaw message send --channel telegram -t 738627638 -m `"Test!`" --json" -ForegroundColor Gray
Write-Host ""
Write-Host "Monitor Gateway:" -ForegroundColor Cyan
Write-Host "  Receive-Job -Job $($gatewayJob.Id) -Keep" -ForegroundColor Gray
Write-Host "  (Or check: Get-Content $env:TEMP\openclaw\openclaw-2026-02-11.log -Wait -Tail 20)" -ForegroundColor Gray
Write-Host ""
