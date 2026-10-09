@echo off
cd /d "%~dp0"
pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-QuickCart.ps1" %*
if errorlevel 1 pause
