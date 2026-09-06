@echo off
echo ============================================================
echo  JalRakshak AI 2.0 - Starting Full Application
echo ============================================================
echo.
echo Starting Backend (FastAPI)...
start "JalRakshak Backend" cmd /k "cd /d %~dp0 && .venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8001 --app-dir backend"
echo.
echo Waiting 3 seconds for backend...
timeout /t 3 /nobreak >nul
echo.
echo Starting Frontend (React/Vite)...
start "JalRakshak Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo ============================================================
echo  Backend:   http://localhost:8001
echo  Frontend:  http://localhost:5173
echo  API Docs:  http://localhost:8001/docs
echo ============================================================
echo.
echo Both services started in separate windows.
echo Close those windows to stop the application.
pause
