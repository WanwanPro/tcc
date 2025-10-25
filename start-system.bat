@echo off
echo 智能停车场系统启动脚本
echo ========================
echo.

echo 请选择要启动的服务:
echo 1. 仅启动后端服务
echo 2. 仅启动前端应用
echo 3. 启动所有服务 (后端 + 前端)
echo 4. 退出
echo.

set /p choice=请输入选项 (1-4): 

if "%choice%"=="1" goto start_backend
if "%choice%"=="2" goto start_frontend
if "%choice%"=="3" goto start_all
if "%choice%"=="4" goto exit
goto invalid_choice

:start_backend
echo.
echo 正在启动后端服务...
echo 启动微信小程序后端服务 (端口: 5000)...
start "微信小程序后端" cmd /k "cd /d %~dp0backend && npm run dev"

echo 启动后台管理系统后端服务 (端口: 3000)...
start "后台管理系统后端" cmd /k "cd /d %~dp0System\backend && npm run dev"

echo.
echo 后端服务正在启动中...
echo 微信小程序后端: http://localhost:5000
echo 后台管理系统后端: http://localhost:3000
echo.
goto end

:start_frontend
echo.
echo 正在启动前端应用...
echo 启动后台管理系统前端 (端口: 3001)...
start "后台管理系统前端" cmd /k "cd /d %~dp0System\frontend && npm run dev"

echo.
echo 前端应用正在启动中...
echo 后台管理系统前端: http://localhost:3001
echo.
goto end

:start_all
echo.
echo 正在启动所有服务...
echo 启动微信小程序后端服务 (端口: 5000)...
start "微信小程序后端" cmd /k "cd /d %~dp0backend && npm run dev"

echo 启动后台管理系统后端服务 (端口: 3000)...
start "后台管理系统后端" cmd /k "cd /d %~dp0System\backend && npm run dev"

timeout /t 5 /nobreak >nul

echo 启动后台管理系统前端 (端口: 3001)...
start "后台管理系统前端" cmd /k "cd /d %~dp0System\frontend && npm run dev"

echo.
echo 所有服务正在启动中...
echo 微信小程序后端: http://localhost:5000
echo 后台管理系统后端: http://localhost:3000
echo 后台管理系统前端: http://localhost:3001
echo.
echo 微信小程序需要在微信开发者工具中打开项目: %~dp0frontend\miniprogram
goto end

:invalid_choice
echo.
echo 无效选项，请重新运行脚本。
goto end

:exit
echo.
echo 退出启动脚本。
goto end

:end
echo.
echo 启动脚本执行完成。
pause