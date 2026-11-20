@echo off
title Database PostgreSQL Humas Polinela
echo ===================================================
echo   Menjalankan Database PostgreSQL Humas Polinela
echo ===================================================
echo.
echo [1/3] Menyalakan Docker Service di WSL...
wsl -d Ubuntu -u root bash -c "service docker start"
echo.
echo [2/3] Menyalakan Container PostgreSQL (humas_postgres)...
wsl -d Ubuntu -u root bash -c "docker start humas_postgres"
echo.
echo [3/3] Memastikan background service tetap aktif...
start "" wscript.exe "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\start-humas-db.vbs"
echo.
echo ===================================================
echo Database aktif dan siap digunakan di localhost:5432!
echo (PostgreSQL akan terus aktif di latar belakang)
echo ===================================================
echo.
timeout /t 5
