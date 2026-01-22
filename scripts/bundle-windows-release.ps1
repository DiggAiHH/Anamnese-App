[CmdletBinding()]
param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$EntryFile = 'index.js'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step([string]$message) {
  Write-Host "\n==> $message" -ForegroundColor Cyan
}

Write-Step "Bundling JS for Windows Release (RepoRoot=$RepoRoot)"

# NOTE: metro.config.js in this repo blocklists the entire windows/ folder.
# Bundle into tmp/ and then copy into windows/anamnese-mobile/Bundle for packaging.
$bundleStageDir = Join-Path $RepoRoot 'tmp\\windows-bundle-stage'
$bundleStageAssets = Join-Path $bundleStageDir 'assets'
New-Item -ItemType Directory -Path $bundleStageAssets -Force | Out-Null

$bundleDir = Join-Path $RepoRoot 'windows\\anamnese-mobile\\Bundle'
New-Item -ItemType Directory -Path $bundleDir -Force | Out-Null

$bundleOutput = Join-Path $bundleStageDir 'index.windows.bundle'

# Use npx.cmd to avoid PowerShell execution-policy issues with npx.ps1
$npx = Get-Command npx.cmd -ErrorAction SilentlyContinue
if (-not $npx) {
  throw 'npx.cmd not found in PATH. Install Node.js or add it to PATH.'
}

& $npx react-native bundle --platform windows --dev false --entry-file $EntryFile --bundle-output $bundleOutput --assets-dest $bundleStageAssets
if ($LASTEXITCODE -ne 0) {
  throw "react-native bundle failed with exit code $LASTEXITCODE"
}

if (-not (Test-Path $bundleOutput)) {
  throw "Bundling finished but bundle output was not created: $bundleOutput"
}

Copy-Item -Path $bundleOutput -Destination (Join-Path $bundleDir 'index.windows.bundle') -Force
if (Test-Path $bundleStageAssets) {
  Copy-Item -Path (Join-Path $bundleStageAssets '*') -Destination $bundleDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Bundle copied to: $(Join-Path $bundleDir 'index.windows.bundle')" -ForegroundColor Green
