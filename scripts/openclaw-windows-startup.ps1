<#
.SYNOPSIS
    OpenClaw Windows Startup Script
.DESCRIPTION
    Automatically starts OpenClaw (Bridge + Agent) when Windows starts.
    This script is designed to be run by Windows Task Scheduler at system startup.
.NOTES
    Installation: Run scripts\install-openclaw-startup.ps1 as Administrator
#>

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

# Determine project root (assuming script is in scripts\ subdirectory)
$ScriptDir = Split-Path -Parent $PSCommandPath
$ProjectRoot = Split-Path -Parent $ScriptDir
$LogDir = Join-Path $ProjectRoot "buildLogs\openclaw"
$StartupLog = Join-Path $LogDir "startup_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# Ensure log directory exists
if (-not (Test-Path $LogDir)) {
    New-Item -Path $LogDir -ItemType Directory -Force | Out-Null
}

# Function to log messages
function Write-StartupLog {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Add-Content -Path $StartupLog -Value $logMessage
    Write-Host $logMessage
}

Write-StartupLog "===== OpenClaw Windows Startup ====="
Write-StartupLog "Project Root: $ProjectRoot"

# Wait for network to be available (important for GitHub API calls)
Write-StartupLog "Waiting for network connectivity..."
$maxWaitSeconds = 30
$waited = 0
while ($waited -lt $maxWaitSeconds) {
    try {
        $ping = Test-Connection -ComputerName 8.8.8.8 -Count 1 -Quiet -ErrorAction SilentlyContinue
        if ($ping) {
            Write-StartupLog "Network is available"
            break
        }
    } catch {
        # Continue waiting
    }
    Start-Sleep -Seconds 2
    $waited += 2
}

if ($waited -ge $maxWaitSeconds) {
    Write-StartupLog "WARNING: Network not available after $maxWaitSeconds seconds. Continuing anyway..."
}

# Check if GITHUB_TOKEN is set
if (-not $env:GITHUB_TOKEN) {
    Write-StartupLog "WARNING: GITHUB_TOKEN environment variable is not set."
    Write-StartupLog "OpenClaw Copilot Bridge requires GITHUB_TOKEN for API access."
    Write-StartupLog "Please set it in System Environment Variables."
}

# Change to project root
Set-Location $ProjectRoot
Write-StartupLog "Changed to project directory: $ProjectRoot"

# Check if node_modules exists
if (-not (Test-Path (Join-Path $ProjectRoot "node_modules"))) {
    Write-StartupLog "WARNING: node_modules not found. Run 'npm install' first."
    exit 1
}

# Start OpenClaw using the existing startup script
Write-StartupLog "Starting OpenClaw stack..."
$startScriptPath = Join-Path $ScriptDir "openclaw-start.ps1"

if (Test-Path $startScriptPath) {
    try {
        # Run the start script
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $startScriptPath
        Write-StartupLog "OpenClaw startup script executed"
    } catch {
        Write-StartupLog "ERROR: Failed to start OpenClaw: $_"
        exit 1
    }
} else {
    Write-StartupLog "ERROR: OpenClaw start script not found at: $startScriptPath"
    exit 1
}

Write-StartupLog "OpenClaw Windows startup completed"
Write-StartupLog "Check status: npm run openclaw:status"
Write-StartupLog "View logs: $LogDir"
