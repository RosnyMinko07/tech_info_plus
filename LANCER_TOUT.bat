@echo off
echo ========================================
echo    TECH INFO PLUS - LANCEMENT COMPLET
echo ========================================
echo.

echo [1/2] Lancement du Backend...
start "Backend FastAPI" cmd /k "cd backend && python app.py"

echo.
echo [2/2] Lancement du Frontend...
start "Frontend React" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo   APPLICATIONS LANCÉES !
echo ========================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Connexion: admin/admin123
echo.

pause

