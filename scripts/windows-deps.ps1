param(
  [string[]]$Tags = @('appDev'),
  [switch]$NoPrompt = $true
)

$ErrorActionPreference = 'Stop'

function Test-IsAdmin {
  $currentIdentity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($currentIdentity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repoRoot

$depsScript = Join-Path $repoRoot 'node_modules\react-native-windows\scripts\rnw-dependencies.ps1'
if (-not (Test-Path $depsScript)) {
  throw "Missing RNW dependencies script at: $depsScript"
}

if (-not (Test-IsAdmin)) {
  $self = $MyInvocation.MyCommand.Path
  $tagArgs = $Tags | ForEach-Object { '-Tags ' + $_ }
  $args = @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', '"' + $self + '"'
  ) + $tagArgs

  if ($NoPrompt) {
    $args += '-NoPrompt'
  }

  Write-Host 'Re-launching as Administrator (UAC prompt expected)...'
  Start-Process -FilePath 'powershell.exe' -Verb RunAs -ArgumentList ($args -join ' ')
  exit 0
}

Write-Host 'Installing/checking React Native Windows build dependencies...'
$installArgs = @('-NoProfile','-ExecutionPolicy','Bypass','-File', $depsScript, '-Install')
if ($NoPrompt) {
  $installArgs += '-NoPrompt'
}
foreach ($tag in $Tags) {
  $installArgs += @('-Tags', $tag)
}

powershell.exe @installArgs
