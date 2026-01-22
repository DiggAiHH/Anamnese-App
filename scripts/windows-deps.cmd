@echo off
setlocal
cd /d "%~dp0.."
REM Self-elevating dependency installer (does not rely on npm.ps1)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "scripts\windows-deps.ps1"
endlocal
