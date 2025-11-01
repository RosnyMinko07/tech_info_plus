@echo off
title Compilation de l'installateur TECH INFO PLUS
color 0A

echo.
echo ========================================
echo   COMPILATION INSTALLATEUR TECH INFO PLUS
echo ========================================
echo.

:: Vérifier qu'on n'est pas en admin
net session >nul 2>&1
if %errorLevel% equ 0 (
    echo ❌ ERREUR: Ne lancez pas ce script en tant qu'administrateur
    echo    PyInstaller ne fonctionne pas en mode administrateur
    echo    Fermez cette fenêtre et relancez normalement
    pause
    exit /b 1
)

:: Vérifier Python
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Python non trouvé
    echo    Veuillez installer Python d'abord
    pause
    exit /b 1
)
echo ✅ Python trouvé

:: Installer les dépendances nécessaires
echo 📦 Installation des dépendances PyInstaller...
pip install --upgrade pip
pip install pyinstaller
pip install mysql-connector-python
pip install pymysql
pip install python-dotenv
echo ✅ Dépendances installées

:: Compiler l'installateur avec toutes les dépendances
echo 🔨 Compilation de l'installateur...
echo    (Ceci peut prendre quelques minutes...)
echo    ⚠️  Note: Cette compilation désactive UPX pour éviter les faux positifs antivirus
echo.

:: Vérifier que les dossiers backend et frontend existent
if not exist "backend" (
    echo ❌ ERREUR: Dossier backend introuvable
    echo    Assurez-vous d'être dans le répertoire racine du projet
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ ERREUR: Dossier frontend introuvable
    echo    Assurez-vous d'être dans le répertoire racine du projet
    pause
    exit /b 1
)

echo ✅ Dossiers backend et frontend trouvés
echo.

:: Compiler avec PyInstaller (sans UPX pour éviter les faux positifs antivirus)
:: Note: --noupx désactive la compression UPX qui est souvent détectée comme suspecte
:: --add-data inclut les dossiers backend et frontend dans l'exe
:: --hidden-import et --collect-all incluent TOUS les packages nécessaires
echo 🔨 Compilation avec inclusion COMPLÈTE des fichiers et packages...
echo    (Ceci peut prendre 5-10 minutes, ne fermez pas la fenêtre...)
echo.

:: Vérifier si installer.spec existe
if exist "installer.spec" (
    echo ✅ Utilisation du fichier installer.spec personnalisé
    pyinstaller --clean --noconfirm installer.spec
) else (
    echo ⚠️  Fichier installer.spec introuvable, compilation avec options manuelles...
    pyinstaller ^
        --onefile ^
        --windowed ^
        --name "TECH_INFO_PLUS_Installer" ^
        --noupx ^
        --add-data "backend;backend" ^
        --add-data "frontend;frontend" ^
        --hidden-import=mysql.connector ^
        --hidden-import=mysql.connector.pooling ^
        --hidden-import=mysql.connector.cursor ^
        --hidden-import=mysql.connector.errors ^
        --hidden-import=mysql.connector.connection ^
        --hidden-import=pymysql ^
        --hidden-import=pymysql.cursors ^
        --hidden-import=pymysql.converters ^
        --hidden-import=tkinter ^
        --hidden-import=tkinter.ttk ^
        --hidden-import=tkinter.scrolledtext ^
        --hidden-import=tkinter.messagebox ^
        --hidden-import=socket ^
        --hidden-import=urllib.request ^
        --hidden-import=urllib.parse ^
        --hidden-import=zipfile ^
        --hidden-import=shutil ^
        --hidden-import=threading ^
        --hidden-import=subprocess ^
        --hidden-import=time ^
        --hidden-import=json ^
        --hidden-import=os ^
        --hidden-import=sys ^
        --hidden-import=pathlib ^
        --hidden-import=dotenv ^
        --hidden-import=ssl ^
        --hidden-import=certifi ^
        --hidden-import=charset_normalizer ^
        --collect-all mysql.connector ^
        --collect-all pymysql ^
        --collect-all tkinter ^
        --collect-all dotenv ^
        --collect-all certifi ^
        --collect-all charset_normalizer ^
        --collect-all urllib3 ^
        installer.py
)

if exist "dist\TECH_INFO_PLUS_Installer.exe" (
    echo ✅ Compilation réussie!
    echo 📁 Fichier créé: dist\TECH_INFO_PLUS_Installer.exe
    
    :: Copier vers le dossier principal
    copy "dist\TECH_INFO_PLUS_Installer.exe" "TECH_INFO_PLUS_Installer.exe"
    echo ✅ Installateur copié dans le dossier principal
    
    :: Nettoyer les fichiers temporaires
    rmdir /s /q build
    rmdir /s /q dist
    if exist "TECH_INFO_PLUS_Installer.spec" (
        del TECH_INFO_PLUS_Installer.spec
    )
    echo ✅ Fichiers temporaires supprimés
    
    echo.
    echo ========================================
    echo   COMPILATION TERMINÉE AVEC SUCCÈS!
    echo ========================================
    echo.
    echo 📁 Installateur créé: TECH_INFO_PLUS_Installer.exe
    echo 🚀 Vous pouvez maintenant distribuer ce fichier
    echo.
) else (
    echo ❌ Erreur lors de la compilation
    echo    Vérifiez les erreurs ci-dessus
)

echo.
pause
