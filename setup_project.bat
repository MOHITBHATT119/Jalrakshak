@echo off
echo ============================================================
echo  JalRakshak AI 2.0 - Setup
echo ============================================================
echo.

REM Check Python
python --version 2>nul || py --version 2>nul
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.10+
    pause & exit /b 1
)
echo [OK] Python found

REM Check Node
node --version 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js 18+
    pause & exit /b 1
)
echo [OK] Node.js found

REM Create .venv
if not exist ".venv" (
    echo [SETUP] Creating Python virtual environment...
    py -m venv .venv
    echo [OK] Virtual environment created
) else (
    echo [OK] Virtual environment already exists
)

REM Install backend
echo [SETUP] Installing backend dependencies...
.venv\Scripts\python.exe -m pip install -q -r backend\requirements.txt
echo [OK] Backend dependencies installed

REM Install frontend
echo [SETUP] Installing frontend dependencies...
cd frontend
call npm install --silent
cd ..
echo [OK] Frontend dependencies installed

REM Create .env if missing
if not exist ".env" (
    echo [SETUP] Creating .env from .env-example...
    copy .env-example .env
    echo [IMPORTANT] Edit .env and add your WATSONX_API_KEY to enable IBM Granite AI
) else (
    echo [OK] .env already exists (not overwriting)
)

echo.
echo ============================================================
echo  Setup complete!
echo  Run start_project.bat to start the application.
echo  Edit .env to add your WATSONX_API_KEY for full AI.
echo ============================================================
pause
