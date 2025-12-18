@echo off
echo 💰 Budget AI - Setup Script
echo ============================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    exit /b 1
)

echo ✅ Python and Node.js found
echo.

REM Setup backend
echo 📦 Setting up backend...
cd backend
pip install -r requirements.txt
cd ..

REM Setup frontend
echo 📦 Setting up frontend...
cd frontend
call npm install
cd ..

echo.
echo ✅ Setup complete!
echo.
echo To run the app:
echo 1. Start backend: cd backend ^&^& python app.py
echo 2. Start frontend: cd frontend ^&^& npm run dev
echo 3. Open http://localhost:3000 in your browser

