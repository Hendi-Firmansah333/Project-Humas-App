@echo off
echo ===================================================
echo Mengisi Ulang Data Bawaan Sistem (Prisma Seed)
echo ===================================================

cd backend
npx prisma db seed
echo Selesai! Seluruh data bawaan berhasil dimasukkan.
echo.
pause

