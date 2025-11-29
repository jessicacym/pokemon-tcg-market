@echo off
echo Stopping existing server...
taskkill /IM node.exe /F
timeout /t 2 /nobreak > nul
echo Starting server...
cd /d "%~dp0"
start "Pokemon TCG Server" node server.js
echo Server restarted!
pause
