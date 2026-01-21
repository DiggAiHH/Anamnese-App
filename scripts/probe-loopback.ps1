[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$PackageFamilyName
)

$ErrorActionPreference = 'Continue'

Write-Host "PFN: $PackageFamilyName" -ForegroundColor Yellow

try {
  $out = & CheckNetIsolation LoopbackExempt -s 2>&1
  $text = ($out | Out-String)
  if ($text -match [regex]::Escape($PackageFamilyName)) {
    Write-Host 'LoopbackExempt: PRESENT' -ForegroundColor Green
  } else {
    Write-Host 'LoopbackExempt: NOT present' -ForegroundColor Yellow
    Write-Host "To add (may require elevation): CheckNetIsolation LoopbackExempt -a -n=$PackageFamilyName" -ForegroundColor Yellow
  }
} catch {
  Write-Host "CheckNetIsolation query failed: $($_.Exception.Message)" -ForegroundColor Yellow
}
