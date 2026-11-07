@echo off
cd /d "%~dp0"
echo.
echo  Starting Shenzhou local preview...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0preview.ps1"
pause
