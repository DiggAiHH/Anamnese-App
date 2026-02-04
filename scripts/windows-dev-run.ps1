[CmdletBinding()]
param(
  [ValidateSet('Debug','Release')]
  [string]$Configuration = 'Debug',

  [ValidateSet('x64','Win32','ARM64')]
  [string]$Platform = 'x64',

  [switch]$SkipBuild
)

$ErrorActionPreference = 'Continue'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$buildLogsDir = Join-Path $repoRoot 'buildLogs'
New-Item -ItemType Directory -Path $buildLogsDir -Force | Out-Null

$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$transcriptPath = Join-Path $buildLogsDir "windows-dev-run-transcript_${timestamp}.log"
$latestTranscriptPath = Join-Path $buildLogsDir 'windows-dev-run-transcript_latest.log'
$transcriptErrorPath = Join-Path $buildLogsDir 'windows-dev-run-transcript_error_latest.log'
$transcribing = $false
try {
  Start-Transcript -Path $transcriptPath -Force | Out-Null
  $transcribing = $true
} catch {
  # Best-effort only, but record why.
  try {
    "Start-Transcript failed: $($_.Exception.Message)" | Set-Content -Path $transcriptErrorPath -Encoding UTF8
  } catch { }
}

try {
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step([string]$message) {
  Write-Host "\n==> $message" -ForegroundColor Cyan
}

function Test-IsElevated {
  $currentIdentity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($currentIdentity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-MetroListening {
  param(
    [string]$HostName = '127.0.0.1',
    [int]$Port = 8081
  )

  try {
    $result = Test-NetConnection -ComputerName $HostName -Port $Port -InformationLevel Quiet
    return [bool]$result
  } catch {
    return $false
  }
}

function Test-MetroStatus {
  param(
    [string]$HostName = '127.0.0.1',
    [int]$Port = 8081
  )

  $url = "http://$HostName`:$Port/status"
  try {
    $resp = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 2
    $content = $resp.Content
    if ($content -is [byte[]]) {
      $content = [Text.Encoding]::UTF8.GetString($content)
    }
    $content = [string]$content
    return ($content.Trim() -eq 'packager-status:running')
  } catch {
    return $false
  }
}

function Start-MetroDetached {
  param(
    [Parameter(Mandatory = $true)]
    [string]$RepoRoot,

    [Parameter(Mandatory = $true)]
    [string]$BuildLogsDir
  )

  $logPath = Join-Path $BuildLogsDir 'metro_latest.log'
  try { Remove-Item -Path $logPath -Force -ErrorAction SilentlyContinue } catch { }

  # IMPORTANT: do not rely on a global `react-native` shim being discoverable.
  # Use the local CLI to make Metro auto-start deterministic.
  $rnCli = Join-Path $RepoRoot 'node_modules\react-native\cli.js'
  if (Test-Path $rnCli) {
    $metroCmdArgs = '/d /c "node ""' + $rnCli + '"" start --reset-cache > ""' + $logPath + '"" 2>&1"'
  } else {
    # Fallback: npm start (may fail on some environments if PATH shims are broken)
    $metroCmdArgs = '/d /c "npm.cmd start -- --reset-cache > ""' + $logPath + '"" 2>&1"'
  }
  try {
    Start-Process -FilePath 'cmd.exe' -ArgumentList $metroCmdArgs -WorkingDirectory $RepoRoot -WindowStyle Hidden | Out-Null
  } catch {
    Write-Host "Failed to auto-start Metro: $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

function Enable-LoopbackExemption {
  param(
    [Parameter(Mandatory=$true)] [string]$PackageFamilyName
  )

  $checkNetIsolation = Join-Path $env:WINDIR 'System32\CheckNetIsolation.exe'
  if (-not (Test-Path $checkNetIsolation)) {
    Write-Host "CheckNetIsolation.exe not found at $checkNetIsolation; cannot set loopback exemption." -ForegroundColor Yellow
    return
  }

  $already = $false
  try {
    $out = & $checkNetIsolation LoopbackExempt -s 2>$null
    if ($out -and ($out | Out-String) -match [regex]::Escape($PackageFamilyName)) {
      $already = $true
    }
  } catch {
    $already = $false
  }

  if ($already) {
    Write-Host "Loopback exemption already present for: $PackageFamilyName" -ForegroundColor Green
    return
  }

  Write-Host "Adding loopback exemption for: $PackageFamilyName" -ForegroundColor Yellow
  if (Test-IsElevated) {
    & $checkNetIsolation LoopbackExempt -a -n="$PackageFamilyName" | Out-Null
  } else {
    Write-Host 'Not running as Administrator; skipping loopback exemption to avoid UAC prompt.' -ForegroundColor Yellow
    Write-Host 'If the app shows it cannot connect to Metro, run this once in an elevated PowerShell:' -ForegroundColor Yellow
    Write-Host "  $checkNetIsolation LoopbackExempt -a -n=\"$PackageFamilyName\"" -ForegroundColor Yellow
    return
  }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$windowsDir = Join-Path $repoRoot 'windows'

# RNW packaging can produce .msix/.appx and bundle variants depending on configuration.
$packageExtensions = @('.msix','.appx','.msixbundle','.appxbundle')
$packageExtensionsLabel = ($packageExtensions -join '/')

Write-Step "Repo root: $repoRoot"

if (-not $SkipBuild) {
  Write-Step "Building Windows ($Configuration|$Platform) via RNW (telemetry disabled)"

  if ($Configuration -eq 'Release') {
    $existingBundle = Join-Path $repoRoot 'windows\anamnese-mobile\Bundle\index.windows.bundle'
    if (Test-Path $existingBundle) {
      $bundleInfo = Get-Item -Path $existingBundle -ErrorAction SilentlyContinue
      if ($bundleInfo -and $bundleInfo.Length -gt 0) {
        Write-Host "Release bundle already present; skipping bundling: $existingBundle" -ForegroundColor DarkGray
      } else {
        Remove-Item -Path $existingBundle -Force -ErrorAction SilentlyContinue
      }
    }

    if (-not (Test-Path $existingBundle)) {
      $bundleScript = Join-Path $PSScriptRoot 'bundle-windows-release.ps1'
      if (-not (Test-Path $bundleScript)) {
        throw "Release bundle script missing: $bundleScript"
      }
      & powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $bundleScript -RepoRoot $repoRoot
      if ($LASTEXITCODE -ne 0) {
        throw "Release bundling script failed with exit code $LASTEXITCODE"
      }
    }
  }

  if ($Configuration -ne 'Release') {
    # Use npm.cmd to avoid PowerShell ExecutionPolicy issues with npm.ps1
    $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if (-not $npm) {
      throw 'npm.cmd not found in PATH. Install Node.js or add it to PATH.'
    }

    $rnwArgs = @('run','windows','--','--no-telemetry','--logging','--arch', $Platform)
    & $npm @rnwArgs
    if ($LASTEXITCODE -ne 0) {
      Write-Host "\nNOTE: 'react-native run-windows' returned exit code $LASTEXITCODE (often deploy-only failure). Continuing with manual install..." -ForegroundColor Yellow
    }
  } else {
    Write-Host "Release mode: skipping 'react-native run-windows' to avoid double-building; using MSBuild packaging to produce the package." -ForegroundColor DarkGray
  }

  if ($Configuration -eq 'Release') {
    Write-Step 'Ensuring Release AppPackages output exists (MSBuild packaging)'

    function Find-MSBuildExe {
      # IMPORTANT:
      # Do NOT fall back to msbuild.exe from PATH.
      # Some machines have MSBuild 18.x available which can break RNW packaging in this repo.
      # We pin to VS2022 (17.x) MSBuild.

      $known2022 = @(
        (Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\\2022\\BuildTools\\MSBuild\\Current\\Bin\\MSBuild.exe'),
        (Join-Path ${env:ProgramFiles} 'Microsoft Visual Studio\\2022\\BuildTools\\MSBuild\\Current\\Bin\\MSBuild.exe'),
        (Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\\2022\\Community\\MSBuild\\Current\\Bin\\MSBuild.exe'),
        (Join-Path ${env:ProgramFiles} 'Microsoft Visual Studio\\2022\\Community\\MSBuild\\Current\\Bin\\MSBuild.exe'),
        (Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\\2022\\Professional\\MSBuild\\Current\\Bin\\MSBuild.exe'),
        (Join-Path ${env:ProgramFiles} 'Microsoft Visual Studio\\2022\\Professional\\MSBuild\\Current\\Bin\\MSBuild.exe'),
        (Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\\2022\\Enterprise\\MSBuild\\Current\\Bin\\MSBuild.exe'),
        (Join-Path ${env:ProgramFiles} 'Microsoft Visual Studio\\2022\\Enterprise\\MSBuild\\Current\\Bin\\MSBuild.exe')
      )
      foreach ($p in $known2022) {
        if (Test-Path $p) { return $p }
      }

      $vswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\\Installer\\vswhere.exe'
      if (Test-Path $vswhere) {
        try {
          $installPath = & $vswhere -latest -products * -requires Microsoft.Component.MSBuild -version '[17.0,18.0)' -property installationPath 2>$null
          if ($installPath) {
            $candidates = @(
              (Join-Path $installPath 'MSBuild\\Current\\Bin\\MSBuild.exe'),
              (Join-Path $installPath 'MSBuild\\15.0\\Bin\\MSBuild.exe')
            )
            foreach ($c in $candidates) {
              if (Test-Path $c) { return $c }
            }
          }
        } catch {
          # ignore
        }
      }

      return $null
    }

    $msbuildExe = Find-MSBuildExe
    if (-not $msbuildExe) {
      throw 'MSBuild.exe not found. Install Visual Studio Build Tools 2022 (MSBuild).'
    }

    $solutionPath = Join-Path $windowsDir 'anamnese-mobile.sln'
    if (-not (Test-Path $solutionPath)) {
      throw "Solution not found: $solutionPath"
    }

    # Prefer placing AppPackages under the app project folder to match RNW defaults.
    $appProjectDir = Join-Path $windowsDir 'anamnese-mobile'
    $appxOutRoot = Join-Path $appProjectDir 'AppPackages'
    New-Item -ItemType Directory -Path $appxOutRoot -Force | Out-Null
    $packageDir = Join-Path $appxOutRoot ("anamnese-mobile_{0}_{1}_{2}_Test\\" -f $Platform, $Configuration, (Get-Date -Format 'yyyyMMdd_HHmmss'))
    New-Item -ItemType Directory -Path $packageDir -Force | Out-Null

    Write-Host "Packaging output dir: $packageDir" -ForegroundColor DarkGray

    $packagingLogStamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $binlogPath = Join-Path $buildLogsDir ("msbuild_release_packaging_{0}.binlog" -f $packagingLogStamp)
    $msbuildLogPath = Join-Path $buildLogsDir ("msbuild_release_packaging_{0}.log" -f $packagingLogStamp)

    # Build via the solution to satisfy RNW projects that require Solution* properties.
    # Use incremental Build (not Rebuild) so repeated packaging runs are fast.
    # Also add a binlog so we can debug packaging steps even if stdout is huge/truncated.
    $msbuildArgs = @(
      $solutionPath,
      '/m',
      '/restore',
      '/t:Build;AppxPackage',
      "/p:Configuration=$Configuration",
      "/p:Platform=$Platform",
      '/p:VisualStudioVersion=17.0',
      '/p:AppxBundle=Never',
      '/p:UapAppxPackageBuildMode=SideloadOnly',
      '/p:GenerateAppxPackageOnBuild=true',
      ("/p:AppxPackageDir=$packageDir"),
      '/fl',
      ("/flp:logfile=$msbuildLogPath;verbosity=normal"),
      ("/bl:$binlogPath")
    )

    # Capture MSBuild output even when console output is truncated/redirected by the caller.
    $msbuildStdoutPath = Join-Path $buildLogsDir ("msbuild_release_packaging_{0}.stdout.log" -f $packagingLogStamp)
    $msbuildStderrPath = Join-Path $buildLogsDir ("msbuild_release_packaging_{0}.stderr.log" -f $packagingLogStamp)

    # IMPORTANT: pass args as string[] so Start-Process handles quoting correctly.
    # Manual quoting here can break MSBuild switches like /bl: and lead to 0-byte binlogs.
    $proc = Start-Process -FilePath $msbuildExe -ArgumentList $msbuildArgs -Wait -PassThru -NoNewWindow `
      -RedirectStandardOutput $msbuildStdoutPath -RedirectStandardError $msbuildStderrPath

    if ($proc.ExitCode -ne 0) {
      Write-Host "MSBuild stdout: $msbuildStdoutPath" -ForegroundColor Yellow
      Write-Host "MSBuild stderr: $msbuildStderrPath" -ForegroundColor Yellow
      Write-Host "MSBuild log: $msbuildLogPath" -ForegroundColor Yellow
      Write-Host "MSBuild binlog: $binlogPath" -ForegroundColor Yellow
      throw "MSBuild packaging failed with exit code $($proc.ExitCode)"
    }

    # Hard validation: the packaging folder must contain installer + a packaged artifact.
    $expectedAddAppDev = Join-Path $packageDir 'Add-AppDevPackage.ps1'
    $expectedPackages = @(
      Get-ChildItem -Path $packageDir -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Extension -in $packageExtensions }
    )
    if (-not (Test-Path $expectedAddAppDev) -or $expectedPackages.Count -eq 0) {
      Write-Host "`nMSBuild finished, but no packaged artifacts ($packageExtensionsLabel) were found in the expected folder." -ForegroundColor Yellow
      Write-Host "Expected folder: $packageDir" -ForegroundColor Yellow
      Write-Host "MSBuild log: $msbuildLogPath" -ForegroundColor Yellow
      Write-Host "MSBuild binlog: $binlogPath" -ForegroundColor Yellow
      throw "Release packaging did not produce Add-AppDevPackage.ps1 + a package file ($packageExtensionsLabel). Check the MSBuild log/binlog for the packaging targets that ran."
    }
  }
}

Write-Step 'Finding latest package in AppPackages output'

# RNW typically places AppPackages under the app project folder (windows/<app>/AppPackages),
# but some setups place it at windows/AppPackages. Support both for reliability.
$appProjectDir = Join-Path $windowsDir 'anamnese-mobile'
$candidateAppPackagesRoots = @(
  (Join-Path $windowsDir 'AppPackages'),
  (Join-Path $appProjectDir 'AppPackages')
)

$existingRoots = @($candidateAppPackagesRoots | Where-Object { Test-Path $_ })
if ($existingRoots.Count -eq 0) {
  throw ("AppPackages folder not found. Checked: {0}" -f ($candidateAppPackagesRoots -join '; '))
}

$allAddAppDevPackages = @()
foreach ($root in $existingRoots) {
  Write-Host "Searching AppPackages under: $root" -ForegroundColor Green
  $allAddAppDevPackages += @(Get-ChildItem -Path $root -Recurse -Filter Add-AppDevPackage.ps1 -ErrorAction SilentlyContinue)
}

# Prefer picking an AppPackages folder that matches the requested configuration/platform.
# Otherwise we can accidentally install a newer Debug package when we intended Release.
$addAppDevPackage = $null
if ($allAddAppDevPackages.Count -gt 0) {
  $configToken = "_${Platform}_${Configuration}_"
  $preferred = @($allAddAppDevPackages | Where-Object { $_.FullName -like "*$configToken*" } | Sort-Object LastWriteTime)
  if ($preferred.Count -gt 0) {
    $addAppDevPackage = $preferred[-1]
  } else {
    if ($Configuration -eq 'Release') {
      throw ("No Release AppPackages output found under: {0}. Found only: {1}" -f ($existingRoots -join '; '), (($allAddAppDevPackages | Select-Object -ExpandProperty FullName | Sort-Object) -join '; '))
    }

    $addAppDevPackage = ($allAddAppDevPackages | Sort-Object LastWriteTime | Select-Object -Last 1)
  }
}

if (-not $addAppDevPackage) {
  throw 'No Add-AppDevPackage.ps1 found under windows/AppPackages. Run a Windows build/package first.'
}

$appPackageDir = Split-Path -Parent $addAppDevPackage.FullName
Write-Host "Using AppPackages dir: $appPackageDir" -ForegroundColor Green

$msix = Get-ChildItem -Path $appPackageDir -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Extension -in $packageExtensions } |
  Sort-Object LastWriteTime |
  Select-Object -Last 1

if (-not $msix) {
  throw "No package ($packageExtensionsLabel) found next to Add-AppDevPackage.ps1 in: $appPackageDir"
}

Write-Host "Using package: $($msix.FullName)" -ForegroundColor Green

Write-Step 'Staging packaging artifacts to avoid file locks'
$stageRoot = Join-Path $repoRoot 'tmp\AppPackageStage'
New-Item -ItemType Directory -Path $stageRoot -Force | Out-Null

$stageDir = Join-Path $stageRoot ("stage_{0:yyyyMMdd_HHmmss}" -f (Get-Date))
New-Item -ItemType Directory -Path $stageDir -Force | Out-Null

# Copy installer + its localized resources
Copy-Item -Path $addAppDevPackage.FullName -Destination $stageDir -Force
if (Test-Path (Join-Path $appPackageDir 'Add-AppDevPackage.resources')) {
  Copy-Item -Path (Join-Path $appPackageDir 'Add-AppDevPackage.resources') -Destination $stageDir -Recurse -Force
}

# Copy dependency packages folder(s)
foreach ($depFolderName in @('Dependencies','TelemetryDependencies')) {
  $depPath = Join-Path $appPackageDir $depFolderName
  if (Test-Path $depPath) {
    Copy-Item -Path $depPath -Destination $stageDir -Recurse -Force
  }
}

# Copy the package to a writable staging location for signing
$stagedMsixPath = Join-Path $stageDir $msix.Name
Copy-Item -Path $msix.FullName -Destination $stagedMsixPath -Force
Write-Host "Staged package: $stagedMsixPath" -ForegroundColor Green

$stagedAddAppDevPackage = Join-Path $stageDir (Split-Path -Leaf $addAppDevPackage.FullName)
Write-Host "Staged installer script: $stagedAddAppDevPackage" -ForegroundColor Green

Write-Step 'Reading Publisher + Identity from Package.appxmanifest'
$manifestSource = Join-Path $windowsDir 'anamnese-mobile\Package.appxmanifest'
if (-not (Test-Path $manifestSource)) {
  throw "Package manifest not found: $manifestSource"
}

[xml]$pkgManifest = Get-Content -Path $manifestSource
$identityNode = $pkgManifest.Package.Identity
$publisher = [string]$identityNode.Publisher
$identityName = [string]$identityNode.Name

if ([string]::IsNullOrWhiteSpace($publisher) -or [string]::IsNullOrWhiteSpace($identityName)) {
  throw 'Could not parse Publisher/Name from Package.appxmanifest.'
}

Write-Host "Identity: $identityName" -ForegroundColor Yellow
Write-Host "Publisher: $publisher" -ForegroundColor Yellow

Write-Step 'Ensuring dev code-signing certificate exists'
$friendlyName = 'AnamneseMobile Dev Certificate'

function Test-CodeSigningEku($cert) {
  if (-not $cert -or -not $cert.EnhancedKeyUsageList) { return $false }
  foreach ($eku in $cert.EnhancedKeyUsageList) {
    # Use OID instead of localized FriendlyName
    if ($eku.ObjectId -eq '1.3.6.1.5.5.7.3.3') { return $true }
  }
  return $false
}

$existingCert = Get-ChildItem -Path Cert:\CurrentUser\My |
  Where-Object { $_.Subject -eq $publisher -and (Test-CodeSigningEku $_) } |
  Sort-Object NotAfter |
  Select-Object -Last 1

if (-not $existingCert) {
  $existingCert = New-SelfSignedCertificate -Type Custom -Subject $publisher -KeyUsage DigitalSignature -KeyAlgorithm RSA -KeyLength 2048 -FriendlyName $friendlyName -CertStoreLocation 'Cert:\CurrentUser\My' -TextExtension @(
    '2.5.29.37={text}1.3.6.1.5.5.7.3.3',
    '2.5.29.19={text}'
  )
  Write-Host "Created certificate: $($existingCert.Thumbprint)" -ForegroundColor Green
} else {
  Write-Host "Using existing certificate: $($existingCert.Thumbprint)" -ForegroundColor Green
}

Write-Step 'Preparing certificate file for AppPackages install'
$cerPath = Join-Path $stageDir 'AnamneseMobile-Dev.cer'
Export-Certificate -Cert $existingCert -FilePath $cerPath -Type CERT | Out-Null
Write-Host "Exported certificate: $cerPath" -ForegroundColor Green

# Add-AppDevPackage.ps1 expects exactly one .cer in the directory.
$otherCers = Get-ChildItem -Path $stageDir -Filter *.cer -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -ne $cerPath }
foreach ($c in $otherCers) {
  Remove-Item -Path $c.FullName -Force -ErrorAction SilentlyContinue
}

Write-Step 'Signing package (signtool.exe)'
$signtool = Get-ChildItem -Path 'C:\Program Files (x86)\Windows Kits\10\bin' -Recurse -Filter signtool.exe -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -match '\\x64\\signtool\.exe$' } |
  Sort-Object FullName |
  Select-Object -Last 1

if (-not $signtool) {
  throw 'signtool.exe not found (Windows SDK missing). Install Windows 10/11 SDK.'
}

& $signtool.FullName sign /fd SHA256 /sha1 $existingCert.Thumbprint /s My "$stagedMsixPath"
if ($LASTEXITCODE -ne 0) {
  throw "signtool.exe failed with exit code $LASTEXITCODE"
}

Write-Step 'Verifying package signature'
$sig = $null
try {
  $sig = Get-AuthenticodeSignature -FilePath $stagedMsixPath
} catch {
  # Some environments intermittently throw a terminating error here ("Die Pipeline wurde beendet.").
  # For local dev runs we can continue as long as signtool signing succeeded.
  Write-Host "Signature verification failed (continuing for dev): $($_.Exception.Message)" -ForegroundColor Yellow
}

if ($sig) {
  Write-Host "Signature status: $($sig.Status)" -ForegroundColor Yellow
  if ($sig.Status -notin @('Valid','UnknownError')) {
    throw "Package signature not acceptable: $($sig.Status) - $($sig.StatusMessage)"
  }

  if (-not $sig.SignerCertificate -or $sig.SignerCertificate.Thumbprint -ne $existingCert.Thumbprint) {
    throw "Package signer certificate mismatch. Expected $($existingCert.Thumbprint), got $($sig.SignerCertificate.Thumbprint)"
  }
} else {
  Write-Host 'Skipping Authenticode signature validation (dev-only fallback).' -ForegroundColor Yellow
}

Write-Step 'Installing package'
Write-Host "Installer script: $stagedAddAppDevPackage" -ForegroundColor Yellow
Write-Host "Note: We'll try a non-admin install first (CurrentUser trust)." -ForegroundColor Yellow

$installed = Get-AppxPackage | Where-Object { $_.Name -eq $identityName } | Select-Object -First 1
if ($installed) {
  Write-Host "Existing install detected ($($installed.PackageFullName)); attempting in-place update first..." -ForegroundColor Yellow
}

$ps = Get-Command powershell.exe -ErrorAction SilentlyContinue
if (-not $ps) {
  throw 'powershell.exe not found in PATH.'
}

$isElevated = Test-IsElevated

if (-not $isElevated) {
  Write-Host 'Not running as Administrator. Installing certificate for CurrentUser + installing package without elevation...' -ForegroundColor Yellow

  function Get-AppxDependencyKey([string]$path) {
    $base = [System.IO.Path]::GetFileNameWithoutExtension($path)
    if (-not $base) { return '' }

    # Typical formats:
    #   Name_Version_Arch__PublisherId
    #   Name_Arch__PublisherId
    $m = [regex]::Match($base, '^(?<name>.+)_(?<ver>\d+(?:\.\d+){3})_(?<arch>[^_]+)__(?<pub>[^_]+)$')
    if ($m.Success) {
      return "$($m.Groups['name'].Value)_$($m.Groups['arch'].Value)__$($m.Groups['pub'].Value)".ToLowerInvariant()
    }

    $m = [regex]::Match($base, '^(?<name>.+)_(?<arch>[^_]+)__(?<pub>[^_]+)$')
    if ($m.Success) {
      return "$($m.Groups['name'].Value)_$($m.Groups['arch'].Value)__$($m.Groups['pub'].Value)".ToLowerInvariant()
    }

    return $base.ToLowerInvariant()
  }

  function Get-AppxDependencyVersion([string]$path) {
    $base = [System.IO.Path]::GetFileNameWithoutExtension($path)
    if (-not $base) { return $null }

    $m = [regex]::Match($base, '^.+_(?<ver>\d+(?:\.\d+){3})_[^_]+__[^_]+$')
    if ($m.Success) {
      try { return [Version]$m.Groups['ver'].Value } catch { return $null }
    }

    return $null
  }

  # Install framework dependencies from the staged AppPackages folder.
  # Without these, Add-AppxPackage can fail with missing framework errors
  # (e.g. Microsoft.NET.CoreRuntime.2.2).
  $dependencyPaths = @()
  $stagedDepsRoot = Join-Path $stageDir 'Dependencies'
  if (Test-Path $stagedDepsRoot) {
    $depArch = $Platform
    # If the architecture-specific dependency folder exists (e.g. Dependencies\x64),
    # only use that. Including the root Dependencies folder can pull in wrong-arch
    # frameworks (e.g. ARM) and break Add-AppxPackage.
    $archDepDir = Join-Path $stagedDepsRoot $depArch
    $candidateDepDirs = if (Test-Path $archDepDir) {
      @($archDepDir)
    } else {
      @($stagedDepsRoot)
    }

    foreach ($depDir in $candidateDepDirs) {
      $dependencyPaths += (Get-ChildItem -Path $depDir -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Extension -in $packageExtensions } |
        Select-Object -ExpandProperty FullName)
    }

    # De-dupe by *package identity* (not just path), otherwise Add-AppxPackage can fail with:
    #   "<PackageFamily> ... more than once specified"
    $dependencyPaths = @(
      $dependencyPaths |
        Where-Object { $_ } |
        ForEach-Object { (Resolve-Path $_ -ErrorAction SilentlyContinue).Path } |
        Where-Object { $_ }
    )

    $dependencyPaths = $dependencyPaths | Sort-Object -Unique

    $depObjects = $dependencyPaths | ForEach-Object {
      [pscustomobject]@{
        Path = $_
        Key = Get-AppxDependencyKey $_
        Version = Get-AppxDependencyVersion $_
      }
    }

    $dependencyPaths = @(
      $depObjects |
        Group-Object -Property Key |
        ForEach-Object {
          $group = $_.Group
          $withVersion = @($group | Where-Object { $_.Version -ne $null })
          if ($withVersion.Count -gt 0) {
            ($withVersion | Sort-Object -Property Version -Descending | Select-Object -First 1).Path
          } else {
            ($group | Select-Object -First 1).Path
          }
        }
    )
  }

  if ($dependencyPaths.Count -gt 0) {
    Write-Host "Found dependency packages: $($dependencyPaths.Count)" -ForegroundColor DarkGray
  } else {
    Write-Host 'No dependency packages found under staged Dependencies; install may fail if frameworks are missing.' -ForegroundColor Yellow
  }

  $stores = @(
    'Cert:\CurrentUser\TrustedPeople',
    'Cert:\CurrentUser\TrustedPublisher'
  )

  foreach ($store in $stores) {
    $alreadyTrusted = $false
    try {
      $alreadyTrusted = @(Get-ChildItem -Path $store -ErrorAction SilentlyContinue | Where-Object { $_.Thumbprint -eq $existingCert.Thumbprint }).Count -gt 0
    } catch {
      $alreadyTrusted = $false
    }

    if (-not $alreadyTrusted) {
      try {
        Import-Certificate -FilePath $cerPath -CertStoreLocation $store -ErrorAction Stop | Out-Null
        Write-Host "Trusted cert in $store" -ForegroundColor DarkGray
      } catch {
        # Fallback for environments where Import-Certificate isn't available
        $certutil = Get-Command certutil.exe -ErrorAction SilentlyContinue
        if (-not $certutil) {
          throw "Failed to trust certificate in $store (Import-Certificate unavailable, certutil.exe missing)."
        }

        $storeName = if ($store -match 'TrustedPeople$') { 'TrustedPeople' } else { 'TrustedPublisher' }
        & $certutil.Source -f -user -addstore $storeName $cerPath | Out-Null
        if ($LASTEXITCODE -ne 0) {
          throw "certutil failed to trust certificate in CurrentUser/$storeName (exit $LASTEXITCODE)"
        }
      }
    }
  }

  $installStart = Get-Date
  Write-Host ("Starting Add-AppxPackage at {0:O}" -f $installStart) -ForegroundColor DarkGray
  Write-Host "Package: $stagedMsixPath" -ForegroundColor DarkGray
  if ($dependencyPaths.Count -gt 0) {
    Write-Host "DependencyPath count: $($dependencyPaths.Count)" -ForegroundColor DarkGray
  }

  try {
    if ($dependencyPaths.Count -gt 0) {
      Add-AppxPackage -Path $stagedMsixPath -DependencyPath $dependencyPaths -ForceApplicationShutdown -ForceUpdateFromAnyVersion -ErrorAction Stop
    } else {
      Add-AppxPackage -Path $stagedMsixPath -ForceApplicationShutdown -ForceUpdateFromAnyVersion -ErrorAction Stop
    }

    $installEnd = Get-Date
    $elapsed = New-TimeSpan -Start $installStart -End $installEnd
    Write-Host ("Add-AppxPackage completed at {0:O} (elapsed: {1})" -f $installEnd, $elapsed) -ForegroundColor Green
  } catch {
    $firstError = $_
    Write-Host 'Add-AppxPackage failed on first attempt.' -ForegroundColor Yellow

    if ($installed -and $installed.PackageFullName) {
      Write-Host 'Attempting uninstall + reinstall once (to recover from update conflicts)...' -ForegroundColor Yellow
      try {
        Remove-AppxPackage -Package $installed.PackageFullName -ErrorAction Stop
        Start-Sleep -Seconds 1
      } catch {
        Write-Host "Remove-AppxPackage failed (continuing to throw original install error): $($_.Exception.Message)" -ForegroundColor Yellow
        throw $firstError
      }

      try {
        if ($dependencyPaths.Count -gt 0) {
          Add-AppxPackage -Path $stagedMsixPath -DependencyPath $dependencyPaths -ForceApplicationShutdown -ForceUpdateFromAnyVersion -ErrorAction Stop
        } else {
          Add-AppxPackage -Path $stagedMsixPath -ForceApplicationShutdown -ForceUpdateFromAnyVersion -ErrorAction Stop
        }

        $installEnd = Get-Date
        $elapsed = New-TimeSpan -Start $installStart -End $installEnd
        Write-Host ("Add-AppxPackage succeeded after uninstall at {0:O} (elapsed: {1})" -f $installEnd, $elapsed) -ForegroundColor Green
      } catch {
        Write-Host 'Reinstall attempt failed.' -ForegroundColor Yellow
        throw
      }
    } else {
      Write-Host 'Non-admin package install failed. If this is a policy/dev-mode issue, re-run in an elevated PowerShell once to trust the cert for LocalMachine.' -ForegroundColor Yellow
      throw
    }
  }
} else {
  & $ps.Source -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $stagedAddAppDevPackage -Force -SkipLoggingTelemetry
  if ($LASTEXITCODE -ne 0) {
    throw "Add-AppDevPackage.ps1 failed with exit code $LASTEXITCODE"
  }
}

Write-Step 'Launching app'
$pkg = Get-AppxPackage | Where-Object { $_.Name -eq $identityName } | Select-Object -First 1
if (-not $pkg) {
  throw "Package not found after install: $identityName"
}

Write-Step 'Checking Metro (packager) availability'
if (-not (Test-MetroStatus -HostName '127.0.0.1' -Port 8081)) {
  Write-Host 'Metro is NOT reachable on http://127.0.0.1:8081 right now.' -ForegroundColor Yellow
  Write-Host 'Auto-starting Metro in the background (logs: buildLogs\metro_latest.log)...' -ForegroundColor Yellow
  Start-MetroDetached -RepoRoot $repoRoot -BuildLogsDir $buildLogsDir

  $started = $false
  for ($i = 0; $i -lt 12; $i++) {
    Start-Sleep -Milliseconds 750
    if (Test-MetroStatus -HostName '127.0.0.1' -Port 8081) {
      $started = $true
      break
    }
  }

  if (-not $started) {
    Write-Host 'Metro still NOT reachable. Start it manually in a separate terminal and keep it running:' -ForegroundColor Yellow
    Write-Host '  node node_modules\react-native\cli.js start --reset-cache' -ForegroundColor Yellow
    Write-Host 'If it fails, check buildLogs\metro_latest.log.' -ForegroundColor Yellow
  } else {
    Write-Host '✅ Metro is reachable now.' -ForegroundColor Green
  }
}

Write-Step 'Enabling loopback for localhost Metro'
Enable-LoopbackExemption -PackageFamilyName $pkg.PackageFamilyName

$aumid = "$($pkg.PackageFamilyName)!App"

Write-Step "Launching via AUMID: $aumid"
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

Write-Step 'Post-launch health check'
$proc = @(Get-Process -Name 'anamnese-mobile' -ErrorAction SilentlyContinue)
if ($null -eq $proc -or $proc.Count -eq 0) {
  Write-Host "❌ App process is NOT running after launch attempt." -ForegroundColor Yellow
  Write-Host "AUMID attempted: $aumid" -ForegroundColor Yellow

  Write-Step 'Recent Application crash/WER events (last 20 minutes)'
  $startTime = (Get-Date).AddMinutes(-20)
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

  Write-Step 'Recent AppModel-Runtime/Admin events (last 20 minutes)'
  try {
    Get-WinEvent -FilterHashtable @{ LogName = 'Microsoft-Windows-AppModel-Runtime/Admin'; StartTime = $startTime } -ErrorAction Stop |
      Where-Object { $_.Message -match 'anamnese-mobile' -or $_.Message -match [regex]::Escape($pkg.PackageFamilyName) } |
      Select-Object -First 20 TimeCreated, ProviderName, Id, LevelDisplayName, Message |
      Format-List | Out-String -Width 300 | Write-Host
  } catch {
    Write-Host "Failed to read AppModel-Runtime/Admin event log: $($_.Exception.Message)" -ForegroundColor Yellow
  }
} else {
  Write-Host "✅ App process is running (PID(s): $($proc.Id -join ', '))" -ForegroundColor Green
}

Write-Host "\n✅ Installed and launched (attempted): $aumid" -ForegroundColor Green

} finally {
  if ($transcribing) {
    try { Stop-Transcript | Out-Null } catch { }
    try { Copy-Item -Path $transcriptPath -Destination $latestTranscriptPath -Force } catch { }
  }
}
