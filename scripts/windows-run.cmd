@echo off
setlocal
cd /d "%~dp0.."
REM Run Windows app via npm.cmd to avoid PowerShell execution policy issues
npm.cmd run windows
endlocal
