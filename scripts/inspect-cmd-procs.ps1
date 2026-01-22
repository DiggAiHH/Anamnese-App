[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$procs = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq 'cmd.exe' })

if ($procs.Count -eq 0) {
  Write-Output 'NO cmd.exe processes found.'
  exit 0
}

$procs |
  Select-Object ProcessId,ParentProcessId,CommandLine |
  Format-List |
  Out-String -Width 400 |
  Write-Output
