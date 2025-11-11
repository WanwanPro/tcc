@echo off
echo 正在停止TCC停车管理系统所有服务...
echo.

echo 1. 停止所有Node.js进程...
taskkill /f /im node.exe >nul 2>&1

echo 2. 清理端口占用...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5001"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5002"') do taskkill /f /pid %%a >nul 2>&1

echo.
echo 所有服务已停止!
echo.
echo 按任意键关闭此窗口...
pause >nul