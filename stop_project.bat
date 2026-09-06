@echo off
echo ============================================================
echo  JalRakshak AI 2.0 - Stopping Project
echo ============================================================
echo.
echo Stopping processes on ports 8000 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000 " ^| find "LISTENING"') do (
    echo Stopping backend PID %%a
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173 " ^| find "LISTENING"') do (
    echo Stopping frontend PID %%a
    taskkill /PID %%a /F >nul 2>&1
)
echo Done.
pause
