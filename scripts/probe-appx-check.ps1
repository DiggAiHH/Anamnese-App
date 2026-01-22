[CmdletBinding()]
param(
  [string]$IdentityName
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

function Write-Step([string]$message) {
  Write-Host "`n==> $message" -ForegroundColor Cyan
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$buildLogsDir = Join-Path $repoRoot 'buildLogs'
New-Item -ItemType Directory -Path $buildLogsDir -Force | Out-Null

$transcribing = $false
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$transcriptPath = Join-Path $buildLogsDir "appx_check_${timestamp}.log"
$latestTranscriptPath = Join-Path $buildLogsDir 'appx_check_latest.log'

try {
  Start-Transcript -Path $transcriptPath -Force | Out-Null
  $transcribing = $true
} catch {
}

try {
  if ([string]::IsNullOrWhiteSpace($IdentityName)) {
    $manifestSource = Join-Path (Join-Path $repoRoot 'windows') 'anamnese-mobile\Package.appxmanifest'
    Write-Step "Reading Identity from manifest: $manifestSource"
    if (Test-Path $manifestSource) {
      [xml]$pkgManifest = Get-Content -Path $manifestSource
      $IdentityName = [string]$pkgManifest.Package.Identity.Name
    }
  }

  if ([string]::IsNullOrWhiteSpace($IdentityName)) {
    Write-Host 'Could not determine IdentityName.' -ForegroundColor Yellow
    exit 2
  }

  Write-Step "Get-AppxPackage for: $IdentityName"
  $pkg = Get-AppxPackage | Where-Object { $_.Name -eq $IdentityName } | Select-Object -First 1
  if (-not $pkg) {
    Write-Host 'NOT INSTALLED' -ForegroundColor Yellow
    exit 1
  }

  $pkg | Select-Object Name, PackageFullName, PackageFamilyName, Status, IsDevelopmentMode, InstallLocation |
    Format-List | Out-String -Width 300 | Write-Host

  Write-Step 'AppId / AUMID'
  $aumid = "$($pkg.PackageFamilyName)!App"
  Write-Host "AUMID: $aumid" -ForegroundColor Yellow

} finally {
  if ($transcribing) {
    try { Stop-Transcript | Out-Null } catch { }
    try { Copy-Item -Path $transcriptPath -Destination $latestTranscriptPath -Force } catch { }
  }
}
