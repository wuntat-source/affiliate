@echo off
title Threads Playwright Login Assistant
cd /d "%~dp0"
echo ========================================================
echo        THREADS BROWSER LOGIN ASSISTANT (PLAYWRIGHT)
echo ========================================================
node scripts/login-browser.mjs %*
pause
