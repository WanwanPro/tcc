@echo off
echo 正在启动智能停车场系统后端服务...
echo.

echo 启动微信小程序后端服务 (端口: 5000)...
start "微信小程序后端" cmd /k "cd /d %~dp0backend && npm run dev"

echo 启动后台管理系统后端服务 (端口: 3000)...
start "后台管理系统后端" cmd /k "cd /d %~dp0System\backend && npm run dev"

echo.
echo 两个后端服务正在启动中...
echo 微信小程序后端: http://localhost:5000
echo 后台管理系统后端: http://localhost:3000
echo.
echo 请等待服务启动完成，然后可以启动前端应用。
pause