$ErrorActionPreference = 'Continue'

function Remove-Robust($path) {
    if (Test-Path $path) {
        Write-Host "Deleting $path..." -ForegroundColor Yellow
        Remove-Item -LiteralPath $path -Recurse -Force -ErrorAction SilentlyContinue
        if (Test-Path $path) {
            Write-Host "  -> Failed to delete fully. Trying cmd.exe..." -ForegroundColor Red
            cmd.exe /c "rmdir /s /q `"$path`""
        }
    }
}

Write-Host "WARNING: This will delete node_modules, windows build, and caches." -ForegroundColor Red
Start-Sleep -Seconds 3

# 1. Kill Processes
Write-Host "Killing processes..." -ForegroundColor Cyan
Get-Process -Name 'node', 'adb', 'msbuild', 'java', 'gradle' -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Delete Caches & Artifacts
Remove-Robust "node_modules"
Remove-Robust "windows/x64"
Remove-Robust "windows/ARM64"
Remove-Robust "windows/Win32"
Remove-Robust "windows/Debug"
Remove-Robust "windows/Release"
Remove-Robust "windows/bin"
Remove-Robust "windows/obj"
Remove-Robust "windows/AppPackages"
Remove-Robust "windows/Bundle"
Remove-Robust "windows/anamnese-mobile/bin"
Remove-Robust "windows/anamnese-mobile/obj"
Remove-Robust "windows/anamnese-mobile/AppPackages"
Remove-Robust "windows/anamnese-mobile/Bundle"
Remove-Robust "windows/anamnese-mobile/Generated Files"
Remove-Robust "windows/anamnese-mobile/x64"

# 3. Clean .__old_ directories (Clutter)
Get-ChildItem -Path "windows" -Filter "*.__old_*" -Recurse -Directory | ForEach-Object {
    Remove-Robust $_.FullName
}

# 4. Metro Cache
Remove-Robust "$env:TEMP/metro-cache"

Write-Host "Clean complete. Installing dependencies..." -ForegroundColor Green
npm install

Write-Host "Dependencies installed. Ready to build." -ForegroundColor Green
Write-Host "Run: npm run windows" -ForegroundColor Cyan
