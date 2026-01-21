[CmdletBinding()]
param(
  [string]$Path = 'buildLogs\windows-cleanrun_latest.out.log'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (Test-Path -LiteralPath $Path) {
  Get-Item -LiteralPath $Path |
    Select-Object FullName,Length,LastWriteTime |
    Format-List |
    Out-String |
    Write-Output
  exit 0
}

Write-Output "Log missing: $Path"
exit 0
