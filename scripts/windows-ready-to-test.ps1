param(
  [switch]$SkipBuild,
  [switch]$SkipTests,
  [switch]$SkipMetroCheck
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$buildLogs = Join-Path $root 'buildLogs'
New-Item -ItemType Directory -Force -Path $buildLogs | Out-Null

function Write-Step([string]$message) {
  Write-Host "[windows:ready] $message"
}

function Assert-ExitCode([int]$exitCode, [string]$what) {
  if ($exitCode -ne 0) {
    throw "$what failed with exit code $exitCode"
  }
}

function Invoke-NpmLogged(
  [string[]]$npmArgs,
  [string]$stdoutPath,
  [string]$stderrPath
) {
  $npmPath = (Get-Command npm.cmd -ErrorAction Stop).Source
  try { Remove-Item -Path $stdoutPath -Force -ErrorAction SilentlyContinue } catch { }
  try { Remove-Item -Path $stderrPath -Force -ErrorAction SilentlyContinue } catch { }

  $proc = Start-Process -FilePath $npmPath -ArgumentList $npmArgs -WorkingDirectory $root -NoNewWindow -Wait -PassThru -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath

  return $proc.ExitCode
}

function Test-MetroRunning {
  $uris = @(
    'http://127.0.0.1:8081/status',
    'http://localhost:8081/status',
    'http://[::1]:8081/status'
  )

  foreach ($u in $uris) {
    try {
      $resp = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 -Uri $u
      if ($resp -and ($resp.Content -match 'packager-status:running')) { return $true }
    } catch {
      # ignore and try next
    }
  }

  # Fallback: accept a listening port even if /status is blocked.
  $hosts = @('127.0.0.1','localhost','::1')
  foreach ($h in $hosts) {
    try {
      $ok = Test-NetConnection -ComputerName $h -Port 8081 -InformationLevel Quiet
      if ($ok) { return $true }
    } catch {
      # ignore
    }
  }

  return $false
}

function Start-MetroDetachedReady {
  $logPath = Join-Path $buildLogs 'metro_ready_latest.log'
  try { Remove-Item -Path $logPath -Force -ErrorAction SilentlyContinue } catch { }

  $args = '/d /c "npm.cmd start -- --reset-cache > ""' + $logPath + '"" 2>&1"'
  try {
    Start-Process -FilePath 'cmd.exe' -ArgumentList $args -WorkingDirectory $root -WindowStyle Hidden | Out-Null
  } catch {
    Write-Host "[windows:ready] Failed to auto-start Metro: $($_.Exception.Message)"
  }
}

function Wait-ForMetro([int]$seconds = 30) {
  $deadline = (Get-Date).AddSeconds([Math]::Max(1, $seconds))
  while ((Get-Date) -lt $deadline) {
    if (Test-MetroRunning) { return $true }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

function Test-HasAppPackageInstaller {
  $windowsDir = Join-Path $root 'windows'
  $candidateRoots = @(
    (Join-Path $windowsDir 'AppPackages'),
    (Join-Path $windowsDir 'anamnese-mobile\\AppPackages')
  )

  foreach ($r in $candidateRoots) {
    if (-not (Test-Path $r)) { continue }
    try {
      $hit = Get-ChildItem -Path $r -Recurse -Filter 'Add-AppDevPackage.ps1' -ErrorAction SilentlyContinue | Select-Object -First 1
      if ($hit) { return $true }
    } catch {
      # ignore
    }
  }

  return $false
}

function Resolve-PackageFamilyName {
  $manifestPath = Join-Path $root 'windows\\anamnese-mobile\\Package.appxmanifest'
  if (-not (Test-Path $manifestPath)) { return $null }

  try {
    [xml]$xml = Get-Content -Path $manifestPath
  } catch {
    return $null
  }

  $identityName = $xml.Package.Identity.Name
  if (-not $identityName) { return $null }

  $pkg = @(Get-AppxPackage -Name $identityName -ErrorAction SilentlyContinue | Select-Object -First 1)
  if ($pkg.Count -eq 0) {
    $pkg = @(Get-AppxPackage -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -eq $identityName -or $_.PackageFamilyName -like "${identityName}*" } |
      Select-Object -First 1)
  }

  if ($pkg.Count -eq 0) { return $null }
  return $pkg[0].PackageFamilyName
}

Push-Location $root
try {
  $effectiveSkipBuild = [bool]$SkipBuild
  if ($effectiveSkipBuild -and (-not (Test-HasAppPackageInstaller))) {
    Write-Host '[windows:ready] SkipBuild requested but no AppPackages artifacts exist yet.'
    Write-Host '[windows:ready] Falling back to a full Windows build/package once to generate AppPackages.'
    $effectiveSkipBuild = $false
  }

  if (-not $SkipTests) {
    Write-Step 'Running type-check with log capture'
    $typeOut = Join-Path $buildLogs 'typecheck_ready_latest.out.log'
    $typeErr = Join-Path $buildLogs 'typecheck_ready_latest.err.log'
    $exitCode = Invoke-NpmLogged -npmArgs @('run','type-check') -stdoutPath $typeOut -stderrPath $typeErr
    Assert-ExitCode $exitCode 'type-check'

    Write-Step 'Running Jest with log capture'
    $testOut = Join-Path $buildLogs 'npm_test_ready_latest.out.log'
    $testErr = Join-Path $buildLogs 'npm_test_ready_latest.err.log'
    $exitCode = Invoke-NpmLogged -npmArgs @('test') -stdoutPath $testOut -stderrPath $testErr
    Assert-ExitCode $exitCode 'npm test'
  } else {
    Write-Step 'Skipping tests (SkipTests=true)'
  }

  if (-not $SkipMetroCheck) {
    Write-Step 'Checking Metro status on http://127.0.0.1:8081/status'
    if (-not (Test-MetroRunning)) {
      Write-Host '[windows:ready] Metro is not reachable; auto-starting it detached (see buildLogs/metro_ready_latest.log)'
      Start-MetroDetachedReady
      if (-not (Wait-ForMetro 45)) {
        Write-Host '[windows:ready] Metro still not reachable.'
        Write-Host '[windows:ready] Start it manually in a separate terminal:'
        Write-Host '  npm.cmd start -- --reset-cache'
        exit 2
      }
    }
  } else {
    Write-Step 'Skipping Metro check (SkipMetroCheck=true)'
  }

  if ($effectiveSkipBuild) {
    Write-Step 'Deploying/launching Windows app (SkipBuild=true)'
    $null = & npm.cmd run windows:run:skipbuild:log
    Assert-ExitCode $LASTEXITCODE 'windows:run:skipbuild:log'
  } else {
    Write-Step 'Deploying/launching Windows app (with build)'
    $null = & npm.cmd run windows:run:log
    Assert-ExitCode $LASTEXITCODE 'windows:run:log'
  }

  Write-Step 'Post-run process check'
  $proc = @(Get-Process -Name 'anamnese-mobile' -ErrorAction SilentlyContinue)
  if ($null -eq $proc -or $proc.Count -eq 0) {
    Write-Host '[windows:ready] App process is not running after deploy/launch.'
    Write-Host '[windows:ready] For diagnostics run: npm.cmd run windows:launch:log'
    exit 3
  }
  Write-Host "[windows:ready] App process running (PID(s): $($proc.Id -join ', '))"

  Write-Step 'Probing loopback exemption (informational)'
  $pfn = Resolve-PackageFamilyName
  if ($pfn) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'probe-loopback.ps1') -PackageFamilyName $pfn | Out-Null
  } else {
    Write-Host '[windows:ready] Could not resolve PackageFamilyName; skipping loopback probe.'
  }

  Write-Step 'READY: App should be running; Metro should be serving bundles.'
  Write-Host '[windows:ready] Testing URLs:'
  Write-Host '  - Metro status: http://127.0.0.1:8081/status'
  Write-Host '  - Metro debugger UI: http://127.0.0.1:8081/debugger-ui'
  Write-Host '[windows:ready] If the app didn’t open, run: npm.cmd run windows:launch:log'

  exit 0
} finally {
  Pop-Location
}
