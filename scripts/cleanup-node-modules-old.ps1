[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $repoRoot

$dirs = Get-ChildItem -Directory -Filter 'node_modules.__old_*' -ErrorAction SilentlyContinue

if (-not $dirs) {
  Write-Output 'No node_modules.__old_* directories found.'
  exit 0
}

foreach ($d in $dirs) {
  Write-Output "Removing $($d.FullName)"
  cmd.exe /d /c "rmdir /s /q \"$($d.FullName)\"" | Out-Null
}

Write-Output 'Done.'
