@echo off
title Eureka CMMS - Start All
echo ========================================
echo    Eureka CMMS - Starting All Services
echo ========================================
echo.

cd /d "%~dp0"

echo Starting Backend...
start "Eureka Backend" cmd /k "start_backend.bat"

timeout /t 3 /nobreak > nul

echo Starting Frontend...
start "Eureka Frontend" cmd /k "start_frontend.bat"

echo.
echo ========================================
echo    All services started!
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.

pause
