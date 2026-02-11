<#
.SYNOPSIS
  Local cross-platform smoke test for Anamnese-App.
  Runs type-check, unit tests, and web build. Optionally probes Windows build.

.DESCRIPTION
  This script performs all CI-equivalent checks locally and writes evidence
  to buildLogs/. Use this before pushing to main to catch issues early.

  Exit codes:
    0 = all checks passed
    1 = one or more checks failed

.PARAMETER SkipTests
  Skip Jest unit tests (useful for quick build-only verification).

.PARAMETER SkipWebBuild
  Skip the webpack production build.

.PARAMETER IncludeWindowsBuild
  Also run the Windows MSBuild (slow, requires VS Build Tools).

.EXAMPLE
  .\scripts\smoke-test.ps1
  .\scripts\smoke-test.ps1 -SkipTests
  .\scripts\smoke-test.ps1 -IncludeWindowsBuild
#>

param(
  [switch]$SkipTests,
  [switch]$SkipWebBuild,
  [switch]$IncludeWindowsBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$buildLogs = Join-Path $root 'buildLogs'
New-Item -ItemType Directory -Force -Path $buildLogs | Out-Null

$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$summaryLog = Join-Path $buildLogs "smoke-test_${timestamp}.log"

$results = @{}
$failed = 0

function Resolve-CommandPath([string]$commandName) {
  $cmd = Get-Command $commandName -ErrorAction SilentlyContinue
  if (-not $cmd) { return $null }
  if ($cmd.PSObject.Properties['Source']) { return $cmd.Source }
  if ($cmd.PSObject.Properties['Path']) { return $cmd.Path }
  return $null
}

function Write-Step([string]$name, [string]$message) {
  $line = "[smoke-test] [$name] $message"
  Write-Host $line -ForegroundColor Cyan
  Add-Content -Path $summaryLog -Value $line -Encoding UTF8
}

function Write-Result([string]$name, [bool]$success, [string]$detail) {
  $status = if ($success) { 'PASS' } else { 'FAIL' }
  $color = if ($success) { 'Green' } else { 'Red' }
  $line = "[smoke-test] [$name] $status - $detail"
  Write-Host $line -ForegroundColor $color
  Add-Content -Path $summaryLog -Value $line -Encoding UTF8
  $results[$name] = $status
  if (-not $success) { $script:failed++ }
}

function Invoke-CheckLogged([string]$name, [string]$command, [string[]]$arguments) {
  $outPath = Join-Path $buildLogs "smoke_${name}_${timestamp}.out.log"
  $errPath = Join-Path $buildLogs "smoke_${name}_${timestamp}.err.log"

  Write-Step $name "Running: $command $($arguments -join ' ')"
  $startTime = Get-Date

  try {
    Push-Location $root
    try {
      # Stream stdout to host (prevents idle detection) and capture to file.
      # Capture stderr to a dedicated evidence log.
      & $command @arguments 2> $errPath | Tee-Object -FilePath $outPath | Out-Host
      $exitCode = $LASTEXITCODE
    } finally {
      Pop-Location
    }

    $elapsed = (Get-Date) - $startTime
    $elapsedStr = '{0:mm\:ss}' -f $elapsed

    if ($exitCode -eq 0) {
      Write-Result $name $true "Completed in $elapsedStr (exit 0)"
      return $true
    } else {
      Write-Result $name $false "Exit code $exitCode after $elapsedStr - see $outPath"
      return $false
    }
  } catch {
    $elapsed = (Get-Date) - $startTime
    try {
      Add-Content -Path $errPath -Value "$($_.Exception.GetType().FullName): $($_.Exception.Message)" -Encoding UTF8
    } catch { }
    Write-Result $name $false "Exception: $($_.Exception.Message)"
    return $false
  }
}

# === Header ===
$header = @"
=============================================
 ANAMNESE-APP LOCAL SMOKE TEST
 Timestamp: $timestamp
 Root: $root
=============================================
"@
Write-Host $header -ForegroundColor White
Set-Content -Path $summaryLog -Value $header -Encoding UTF8

Push-Location $root
try {
  # --- 1. Type Check ---
  Write-Step 'type-check' 'Starting TypeScript type check'
  $npmCmd = Resolve-CommandPath 'npm.cmd'
  if (-not $npmCmd) { $npmCmd = 'npm' }
  Invoke-CheckLogged -name 'type-check' -command $npmCmd -arguments @('run', 'type-check') | Out-Null

  # --- 2. Unit Tests ---
  if (-not $SkipTests) {
    Write-Step 'tests' 'Starting Jest unit tests'
    Invoke-CheckLogged -name 'tests' -command $npmCmd -arguments @('test', '--', '--ci', '--forceExit', '--no-coverage') | Out-Null
  } else {
    Write-Step 'tests' 'SKIPPED (SkipTests flag)'
    $results['tests'] = 'SKIP'
  }

  # --- 3. Web Build ---
  if (-not $SkipWebBuild) {
    Write-Step 'web-build' 'Starting webpack production build'
    $webBuildOk = Invoke-CheckLogged -name 'web-build' -command $npmCmd -arguments @('run', 'web:build')

    if ($webBuildOk) {
      # Verify artifacts
      $bundlePath = Join-Path $root 'web\dist\bundle.js'
      $indexPath = Join-Path $root 'web\dist\index.html'
      if ((Test-Path $bundlePath) -and (Test-Path $indexPath)) {
        $bundleSize = (Get-Item $bundlePath).Length
        if ($bundleSize -gt 1000) {
          Write-Result 'web-artifacts' $true "bundle.js=$bundleSize bytes, index.html exists"
        } else {
          Write-Result 'web-artifacts' $false "bundle.js suspiciously small: $bundleSize bytes"
        }
      } else {
        Write-Result 'web-artifacts' $false "Missing bundle.js or index.html in web/dist/"
      }
    }
  } else {
    Write-Step 'web-build' 'SKIPPED (SkipWebBuild flag)'
    $results['web-build'] = 'SKIP'
  }

  # --- 4. Windows Build (optional) ---
  if ($IncludeWindowsBuild) {
    try {
      Write-Step 'windows-build' 'Starting Windows MSBuild (this may take several minutes)'
      $slnPath = Join-Path $root 'windows\anamnese-mobile.sln'
      if (Test-Path $slnPath) {
        # Find MSBuild
        $msbuild = $null

        $programFilesX86 = ${env:ProgramFiles(x86)}
        if (-not $programFilesX86) {
          $programFilesX86 = $env:ProgramFiles
        }

        if ($programFilesX86) {
          $vswhere = Join-Path $programFilesX86 'Microsoft Visual Studio\Installer\vswhere.exe'
          if (Test-Path $vswhere) {
            try {
              $installPath = & $vswhere -latest -products * -requires Microsoft.Component.MSBuild -property installationPath 2>$null
              if ($installPath) {
                $candidate = Join-Path $installPath 'MSBuild\Current\Bin\MSBuild.exe'
                if (Test-Path $candidate) { $msbuild = $candidate }
              }
            } catch { }
          }
        }

        if (-not $msbuild) {
          $msbuild = Resolve-CommandPath 'msbuild.exe'
        }

        if ($msbuild) {
          # Restore packages first (NuGet if available, otherwise MSBuild integrated restore)
          $nuget = Resolve-CommandPath 'nuget.exe'
          if ($nuget) {
            Write-Step 'windows-nuget' 'Restoring NuGet packages'
            Invoke-CheckLogged -name 'windows-nuget' -command $nuget -arguments @('restore', $slnPath) | Out-Null
          } else {
            Write-Step 'windows-restore' 'Restoring packages via MSBuild (/t:Restore)'
            Invoke-CheckLogged -name 'windows-restore' -command $msbuild -arguments @(
              $slnPath,
              '/t:Restore',
              '/p:Configuration=Release',
              '/p:Platform=x64',
              '/v:minimal'
            ) | Out-Null
          }

          Invoke-CheckLogged -name 'windows-build' -command $msbuild -arguments @(
            $slnPath,
            '/p:Configuration=Release',
            '/p:Platform=x64',
            '/p:AppxBundle=Never',
            '/p:AppxPackageSigningEnabled=false',
            '/m',
            '/v:minimal'
          ) | Out-Null
        } else {
          Write-Result 'windows-build' $false 'MSBuild not found - install VS Build Tools 2022'
        }
      } else {
        Write-Result 'windows-build' $false "Solution not found: $slnPath"
      }
    } catch {
      Write-Result 'windows-build' $false "Exception: $($_.Exception.Message)"
    }
  }

  # === Summary ===
  $summary = @"

=============================================
 SMOKE TEST RESULTS
=============================================
"@
  Write-Host $summary -ForegroundColor White
  Add-Content -Path $summaryLog -Value $summary -Encoding UTF8

  foreach ($key in ($results.Keys | Sort-Object)) {
    $val = $results[$key]
    $color = switch ($val) {
      'PASS' { 'Green' }
      'FAIL' { 'Red' }
      'SKIP' { 'Yellow' }
      default { 'White' }
    }
    $line = "  ${key}: $val"
    Write-Host $line -ForegroundColor $color
    Add-Content -Path $summaryLog -Value $line -Encoding UTF8
  }

  Write-Host ""
  Add-Content -Path $summaryLog -Value "" -Encoding UTF8

  if ($failed -gt 0) {
    $failLine = "RESULT: $failed check(s) FAILED"
    Write-Host $failLine -ForegroundColor Red
    Add-Content -Path $summaryLog -Value $failLine -Encoding UTF8
    exit 1
  } else {
    $passLine = "RESULT: ALL CHECKS PASSED"
    Write-Host $passLine -ForegroundColor Green
    Add-Content -Path $summaryLog -Value $passLine -Encoding UTF8
    exit 0
  }
} finally {
  Pop-Location
}
