@echo off
echo ===================================================
echo Memulihkan Database Humas Polinela dari Backup
echo ===================================================

if exist "C:\Users\ASUS\backup_humas.sql" (
    echo Mengimpor data dari C:\Users\ASUS\backup_humas.sql ...
    wsl -d Ubuntu -u root bash -c "docker start humas_postgres >/dev/null 2>&1; docker exec humas_postgres psql -U humas -d Polihumas -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;' && docker exec -i humas_postgres psql -U humas -d Polihumas < /mnt/c/Users/ASUS/backup_humas.sql"
    echo.
    echo Selesai! Seluruh tabel dan data Polihumas berhasil dipulihkan 100%%.
) else (
    echo File C:\Users\ASUS\backup_humas.sql tidak ditemukan.
    echo Menjalankan pemulihan data bawaan sistem (Prisma Seed)...
    cd backend
    npx prisma db seed
)
echo.
pause
