[CmdletBinding()]
param(
  [ValidateSet('x64','Win32','ARM64')]
  [string]$Platform = 'x64',

  [string]$Configuration = 'Release'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$windowsDir = Join-Path $repoRoot 'windows'
$solutionPath = Join-Path $windowsDir 'anamnese-mobile.sln'
if (-not (Test-Path $solutionPath)) {
  throw "Solution not found: $solutionPath"
}

$msbuildExe = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe'
if (-not (Test-Path $msbuildExe)) {
  throw "MSBuild not found: $msbuildExe"
}

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$buildLogsDir = Join-Path $repoRoot 'buildLogs'
New-Item -ItemType Directory -Force -Path $buildLogsDir | Out-Null

$appProjectDir = Join-Path $windowsDir 'anamnese-mobile'
$appxOutRoot = Join-Path $appProjectDir 'AppPackages'
New-Item -ItemType Directory -Force -Path $appxOutRoot | Out-Null

$packageDir = Join-Path $appxOutRoot ("anamnese-mobile_{0}_{1}_{2}_Test\\" -f $Platform, $Configuration, $stamp)
New-Item -ItemType Directory -Force -Path $packageDir | Out-Null

$binlogPath = Join-Path $buildLogsDir ("msbuild_release_packaging_{0}.binlog" -f $stamp)
$msbuildLogPath = Join-Path $buildLogsDir ("msbuild_release_packaging_{0}.log" -f $stamp)
$msbuildStdoutPath = Join-Path $buildLogsDir ("msbuild_release_packaging_{0}.stdout.log" -f $stamp)
$msbuildStderrPath = Join-Path $buildLogsDir ("msbuild_release_packaging_{0}.stderr.log" -f $stamp)

Write-Host "Packaging output dir: $packageDir" -ForegroundColor DarkGray
Write-Host "MSBuild log: $msbuildLogPath" -ForegroundColor DarkGray
Write-Host "MSBuild binlog: $binlogPath" -ForegroundColor DarkGray
Write-Host "MSBuild stdout: $msbuildStdoutPath" -ForegroundColor DarkGray
Write-Host "MSBuild stderr: $msbuildStderrPath" -ForegroundColor DarkGray

$msbuildArgs = @(
  $solutionPath,
  '/m',
  '/restore',
  '/t:Build;AppxPackage',
  "/p:Configuration=$Configuration",
  "/p:Platform=$Platform",
  '/p:VisualStudioVersion=17.0',
  '/p:AppxBundle=Never',
  '/p:UapAppxPackageBuildMode=SideloadOnly',
  '/p:GenerateAppxPackageOnBuild=true',
  "/p:AppxPackageDir=$packageDir",
  '/fl',
  "/flp:logfile=$msbuildLogPath;verbosity=normal",
  "/bl:$binlogPath"
)

$proc = Start-Process -FilePath $msbuildExe -ArgumentList $msbuildArgs -NoNewWindow -Wait -PassThru `
  -RedirectStandardOutput $msbuildStdoutPath -RedirectStandardError $msbuildStderrPath

$exitCode = $proc.ExitCode
Write-Host "MSBuild exit code: $exitCode" -ForegroundColor Yellow

if ($exitCode -ne 0) {
  throw "MSBuild packaging failed with exit code $exitCode"
}

$packageExtensions = @('.msix','.appx','.msixbundle','.appxbundle')
$expectedAddAppDev = Join-Path $packageDir 'Add-AppDevPackage.ps1'
$expectedPackages = @(
  Get-ChildItem -Path $packageDir -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Extension -in $packageExtensions }
)

if (-not (Test-Path $expectedAddAppDev) -or $expectedPackages.Count -eq 0) {
  throw "MSBuild succeeded but did not produce Add-AppDevPackage.ps1 + a package in: $packageDir"
}

Write-Host "Packaging artifacts found in: $packageDir" -ForegroundColor Green
