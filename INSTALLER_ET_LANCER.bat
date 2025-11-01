@echo off
setlocal enabledelayedexpansion
title 🚀 TECH INFO PLUS - Installation Automatique
color 0A

echo.
echo ===========================================
echo     🚀 TECH INFO PLUS - INSTALLATION AUTO
echo ===========================================
echo.

:: Vérification des privilèges administrateur
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Ce script doit être exécuté en tant qu'administrateur.
    pause
    exit /b 1
)

echo ✅ Privilèges administrateur confirmés
echo.

:: Vérification connexion Internet
echo 🌐 Vérification de la connexion Internet...
ping -n 1 google.com >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Pas de connexion Internet détectée.
    pause
    exit /b 1
)
echo ✅ Internet disponible
echo.

:: Vérification XAMPP et MySQL
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

:: Configuration du pare-feu Windows
echo 🔥 Configuration du pare-feu Windows...
netsh advfirewall firewall add rule name="TECH_INFO_PLUS_Frontend" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
netsh advfirewall firewall add rule name="TECH_INFO_PLUS_Backend" dir=in action=allow protocol=TCP localport=8000 >nul 2>&1
echo ✅ Règles pare-feu configurées
echo.

:: Dossier d’installation
set "INSTALL_DIR=%USERPROFILE%\TECH_INFO_PLUS"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
echo 📁 Installation dans : %INSTALL_DIR%
echo.

:: ===========================================
:: INSTALLATION DE PYTHON PORTABLE
:: ===========================================
echo 🐍 Vérification de Python...
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ⚠️ Python non trouvé. Téléchargement en cours...

    set "PYTHON_URL=https://www.python.org/ftp/python/3.11.9/python-3.11.9-embed-amd64.zip"
    set "PYTHON_ZIP=%INSTALL_DIR%\python.zip"
    set "PYTHON_DIR=%INSTALL_DIR%\python"

    powershell -Command ^
        "$ProgressPreference='SilentlyContinue';" ^
        "$ErrorActionPreference='Stop';" ^
        "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12;" ^
        "$url='%PYTHON_URL%';" ^
        "$output='%PYTHON_ZIP%';" ^
        "Write-Host '⬇️ Téléchargement de Python...';" ^
        "Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing;" ^
        "Write-Host '✅ Téléchargement Python terminé.'"

    if exist "%PYTHON_ZIP%" (
        echo    Extraction de Python...
        powershell -Command "Expand-Archive -Path '%PYTHON_ZIP%' -DestinationPath '%PYTHON_DIR%' -Force"
        del "%PYTHON_ZIP%"
        set "PATH=%PYTHON_DIR%;%PATH%"
        
        :: Vérifier que Python fonctionne
        python --version >nul 2>&1
        if %errorLevel% equ 0 (
            echo ✅ Python portable installé et fonctionnel.
        ) else (
            echo ❌ ERREUR: Python installé mais ne fonctionne pas
            echo    Vérifiez les permissions du dossier: %PYTHON_DIR%
            pause
            exit /b 1
        )
    ) else (
        echo ❌ ERREUR: Téléchargement de Python échoué
        echo    Vérifiez votre connexion internet et relancez
        echo.
        echo Appuyez sur une touche pour fermer...
        pause
        exit /b 1
    )
) else (
    echo ✅ Python déjà installé sur le système.
)
echo.

:: ===========================================
:: INSTALLATION DE NODE.JS PORTABLE
:: ===========================================
echo 🧩 Vérification de Node.js...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ⚠️ Node.js non trouvé. Téléchargement en cours...

    set "NODE_URL=https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip"
    set "NODE_ZIP=%INSTALL_DIR%\node.zip"
    set "NODE_DIR=%INSTALL_DIR%\node-v20.11.0-win-x64"

    powershell -Command ^
        "$ProgressPreference='SilentlyContinue';" ^
        "$ErrorActionPreference='Stop';" ^
        "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12;" ^
        "$url='https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip';" ^
        "$output='%INSTALL_DIR%\\node.zip';" ^
        "Write-Host '⬇️ Téléchargement de Node.js...';" ^
        "Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing;" ^
        "Write-Host '✅ Téléchargement Node.js terminé.'"

    if exist "%NODE_ZIP%" (
        echo    Extraction de Node.js...
        powershell -Command "Expand-Archive -Path '%NODE_ZIP%' -DestinationPath '%INSTALL_DIR%' -Force"
        del "%NODE_ZIP%"
        set "PATH=%NODE_DIR%;%PATH%"
        
        :: Vérifier que Node.js fonctionne
        node --version >nul 2>&1
        if %errorLevel% equ 0 (
            echo ✅ Node.js portable installé et fonctionnel.
        ) else (
            echo ❌ ERREUR: Node.js installé mais ne fonctionne pas
            echo    Vérifiez les permissions du dossier: %NODE_DIR%
            pause
            exit /b 1
        )
    ) else (
        echo ❌ ERREUR: Téléchargement de Node.js échoué
        echo    Vérifiez votre connexion internet et relancez
        echo.
        echo Appuyez sur une touche pour fermer...
        pause
        exit /b 1
    )
) else (
    echo ✅ Node.js déjà installé.
)
echo.

