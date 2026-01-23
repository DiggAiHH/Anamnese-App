[CmdletBinding()]
param(
  [ValidateSet('Debug','Release')]
  [string]$Configuration = 'Debug',

  [ValidateSet('x64','Win32','ARM64')]
  [string]$Platform = 'x64',

  [switch]$SkipUninstall,
  [switch]$SkipNpmCi,
  [switch]$SkipMetroRestart,
  [switch]$IsDetached
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Prevent Ctrl+C from breaking child cmd.exe/npm processes and leaving
# an interactive "Batchvorgang abbrechen (J/N)?" prompt.
$__prevTreatCtrlCAsInput = $null
try {
  $__prevTreatCtrlCAsInput = [Console]::TreatControlCAsInput
  [Console]::TreatControlCAsInput = $true
} catch {
  # ignore
}

function Write-Step([string]$message) {
  Write-Host "\n==> $message" -ForegroundColor Cyan
}

function Remove-IfExists([string]$path) {
  if (-not (Test-Path -LiteralPath $path)) { return }

  Write-Host "Deleting: $path" -ForegroundColor Yellow

  $item = Get-Item -LiteralPath $path -ErrorAction SilentlyContinue
  if ($item -and $item.PSIsContainer) {
    # Prefer cmd.exe rmdir for speed on huge trees (node_modules)
    $deletedViaCmd = $false
    try {
      $quoted = '"' + $path.Replace('"', '""') + '"'
      $p = Start-Process -FilePath 'cmd.exe' -ArgumentList @('/d','/c',"rmdir /s /q $quoted") -PassThru -Wait -WindowStyle Hidden
      if ($p.ExitCode -eq 0) {
        $deletedViaCmd = $true
      }
    } catch {
      # ignore and fall back
    }

    if (-not $deletedViaCmd) {
      Remove-Item -LiteralPath $path -Recurse -Force -ErrorAction SilentlyContinue
    }
  } else {
    # Prefer cmd.exe del for consistency with Windows file attributes
    $deletedViaCmd = $false
    try {
      $quoted = '"' + $path.Replace('"', '""') + '"'
      $p = Start-Process -FilePath 'cmd.exe' -ArgumentList @('/d','/c',"del /f /q $quoted") -PassThru -Wait -WindowStyle Hidden
      if ($p.ExitCode -eq 0) {
        $deletedViaCmd = $true
      }
    } catch {
      # ignore and fall back
    }

    if (-not $deletedViaCmd) {
      Remove-Item -LiteralPath $path -Force -ErrorAction SilentlyContinue
    }
  }

  if (Test-Path -LiteralPath $path) {
    Write-Host "WARNING: Could not fully delete: $path" -ForegroundColor Yellow
  } else {
    Write-Host "Deleted: $path" -ForegroundColor Green
  }
}

function Stop-PortListener([int]$port) {
  try {
    $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if (-not $listeners) { return }
    $pids = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $pids) {
      try {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
      } catch {
        # ignore
      }
    }
  } catch {
    # ignore
  }
}

function Rename-DirBestEffort([string]$path) {
  if (-not (Test-Path -LiteralPath $path)) { return }

  $leaf = Split-Path -Leaf $path
  $parent = Split-Path -Parent $path
  $stamp = (Get-Date -Format 'yyyyMMdd_HHmmss')
  $renamed = Join-Path $parent ("$leaf.__old_$stamp")

  try {
    Rename-Item -LiteralPath $path -NewName (Split-Path -Leaf $renamed) -ErrorAction Stop
  } catch {
    Write-Host "WARNING: Could not rename: $path ($($_.Exception.Message))" -ForegroundColor Yellow
  }
}

