@echo off
title Menjalankan Sistem Humas Polinela
echo ===================================================
echo   MEMULAI SISTEM HUMAS POLINELA
echo ===================================================
echo.
echo [1/3] Menyalakan Database PostgreSQL...
wsl -d Ubuntu -u root bash -c "service docker start && docker start humas_postgres"
echo Database PostgreSQL Aktif!
echo.
echo [2/3] Menjalankan Server Backend (Port 3001)...
start "Backend Humas API" cmd /k "cd /d %~dp0backend && npm run start:dev"
echo.
echo [3/3] Menjalankan Frontend Web Admin (Port 3000)...
start "Frontend Humas Web" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo ===================================================
echo Seluruh layanan berhasil dijalankan!
echo - Database: localhost:5432
echo - Backend API: http://localhost:3001
echo - Web Admin: http://localhost:3000
echo ===================================================
echo.
timeout /t 5 >nul
start http://localhost:3000
exit