:: ===========================================
:: CREATION DU PROJET TECH INFO PLUS
:: ===========================================
echo 🏗️ Préparation du projet TECH INFO PLUS...
set "PROJECT_DIR=%INSTALL_DIR%\tech_info_plus"
if not exist "%PROJECT_DIR%" mkdir "%PROJECT_DIR%"
cd /d "%PROJECT_DIR%"
echo ✅ Dossier projet prêt : %PROJECT_DIR%
echo.

:: FRONTEND (React)
set "FRONT_DIR=%PROJECT_DIR%\frontend"
if not exist "%FRONT_DIR%" mkdir "%FRONT_DIR%"
cd /d "%FRONT_DIR%"
echo 🔧 Initialisation du frontend React...

:: Créer package.json complet
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

echo    Installation des dépendances Node.js...
npm install
if %errorLevel% equ 0 (
    echo ✅ Frontend configuré avec succès
) else (
    echo ❌ ERREUR: Installation des dépendances Node.js échouée
    echo    Vérifiez la connexion internet et relancez
    pause
    exit /b 1
)
echo.

:: BACKEND (Python FastAPI)
set "BACK_DIR=%PROJECT_DIR%\backend"
if not exist "%BACK_DIR%" mkdir "%BACK_DIR%"
cd /d "%BACK_DIR%"
echo 🔧 Initialisation du backend FastAPI...

:: Créer requirements.txt complet
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

echo    Mise à jour de pip...
python -m pip install --upgrade pip
echo    Installation des dépendances Python...
python -m pip install -r requirements.txt
if %errorLevel% equ 0 (
    echo ✅ Backend configuré avec succès
) else (
    echo ❌ ERREUR: Installation des dépendances Python échouée
    echo    Vérifiez la connexion internet et relancez
    pause
    exit /b 1
)

(
echo from fastapi import FastAPI
echo app = FastAPI()
echo @app.get("/")
echo async def root():
echo.    return {"message": "Bienvenue sur TECH INFO PLUS API"}
echo if __name__ == "__main__":
echo.    import uvicorn
echo.    uvicorn.run(app, host="0.0.0.0", port=8000)
) > app.py

echo ✅ Backend configuré
echo.

:: ===========================================
:: CREATION DU RACCOURCI DE LANCEMENT
:: ===========================================
echo 🖱️ Création du raccourci sur le bureau...
set "SHORTCUT=%USERPROFILE%\Desktop\LANCER_TECH_INFO_PLUS.bat"
(
echo @echo off
echo title 🚀 TECH INFO PLUS - Lancement
echo cd /d "%BACK_DIR%"
echo start "" python app.py
echo timeout /t 3 >nul
echo cd /d "%FRONT_DIR%"
echo start "" cmd /k "npm start"
) > "%SHORTCUT%"
echo ✅ Raccourci créé sur le bureau.
echo.

:: ===========================================
:: VÉRIFICATIONS FINALES
:: ===========================================
echo 🔍 Vérifications finales...

:: Vérifier que Python fonctionne
python --version >nul 2>&1
if %errorLevel% equ 0 (
    echo ✅ Python: OK
) else (
    echo ❌ Python: PROBLÈME
)

:: Vérifier que Node.js fonctionne
node --version >nul 2>&1
if %errorLevel% equ 0 (
    echo ✅ Node.js: OK
) else (
    echo ❌ Node.js: PROBLÈME
)

:: Vérifier que les dossiers existent
if exist "%FRONT_DIR%" (
    echo ✅ Frontend: OK
) else (
    echo ❌ Frontend: PROBLÈME
)

if exist "%BACK_DIR%" (
    echo ✅ Backend: OK
) else (
    echo ❌ Backend: PROBLÈME
)

echo.

:: ===========================================
:: FIN DE L'INSTALLATION
:: ===========================================
echo ===========================================
echo ✅ INSTALLATION TERMINÉE AVEC SUCCÈS
echo ===========================================
echo 📍 Dossier d'installation : %INSTALL_DIR%
echo 🖱️ Raccourci créé sur le bureau : LANCER_TECH_INFO_PLUS.bat
echo.
echo 🚀 POUR DÉMARRER L'APPLICATION :
echo    1. Gardez XAMPP ouvert avec MySQL démarré
echo    2. Double-cliquez sur "LANCER_TECH_INFO_PLUS" sur le bureau
echo    3. Ou utilisez : %SHORTCUT%
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
