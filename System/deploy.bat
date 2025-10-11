@echo off
echo 正在部署智能停车场管理系统...
echo.

REM 检查Docker是否安装
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未检测到Docker，请先安装Docker Desktop
    echo 下载地址: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM 检查Docker Compose是否安装
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未检测到Docker Compose，请确保Docker Desktop已安装并包含Docker Compose
    pause
    exit /b 1
)

REM 停止并删除现有容器（如果有）
echo 停止现有容器...
docker-compose down

REM 构建并启动服务
echo 构建并启动服务...
docker-compose up --build -d

REM 等待服务启动
echo 等待服务启动...
timeout /t 30 >nul

REM 检查服务状态
echo 检查服务状态...
docker-compose ps

echo.
echo 部署完成!
echo.
echo 访问地址:
echo - 前端应用: http://localhost
echo - 后端API: http://localhost/api
echo.
echo 默认管理员账户:
echo - 用户名: admin
echo - 密码: admin123
echo.
pause