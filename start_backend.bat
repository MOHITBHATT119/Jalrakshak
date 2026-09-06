@echo off
echo ============================================================
echo  JalRakshak AI 2.0 - Starting Backend
echo ============================================================
echo.
echo Backend: http://localhost:8001
echo API Docs: http://localhost:8001/docs
echo.
cd /d %~dp0
.venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8001 --app-dir backend
