@echo off
echo 💰 Budget AI - Starting Application
echo ====================================
echo.

REM Check if backend dependencies are installed
echo Checking backend dependencies...
cd backend
pip show Flask >nul 2>&1
if errorlevel 1 (
    echo Installing backend dependencies...
    pip install -r requirements.txt
)

echo.
echo Starting Flask backend server...
start "Budget AI Backend" cmd /k "cd /d %~dp0backend && python app.py"

timeout /t 3 /nobreak >nul

echo.
echo Starting React frontend...
cd ..\frontend

if not exist "node_modules" (
    echo Installing frontend dependencies (this may take a few minutes)...
    call npm install --legacy-peer-deps
)

echo.
echo Starting frontend dev server...
start "Budget AI Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ✅ Both servers are starting!
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Open http://localhost:3000 in your browser!
echo.
echo Press any key to exit this window (servers will keep running)...
pause >nul

