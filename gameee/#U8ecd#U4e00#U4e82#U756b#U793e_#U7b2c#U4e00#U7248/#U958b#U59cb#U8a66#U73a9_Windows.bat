@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Please install Node.js LTS from https://nodejs.org/
  pause
  exit /b 1
)
if not exist "node_modules\socket.io" (
  echo Installing game dependencies...
  call npm install
  if errorlevel 1 (
    echo Installation failed. Please check your internet connection.
    pause
    exit /b 1
  )
)
start "" "http://localhost:3000/draw-guess.html"
node server-local.js
pause
