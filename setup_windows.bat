@echo off
REM Setup script for Windows users

echo ======================================
echo  Smart Student Tracking - Setup Script
echo ======================================
echo.

REM Check if PowerShell is available
where powershell >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo PowerShell not found. Please install PowerShell.
    exit /b 1
)

REM Run the PowerShell setup script
echo Running PowerShell setup script...
powershell -ExecutionPolicy Bypass -File setup_ai_features.ps1

echo.
echo Setup completed. Check AI_FEATURES_SETUP.md for more information.
pause
