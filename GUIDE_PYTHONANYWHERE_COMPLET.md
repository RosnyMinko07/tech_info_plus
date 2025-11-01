# 🚀 Guide Complet : Déployer sur PythonAnywhere

---

## 📋 **PRÉREQUIS**

✅ Code sur GitHub : https://github.com/RosnyMinko07/tech_info_plus  
✅ Compte PythonAnywhere (gratuit) : https://www.pythonanywhere.com

---

## 🎯 **ÉTAPE 1 : Cloner le Code**

### 1.1 Se connecter à PythonAnywhere

1. Va sur → https://www.pythonanywhere.com
2. Connecte-toi à ton compte
3. Clique sur **"Consoles"** (dans le menu en haut)
4. Clique sur **"Bash"** (pour ouvrir une console Bash)

### 1.2 Cloner le repository GitHub

Dans la console Bash qui s'ouvre, tape :

```bash
git clone https://github.com/RosnyMinko07/tech_info_plus.git
```

**Tu devrais voir :**
```
Cloning into 'tech_info_plus'...
remote: Enumerating objects: 100, done.
remote: Counting objects: 100% (100/100), done.
Receiving objects: 100% (100/100), done.
```

✅ **Code cloné !**

### 1.3 Entrer dans le dossier

```bash
cd tech_info_plus
```

### 1.4 Vérifier que tout est là

```bash
ls -la
```

**Tu devrais voir :**
```
backend/
frontend/
logos/
.gitignore
README.md
requirements.txt
```

✅ **Tous les fichiers sont présents !**

---

## 🎯 **ÉTAPE 2 : Installer les Dépendances**

### 2.1 Installer les dépendances principales

```bash
pip3.10 install --user -r requirements.txt
```

**Ça va installer :**
- FastAPI
- Uvicorn
- PyMySQL
- SQLAlchemy
- ReportLab
- etc.

⏱️ **Ça peut prendre 2-3 minutes...**

### 2.2 Installer les dépendances backend

```bash
cd backend
pip3.10 install --user -r requirements.txt
```

✅ **Dépendances installées !**

---

## 🎯 **ÉTAPE 3 : Configurer MySQL**

### 3.1 Créer une base de données MySQL

1. Dans PythonAnywhere, clique sur **"Databases"** (dans le menu)
2. Tu vas voir une section **"MySQL"**
3. Si ce n'est pas déjà fait, **initialise MySQL** (définis un mot de passe)
4. Dans la section **"Create a new database"**, tape :
   ```
   tech_info_plus
   ```
5. Clique sur **"Create"**

✅ **Base de données créée !**

### 3.2 Noter les informations MySQL

Tu vas avoir besoin de ces informations :

```
Host: TON-USERNAME.mysql.pythonanywhere-services.com
Database: TON-USERNAME$tech_info_plus
User: TON-USERNAME
Password: [le mot de passe que tu as défini]
Port: 3306
```

**Exemple :**
Si ton username PythonAnywhere est `rosnyminko` :
```
Host: rosnyminko.mysql.pythonanywhere-services.com
Database: rosnyminko$tech_info_plus
User: rosnyminko
Password: ton_mot_de_passe_mysql
```

---

## 🎯 **ÉTAPE 4 : Configurer l'Application**

### 4.1 Créer le fichier .env

Dans la console Bash :

```bash
cd ~/tech_info_plus/backend
nano .env
```

### 4.2 Remplir le fichier .env

Colle ce contenu (en remplaçant par tes vraies valeurs) :

```env
MYSQL_HOST=TON-USERNAME.mysql.pythonanywhere-services.com
MYSQL_USER=TON-USERNAME
MYSQL_PASSWORD=ton_mot_de_passe_mysql
MYSQL_DATABASE=TON-USERNAME$tech_info_plus
MYSQL_PORT=3306
```

**Exemple concret :**
```env
MYSQL_HOST=rosnyminko.mysql.pythonanywhere-services.com
MYSQL_USER=rosnyminko
MYSQL_PASSWORD=MonMotDePasse123
MYSQL_DATABASE=rosnyminko$tech_info_plus
MYSQL_PORT=3306
```

### 4.3 Sauvegarder et quitter

1. Appuie sur **Ctrl+O** (pour sauvegarder)
2. Appuie sur **Entrée** (pour confirmer)
3. Appuie sur **Ctrl+X** (pour quitter)

✅ **Configuration créée !**

---

## 🎯 **ÉTAPE 5 : Créer l'Application Web**

### 5.1 Aller dans l'onglet Web

1. Clique sur **"Web"** (dans le menu en haut)
2. Clique sur **"Add a new web app"**

### 5.2 Choisir les options

1. **Domain** : Laisse le domaine gratuit (ex: `ton-username.pythonanywhere.com`)
2. **Python Web Framework** : Choisis **"Manual configuration"**
3. **Python version** : Choisis **"Python 3.10"**
4. Clique sur **"Next"**

### 5.3 Configurer le WSGI

