@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

cd /d "%~dp0"

echo ========================================
echo   TCC智能停车场管理系统
echo ========================================
echo.

echo 启动服务...
echo.

REM 在新窗口中启动TCC后端
start "TCC后端-3001" cmd /k "cd /d %~dp0backend && echo [TCC后端] 端口: 3001 && npm run dev"

REM 等待一秒
timeout /t 1 /nobreak >nul

REM 在新窗口中启动System后端
start "System后端-5000" cmd /k "cd /d %~dp0System\backend && echo [System后端] 端口: 5000 && npm run dev"

REM 等待一秒
timeout /t 1 /nobreak >nul

REM 在新窗口中启动前端
start "系统前端-5002" cmd /k "cd /d %~dp0System\frontend && echo [系统前端] 端口: 5002 && npm run dev"

echo.
echo ========================================
echo   服务已启动
echo ========================================
echo   TCC小程序后端: http://localhost:3001
echo   System管理后端: http://localhost:5000
echo   System管理前端: http://localhost:5002
echo ========================================
echo.
echo 已打开3个窗口，每个服务一个窗口
echo 关闭此窗口不会影响服务运行
echo.
pause




