param(
  [Parameter(Mandatory = $true)]
  [string]$Aumid,

  [int]$Minutes = 15
)

$ErrorActionPreference = 'Continue'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$buildLogsDir = Join-Path $repoRoot 'buildLogs'
New-Item -ItemType Directory -Path $buildLogsDir -Force | Out-Null

$transcribing = $false
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$transcriptPath = Join-Path $buildLogsDir "launch_diagnose_${timestamp}.log"
$latestTranscriptPath = Join-Path $buildLogsDir 'launch_diagnose_latest.log'
$exitCode = 0

try {

$failReasons = New-Object System.Collections.Generic.List[string]
  Start-Transcript -Path $transcriptPath -Force | Out-Null
  $transcribing = $true
} catch {
  # Best-effort only.
}

try {

function Write-Header([string]$title) {
  "`n==== $title ====\n" | Write-Output
}

$startTime = (Get-Date).AddMinutes(-1 * [Math]::Abs($Minutes))

$pfn = ($Aumid -split '!')[0]
$pkg = $null
try {
  $pkg = Get-AppxPackage | Where-Object { $_.PackageFamilyName -eq $pfn } | Select-Object -First 1
} catch {
}

Write-Header "Launch diagnostic"
"Time:        $(Get-Date -Format o)" | Write-Output
"AUMID:       $Aumid" | Write-Output
"PFN:         $pfn" | Write-Output
"Start window: $startTime" | Write-Output

if ($pkg) {
  Write-Header 'Installed package details'
  $pkg | Select-Object Name, PackageFullName, PackageFamilyName, Status, IsDevelopmentMode, InstallLocation |
    Format-List | Out-String -Width 300 | Write-Output

  Write-Header 'Installed manifest + executable check'
  try {
    $installedManifestPath = Join-Path $pkg.InstallLocation 'AppxManifest.xml'
    "AppxManifest.xml: $installedManifestPath" | Write-Output
    if (Test-Path $installedManifestPath) {
      [xml]$installedManifest = Get-Content -Path $installedManifestPath
      $appNode = $installedManifest.Package.Applications.Application | Select-Object -First 1
      $exe = [string]$appNode.Executable
      $entryPoint = [string]$appNode.EntryPoint
      "Executable:  $exe" | Write-Output
      "EntryPoint:  $entryPoint" | Write-Output

      Write-Header 'Manifest dependency sanity (Debug framework detection)'
      try {
        $depNodes = $installedManifest.SelectNodes("//*[local-name()='PackageDependency']")
        $depNames = @()
        foreach ($dn in ($depNodes | Where-Object { $_ })) {
          $name = [string]$dn.GetAttribute('Name')
          if (-not [string]::IsNullOrWhiteSpace($name)) { $depNames += $name }
        }

        $debugDeps = @($depNames | Where-Object { $_ -match '(?i)\\bdebug\\b|\\.Debug(\\b|$)' })
        if ($debugDeps.Count -gt 0) {
          '❌ Debug dependencies detected:' | Write-Output
          ($debugDeps | Sort-Object -Unique) | ForEach-Object { "  - $_" | Write-Output }
          $failReasons.Add('Installed manifest includes Debug framework dependencies.') | Out-Null
        } else {
          '✅ No obvious Debug dependencies found in PackageDependency list.' | Write-Output
        }
      } catch {
        "Dependency Debug-scan ERROR: $($_.Exception.Message)" | Write-Output
      }

      Write-Header 'Manifest dependencies (PackageDependency)'
      try {
        $depNodes = $installedManifest.SelectNodes("//*[local-name()='PackageDependency']")
        if ($depNodes -and $depNodes.Count -gt 0) {
          $deps = @()
          foreach ($dn in $depNodes) {
            $name = [string]$dn.GetAttribute('Name')
            $minVersion = [string]$dn.GetAttribute('MinVersion')
            if (-not [string]::IsNullOrWhiteSpace($name)) {
              $deps += [pscustomobject]@{ Name = $name; MinVersion = $minVersion }
            }
          }

          if ($deps.Count -gt 0) {
            $deps | Sort-Object Name | Format-Table -AutoSize | Out-String | Write-Output

            Write-Header 'Dependency install check (Get-AppxPackage)'
            foreach ($dep in ($deps | Sort-Object Name)) {
              try {
                $installed = Get-AppxPackage -Name $dep.Name -ErrorAction SilentlyContinue | Select-Object -First 1
                if ($installed) {
                  $arch = $null
                  try { $arch = $installed.Architecture } catch { }
                  "OK   $($dep.Name)  $($installed.Version)  ($arch)  $($installed.PackageFullName)" | Write-Output
                } else {
                  "MISS $($dep.Name)  (MinVersion: $($dep.MinVersion))" | Write-Output
                }
              } catch {
                "ERR  $($dep.Name)  $($_.Exception.Message)" | Write-Output
              }
            }
          } else {
            'No PackageDependency Name attributes found.' | Write-Output
          }
        } else {
          'No <PackageDependency> entries found in manifest.' | Write-Output
        }
      } catch {
        "Dependency parse ERROR: $($_.Exception.Message)" | Write-Output
      }

      if (-not [string]::IsNullOrWhiteSpace($exe)) {
        $exePath = Join-Path $pkg.InstallLocation $exe
        "Exe path:    $exePath" | Write-Output
        "Exe exists:  $((Test-Path $exePath))" | Write-Output

        Write-Header 'Direct exe start (best-effort)'
        try {
          if (Test-Path $exePath) {
            $p = Start-Process -FilePath $exePath -PassThru -ErrorAction Stop
            Start-Sleep -Milliseconds 800
            if ($p.HasExited) {
              "Direct start: exited quickly (ExitCode: $($p.ExitCode))" | Write-Output
            } else {
              "Direct start: running (PID: $($p.Id)); stopping (diagnostic only)" | Write-Output
              try { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } catch { }
            }
          } else {
            'Direct start: skipped (exe missing)' | Write-Output
          }
        } catch {
          "Direct start ERROR: $($_.Exception.Message)" | Write-Output
        }
      }
    } else {
      'AppxManifest.xml not readable (missing or access denied).' | Write-Output
    }
  } catch {
    "Manifest check ERROR: $($_.Exception.Message)" | Write-Output
  }

  Write-Header 'Installed folder exe listing'
  try {
    Get-ChildItem -Path $pkg.InstallLocation -Filter '*.exe' -ErrorAction Stop |
      Select-Object Name, Length, LastWriteTime |
      Format-Table -AutoSize | Out-String | Write-Output
  } catch {
    "Exe listing ERROR: $($_.Exception.Message)" | Write-Output
  }

  Write-Header 'JS bundle presence (heuristic)'
  try {
    $bundleHits = Get-ChildItem -Path $pkg.InstallLocation -Recurse -Include '*.bundle', '*.jsbundle' -ErrorAction Stop |
      Select-Object -First 30 FullName, Length
    if ($bundleHits) {
      $bundleHits | Format-Table -AutoSize | Out-String | Write-Output
    } else {
      'No *.bundle/*.jsbundle files found under InstallLocation.' | Write-Output
      $failReasons.Add('No JS bundle found inside installed package (expected for Release self-contained).') | Out-Null
    }
  } catch {
    "Bundle scan ERROR: $($_.Exception.Message)" | Write-Output
  }

  Write-Header 'Metro packager check (http://127.0.0.1:8081/status)'
  try {
    $resp = Invoke-WebRequest -Uri 'http://127.0.0.1:8081/status' -UseBasicParsing -TimeoutSec 2
    "Status: $($resp.StatusCode)" | Write-Output
    "Body:   $($resp.Content)" | Write-Output
  } catch {
    "Metro check ERROR: $($_.Exception.Message)" | Write-Output
  }
} else {
  Write-Header 'Installed package details'
  "Package not found by PFN (may be uninstalled)." | Write-Output
}

Write-Header 'Verdict'
if (-not $pkg) {
  '❌ FAIL: Package not installed (Get-AppxPackage returned nothing).' | Write-Output
  $exitCode = 2
} elseif ($failReasons.Count -gt 0) {
  '❌ FAIL:' | Write-Output
  foreach ($r in $failReasons) { "  - $r" | Write-Output }
  $exitCode = 1
} else {
  '✅ PASS: No obvious self-containment blockers detected by heuristic checks.' | Write-Output
  $exitCode = 0
}

Write-Header "Attempt launch (explorer.exe)"
try {
  $launchTime = Get-Date
  Start-Process -FilePath "explorer.exe" -ArgumentList "shell:AppsFolder\\$Aumid" | Out-Null
  "explorer.exe launch invoked" | Write-Output
} catch {
  "explorer.exe launch ERROR: $($_.Exception.Message)" | Write-Output
}

Start-Sleep -Seconds 2

Write-Header "Attempt launch (Shell.Application COM)"
try {
  $shell = New-Object -ComObject Shell.Application
  $shell.ShellExecute("shell:AppsFolder\\$Aumid")
  "ShellExecute invoked" | Write-Output
} catch {
  "ShellExecute ERROR: $($_.Exception.Message)" | Write-Output
}

Start-Sleep -Seconds 2

Write-Header "Process check"
try {
  $everSeen = $false
  for ($i = 0; $i -lt 200; $i++) {
    $procs = Get-Process -Name 'anamnese-mobile' -ErrorAction SilentlyContinue
    if ($procs) {
      $everSeen = $true
      "anamnese-mobile process: RUNNING (poll #$i)" | Write-Output
      $procs | Select-Object Name, Id, StartTime | Format-Table -AutoSize | Out-String | Write-Output
      break
    }
    Start-Sleep -Milliseconds 50
  }

  if (-not $everSeen) {
    "anamnese-mobile process: NOT RUNNING (never observed during polling)" | Write-Output
  }
} catch {
  "Process check ERROR: $($_.Exception.Message)" | Write-Output
}

Write-Header "Post-launch process sniffer (CIM, 10s)"
try {
  if (-not $launchTime) { $launchTime = $startTime }
  $end = (Get-Date).AddSeconds(10)
  $hits = @()
  while ((Get-Date) -lt $end) {
    try {
      $cims = Get-CimInstance Win32_Process -ErrorAction Stop |
        Where-Object {
          $_.CreationDate -and ([Management.ManagementDateTimeConverter]::ToDateTime($_.CreationDate) -ge $launchTime) -and (
            ($_.CommandLine -and ($_.CommandLine -match 'anamnese-mobile' -or $_.CommandLine -match $pfn -or $_.CommandLine -match 'WindowsApps'))
          )
        } |
        Select-Object Name, ProcessId, CreationDate, CommandLine

      foreach ($p in $cims) {
        $hits += $p
      }
    } catch {
      # ignore
    }
    Start-Sleep -Milliseconds 250
  }

  if ($hits -and $hits.Count -gt 0) {
    $hits |
      Sort-Object ProcessId -Unique |
      Select-Object -First 50 Name, ProcessId, CreationDate, CommandLine |
      Format-List | Out-String -Width 300 | Write-Output
  } else {
    'No new related processes observed via CIM.' | Write-Output
  }
} catch {
  "Process sniffer ERROR: $($_.Exception.Message)" | Write-Output
}

Write-Header "Related host processes (informational)"
try {
  $hosts = Get-Process -Name 'ApplicationFrameHost', 'RuntimeBroker', 'WWAHost' -ErrorAction SilentlyContinue |
    Select-Object Name, Id, StartTime
  if ($hosts) {
    $hosts | Format-Table -AutoSize | Out-String | Write-Output
  } else {
    'No related host processes found (unexpected on most systems).' | Write-Output
  }
} catch {
  "Host process query ERROR: $($_.Exception.Message)" | Write-Output
}

Write-Header "Process scan by InstallLocation (CIM)"
try {
  if ($pkg -and $pkg.InstallLocation) {
    $il = $pkg.InstallLocation.Replace('\\', '\\\\')
    $procs2 = Get-CimInstance Win32_Process -ErrorAction Stop |
      Where-Object {
        $_.CommandLine -and (
          $_.CommandLine -like "*$($pkg.InstallLocation)*" -or
          $_.CommandLine -like "*$pfn*" -or
          $_.CommandLine -like "*anamnese-mobile*"
        )
      } |
      Select-Object Name, ProcessId, CommandLine

    if ($procs2) {
      $procs2 | Format-List | Out-String -Width 300 | Write-Output
    } else {
      "No matching Win32_Process found." | Write-Output
    }
  } else {
    "InstallLocation unknown; skipping." | Write-Output
  }
} catch {
  "Process scan ERROR: $($_.Exception.Message)" | Write-Output
}

Write-Header "Recent Application log (crash/wer)"
try {
  Get-WinEvent -FilterHashtable @{ LogName = 'Application'; StartTime = $startTime } -ErrorAction Stop |
    Where-Object {
      ($_.ProviderName -in @('Application Error', 'Windows Error Reporting')) -and
      ($_.Message -match 'anamnese-mobile')
    } |
    Select-Object -First 20 TimeCreated, ProviderName, Id, LevelDisplayName, Message |
    Format-List | Out-String -Width 300 | Write-Output
} catch {
  "Application log query ERROR: $($_.Exception.Message)" | Write-Output
}

Write-Header "Recent Application Error/WER (unfiltered, first 15)"
try {
  Get-WinEvent -FilterHashtable @{ LogName = 'Application'; StartTime = $startTime } -ErrorAction Stop |
    Where-Object { $_.ProviderName -in @('Application Error', 'Windows Error Reporting') } |
    Select-Object -First 15 TimeCreated, ProviderName, Id, LevelDisplayName, Message |
    Format-List | Out-String -Width 300 | Write-Output
} catch {
  "Application unfiltered query ERROR: $($_.Exception.Message)" | Write-Output
}

Write-Header "Recent Application Error/WER (filtered by app/host, first 50)"
try {
  Get-WinEvent -FilterHashtable @{ LogName = 'Application'; StartTime = $startTime } -ErrorAction Stop |
    Where-Object {
      $_.ProviderName -in @('Application Error', 'Windows Error Reporting') -and (
        $_.Message -match 'anamnese-mobile' -or
        $_.Message -match 'ApplicationFrameHost' -or
        $_.Message -match $pfn -or
        $_.Message -match 'cc3a5ac8-ac09-4f03-b6c9-0cfd812841a0'
      )
    } |
    Select-Object -First 50 TimeCreated, ProviderName, Id, LevelDisplayName, Message |
    Format-List | Out-String -Width 300 | Write-Output
} catch {
  "Application filtered query ERROR: $($_.Exception.Message)" | Write-Output
}

Write-Header "Recent AppModel-Runtime/Admin log"
try {
  Get-WinEvent -FilterHashtable @{ LogName = 'Microsoft-Windows-AppModel-Runtime/Admin'; StartTime = $startTime } -ErrorAction Stop |
    Where-Object { $_.Message -match 'anamnese-mobile' -or $_.Message -match $Aumid } |
    Select-Object -First 30 TimeCreated, ProviderName, Id, LevelDisplayName, Message |
    Format-List | Out-String -Width 300 | Write-Output
} catch {
  "AppModel-Runtime log query ERROR: $($_.Exception.Message)" | Write-Output
}

Write-Header "Recent AppModel-Runtime/Operational log"
try {
  Get-WinEvent -FilterHashtable @{ LogName = 'Microsoft-Windows-AppModel-Runtime/Operational'; StartTime = $startTime } -ErrorAction Stop |
    Where-Object { $_.Message -match 'anamnese-mobile' -or $_.Message -match $pfn -or $_.Message -match 'cc3a5ac8-ac09-4f03-b6c9-0cfd812841a0' } |
    Select-Object -First 40 TimeCreated, ProviderName, Id, LevelDisplayName, Message |
    Format-List | Out-String -Width 300 | Write-Output
} catch {
  "AppModel-Runtime/Operational query ERROR: $($_.Exception.Message)" | Write-Output
}

Write-Header "Recent TWinUI/Operational log"
try {
  Get-WinEvent -FilterHashtable @{ LogName = 'Microsoft-Windows-TWinUI/Operational'; StartTime = $startTime } -ErrorAction Stop |
    Where-Object { $_.LevelDisplayName -in @('Error', 'Warning') -or $_.Message -match $pfn -or $_.Message -match 'anamnese-mobile' } |
    Select-Object -First 40 TimeCreated, ProviderName, Id, LevelDisplayName, Message |
    Format-List | Out-String -Width 300 | Write-Output
} catch {
  "TWinUI/Operational query ERROR: $($_.Exception.Message)" | Write-Output
}

Write-Header "Recent AppXDeploymentServer/Operational log"
try {
  Get-WinEvent -FilterHashtable @{ LogName = 'Microsoft-Windows-AppXDeploymentServer/Operational'; StartTime = $startTime } -ErrorAction Stop |
    Where-Object { $_.LevelDisplayName -in @('Error', 'Warning') -or $_.Message -match $pfn -or $_.Message -match 'cc3a5ac8-ac09-4f03-b6c9-0cfd812841a0' } |
    Select-Object -First 40 TimeCreated, ProviderName, Id, LevelDisplayName, Message |
    Format-List | Out-String -Width 300 | Write-Output
} catch {
  "AppXDeploymentServer/Operational query ERROR: $($_.Exception.Message)" | Write-Output
}

Write-Header "Recent AppReadiness/Admin log"
try {
  Get-WinEvent -FilterHashtable @{ LogName = 'Microsoft-Windows-AppReadiness/Admin'; StartTime = $startTime } -ErrorAction Stop |
    Where-Object { $_.LevelDisplayName -in @('Error', 'Warning') -or $_.Message -match $pfn -or $_.Message -match 'anamnese-mobile' } |
    Select-Object -First 40 TimeCreated, ProviderName, Id, LevelDisplayName, Message |
    Format-List | Out-String -Width 300 | Write-Output
} catch {
  "AppReadiness/Admin query ERROR: $($_.Exception.Message)" | Write-Output
}

Write-Header "Recent AppReadiness/Operational log"
try {
  Get-WinEvent -FilterHashtable @{ LogName = 'Microsoft-Windows-AppReadiness/Operational'; StartTime = $startTime } -ErrorAction Stop |
    Where-Object { $_.LevelDisplayName -in @('Error', 'Warning') -or $_.Message -match $pfn -or $_.Message -match 'anamnese-mobile' } |
    Select-Object -First 40 TimeCreated, ProviderName, Id, LevelDisplayName, Message |
    Format-List | Out-String -Width 300 | Write-Output
} catch {
  "AppReadiness/Operational query ERROR: $($_.Exception.Message)" | Write-Output
}

Write-Header "Recent AppHost/Admin log"
try {
  Get-WinEvent -FilterHashtable @{ LogName = 'Microsoft-Windows-AppHost/Admin'; StartTime = $startTime } -ErrorAction Stop |
    Where-Object { $_.LevelDisplayName -in @('Error', 'Warning') -or $_.Message -match $pfn -or $_.Message -match 'anamnese-mobile' } |
    Select-Object -First 40 TimeCreated, ProviderName, Id, LevelDisplayName, Message |
    Format-List | Out-String -Width 300 | Write-Output
} catch {
  "AppHost/Admin query ERROR: $($_.Exception.Message)" | Write-Output
}

Write-Header "Recent AppHost/Operational log"
try {
  Get-WinEvent -FilterHashtable @{ LogName = 'Microsoft-Windows-AppHost/Operational'; StartTime = $startTime } -ErrorAction Stop |
    Where-Object { $_.LevelDisplayName -in @('Error', 'Warning') -or $_.Message -match $pfn -or $_.Message -match 'anamnese-mobile' } |
    Select-Object -First 40 TimeCreated, ProviderName, Id, LevelDisplayName, Message |
    Format-List | Out-String -Width 300 | Write-Output
} catch {
  "AppHost/Operational query ERROR: $($_.Exception.Message)" | Write-Output
}

Write-Header "Recent CodeIntegrity/Operational log (blocked binaries)"
try {
  Get-WinEvent -FilterHashtable @{ LogName = 'Microsoft-Windows-CodeIntegrity/Operational'; StartTime = $startTime } -ErrorAction Stop |
    Where-Object { $_.LevelDisplayName -in @('Error', 'Warning') -or $_.Message -match 'anamnese-mobile' -or $_.Message -match $pfn } |
    Select-Object -First 40 TimeCreated, ProviderName, Id, LevelDisplayName, Message |
    Format-List | Out-String -Width 300 | Write-Output
} catch {
  "CodeIntegrity/Operational query ERROR: $($_.Exception.Message)" | Write-Output
}

Write-Header "Recent AppLocker/EXE and DLL log (blocked binaries)"
try {
  Get-WinEvent -FilterHashtable @{ LogName = 'Microsoft-Windows-AppLocker/EXE and DLL'; StartTime = $startTime } -ErrorAction Stop |
    Where-Object { $_.LevelDisplayName -in @('Error', 'Warning') -or $_.Message -match 'anamnese-mobile' -or $_.Message -match $pfn } |
    Select-Object -First 40 TimeCreated, ProviderName, Id, LevelDisplayName, Message |
    Format-List | Out-String -Width 300 | Write-Output
} catch {
  "AppLocker/EXE and DLL query ERROR: $($_.Exception.Message)" | Write-Output
}

} finally {
  if ($transcribing) {
    try { Stop-Transcript | Out-Null } catch { }
    try { Copy-Item -Path $transcriptPath -Destination $latestTranscriptPath -Force } catch { }
  }
}

exit $exitCode
