@echo off
echo ============================================================
echo   CORRECTION DES NUMEROS SEQUENTIELS - TECH INFO PLUS
echo ============================================================
echo.
echo Ce script va corriger tous les numeros pour garantir
echo l'ordre sequentiel correct.
echo.
pause

cd backend
python corriger_numeros.py
cd ..

echo.
echo ============================================================
pause


