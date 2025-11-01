# Lancement local (sans Docker)

Ce projet peut être lancé localement sans Docker.

Étapes rapides (Windows PowerShell) :

1. Backend

```powershell
cd .\backend
# Créer et activer un environnement virtuel si souhaité
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
# Démarrer
python .\start_server.py
```

2. Frontend

```powershell
cd .\frontend
npm install
npm start
```

3. Script pratique

Depuis la racine du projet, tu peux lancer le script PowerShell fourni qui ouvrira deux fenêtres :

```powershell
.\start_local_servers.ps1
```

Remarques :
- Les fichiers Docker ont été désactivés (renommés avec `.disabled`) mais sont conservés pour référence.
- Les scripts `LANCER_BACKEND.bat`, `LANCER_FRONTEND.bat` et `LANCER_TOUT.bat` restent disponibles.

Script pratique pour utilisateurs XAMPP
------------------------------------

Si l'utilisateur utilise XAMPP (MySQL fourni par XAMPP) et souhaite que l'import de la base soit fait automatiquement puis lancer l'application, utilise :

```powershell
.\start_with_xampp.ps1
```

Le script détecte `mysql.exe` (PATH ou chemin XAMPP), vérifie si la base `tech_info_plus` existe, l'importe depuis `backend/init.sql` si nécessaire, puis démarre le backend et le frontend.

Remarque : le script peut demander le mot de passe MySQL si nécessaire.
