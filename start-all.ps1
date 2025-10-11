# 启动TCC停车管理系统
Write-Host "Starting TCC Parking Management System..." -ForegroundColor Green

# 启动TCC小程序后端
Write-Host "1. Starting TCC Mini Program Backend (Port: 3001)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d $PSScriptRoot\backend && npm run dev" -WindowStyle Normal

# 启动System管理后端
Write-Host "2. Starting System Management Backend (Port: 5000)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d $PSScriptRoot\System\backend && npm run dev" -WindowStyle Normal

# 等待后端服务启动
Write-Host "3. Waiting for backend services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 启动System管理前端
Write-Host "4. Starting System Management Frontend (Port: 5002)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d $PSScriptRoot\System\frontend && npm run dev" -WindowStyle Normal

Write-Host "`nAll services have been started!" -ForegroundColor Green
Write-Host "`nAccess URLs:" -ForegroundColor Cyan
Write-Host "- TCC Mini Program Backend API: http://localhost:3001" -ForegroundColor White
Write-Host "- System Management Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "- System Management Frontend: http://localhost:5002" -ForegroundColor White

Write-Host "`nPress any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")