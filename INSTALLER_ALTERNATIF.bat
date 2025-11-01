@echo off
setlocal enabledelayedexpansion
title TECH INFO PLUS - Installation Alternative
color 0B

echo.
echo ========================================
echo   TECH INFO PLUS - INSTALLATION ALTERNATIVE
echo ========================================
echo.
echo Cette version utilise des méthodes alternatives
echo pour contourner les problèmes de téléchargement
echo.

:: ===========================================
:: VÉRIFICATIONS PRÉALABLES
:: ===========================================
echo 🔍 Vérifications préalables...

:: Vérifier les privilèges administrateur
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ ERREUR: Ce script doit être exécuté en tant qu'administrateur
    echo    Clic droit sur le fichier → "Exécuter en tant qu'administrateur"
    echo.
    echo Appuyez sur une touche pour fermer...
    pause
    exit /b 1
)
echo ✅ Privilèges administrateur confirmés

:: Vérifier la connexion internet
echo 🔍 Vérification de la connexion internet...
ping -n 1 google.com >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ ERREUR: Pas de connexion internet
    echo    Vérifiez votre connexion et relancez le script
    echo.
    echo Appuyez sur une touche pour fermer...
    pause
    exit /b 1
)
echo ✅ Connexion internet OK

:: Vérifier XAMPP et MySQL
echo 🗄️ Vérification de XAMPP et MySQL...
netstat -an | findstr ":3306" >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ ERREUR: MySQL n'est pas démarré
    echo    Veuillez ouvrir XAMPP et démarrer MySQL
    echo    Puis relancez ce script
    echo.
    echo Appuyez sur une touche pour fermer...
    pause
    exit /b 1
)
echo ✅ MySQL est démarré sur le port 3306
echo.

:: ===========================================
:: MÉTHODE ALTERNATIVE 1: UTILISER CHOCOLATEY
:: ===========================================
echo 🍫 Tentative d'installation via Chocolatey...

:: Vérifier si Chocolatey est installé
choco --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ⚠️  Chocolatey non trouvé, installation...
    
    :: Installer Chocolatey
    powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
    
    if %errorLevel% equ 0 (
        echo ✅ Chocolatey installé
    ) else (
        echo ❌ Échec installation Chocolatey
        goto :manual_install
    )
) else (
    echo ✅ Chocolatey déjà installé
)

:: Installer Python via Chocolatey
echo 🐍 Installation de Python via Chocolatey...
choco install python -y
if %errorLevel% equ 0 (
    echo ✅ Python installé via Chocolatey
) else (
    echo ❌ Échec installation Python via Chocolatey
    goto :manual_install
)

:: Installer Node.js via Chocolatey
echo 🧩 Installation de Node.js via Chocolatey...
choco install nodejs -y
if %errorLevel% equ 0 (
    echo ✅ Node.js installé via Chocolatey
) else (
    echo ❌ Échec installation Node.js via Chocolatey
    goto :manual_install
)

:: Rafraîchir le PATH
refreshenv

goto :setup_project

:manual_install
echo.
echo ========================================
echo   INSTALLATION MANUELLE REQUISE
echo ========================================
echo.
echo Les téléchargements automatiques ont échoué.
echo Veuillez installer manuellement :
echo.
echo 1. Python : https://www.python.org/downloads/
echo 2. Node.js : https://nodejs.org/
echo.
echo Après installation, relancez ce script.
echo.
echo Appuyez sur une touche pour fermer...
pause
exit /b 1

:setup_project
echo.
echo ===========================================
echo   CONFIGURATION DU PROJET
echo ===========================================

:: Dossier d'installation
set "INSTALL_DIR=%USERPROFILE%\TECH_INFO_PLUS"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
echo 📁 Installation dans : %INSTALL_DIR%

:: Créer le projet
set "PROJECT_DIR=%INSTALL_DIR%\tech_info_plus"
if not exist "%PROJECT_DIR%" mkdir "%PROJECT_DIR%"

:: Copier les fichiers du projet actuel
echo 📁 Copie des fichiers du projet...
set "CURRENT_DIR=%~dp0"
xcopy "%CURRENT_DIR%*" "%PROJECT_DIR%\" /E /I /H /Y /Q
echo ✅ Fichiers copiés

:: ===========================================
:: INSTALLATION DES DÉPENDANCES
:: ===========================================

:: Backend Python
echo 🐍 Installation des dépendances Python...
cd /d "%PROJECT_DIR%\backend"
if exist "requirements.txt" (
    python -m pip install --upgrade pip
    python -m pip install -r requirements.txt
    if %errorLevel% equ 0 (
        echo ✅ Dépendances Python installées
    ) else (
        echo ❌ ERREUR: Installation dépendances Python échouée
        echo    Vérifiez que Python est bien installé
        pause
        exit /b 1
    )
) else (
    echo ⚠️  requirements.txt non trouvé, création...
    (
    echo fastapi==0.104.1
    echo uvicorn==0.24.0
    echo sqlalchemy==2.0.23
    echo mysql-connector-python==8.2.0
    echo python-multipart==0.0.6
    echo python-jose==3.3.0
    echo passlib==1.7.4
    echo bcrypt==4.1.2
    echo requests==2.31.0
    echo reportlab==4.0.7
    echo pillow==10.1.0
    ) > requirements.txt
    python -m pip install -r requirements.txt
)

