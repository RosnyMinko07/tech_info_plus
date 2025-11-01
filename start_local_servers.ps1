<#
Simple script PowerShell pour démarrer le backend et le frontend localement
Ce script ouvre deux fenêtres de commande (cmd) et exécute les scripts existants :
 - LANCER_BACKEND.bat
 - LANCER_FRONTEND.bat

Il ne supprime rien et n'installe pas de dépendances. Utilise ce script depuis la racine du projet.
#>

Write-Host "Démarrage des serveurs locaux..." -ForegroundColor Green

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Démarrer le backend dans une nouvelle fenêtre cmd
Write-Host "Lancement du backend (nouvelle fenêtre)..."
Start-Process -FilePath cmd.exe -ArgumentList '/k', "cd /d `"$root\backend`" && python .\start_server.py"

Start-Sleep -Milliseconds 500

Write-Host "Lancement du frontend (nouvelle fenêtre)..."
Start-Process -FilePath cmd.exe -ArgumentList '/k', "cd /d `"$root\frontend`" && npm start"

Write-Host "✅ Les deux serveurs sont lancés (vérifie les fenêtres ouvertes)." -ForegroundColor Green
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
