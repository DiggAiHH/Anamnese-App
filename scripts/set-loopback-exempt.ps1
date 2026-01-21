[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$PackageFamilyName
)

$ErrorActionPreference = 'Continue'

Write-Host "Adding loopback exemption for: $PackageFamilyName" -ForegroundColor Cyan

try {
  & CheckNetIsolation LoopbackExempt -a -n=$PackageFamilyName 2>&1 | Out-String | Write-Host
} catch {
  Write-Host "CheckNetIsolation add failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

try {
  & CheckNetIsolation LoopbackExempt -s 2>&1 | Out-String | Write-Host
} catch {
}
