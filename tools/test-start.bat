@echo off
chcp 65001 >nul
echo 测试启动脚本...
echo.

cd /d "%~dp0"

echo 当前目录: %CD%
echo.

echo 检查concurrently...
if exist "node_modules\concurrently" (
    echo ✓ concurrently已安装
) else (
    echo ✗ concurrently未安装
    exit /b 1
)

echo.
echo 启动TCC智能停车场管理系统...
echo 后端服务将运行在端口5001
echo 前端服务将自动选择可用端口
echo.
call npm run start-all

pause




