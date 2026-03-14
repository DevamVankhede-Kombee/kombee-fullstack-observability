@echo off
echo ========================================
echo   Product/Order Management System
echo   Development Environment Startup
echo ========================================
echo.

echo [1/4] Checking Docker Desktop...
docker ps >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Desktop is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)
echo ✓ Docker Desktop is running

echo.
echo [2/4] Starting database container...
docker-compose up -d db
if errorlevel 1 (
    echo ERROR: Failed to start database
    pause
    exit /b 1
)

echo.
echo [3/4] Waiting for database to be healthy...
timeout /t 15 /nobreak >nul
echo ✓ Database should be ready

echo.
echo [4/4] Starting services...
echo.
echo Opening Backend Server (Port 3001)...
start "Backend Server" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo Opening Frontend Server (Port 5173)...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   All services started!
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit this window...
pause >nul
