param(
  [switch]$Init = $true,
  [switch]$InstallDeps = $true,
  [switch]$Run = $true
)

$ErrorActionPreference = 'Stop'

function Test-IsAdmin {
  $currentIdentity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($currentIdentity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repoRoot

# Reduce spinner/ANSI issues in some terminals
$env:CI = '1'
$env:FORCE_COLOR = '0'

if ($InstallDeps -and -not (Test-IsAdmin)) {
  $self = $MyInvocation.MyCommand.Path
  $args = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', '"' + $self + '"')

  if (-not $Init) { $args += '-Init:$false' }
  if (-not $InstallDeps) { $args += '-InstallDeps:$false' }
  if (-not $Run) { $args += '-Run:$false' }

  Write-Host 'Re-launching as Administrator (UAC prompt expected)...'
  Start-Process -FilePath 'powershell.exe' -Verb RunAs -ArgumentList ($args -join ' ')
  exit 0
}

if ($Init) {
  if (-not (Test-Path (Join-Path $repoRoot 'windows'))) {
    Write-Host 'Generating windows/ project...'
    node .\node_modules\react-native-windows-init\bin.js --overwrite --verbose
  } else {
    Write-Host 'windows/ already exists; skipping init.'
  }
}

if ($InstallDeps) {
  $depsScript = Join-Path $repoRoot 'node_modules\react-native-windows\scripts\rnw-dependencies.ps1'
  if (-not (Test-Path $depsScript)) {
    throw "Missing RNW dependencies script at: $depsScript"
  }

  Write-Host 'Installing/checking React Native Windows build dependencies...'
  # appDev includes VS + Windows SDK checks. This may take time and require downloads.
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File $depsScript -Install -NoPrompt -Tags appDev
}

if ($Run) {
  Write-Host 'Running Windows app...'
  cmd /c "npm.cmd run windows"
}
