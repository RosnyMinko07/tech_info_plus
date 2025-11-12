@echo off
setlocal enabledelayedexpansion
title TECH INFO PLUS - Installation Debug (Fenêtre reste ouverte)
color 0E

echo.
echo ========================================
echo   TECH INFO PLUS - INSTALLATION DEBUG
echo ========================================
echo.
echo Cette version garde la fenêtre ouverte pour voir les erreurs
echo.

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
echo.

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
echo.

:: Vérifier XAMPP et MySQL
echo 🔍 Vérification de XAMPP et MySQL...
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

:: Créer le dossier d'installation
set "INSTALL_DIR=%USERPROFILE%\TECH_INFO_PLUS"
if not exist "%INSTALL_DIR%" (
    mkdir "%INSTALL_DIR%"
    echo ✅ Dossier d'installation créé: %INSTALL_DIR%
) else (
    echo ✅ Dossier d'installation existe déjà: %INSTALL_DIR%
)
echo.

:: Vérifier Python
echo 🔍 Vérification de Python...
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ⚠️  Python non trouvé, téléchargement en cours...
    
    :: Télécharger Python portable
    set "PYTHON_URL=https://www.python.org/ftp/python/3.11.9/python-3.11.9-embed-amd64.zip"
    set "PYTHON_ZIP=%INSTALL_DIR%\python.zip"
    
    echo    Téléchargement de Python portable...
    echo    URL: %PYTHON_URL%
    echo    Destination: %PYTHON_ZIP%
    echo.
    
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%PYTHON_URL%' -OutFile '%PYTHON_ZIP%' -UseBasicParsing}"
    
    if exist "%PYTHON_ZIP%" (
        echo    ✅ Téléchargement réussi, extraction en cours...
        powershell -Command "Expand-Archive -Path '%PYTHON_ZIP%' -DestinationPath '%INSTALL_DIR%\python' -Force"
        del "%PYTHON_ZIP%"
        
        :: Ajouter Python au PATH temporairement
        set "PATH=%INSTALL_DIR%\python;%PATH%"
        echo ✅ Python portable installé
    ) else (
        echo ❌ ERREUR: Impossible de télécharger Python depuis l'URL principale
        echo    Tentative avec une URL alternative...
        
        :: URL alternative pour Python
        set "PYTHON_URL_ALT=https://www.python.org/ftp/python/3.11.7/python-3.11.7-embed-amd64.zip"
        echo    URL alternative: %PYTHON_URL_ALT%
        
        powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%PYTHON_URL_ALT%' -OutFile '%PYTHON_ZIP%' -UseBasicParsing}"
        
        if exist "%PYTHON_ZIP%" (
            echo    ✅ Téléchargement alternatif réussi, extraction en cours...
            powershell -Command "Expand-Archive -Path '%PYTHON_ZIP%' -DestinationPath '%INSTALL_DIR%\python' -Force"
            del "%PYTHON_ZIP%"
            
            :: Ajouter Python au PATH temporairement
            set "PATH=%INSTALL_DIR%\python;%PATH%"
            echo ✅ Python portable installé (version alternative)
        ) else (
            echo ❌ ERREUR: Impossible de télécharger Python
            echo    Veuillez installer Python manuellement depuis https://www.python.org/
            echo.
            echo 🔧 SOLUTIONS POSSIBLES:
            echo    1. Vérifiez votre connexion internet
            echo    2. Désactivez temporairement votre antivirus
            echo    3. Installez Python manuellement depuis python.org
            echo    4. Relancez ce script après installation manuelle
            echo.
            echo Appuyez sur une touche pour fermer...
            pause
            exit /b 1
        )
    )
) else (
    echo ✅ Python trouvé
)
echo.

:: Vérifier Node.js
echo 🔍 Vérification de Node.js...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ⚠️  Node.js non trouvé, téléchargement en cours...
    
    :: Télécharger Node.js portable
    set "NODE_URL=https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip"
    set "NODE_ZIP=%INSTALL_DIR%\nodejs.zip"
    
    echo    Téléchargement de Node.js portable...
    echo    URL: %NODE_URL%
    echo    Destination: %NODE_ZIP%
    echo.
    
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%NODE_ZIP%' -UseBasicParsing}"
    
    if exist "%NODE_ZIP%" (
        echo    ✅ Téléchargement réussi, extraction en cours...
        powershell -Command "Expand-Archive -Path '%NODE_ZIP%' -DestinationPath '%INSTALL_DIR%' -Force"
        del "%NODE_ZIP%"
        
        :: Ajouter Node.js au PATH temporairement
        set "PATH=%INSTALL_DIR%\node-v20.11.0-win-x64;%PATH%"
        echo ✅ Node.js portable installé
    ) else (
        echo ❌ ERREUR: Impossible de télécharger Node.js depuis l'URL principale
        echo    Tentative avec une URL alternative...
        
        :: URL alternative pour Node.js
        set "NODE_URL_ALT=https://nodejs.org/dist/v18.19.0/node-v18.19.0-win-x64.zip"
        echo    URL alternative: %NODE_URL_ALT%
        
        powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%NODE_URL_ALT%' -OutFile '%NODE_ZIP%' -UseBasicParsing}"
        
        if exist "%NODE_ZIP%" (
            echo    ✅ Téléchargement alternatif réussi, extraction en cours...
            powershell -Command "Expand-Archive -Path '%NODE_ZIP%' -DestinationPath '%INSTALL_DIR%' -Force"
            del "%NODE_ZIP%"
            
            :: Ajouter Node.js au PATH temporairement
            set "PATH=%INSTALL_DIR%\node-v18.19.0-win-x64;%PATH%"
            echo ✅ Node.js portable installé (version alternative)
        ) else (
            echo ❌ ERREUR: Impossible de télécharger Node.js
            echo    Veuillez installer Node.js manuellement depuis https://nodejs.org/
            echo.
            echo 🔧 SOLUTIONS POSSIBLES:
            echo    1. Vérifiez votre connexion internet
            echo    2. Désactivez temporairement votre antivirus
            echo    3. Installez Node.js manuellement depuis nodejs.org
            echo    4. Relancez ce script après installation manuelle
            echo.
            echo Appuyez sur une touche pour fermer...
            pause
            exit /b 1
        )
    )
) else (
    echo ✅ Node.js trouvé
)
echo.

