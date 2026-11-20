@echo off
title Prisma Studio - Antarmuka Web Database PostgreSQL Humas
echo ===================================================
echo   MEMBUKA DATABASE POSTGRESQL DI WEBSITE (PRISMA STUDIO)
echo ===================================================
echo.
echo Menjalankan Prisma Studio di browser...
echo URL: http://localhost:5555
echo.
cd /d %~dp0backend
start http://localhost:5555
npx prisma studio --port 5555

