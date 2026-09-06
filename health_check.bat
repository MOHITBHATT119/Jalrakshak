@echo off
echo ============================================================
echo  JalRakshak AI 2.0 - Health Check
echo ============================================================
echo.

set PASS=0
set FAIL=0

REM Check Backend
echo [1/4] Checking Backend (http://localhost:8001)...
curl -s -f http://localhost:8001/api/v1/health >nul 2>&1
if errorlevel 1 (
    echo   [FAIL] Backend not responding
    set /a FAIL=FAIL+1
) else (
    echo   [PASS] Backend is running
    set /a PASS=PASS+1
)

REM Check Frontend
echo [2/4] Checking Frontend (http://localhost:5173)...
curl -s -f http://localhost:5173 >nul 2>&1
if errorlevel 1 (
    echo   [FAIL] Frontend not responding
    set /a FAIL=FAIL+1
) else (
    echo   [PASS] Frontend is running
    set /a PASS=PASS+1
)

REM Check Watsonx config
echo [3/4] Checking Watsonx configuration...
curl -s http://localhost:8001/api/v1/health 2>nul | findstr /i "watsonx_configured.*true" >nul 2>&1
if errorlevel 1 (
    echo   [INFO] Watsonx API key not configured - running in DEMO MODE
    set /a PASS=PASS+1
) else (
    echo   [PASS] Watsonx is configured
    set /a PASS=PASS+1
)

REM Check .env exists
echo [4/4] Checking .env file...
if exist ".env" (
    echo   [PASS] .env file exists
    set /a PASS=PASS+1
) else (
    echo   [FAIL] .env file missing - run setup_project.bat
    set /a FAIL=FAIL+1
)

echo.
echo ============================================================
echo  Results: %PASS% passed, %FAIL% failed
echo  Note: API credentials are NOT displayed for security.
echo ============================================================
pause
