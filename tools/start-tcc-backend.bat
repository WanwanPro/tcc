@echo off
chcp 65001 >nul
cd /d %~dp0backend
if errorlevel 1 (
    echo [错误] 无法切换到backend目录
    pause
    exit /b 1
)
npm run dev

