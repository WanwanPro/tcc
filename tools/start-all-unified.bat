@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM 切换到脚本所在目录
cd /d "%~dp0"

echo ========================================
echo   TCC智能停车场管理系统 - 统一启动
echo ========================================
echo.

REM 检查Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Node.js
    pause
    exit /b 1
)

REM 检查并安装concurrently
if not exist "node_modules\concurrently" (
    echo 正在安装 concurrently...
    call npm install concurrently --save-dev
    if errorlevel 1 (
        echo [错误] concurrently安装失败
        pause
        exit /b 1
    )
)

REM 启动所有服务
call npm run start-all

if errorlevel 1 (
    echo.
    echo [错误] 启动失败，请检查错误信息
    pause
    exit /b 1
)

