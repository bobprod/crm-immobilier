@echo off
title Immo SaaS — Launcher
cd /d "%~dp0"
echo.
echo  ====================================================
echo         Immo SaaS — CRM Immobilier Launcher
echo.
echo   Dashboard : http://localhost:3000
echo   Backend   : http://localhost:3001/api
echo   Frontend  : http://localhost:3002
echo  ====================================================
echo.
node launcher.mjs
pause
