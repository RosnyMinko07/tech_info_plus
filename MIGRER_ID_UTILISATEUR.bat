@echo off
echo ============================================
echo MIGRATION: ID Utilisateur pour les Factures
echo ============================================
echo.

cd /d "%~dp0"
python backend/migrer_id_utilisateur.py

echo.
echo ============================================
echo Migration terminee. Appuyez sur une touche pour continuer...
echo ============================================
pause


