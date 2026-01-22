[CmdletBinding()]
param(
  [int]$Minutes = 20
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$buildLogsDir = Join-Path $repoRoot 'buildLogs'
New-Item -ItemType Directory -Path $buildLogsDir -Force | Out-Null

$transcribing = $false
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$transcriptPath = Join-Path $buildLogsDir "windows-launch-transcript_${timestamp}.log"
$latestTranscriptPath = Join-Path $buildLogsDir 'windows-launch-transcript_latest.log'

try {
  Start-Transcript -Path $transcriptPath -Force | Out-Null
  $transcribing = $true
} catch {
  # Best-effort only; continue without transcript.
}

try {

function Write-Step([string]$message) {
  Write-Host "`n==> $message" -ForegroundColor Cyan
}

$windowsDir = Join-Path $repoRoot 'windows'
$manifestSource = Join-Path $windowsDir 'anamnese-mobile\Package.appxmanifest'

Write-Step "Repo root: $repoRoot"

if (-not (Test-Path $manifestSource)) {
  throw "Package manifest not found: $manifestSource"
}

Write-Step 'Reading Identity from Package.appxmanifest'
[xml]$pkgManifest = Get-Content -Path $manifestSource
$identityName = [string]$pkgManifest.Package.Identity.Name
if ([string]::IsNullOrWhiteSpace($identityName)) {
  throw 'Could not parse Identity Name from Package.appxmanifest.'
}
Write-Host "Identity: $identityName" -ForegroundColor Yellow

Write-Step 'Finding installed package'
$pkg = $null
try {
  $pkg = Get-AppxPackage -Name $identityName -ErrorAction SilentlyContinue | Select-Object -First 1
} catch {
  $pkg = $null
}

if (-not $pkg) {
  $pkg = Get-AppxPackage | Where-Object {
    $_.Name -like ($identityName + '*') -or
    $_.PackageFamilyName -like ($identityName + '*')
  } | Select-Object -First 1
}

if (-not $pkg) {
  Write-Host "Package not installed for current user: $identityName" -ForegroundColor Yellow
  Write-Host 'Fix: install it first (creates AppPackages + installs):' -ForegroundColor Yellow
  Write-Host '  npm.cmd run windows:run' -ForegroundColor Yellow
  Write-Host 'Or install latest AppPackages without rebuild:' -ForegroundColor Yellow
  Write-Host '  npm.cmd run windows:run:skipbuild:log' -ForegroundColor Yellow
  exit 2
}

$aumid = "$($pkg.PackageFamilyName)!App"
Write-Host "AUMID: $aumid" -ForegroundColor Yellow

Write-Step 'Launching'
try {
  Start-Process -FilePath 'explorer.exe' -ArgumentList "shell:AppsFolder\$aumid" | Out-Null
} catch {
  Write-Host "explorer.exe launch failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

try {
  Start-Process "shell:AppsFolder\$aumid" | Out-Null
} catch {
  Write-Host "Start-Process shell:AppsFolder launch failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Start-Sleep -Seconds 2

Write-Step 'Process check'
$proc = @(Get-Process -Name 'anamnese-mobile' -ErrorAction SilentlyContinue)
if ($null -eq $proc -or $proc.Count -eq 0) {
  Write-Host "App process is NOT running after launch attempt." -ForegroundColor Yellow

  $startTime = (Get-Date).AddMinutes(-1 * [Math]::Abs($Minutes))

  Write-Step "Recent Application crash/WER events (since $startTime)"
  try {
    Get-WinEvent -FilterHashtable @{ LogName = 'Application'; StartTime = $startTime } -ErrorAction Stop |
      Where-Object {
        ($_.ProviderName -in @('Application Error', 'Windows Error Reporting')) -and
        ($_.Message -match 'anamnese-mobile')
      } |
      Select-Object -First 15 TimeCreated, ProviderName, Id, LevelDisplayName, Message |
      Format-List | Out-String -Width 300 | Write-Host
  } catch {
    Write-Host "Failed to read Application event log: $($_.Exception.Message)" -ForegroundColor Yellow
  }

  Write-Step "Recent AppModel-Runtime/Admin events (since $startTime)"
  try {
    Get-WinEvent -FilterHashtable @{ LogName = 'Microsoft-Windows-AppModel-Runtime/Admin'; StartTime = $startTime } -ErrorAction Stop |
      Where-Object { $_.Message -match 'anamnese-mobile' -or $_.Message -match [regex]::Escape($pkg.PackageFamilyName) } |
      Select-Object -First 20 TimeCreated, ProviderName, Id, LevelDisplayName, Message |
      Format-List | Out-String -Width 300 | Write-Host
  } catch {
    Write-Host "Failed to read AppModel-Runtime/Admin event log: $($_.Exception.Message)" -ForegroundColor Yellow
  }
} else {
  Write-Host "App process is running (PID(s): $($proc.Id -join ', '))" -ForegroundColor Green
}

} finally {
  if ($transcribing) {
    try { Stop-Transcript | Out-Null } catch { }
    try { Copy-Item -Path $transcriptPath -Destination $latestTranscriptPath -Force } catch { }
  }
}
