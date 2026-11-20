@echo off
setlocal
cd /d "%~dp0"
node scripts\security\run-audit.js %*
endlocal

