@echo off
setlocal enabledelayedexpansion
title TEST TÉLÉCHARGEMENT RÉEL - Debug
color 0C

echo.
echo ========================================
echo   TEST TÉLÉCHARGEMENT RÉEL
echo ========================================
echo.

:: Créer le dossier de test
set "TEST_DIR=%USERPROFILE%\TECH_INFO_PLUS_TEST"
if not exist "%TEST_DIR%" (
    mkdir "%TEST_DIR%"
    echo ✅ Dossier de test créé: %TEST_DIR%
) else (
    echo ✅ Dossier de test existe: %TEST_DIR%
)
echo.

:: Test 1: Téléchargement Node.js
echo 🔍 TEST 1: Téléchargement Node.js
echo ========================================
set "NODE_URL=https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip"
set "NODE_ZIP=%TEST_DIR%\nodejs_test.zip"

echo URL: %NODE_URL%
echo Destination: %NODE_ZIP%
echo.

echo Tentative de téléchargement...
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; try { Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%NODE_ZIP%' -UseBasicParsing; Write-Host '✅ Téléchargement réussi' -ForegroundColor Green } catch { Write-Host '❌ Erreur téléchargement:' -ForegroundColor Red; Write-Host $_.Exception.Message } }"

if exist "%NODE_ZIP%" (
    echo ✅ Fichier téléchargé avec succès
    for %%A in ("%NODE_ZIP%") do echo    Taille: %%~zA bytes
) else (
    echo ❌ Fichier non trouvé après téléchargement
)
echo.

:: Test 2: Téléchargement Python
echo 🔍 TEST 2: Téléchargement Python
echo ========================================
set "PYTHON_URL=https://www.python.org/ftp/python/3.11.9/python-3.11.9-embed-amd64.zip"
set "PYTHON_ZIP=%TEST_DIR%\python_test.zip"

echo URL: %PYTHON_URL%
echo Destination: %PYTHON_ZIP%
echo.

echo Tentative de téléchargement...
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; try { Invoke-WebRequest -Uri '%PYTHON_URL%' -OutFile '%PYTHON_ZIP%' -UseBasicParsing; Write-Host '✅ Téléchargement réussi' -ForegroundColor Green } catch { Write-Host '❌ Erreur téléchargement:' -ForegroundColor Red; Write-Host $_.Exception.Message } }"

if exist "%PYTHON_ZIP%" (
    echo ✅ Fichier téléchargé avec succès
    for %%A in ("%PYTHON_ZIP%") do echo    Taille: %%~zA bytes
) else (
    echo ❌ Fichier non trouvé après téléchargement
)
echo.

:: Test 3: Vérification des permissions
echo 🔍 TEST 3: Vérification des permissions
echo ========================================
echo Dossier de test: %TEST_DIR%
echo Permissions d'écriture...
echo test > "%TEST_DIR%\test_write.txt" 2>nul
if exist "%TEST_DIR%\test_write.txt" (
    echo ✅ Permissions d'écriture OK
    del "%TEST_DIR%\test_write.txt"
) else (
    echo ❌ Pas de permissions d'écriture
)
echo.

:: Test 4: Vérification antivirus/firewall
echo 🔍 TEST 4: Vérification réseau
echo ========================================
echo Test de connectivité vers nodejs.org...
ping -n 1 nodejs.org >nul 2>&1
if %errorLevel% equ 0 (
    echo ✅ Connectivité nodejs.org OK
) else (
    echo ❌ Problème de connectivité vers nodejs.org
)

echo Test de connectivité vers python.org...
ping -n 1 python.org >nul 2>&1
if %errorLevel% equ 0 (
    echo ✅ Connectivité python.org OK
) else (
    echo ❌ Problème de connectivité vers python.org
)
echo.

:: Test 5: PowerShell et TLS
echo 🔍 TEST 5: Test PowerShell TLS
echo ========================================
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Write-Host '✅ TLS 1.2 configuré' -ForegroundColor Green }"
echo.

echo ========================================
echo   RÉSUMÉ DES TESTS
echo ========================================
echo.

if exist "%NODE_ZIP%" (
    echo ✅ Node.js: Téléchargement OK
) else (
    echo ❌ Node.js: Échec téléchargement
)

if exist "%PYTHON_ZIP%" (
    echo ✅ Python: Téléchargement OK
) else (
    echo ❌ Python: Échec téléchargement
)

echo.
echo 📁 Fichiers de test dans: %TEST_DIR%
echo.
echo Appuyez sur une touche pour fermer...
pause























