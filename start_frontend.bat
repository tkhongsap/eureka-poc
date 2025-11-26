@echo off
title Eureka CMMS - Frontend
echo ========================================
echo    Eureka CMMS - Starting Frontend
echo ========================================
echo.

cd /d "%~dp0"

echo Installing dependencies...
call npm install

echo.
echo Starting Vite dev server...
echo Frontend will be available at: http://localhost:5173
echo.

call npm run dev

pause
