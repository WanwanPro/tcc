@echo off
echo 正在初始化数据库...
echo.

REM 检查是否安装了Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未检测到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查是否存在.env文件
if not exist ".env" (
    echo 正在创建环境配置文件...
    copy .env.example .env
    echo 已创建.env文件，请根据需要修改配置
    echo.
)

REM 检查是否安装了依赖
if not exist "node_modules" (
    echo 正在安装依赖包...
    npm install
    echo.
)

REM 运行数据库初始化脚本
echo 运行数据库初始化脚本...
node init-db.js

echo.
echo 数据库初始化完成!
echo 默认管理员账户: admin / admin123
pause