function Repair-DirAccessBestEffort([string]$path) {
  if (-not (Test-Path -LiteralPath $path)) { return }

  Write-Host "Attempting to repair access for: $path" -ForegroundColor Yellow

  # Clear common read-only/system attributes first (fast + non-admin in many cases).
  try {
    $quoted = '"' + $path.Replace('"', '""') + '"'
    Start-Process -FilePath 'cmd.exe' -ArgumentList @('/d','/c',"attrib -R -S -H $quoted /S /D") -Wait -WindowStyle Hidden | Out-Null
  } catch {
    # ignore
  }

  # Try to reset ACLs / grant current user full control. These may fail without elevation; keep best-effort.
  try {
    $quoted = '"' + $path.Replace('"', '""') + '"'
    $user = "$env:USERDOMAIN\$env:USERNAME"

    $cmd = "icacls $quoted /grant `"$user`:(OI)(CI)F`" /t /c"
    Start-Process -FilePath 'cmd.exe' -ArgumentList @('/d','/c',$cmd) -Wait -WindowStyle Hidden | Out-Null
  } catch {
    # ignore
  }
}

function Invoke-NpmNonInteractive {
  param(
    [Parameter(Mandatory=$true)] [string[]]$Args,
    [Parameter(Mandatory=$true)] [string]$WorkingDirectory,
    [Parameter(Mandatory=$true)] [string]$StdOutPath,
    [Parameter(Mandatory=$true)] [string]$StdErrPath
  )

  $npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
  if (-not $npmCmd) {
    throw 'npm.cmd not found in PATH. Install Node.js or add it to PATH.'
  }

  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $StdOutPath) | Out-Null
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $StdErrPath) | Out-Null

  $p = Start-Process -FilePath $npmCmd.Source -ArgumentList $Args -WorkingDirectory $WorkingDirectory -PassThru -Wait -WindowStyle Hidden -RedirectStandardOutput $StdOutPath -RedirectStandardError $StdErrPath
  if ($p.ExitCode -ne 0) {
    throw "npm failed with exit code $($p.ExitCode). See logs: $StdOutPath / $StdErrPath"
  }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$windowsDir = Join-Path $repoRoot 'windows'

# If invoked via `npm run windows:cleanrun`, detach into a standalone process.
# This avoids killing the parent npm/node process and allows us to stop node.exe
# to unlock node_modules for a real clean reinstall.
if (-not $IsDetached -and -not [string]::IsNullOrWhiteSpace($env:npm_lifecycle_event)) {
  $scriptPath = Join-Path $PSScriptRoot 'windows-cleanrun.ps1'
  $arg = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File ""$scriptPath"" -Configuration $Configuration -Platform $Platform -IsDetached"
  if ($SkipUninstall) { $arg += ' -SkipUninstall' }
  if ($SkipNpmCi) { $arg += ' -SkipNpmCi' }
  if ($SkipMetroRestart) { $arg += ' -SkipMetroRestart' }

  Write-Step 'Detaching cleanrun into a standalone window'
  # Use /k to keep window open on error/finish so user can see output
  Start-Process -FilePath 'cmd.exe' -WorkingDirectory $repoRoot -ArgumentList @('/d','/k',$arg) | Out-Null
  Write-Host 'Detached cleanrun started. Closing npm-hosted run.' -ForegroundColor Yellow
  exit 0
}

$__transcriptStamp = (Get-Date -Format 'yyyyMMdd_HHmmss')
$__transcriptPath = Join-Path (Join-Path $repoRoot 'buildLogs') ("windows-cleanrun-transcript_$__transcriptStamp.log")
try {
  New-Item -ItemType Directory -Force -Path (Split-Path $__transcriptPath) | Out-Null
  Start-Transcript -Path $__transcriptPath -Force | Out-Null
} catch {
  # ignore
}

Write-Step "Clean rebuild starting (Configuration=$Configuration, Platform=$Platform)"
Write-Step "Repo root: $repoRoot"

# Reduce noisy ANSI/spinner output in spawned tools
$env:CI = '1'
$env:FORCE_COLOR = '0'

$skipNpmCiEffective = [bool]$SkipNpmCi
$nodeModulesLocked = $false

