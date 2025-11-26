@echo off
title Eureka CMMS - Backend
echo ========================================
echo    Eureka CMMS - Starting Backend
echo ========================================
echo.

cd /d "%~dp0backend"

echo Checking Python virtual environment...
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Starting FastAPI server...
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.

python run.py

pause
