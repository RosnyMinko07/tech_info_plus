@echo off
echo ============================================================
echo   MIGRATION DES FOURNISSEURS - TECH INFO PLUS
echo ============================================================
echo.
echo Cette migration va attribuer des numeros automatiques aux
echo fournisseurs existants qui n'en ont pas encore.
echo.
pause

cd backend
python migration_fournisseurs.py
cd ..

echo.
echo ============================================================
pause


