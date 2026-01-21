[CmdletBinding()]
param(
  [string]$RepoRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
  $scriptPath = $MyInvocation.MyCommand.Path
  if ([string]::IsNullOrWhiteSpace($scriptPath)) {
    throw 'Unable to determine script path to resolve RepoRoot. Pass -RepoRoot explicitly.'
  }

  $scriptDir = Split-Path -Parent $scriptPath
  $RepoRoot = (Resolve-Path (Join-Path $scriptDir '..')).Path
}

$patchPath = Join-Path $RepoRoot 'patches\react-native-share+10.2.1.patch'

# Keep this patch minimal and portable (no generated obj/ files, no machine-specific paths).
$lines = @(
  'diff --git a/node_modules/react-native-share/windows/ReactNativeShare/ReactNativeShare.vcxproj b/node_modules/react-native-share/windows/ReactNativeShare/ReactNativeShare.vcxproj',
  '--- a/node_modules/react-native-share/windows/ReactNativeShare/ReactNativeShare.vcxproj',
  '+++ b/node_modules/react-native-share/windows/ReactNativeShare/ReactNativeShare.vcxproj',
  '@@',
  '-      <AdditionalOptions>%(AdditionalOptions) /bigobj</AdditionalOptions>',
  '+      <AdditionalOptions>%(AdditionalOptions) /bigobj /FS</AdditionalOptions>',
  '+      <MultiProcessorCompilation>false</MultiProcessorCompilation>',
  '@@',
  '+      <AdditionalOptions>%(AdditionalOptions) /FS</AdditionalOptions>',
  '-    <ClCompile Include="$(GeneratedFilesDir)module.g.cpp" />',
  '+    <ClCompile Include="$(GeneratedFilesDir)module.g.cpp">',
  '+      <AdditionalOptions>%(AdditionalOptions) /FS</AdditionalOptions>',
  '+    </ClCompile>'
)

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $patchPath) | Out-Null
[System.IO.File]::WriteAllLines($patchPath, $lines, (New-Object System.Text.UTF8Encoding($false)))

$fi = Get-Item $patchPath
Write-Host "Wrote patch: $($fi.FullName) ($($fi.Length) bytes)" -ForegroundColor Green
