[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$procs = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
  ($_.CommandLine -match 'windows-cleanrun\.ps1') -or ($_.CommandLine -match 'windows-dev-run\.ps1')
})

if ($procs.Count -eq 0) {
  Write-Output 'NO cleanrun/dev-run processes found.'
  exit 0
}

$procs |
  Select-Object ProcessId,ParentProcessId,Name,CommandLine |
  Format-List |
  Out-String -Width 400 |
  Write-Output