Write-Step 'Stopping Metro (port 8081) + app process'
Stop-PortListener -port 8081
Get-Process -Name 'anamnese-mobile' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Best-effort: stop toolchain processes that can keep MSBuild .tlog/.obj files locked
# across repeated rebuild attempts.
Get-Process -Name 'msbuild','midl','cl','link','rc','mspdbsrv','vctip','vcpkgsrv' -ErrorAction SilentlyContinue |
  Stop-Process -Force -ErrorAction SilentlyContinue

# In detached mode, it's safe to stop all node.exe processes to release locks in node_modules.
if ($IsDetached) {
  Get-Process -Name 'node' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

# Cleanup any stray permission-fix processes from previous interrupted runs
Get-Process -Name 'icacls','takeown','attrib' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Cleanup any stray cmd.exe spawned by previous interrupted runs (e.g., broken rmdir / permission-fix commands)
try {
  $cmdProcs = Get-CimInstance Win32_Process -Filter "Name='cmd.exe'" -ErrorAction SilentlyContinue
  foreach ($p in $cmdProcs) {
    $cl = [string]$p.CommandLine
    if ([string]::IsNullOrWhiteSpace($cl)) { continue }
    if ($cl -match '(?i)\brmdir\b\s+/s\s+/q' -or $cl -match '(?i)\bicacls\b|\btakeown\b|\battrib\b') {
      try { Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue } catch { }
    }
  }
} catch {
  # ignore
}

if (-not $SkipUninstall) {
  Write-Step 'Uninstalling existing AppX (if installed)'
  $manifestSource = Join-Path $windowsDir 'anamnese-mobile\Package.appxmanifest'
  if (Test-Path $manifestSource) {
    try {
      [xml]$pkgManifest = Get-Content -Path $manifestSource
      $identityName = [string]$pkgManifest.Package.Identity.Name
      if (-not [string]::IsNullOrWhiteSpace($identityName)) {
        $installed = Get-AppxPackage | Where-Object { $_.Name -eq $identityName } | Select-Object -First 1
        if ($installed) {
          Write-Host "Removing installed package: $($installed.PackageFullName)" -ForegroundColor Yellow
          Remove-AppxPackage -Package $installed.PackageFullName -ErrorAction SilentlyContinue
        } else {
          Write-Host 'No installed package found.' -ForegroundColor Green
        }
      }
    } catch {
      Write-Host "Uninstall check failed (continuing): $($_.Exception.Message)" -ForegroundColor Yellow
    }
  }
}

Write-Step 'Deleting repo build artifacts + caches'
$nm = Join-Path $repoRoot 'node_modules'
if ($SkipNpmCi) {
  if (-not (Test-Path -LiteralPath $nm)) {
    throw 'SkipNpmCi was specified, but node_modules does not exist. Run without -SkipNpmCi (recommended) or reinstall dependencies first.'
  }
  Write-Host 'SkipNpmCi: keeping existing node_modules.' -ForegroundColor Yellow
} elseif (Test-Path -LiteralPath $nm) {
  # Prefer rename-then-delete to avoid long delete times, but don't fail if locked.
  $stamp = (Get-Date -Format 'yyyyMMdd_HHmmss')
  $nmOld = Join-Path $repoRoot ("node_modules.__old_$stamp")
  try {
    Rename-Item -LiteralPath $nm -NewName (Split-Path -Leaf $nmOld) -ErrorAction Stop
    Remove-IfExists $nmOld
  } catch {
    $msg = [string]$_.Exception.Message

    # If this is an access/ACL issue, try a best-effort permission repair and retry once.
    if ($msg -match '(?i)zugriff.*verweigert|access.*denied') {
      Repair-DirAccessBestEffort -path $nm
      try {
        Rename-Item -LiteralPath $nm -NewName (Split-Path -Leaf $nmOld) -ErrorAction Stop
        Remove-IfExists $nmOld
      } catch {
        $nodeModulesLocked = $true
        Write-Host "WARNING: node_modules is locked (cannot rename/delete): $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host 'WARNING: Will attempt npm repair install (not a true clean). Close VS Code/AV locks if this still fails.' -ForegroundColor Yellow
      }
    } else {
      Write-Host "WARNING: node_modules is locked (cannot rename/delete): $msg" -ForegroundColor Yellow
      Write-Host 'WARNING: Will attempt npm repair install (not a true clean). Close VS Code/AV locks if this still fails.' -ForegroundColor Yellow
      $nodeModulesLocked = $true
    }
  }
}
Remove-IfExists (Join-Path $repoRoot 'tmp')

if (Test-Path $windowsDir) {
  # AppPackages can be big; rename-only to avoid long blocking deletes/locks
  Rename-DirBestEffort (Join-Path $windowsDir 'AppPackages')
  Rename-DirBestEffort (Join-Path $windowsDir 'anamnese-mobile\AppPackages')
  # Common RNW/MSBuild output dirs (keep the source)
  foreach ($sub in @('GeneratedFiles','x64','Win32','ARM64','Debug','Release','bin','obj')) {
    Rename-DirBestEffort (Join-Path $windowsDir "anamnese-mobile\\$sub")
  }
}

# Metro cache (best-effort)
Remove-IfExists (Join-Path $env:TEMP 'metro-cache')

if (-not $skipNpmCiEffective) {
  Write-Step 'Reinstalling JS dependencies'
  $useCi = Test-Path (Join-Path $repoRoot 'package-lock.json')

  $npmStamp = (Get-Date -Format 'yyyyMMdd_HHmmss')
  $npmOut = Join-Path (Join-Path $repoRoot 'buildLogs') ("npm-deps_$npmStamp.out.log")
  $npmErr = Join-Path (Join-Path $repoRoot 'buildLogs') ("npm-deps_$npmStamp.err.log")

  # If node_modules couldn't be removed, avoid `npm ci` (it tries to delete node_modules).
  if ($nodeModulesLocked) {
    Invoke-NpmNonInteractive -Args @('install','--no-audit','--no-fund') -WorkingDirectory $repoRoot -StdOutPath $npmOut -StdErrPath $npmErr
  } elseif ($useCi) {
    Invoke-NpmNonInteractive -Args @('ci','--no-audit','--no-fund') -WorkingDirectory $repoRoot -StdOutPath $npmOut -StdErrPath $npmErr
  } else {
    Invoke-NpmNonInteractive -Args @('install','--no-audit','--no-fund') -WorkingDirectory $repoRoot -StdOutPath $npmOut -StdErrPath $npmErr
  }

  if (-not (Test-Path (Join-Path $repoRoot 'node_modules\.bin\react-native.cmd'))) {
    throw 'react-native CLI not found after npm install. node_modules is likely still broken/locked.'
  }
}

if (-not $SkipMetroRestart) {
  Write-Step 'Starting Metro in a new window (reset-cache)'
  # Detached to avoid blocking this script.
  Start-Process -FilePath 'cmd.exe' -ArgumentList @('/c','start','""','cmd','/k','npm.cmd','start','--','--reset-cache') -WorkingDirectory $repoRoot | Out-Null
  Start-Sleep -Seconds 2
}

try {
  Write-Step 'Running windows:run (build -> stage -> sign -> install -> loopback -> launch)'
  $devRun = Join-Path $repoRoot 'scripts\windows-dev-run.ps1'
  if (-not (Test-Path $devRun)) {
    throw "Missing script: $devRun"
  }

  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $devRun -Configuration $Configuration -Platform $Platform
} finally {
  if ($__prevTreatCtrlCAsInput -ne $null) {
    try { [Console]::TreatControlCAsInput = $__prevTreatCtrlCAsInput } catch { }
  }
  try { Stop-Transcript | Out-Null } catch { }
}
