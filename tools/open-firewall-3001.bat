@echo off
echo 正在为TCC后端开放3001端口...
netsh advfirewall firewall add rule name="TCC Backend Port 3001" dir=in action=allow protocol=TCP localport=3001
echo.
echo 防火墙规则添加完成！
echo 现在可以从局域网访问 http://192.168.0.78:3001
pause


