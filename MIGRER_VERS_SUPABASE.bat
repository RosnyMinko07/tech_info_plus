@echo off
echo ========================================================================
echo MIGRATION DES DONNEES MYSQL VERS SUPABASE POSTGRESQL
echo ========================================================================
echo.
echo Ce script va transferer toutes vos donnees vers Supabase.
echo.
echo PREREQUIS:
echo 1. Les tables doivent etre creees sur Supabase (supabase_schema.sql)
echo 2. Votre base MySQL locale doit etre accessible
echo 3. Vous devez avoir votre DATABASE_URL Supabase
echo.
pause
echo.
echo Installation des dependances...
cd backend
pip install pymysql psycopg2-binary python-dotenv
echo.
echo ========================================================================
echo LANCEMENT DE LA MIGRATION
echo ========================================================================
echo.
python migrate_to_supabase.py
echo.
pause

