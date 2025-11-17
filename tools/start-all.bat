@echo off
setlocal
cd /d "%~dp0.."

where py >nul 2>&1
if %errorlevel%==0 (
  py -3 tools\start_all.py
) else (
  where python >nul 2>&1
  if %errorlevel%==0 (
    python tools\start_all.py
  ) else (
    echo [ERROR] Python not found in PATH
    pause
    exit /b 1
  )
)

if errorlevel 1 (
  echo [ERROR] Startup failed. See errors above.
  pause
)
