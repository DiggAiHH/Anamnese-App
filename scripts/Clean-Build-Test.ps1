<#
.SYNOPSIS
    Clean-Build-Test.ps1 — Full clean build + test pipeline for Anamnese-App
.DESCRIPTION
    Adapted from C#/.NET "TreatWarningsAsErrors" pattern for React Native / TypeScript.
    Phases:
      1. Kill stale processes (Metro, Node)
      2. Clean build artifacts
      3. npm ci (deterministic install)
      4. TypeScript strict type-check (zero errors = pass)
      5. Jest full suite (zero failures = pass)
      6. Optional: react-native-windows release bundle
    All output captured to buildLogs/ for CI evidence.
.PARAMETER SkipInstall
    Skip npm ci (useful for re-runs after dependency change)
.PARAMETER IncludeWindowsBuild
    Also run react-native-windows release build
.PARAMETER Coverage
    Run Jest with --coverage
.EXAMPLE
    .\scripts\Clean-Build-Test.ps1
    .\scripts\Clean-Build-Test.ps1 -Coverage -IncludeWindowsBuild
#>

param(
    [switch]$SkipInstall,
    [switch]$IncludeWindowsBuild,
    [switch]$Coverage
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$LogDir = Join-Path $ProjectRoot 'buildLogs'
if (!(Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

$Timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$SummaryLog = Join-Path $LogDir "build_summary_$Timestamp.log"

function Write-Step {
    param([string]$Step, [string]$Message)
    $line = "[$(Get-Date -Format 'HH:mm:ss')] [$Step] $Message"
    Write-Host $line -ForegroundColor Cyan
    Add-Content -Path $SummaryLog -Value $line
}

function Write-Result {
    param([string]$Step, [bool]$Success, [string]$Detail = '')
    $status = if ($Success) { 'PASS' } else { 'FAIL' }
    $color = if ($Success) { 'Green' } else { 'Red' }
    $line = "[$(Get-Date -Format 'HH:mm:ss')] [$Step] $status $Detail"
    Write-Host $line -ForegroundColor $color
    Add-Content -Path $SummaryLog -Value $line
    if (!$Success) { throw "$Step FAILED: $Detail" }
}

# ── Phase 1: Kill Stale Processes ──────────────────────────────────
Write-Step 'CLEAN' 'Killing stale Metro/Node processes...'
Get-Process -Name 'node' -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'metro|react-native' } |
    Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# ── Phase 2: Clean Build Artifacts ─────────────────────────────────
Write-Step 'CLEAN' 'Removing build caches...'
$CacheDirs = @(
    'android/app/build',
    'windows/x64',
    'windows/ARM64',
    'tmp'
)
foreach ($dir in $CacheDirs) {
    $fullPath = Join-Path $ProjectRoot $dir
    if (Test-Path $fullPath) {
        Remove-Item -Recurse -Force $fullPath
        Write-Step 'CLEAN' "  Removed: $dir"
    }
}

# Clear Metro cache
$MetroCache = Join-Path $env:TEMP 'metro-cache'
if (Test-Path $MetroCache) {
    Remove-Item -Recurse -Force $MetroCache -ErrorAction SilentlyContinue
    Write-Step 'CLEAN' '  Removed: metro-cache'
}

Write-Result 'CLEAN' $true 'Build artifacts cleaned'

# ── Phase 3: npm ci ───────────────────────────────────────────────
if (!$SkipInstall) {
    Write-Step 'INSTALL' 'Running npm ci...'
    $installLog = Join-Path $LogDir "npm_ci_$Timestamp.log"
    & npm.cmd ci --prefer-offline 2>&1 | Out-File -FilePath $installLog -Encoding utf8
    $installExit = $LASTEXITCODE
    Write-Result 'INSTALL' ($installExit -eq 0) "Exit code: $installExit (log: $installLog)"
} else {
    Write-Step 'INSTALL' 'Skipped (--SkipInstall)'
}

# ── Phase 4: TypeScript Strict Type-Check ──────────────────────────
# Equivalent to TreatWarningsAsErrors in MSBuild:
# tsc --noEmit produces ZERO output on success, any output = failure.
Write-Step 'TYPECHECK' 'Running tsc --noEmit (strict mode, zero errors required)...'
$tscLog = Join-Path $LogDir "typecheck_$Timestamp.log"
& npx.cmd tsc --noEmit 2>&1 | Out-File -FilePath $tscLog -Encoding utf8
$tscContent = Get-Content -Path $tscLog -Raw -ErrorAction SilentlyContinue
$tscPass = [string]::IsNullOrWhiteSpace($tscContent)
Write-Result 'TYPECHECK' $tscPass "$(if (!$tscPass) { $tscContent.Trim() } else { 'Zero errors' })"

# ── Phase 5: Jest Full Suite ──────────────────────────────────────
Write-Step 'TEST' 'Running Jest full suite...'
$jestLog = Join-Path $LogDir "jest_$Timestamp.log"
$jestArgs = @('jest', '--forceExit')
if ($Coverage) { $jestArgs += '--coverage' } else { $jestArgs += '--no-coverage' }
& npx.cmd @jestArgs 2>&1 | Out-File -FilePath $jestLog -Encoding utf8

# Parse Jest results
$jestContent = Get-Content -Path $jestLog -Raw -ErrorAction SilentlyContinue
$failMatch = [regex]::Match($jestContent, 'Tests:\s+(\d+)\s+failed')
$passMatch = [regex]::Match($jestContent, '(\d+)\s+passed')
$totalMatch = [regex]::Match($jestContent, '(\d+)\s+total\s*$', [System.Text.RegularExpressions.RegexOptions]::Multiline)

$failCount = if ($failMatch.Success) { [int]$failMatch.Groups[1].Value } else { 0 }
$passCount = if ($passMatch.Success) { [int]$passMatch.Groups[1].Value } else { 0 }

$jestPass = ($failCount -eq 0) -and ($passCount -gt 0)
Write-Result 'TEST' $jestPass "$passCount passed, $failCount failed (log: $jestLog)"

# ── Phase 6: Windows Release Build (optional) ─────────────────────
if ($IncludeWindowsBuild) {
    Write-Step 'BUILD-WIN' 'Bundling for Windows (release)...'
    $bundleLog = Join-Path $LogDir "bundle_windows_$Timestamp.log"
    & npx.cmd react-native bundle `
        --platform windows `
        --dev false `
        --entry-file index.js `
        --bundle-output "windows\Bundle\index.windows.bundle" `
        --assets-dest "windows\Bundle" `
        2>&1 | Out-File -FilePath $bundleLog -Encoding utf8
    $bundleExit = $LASTEXITCODE
    Write-Result 'BUILD-WIN' ($bundleExit -eq 0) "Exit code: $bundleExit (log: $bundleLog)"
}

# ── Summary ────────────────────────────────────────────────────────
Write-Host ''
Write-Host '══════════════════════════════════════════════════════' -ForegroundColor White
Write-Host '  BUILD PIPELINE COMPLETE' -ForegroundColor Green
Write-Host "  TypeCheck:  PASS (0 errors)" -ForegroundColor Green
Write-Host "  Tests:      $passCount passed, $failCount failed" -ForegroundColor $(if ($jestPass) { 'Green' } else { 'Red' })
Write-Host "  Logs:       $LogDir" -ForegroundColor Gray
Write-Host "  Summary:    $SummaryLog" -ForegroundColor Gray
Write-Host '══════════════════════════════════════════════════════' -ForegroundColor White
