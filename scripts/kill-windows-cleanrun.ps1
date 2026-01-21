[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$procs = Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
  Where-Object { $_.CommandLine -match 'windows-cleanrun\.ps1' }

if (-not $procs) {
  Write-Output 'No windows-cleanrun.ps1 process found.'
  exit 0
}

foreach ($p in $procs) {
  try {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Output "Killed PID $($p.ProcessId)"
  } catch {
    Write-Output "Failed to kill PID $($p.ProcessId): $($_.Exception.Message)"
  }
}
