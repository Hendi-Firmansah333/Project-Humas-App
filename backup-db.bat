@echo off
echo ===================================================
echo Mencadangkan (Backup) Database Humas Polinela
echo ===================================================

echo Sedang mengekspor database ke C:\Users\ASUS\backup_humas.sql ...
wsl -d Ubuntu -u root bash -c "docker exec humas_postgres pg_dump -U humas -d Polihumas > /mnt/c/Users/ASUS/backup_humas.sql"
echo Selesai! File backup tersimpan di: C:\Users\ASUS\backup_humas.sql
echo.
pause

