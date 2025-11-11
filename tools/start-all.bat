@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ========================================
echo   TCC智能停车场管理系统 - 统一窗口启动
echo ========================================
echo.

REM 切换到脚本所在目录
cd /d "%~dp0"

REM 检查Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Node.js
    pause
    exit /b 1
)

echo [1/3] 检查依赖...
if not exist "node_modules\concurrently" (
    echo 正在安装 concurrently...
    call npm install concurrently --save-dev
    if errorlevel 1 (
        echo [错误] concurrently安装失败
        pause
        exit /b 1
    )
)

REM 确保子项目依赖存在
if not exist "backend\node_modules" (
    echo [提示] 初始化TCC后端依赖...
    call npm install --prefix backend
)

if not exist "System\backend\node_modules" (
    echo [提示] 初始化System后端依赖...
    call npm install --prefix System/backend
)

if not exist "System\frontend\node_modules" (
    echo [提示] 初始化系统前端依赖...
    call npm install --prefix System/frontend
)

REM 确认cross-env安装
if not exist "System\backend\node_modules\.bin\cross-env.cmd" (
    echo [提示] 安装System后端 cross-env...
    call npm install cross-env --save-dev --prefix System/backend
)

echo [2/3] 启动服务...
echo.
echo ========================================
echo   服务端口信息
echo ========================================
echo   - TCC小程序后端: http://localhost:3001
echo   - System管理后端: http://localhost:5001
echo   - System管理前端: http://localhost:5002
echo ========================================
echo.
echo 提示: 使用 Ctrl+C 停止所有服务
echo.

REM 直接使用npm run start-all，这是最可靠的方式
call npm run start-all

REM 如果退出（无论是正常还是错误），都显示信息
echo.
echo ========================================
echo   服务已停止
echo ========================================
pause