1. Tu vas voir une page de configuration
2. Clique sur le lien **"WSGI configuration file"** (en bleu)
3. **Supprime tout le contenu** du fichier
4. **Colle ce nouveau contenu** :

```python
import sys
import os

# Ajouter le chemin du projet
path = '/home/TON-USERNAME/tech_info_plus/backend'
if path not in sys.path:
    sys.path.insert(0, path)

# Charger les variables d'environnement
from dotenv import load_dotenv
load_dotenv(os.path.join(path, '.env'))

# Importer l'application FastAPI
from app import app as application
```

**⚠️ IMPORTANT : Remplace `TON-USERNAME` par ton vrai username PythonAnywhere !**

**Exemple :**
```python
path = '/home/rosnyminko/tech_info_plus/backend'
```

5. Clique sur **"Save"** (en haut à droite)

### 5.4 Configurer le Virtual Environment

1. Retourne dans l'onglet **"Web"**
2. Descends à la section **"Virtualenv"**
3. Dans le champ, tape :
   ```
   /home/TON-USERNAME/.local
   ```
4. Clique sur le ✓ (pour valider)

### 5.5 Configurer les fichiers statiques (optionnel pour le frontend)

Si tu veux servir le frontend depuis PythonAnywhere :

1. Dans la section **"Static files"**
2. Clique sur **"Add a new static file mapping"**
3. **URL** : `/`
4. **Directory** : `/home/TON-USERNAME/tech_info_plus/frontend/build`

---

## 🎯 **ÉTAPE 6 : Lancer l'Application**

### 6.1 Recharger l'application

1. En haut de la page **"Web"**, clique sur le bouton vert **"Reload"**
2. Attends quelques secondes...

### 6.2 Tester l'application

1. Clique sur le lien de ton application (ex: `https://ton-username.pythonanywhere.com`)
2. Tu devrais voir l'API FastAPI !

✅ **Application déployée !**

---

## 🎯 **ÉTAPE 7 : Importer les Données (Optionnel)**

Si tu veux importer ta base de données existante :

### 7.1 Exporter depuis ton PC

Sur ton PC :

```bash
# Exporter la base de données
mysqldump -u root -p tech_info_plus > database_backup.sql
```

### 7.2 Uploader sur PythonAnywhere

1. Dans PythonAnywhere, clique sur **"Files"**
2. Clique sur **"Upload a file"**
3. Sélectionne `database_backup.sql`

### 7.3 Importer dans MySQL

Dans la console Bash de PythonAnywhere :

```bash
mysql -h TON-USERNAME.mysql.pythonanywhere-services.com -u TON-USERNAME -p TON-USERNAME\$tech_info_plus < database_backup.sql
```

(Tape ton mot de passe MySQL quand demandé)

✅ **Données importées !**

---

## 🎯 **ÉTAPE 8 : Configurer le Frontend (React)**

### Option 1 : Build et servir depuis PythonAnywhere

```bash
cd ~/tech_info_plus/frontend
npm install
npm run build
```

Puis configure les fichiers statiques (voir Étape 5.5)

### Option 2 : Déployer sur Vercel/Netlify (Recommandé)

Le frontend React est mieux hébergé sur :
- **Vercel** : https://vercel.com (gratuit)
- **Netlify** : https://netlify.com (gratuit)

---

## 📊 **RÉCAPITULATIF**

| Étape | Action | Statut |
|-------|--------|--------|
| 1 | Cloner le code depuis GitHub | ☐ |
| 2 | Installer les dépendances Python | ☐ |
| 3 | Créer la base MySQL | ☐ |
| 4 | Configurer le fichier .env | ☐ |
| 5 | Créer l'application Web | ☐ |
| 6 | Configurer le WSGI | ☐ |
| 7 | Recharger l'application | ☐ |
| 8 | Tester l'application | ☐ |

---

## ❓ **PROBLÈMES COURANTS**

### 🔴 "Error loading WSGI app"

**Solution :** Vérifie que :
- Le chemin dans le WSGI est correct
- Le fichier `.env` existe dans `backend/`
- Les dépendances sont installées

### 🔴 "Can't connect to MySQL"

**Solution :** Vérifie que :
- Le host MySQL est correct (avec `.pythonanywhere-services.com`)
- Le nom de la base contient bien `USERNAME$`
- Le mot de passe MySQL est correct

### 🔴 "Module not found"

**Solution :**
```bash
pip3.10 install --user nom_du_module
```

---

## 🚀 **PROCHAINES ÉTAPES**

Une fois l'application déployée :

1. ✅ Tester toutes les fonctionnalités
2. ✅ Créer un utilisateur admin
3. ✅ Importer les données (si nécessaire)
4. ✅ Configurer le frontend
5. ✅ Partager le lien !

**Ton application sera accessible sur :**
```
https://ton-username.pythonanywhere.com
```

---

## 🎉 **FÉLICITATIONS !**

Ton application **Tech Info Plus** est maintenant en ligne ! 🚀

**Besoin d'aide ? Dis-moi où tu es bloqué !** 😊

