<#
.SYNOPSIS
    Install OpenClaw Windows Startup Task
.DESCRIPTION
    Creates a Windows Task Scheduler task to automatically start OpenClaw
    when Windows boots up. Requires Administrator privileges.
.NOTES
    Run as Administrator:
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-openclaw-startup.ps1
#>

#Requires -RunAsAdministrator

[CmdletBinding()]
param(
    [switch]$Uninstall
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$TaskName = "OpenClaw Startup"
$TaskDescription = "Automatically start OpenClaw (Copilot Bridge + Agent) on Windows startup"
$ScriptDir = Split-Path -Parent $PSCommandPath
$ProjectRoot = Split-Path -Parent $ScriptDir
$StartupScriptPath = Join-Path $ScriptDir "openclaw-windows-startup.ps1"

function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Info    { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn    { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Fail    { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }

Write-Info "OpenClaw Windows Startup Installer"
Write-Info "Project Root: $ProjectRoot"
Write-Info "Startup Script: $StartupScriptPath"

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Fail "This script must be run as Administrator!"
    Write-Info "Right-click PowerShell and select 'Run as Administrator', then run this script again."
    exit 1
}

# Check if startup script exists
if (-not (Test-Path $StartupScriptPath)) {
    Write-Fail "Startup script not found: $StartupScriptPath"
    exit 1
}

# Uninstall mode
if ($Uninstall) {
    Write-Info "Uninstalling OpenClaw startup task..."
    
    $existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    
    if ($existingTask) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Success "OpenClaw startup task removed successfully"
    } else {
        Write-Warn "Task '$TaskName' not found. Nothing to uninstall."
    }
    
    exit 0
}

# Install mode
Write-Info "Installing OpenClaw startup task..."

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Warn "Task '$TaskName' already exists. Removing old task..."
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Create task action
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$StartupScriptPath`"" `
    -WorkingDirectory $ProjectRoot

# Create task trigger (at startup, with 60 second delay to allow system services to start)
$trigger = New-ScheduledTaskTrigger -AtStartup
$trigger.Delay = "PT1M"  # 1 minute delay

# Create task settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

# Create task principal (run as current user)
$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType S4U `
    -RunLevel Highest

# Register the task
try {
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Description $TaskDescription `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Force | Out-Null
    
    Write-Success "OpenClaw startup task installed successfully!"
    Write-Info ""
    Write-Info "Task Details:"
    Write-Info "  Name: $TaskName"
    Write-Info "  Trigger: At Windows startup (with 1 minute delay)"
    Write-Info "  Script: $StartupScriptPath"
    Write-Info ""
    Write-Info "To view the task:"
    Write-Info "  - Open Task Scheduler (taskschd.msc)"
    Write-Info "  - Navigate to 'Task Scheduler Library'"
    Write-Info "  - Find '$TaskName'"
    Write-Info ""
    Write-Info "To test the task now:"
    Write-Info "  Start-ScheduledTask -TaskName '$TaskName'"
    Write-Info ""
    Write-Info "To uninstall:"
    Write-Info "  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-openclaw-startup.ps1 -Uninstall"
    
} catch {
    Write-Fail "Failed to register scheduled task: $_"
    exit 1
}

Write-Success "Installation complete!"