echo ========================================
echo   INSTALLATION DES DÉPENDANCES
echo ========================================
echo.

:: Copier les fichiers du projet
echo 📁 Copie des fichiers du projet...
set "PROJECT_DIR=%~dp0"
set "TARGET_DIR=%INSTALL_DIR%\tech_info_plus"

if not exist "%TARGET_DIR%" (
    mkdir "%TARGET_DIR%"
)

:: Copier tous les fichiers nécessaires
xcopy "%PROJECT_DIR%*" "%TARGET_DIR%\" /E /I /H /Y >nul 2>&1
echo ✅ Fichiers copiés vers %TARGET_DIR%
echo.

:: Installer les dépendances Python
echo 🐍 Installation des dépendances Python...
cd /d "%TARGET_DIR%\backend"

:: Créer requirements.txt s'il n'existe pas
if not exist "requirements.txt" (
    echo fastapi==0.104.1 > requirements.txt
    echo uvicorn==0.24.0 >> requirements.txt
    echo sqlalchemy==2.0.23 >> requirements.txt
    echo mysql-connector-python==8.2.0 >> requirements.txt
    echo python-multipart==0.0.6 >> requirements.txt
    echo python-jose==3.3.0 >> requirements.txt
    echo passlib==1.7.4 >> requirements.txt
    echo bcrypt==4.1.2 >> requirements.txt
    echo requests==2.31.0 >> requirements.txt
    echo reportlab==4.0.7 >> requirements.txt
    echo pillow==10.1.0 >> requirements.txt
)

echo    Mise à jour de pip...
python -m pip install --upgrade pip
echo    Installation des dépendances Python...
python -m pip install -r requirements.txt
echo ✅ Dépendances Python installées
echo.

:: Installer les dépendances Node.js
echo 📦 Installation des dépendances Node.js...
cd /d "%TARGET_DIR%\frontend"

:: Créer package.json s'il n'existe pas
if not exist "package.json" (
    echo { > package.json
    echo   "name": "tech-info-plus-frontend", >> package.json
    echo   "version": "1.0.0", >> package.json
    echo   "private": true, >> package.json
    echo   "dependencies": { >> package.json
    echo     "react": "^18.2.0", >> package.json
    echo     "react-dom": "^18.2.0", >> package.json
    echo     "react-scripts": "5.0.1", >> package.json
    echo     "axios": "^1.6.0", >> package.json
    echo     "react-router-dom": "^6.8.0", >> package.json
    echo     "chart.js": "^4.4.0", >> package.json
    echo     "react-chartjs-2": "^5.2.0", >> package.json
    echo     "jspdf": "^2.5.1", >> package.json
    echo     "jspdf-autotable": "^3.6.0", >> package.json
    echo     "sweetalert2": "^11.10.0", >> package.json
    echo     "react-toastify": "^9.1.3" >> package.json
    echo   }, >> package.json
    echo   "scripts": { >> package.json
    echo     "start": "react-scripts start", >> package.json
    echo     "build": "react-scripts build" >> package.json
    echo   } >> package.json
    echo } >> package.json
)

echo    Installation des dépendances Node.js...
npm install
echo ✅ Dépendances Node.js installées
echo.

echo ========================================
echo   INSTALLATION TERMINÉE AVEC SUCCÈS!
echo ========================================
echo.
echo 📍 Installation dans: %INSTALL_DIR%
echo.
echo 🚀 Pour démarrer l'application:
echo    1. Ouvrez XAMPP et démarrez MySQL
echo    2. Utilisez: %INSTALL_DIR%\LANCER_TECH_INFO_PLUS.bat
echo.
echo ⚠️  IMPORTANT: Gardez XAMPP ouvert avec MySQL démarré
echo.
echo Appuyez sur une touche pour fermer...
pause























