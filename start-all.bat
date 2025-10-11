@echo off
chcp 65001 >nul
echo Starting TCC Parking Management System...
echo.

echo 1. Starting TCC Mini Program Backend (Port: 3001)...
start "TCC Mini Program Backend" cmd /k "cd /d %~dp0backend && npm run dev"

echo 2. Starting System Management Backend (Port: 5000)...
start "System Management Backend" cmd /k "cd /d %~dp0System\backend && npm run dev"

echo 3. Waiting for backend services to start...
timeout /t 5 /nobreak >nul

echo 4. Starting System Management Frontend (Port: 5002)...
start "System Management Frontend" cmd /k "cd /d %~dp0System\frontend && npm run dev"

echo.
echo All services have been started!
echo.
echo Access URLs:
echo - TCC Mini Program Backend API: http://localhost:3001
echo - System Management Backend API: http://localhost:5000
echo - System Management Frontend: http://localhost:5002
echo.
echo Press any key to close this window...
pause >nul