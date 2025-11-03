@echo off
echo ========================================
echo AR Interior Design Platform - Deployment Setup
echo ========================================

echo.
echo [1/6] Installing frontend dependencies...
call npm install

echo.
echo [2/6] Installing backend dependencies...
cd Backend
call pip install -r requirements.txt
cd ..

echo.
echo [3/6] Setting up environment variables...
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo Please update .env with your actual API keys
) else (
    echo .env file already exists
)

echo.
echo [4/6] Building frontend...
call npm run build

echo.
echo [5/6] Testing backend...
cd Backend
start /B python main.py
timeout /t 3 /nobreak >nul
curl -s http://localhost:8001/health >nul
if %errorlevel% equ 0 (
    echo Backend is running successfully!
) else (
    echo Backend test failed. Please check the logs.
)
cd ..

echo.
echo [6/6] Starting development server...
echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8001
echo.
echo Next steps:
echo 1. Update .env with your API keys
echo 2. Run the database setup in Supabase SQL Editor
echo 3. Test all features
echo 4. Deploy to production
echo.
pause







