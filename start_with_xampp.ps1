<#
start_with_xampp.ps1

But: détecter un MySQL/XAMPP local, importer la base `tech_info_plus` (si absente)
et démarrer le backend + frontend dans des fenêtres séparées.

Usage: depuis la racine du projet
    .\start_with_xampp.ps1

Le script :
 - cherche `mysql.exe` dans le PATH et dans des emplacements XAMPP/MySQL courants
 - teste la connexion TCP au port MySQL (3306 par défaut)
 - vérifie si la base `tech_info_plus` existe
 - si absent, crée la base et importe `backend\init.sql`
 - démarre backend (python start_server.py) et frontend (npm start) dans 2 fenêtres cmd

Remarques :
 - Si `mysql.exe` n'est pas trouvé, le script demande son chemin.
 - Si un mot de passe est nécessaire, le script le demande en entrée sécurisée.
#>

Set-StrictMode -Version Latest
Write-Host "== Start (XAMPP import + lancement) ==" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$sqlFile = Join-Path $projectRoot "backend\init.sql"

function Find-MySqlExe {
    # Cherche mysql.exe dans PATH
    $cmd = Get-Command mysql -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    # Emplacements courants XAMPP / MySQL
    $candidates = @(
        "C:\\xampp\\mysql\\bin\\mysql.exe",
        "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe",
        "C:\\Program Files (x86)\\MySQL\\MySQL Server 5.7\\bin\\mysql.exe",
        "C:\\Program Files\\MariaDB 10.4\\bin\\mysql.exe"
    )
    foreach ($p in $candidates) {
        if (Test-Path $p) { return $p }
    }
    return $null
}

function Test-TcpPortOpen {
    param($host = '127.0.0.1', $port = 3306)
    try {
        $r = Test-NetConnection -ComputerName $host -Port $port -InformationLevel Quiet
        return $r
    } catch { return $false }
}

$mysqlExe = Find-MySqlExe
if (-not $mysqlExe) {
    Write-Host "mysql.exe introuvable dans PATH ni dans chemins XAMPP courants." -ForegroundColor Yellow
    $mysqlExe = Read-Host "Entrez le chemin complet vers mysql.exe (ou appuyez sur Entrée pour annuler)"
    if (-not $mysqlExe) { Write-Host "Abandon car mysql non trouvé." -ForegroundColor Red; exit 1 }
}

Write-Host "mysql client trouvé : $mysqlExe"

# Vérifier port
if (-not (Test-TcpPortOpen -host '127.0.0.1' -port 3306)) {
    Write-Host "Aucun serveur MySQL détecté sur 127.0.0.1:3306."
    Write-Host "Assure-toi que XAMPP MySQL est démarré, puis relance ce script." -ForegroundColor Yellow
    $resp = Read-Host "Souhaites-tu continuer malgré tout ? (o/N)"
    if ($resp -ne 'o' -and $resp -ne 'O') { exit 1 }
}

# Demander credentials (utilisateur et mot de passe) - défaut root, mot de passe vide
$dbUser = Read-Host "Utilisateur MySQL (par défaut 'root')"
if (-not $dbUser) { $dbUser = 'root' }
$securePass = Read-Host -AsSecureString "Mot de passe MySQL (laisser vide si aucun)"
$ptr = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass))
$dbPass = $ptr

function Exec-MySqlQuery {
    param($query)
    $tmpCmd = "`"$mysqlExe`" -u$dbUser"
    if ($dbPass -ne '') { $tmpCmd += " -p$dbPass" }
    $tmpCmd += " -e \"$query\""
    $res = cmd /c $tmpCmd
    return $LASTEXITCODE
}

# Vérifier si la base existe
Write-Host "Vérification de l'existence de la base 'tech_info_plus'..."
$checkDbCmd = "SHOW DATABASES LIKE 'tech_info_plus';"
try {
    $out = & cmd /c "`"$mysqlExe`" -u$dbUser" + (if ($dbPass -ne '') { " -p$dbPass" } else { "" }) + " -e \"$checkDbCmd\"" 2>&1
} catch { $out = $_.Exception.Message }

if ($out -match 'tech_info_plus') {
    Write-Host "Base 'tech_info_plus' déjà présente." -ForegroundColor Green
} else {
    Write-Host "Base absente → création et import de $sqlFile" -ForegroundColor Cyan
    # Créer la base
    & cmd /c "`"$mysqlExe`" -u$dbUser" + (if ($dbPass -ne '') { " -p$dbPass" } else { "" }) + " -e \"CREATE DATABASE IF NOT EXISTS tech_info_plus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\""

    if (-not (Test-Path $sqlFile)) {
        Write-Host "Fichier SQL d'initialisation introuvable: $sqlFile" -ForegroundColor Red
        Write-Host "Impossible d'importer la base automatiquement."; exit 1
    }

    # Import (via cmd redirection)
    $importCmd = "`"$mysqlExe`" -u$dbUser" + (if ($dbPass -ne '') { " -p$dbPass" } else { "" }) + " tech_info_plus < `"$sqlFile`""
    Write-Host "Exécution de l'import (cela peut prendre quelques secondes)..."
    $rc = cmd /c $importCmd
    if ($LASTEXITCODE -ne 0) {
        Write-Host "L'import a échoué (code $LASTEXITCODE). Sortie:" -ForegroundColor Red
        Write-Host $rc
        exit 1
    }
    Write-Host "Import terminé." -ForegroundColor Green
}

# Démarrer backend et frontend
Write-Host "Démarrage du backend et du frontend..." -ForegroundColor Cyan
Start-Process -FilePath cmd.exe -ArgumentList '/k', "cd /d `"$projectRoot\\backend`" && python .\\start_server.py"
Start-Sleep -Milliseconds 500
Start-Process -FilePath cmd.exe -ArgumentList '/k', "cd /d `"$projectRoot\\frontend`" && npm start"

Write-Host "✅ Tout lancé. Vérifie les fenêtres ouvertes. Backend: http://localhost:8000 | Frontend: http://localhost:3000" -ForegroundColor Green