:: Frontend Node.js
echo 🧩 Installation des dépendances Node.js...
cd /d "%PROJECT_DIR%\frontend"
if exist "package.json" (
    npm install
    if %errorLevel% equ 0 (
        echo ✅ Dépendances Node.js installées
    ) else (
        echo ❌ ERREUR: Installation dépendances Node.js échouée
        echo    Vérifiez que Node.js est bien installé
        pause
        exit /b 1
    )
) else (
    echo ⚠️  package.json non trouvé, création...
    (
    echo {
    echo   "name": "tech-info-plus-frontend",
    echo   "version": "1.0.0",
    echo   "private": true,
    echo   "dependencies": {
    echo     "react": "^18.2.0",
    echo     "react-dom": "^18.2.0",
    echo     "react-scripts": "5.0.1",
    echo     "axios": "^1.6.0",
    echo     "react-router-dom": "^6.8.0",
    echo     "chart.js": "^4.4.0",
    echo     "react-chartjs-2": "^5.2.0",
    echo     "jspdf": "^2.5.1",
    echo     "jspdf-autotable": "^3.6.0",
    echo     "sweetalert2": "^11.10.0",
    echo     "react-toastify": "^9.1.3"
    echo   },
    echo   "scripts": {
    echo     "start": "react-scripts start",
    echo     "build": "react-scripts build"
    echo   }
    echo }
    ) > package.json
    npm install
)

:: ===========================================
:: CRÉATION DES SCRIPTS DE LANCEMENT
:: ===========================================
echo 🖱️ Création des scripts de lancement...

:: Script de lancement principal
set "LAUNCHER=%USERPROFILE%\Desktop\LANCER_TECH_INFO_PLUS.bat"
(
echo @echo off
echo title TECH INFO PLUS - Lancement
echo color 0A
echo echo ========================================
echo echo   TECH INFO PLUS - DÉMARRAGE
echo echo ========================================
echo echo.
echo echo 🚀 Démarrage du backend...
echo start "Backend" cmd /k "cd /d \"%PROJECT_DIR%\backend\" ^&^& python app.py"
echo timeout /t 5 /nobreak ^>nul
echo echo 🚀 Démarrage du frontend...
echo start "Frontend" cmd /k "cd /d \"%PROJECT_DIR%\frontend\" ^&^& npm start"
echo timeout /t 10 /nobreak ^>nul
echo echo ✅ Application démarrée!
echo echo 🌐 Frontend: http://localhost:3000
echo echo 🌐 Backend: http://localhost:8000
echo echo.
echo echo Appuyez sur une touche pour fermer cette fenêtre...
echo pause ^>nul
) > "%LAUNCHER%"

echo ✅ Script de lancement créé sur le bureau

:: ===========================================
:: VÉRIFICATIONS FINALES
:: ===========================================
echo 🔍 Vérifications finales...

:: Vérifier Python
python --version >nul 2>&1
if %errorLevel% equ 0 (
    echo ✅ Python: OK
) else (
    echo ❌ Python: PROBLÈME
)

:: Vérifier Node.js
node --version >nul 2>&1
if %errorLevel% equ 0 (
    echo ✅ Node.js: OK
) else (
    echo ❌ Node.js: PROBLÈME
)

:: Vérifier les dossiers
if exist "%PROJECT_DIR%\backend" (
    echo ✅ Backend: OK
) else (
    echo ❌ Backend: PROBLÈME
)

if exist "%PROJECT_DIR%\frontend" (
    echo ✅ Frontend: OK
) else (
    echo ❌ Frontend: PROBLÈME
)

echo.

:: ===========================================
echo ===========================================
echo ✅ INSTALLATION TERMINÉE AVEC SUCCÈS
echo ===========================================
echo 📍 Dossier d'installation : %INSTALL_DIR%
echo 🖱️ Raccourci sur le bureau : LANCER_TECH_INFO_PLUS.bat
echo.
echo 🚀 POUR DÉMARRER L'APPLICATION :
echo    1. Gardez XAMPP ouvert avec MySQL démarré
echo    2. Double-cliquez sur "LANCER_TECH_INFO_PLUS" sur le bureau
echo.
echo 🌐 URLs d'accès :
echo    Frontend: http://localhost:3000
echo    Backend: http://localhost:8000
echo.
echo ⚠️  IMPORTANT: Gardez XAMPP ouvert avec MySQL démarré
echo.
echo Appuyez sur une touche pour fermer...
pause
exit /b 0
















