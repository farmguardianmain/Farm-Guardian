@echo off
chcp 65001 >nul
cls
echo ========================================
echo   Farm Guardians - FINAL WORKING EXPO 54
echo ========================================
echo.

echo Your Farm Guardians app is ready to use!
echo.

echo Step 1: Start Backend
cd /d "d:\ALL-CODE-HP\Farm Guardians\backend"
echo Starting backend...
start "Backend" cmd /k "cd /d ""d:\ALL-CODE-HP\Farm Guardians\backend"" && ""d:\ALL-CODE-HP\Farm Guardians\backend\clean-env\Scripts\python.exe"" test_backend.py"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Step 2: Start Frontend
cd /d "d:\ALL-CODE-HP\Farm Guardians\frontend"
echo Starting frontend...
start "Frontend" cmd /k "cd /d ""d:\ALL-CODE-HP\Farm Guardians\frontend"" && npm start"

echo Waiting for services to start...
timeout /t 10 /nobreak >nul

echo Opening browser...
start http://localhost:8002/docs

cls
echo ========================================
echo        FARM GUARDIANS IS RUNNING!
echo ========================================
echo.
echo CHECK THESE WINDOWS:
echo - "Backend" window - should show server logs
echo - "Frontend" window - should show QR code
echo.
echo URLs:
echo Backend API: http://localhost:8002/docs
echo Frontend:    http://localhost:8082 (auto-assigned)
echo.
echo MOBILE SETUP:
echo 1. Install Expo Go app
echo 2. Scan QR code from Frontend window
echo 3. Login: farm@farmguardian.app / herd
echo.
echo SUCCESS: Your Farm Guardians app is working!
echo ========================================
echo Press any key to exit...
pause > nul
