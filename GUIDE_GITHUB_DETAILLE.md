# 🚀 GUIDE DÉTAILLÉ : Uploader sur GitHub puis PythonAnywhere

---

## 📋 **TABLE DES MATIÈRES**

1. [Créer un compte GitHub](#étape-1--créer-un-compte-github)
2. [Créer un repository](#étape-2--créer-un-repository)
3. [Pousser le code](#étape-3--pousser-le-code)
4. [Cloner sur PythonAnywhere](#étape-4--cloner-sur-pythonanywhere)

---

## 🎯 **ÉTAPE 1 : Créer un compte GitHub**

### Si tu n'as PAS encore de compte GitHub :

1. **Va sur** → https://github.com
2. **Clique sur** → **"Sign up"** (en haut à droite)
3. **Remplis le formulaire :**
   - **Email** : ton email
   - **Password** : un mot de passe fort
   - **Username** : choisis un nom (ex: `rosnyminko`, `techfactu`, etc.)
4. **Vérifie ton email** (GitHub va t'envoyer un code)
5. **Connecte-toi** à ton compte

### Si tu as DÉJÀ un compte GitHub :

1. **Va sur** → https://github.com
2. **Clique sur** → **"Sign in"**
3. **Entre tes identifiants**

✅ **Compte GitHub créé/connecté !**

---

## 🎯 **ÉTAPE 2 : Créer un Repository**

### Sur la page d'accueil GitHub :

1. **Clique sur le bouton vert** → **"New"** (en haut à gauche)
   
   OU
   
   Va directement sur → https://github.com/new

2. **Remplis le formulaire :**

   ```
   ┌─────────────────────────────────────────────────┐
   │ Repository name *                                │
   │ ┌─────────────────────────────────────────────┐ │
   │ │ tech-info-plus                              │ │
   │ └─────────────────────────────────────────────┘ │
   │                                                  │
   │ Description (optional)                           │
   │ ┌─────────────────────────────────────────────┐ │
   │ │ Application de gestion commerciale          │ │
   │ │ React + FastAPI + MySQL                     │ │
   │ └─────────────────────────────────────────────┘ │
   │                                                  │
   │ ○ Public  ← CHOISIS CETTE OPTION (GRATUIT)     │
   │ ○ Private                                        │
   │                                                  │
   │ Initialize this repository with:                │
   │ ☐ Add a README file  ← NE COCHE PAS            │
   │ ☐ Add .gitignore     ← NE COCHE PAS            │
   │ ☐ Choose a license   ← NE COCHE PAS            │
   └─────────────────────────────────────────────────┘
   ```

3. **Clique sur le bouton vert** → **"Create repository"**

4. **GitHub va t'afficher une page avec des instructions**

   Tu vas voir quelque chose comme ça :
   
   ```
   Quick setup — if you've done this kind of thing before
   
   https://github.com/TON-USERNAME/tech-info-plus.git
   
   …or push an existing repository from the command line
   
   git remote add origin https://github.com/TON-USERNAME/tech-info-plus.git
   git branch -M master
   git push -u origin master
   ```

5. **COPIE L'URL** de ton repository (on va l'utiliser à l'étape 3)
   
   Format : `https://github.com/TON-USERNAME/tech-info-plus.git`

✅ **Repository créé !**

---

## 🎯 **ÉTAPE 3 : Pousser le Code**

### Maintenant, on va envoyer ton code sur GitHub

**IMPORTANT :** Remplace `TON-USERNAME` par ton vrai nom d'utilisateur GitHub !

### 🔹 **Commande 1 : Ajouter l'URL du repository**

```bash
git remote add origin https://github.com/TON-USERNAME/tech-info-plus.git
```

**Exemple concret :**
- Si ton username est `rosnyminko` :
  ```bash
  git remote add origin https://github.com/rosnyminko/tech-info-plus.git
  ```

### 🔹 **Commande 2 : Vérifier que c'est bien ajouté**

```bash
git remote -v
```

**Tu devrais voir :**
```
origin  https://github.com/TON-USERNAME/tech-info-plus.git (fetch)
origin  https://github.com/TON-USERNAME/tech-info-plus.git (push)
```

### 🔹 **Commande 3 : Pousser le code**

```bash
git push -u origin master
```

**Ce qui va se passer :**

1. **GitHub va demander ton mot de passe**
   
   ⚠️ **ATTENTION** : Depuis 2021, GitHub n'accepte PLUS les mots de passe normaux !
   
   Tu dois utiliser un **Personal Access Token (PAT)**

2. **Si c'est la première fois, créer un token :**

   a. Va sur → https://github.com/settings/tokens
   
   b. Clique sur → **"Generate new token"** → **"Generate new token (classic)"**
   
   c. **Remplis :**
      - **Note** : `tech-info-plus upload`
      - **Expiration** : 90 days (ou No expiration)
      - **Coches** : ✅ `repo` (toutes les cases sous "repo")
   
   d. **Clique sur** → **"Generate token"**
   
   e. **COPIE LE TOKEN** (tu ne le reverras plus !)
      
      Format : `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

3. **Quand Git demande le mot de passe :**
   
   ```
   Username: TON-USERNAME
   Password: [COLLE TON TOKEN ICI]
   ```

4. **L'upload commence !**
   
   Tu vas voir :
   ```
   Enumerating objects: 100, done.
   Counting objects: 100% (100/100), done.
   Delta compression using up to 8 threads
   Compressing objects: 100% (95/95), done.
   Writing objects: 100% (100/100), 1.2 MiB | 500 KiB/s, done.
   Total 100 (delta 20), reused 0 (delta 0)
   remote: Resolving deltas: 100% (20/20), done.
   To https://github.com/TON-USERNAME/tech-info-plus.git
    * [new branch]      master -> master
   Branch 'master' set up to track remote branch 'master' from 'origin'.
   ```

5. **Vérifie que c'est uploadé :**
   
   Va sur → `https://github.com/TON-USERNAME/tech-info-plus`
   
   Tu devrais voir tous tes fichiers !

✅ **Code uploadé sur GitHub !**

---

## 🎯 **ÉTAPE 4 : Cloner sur PythonAnywhere**

### Maintenant qu'on a le code sur GitHub, on va le télécharger sur PythonAnywhere

1. **Va sur** → https://www.pythonanywhere.com
2. **Connecte-toi** à ton compte
3. **Clique sur** → **"Consoles"** (en haut)
4. **Clique sur** → **"Bash"** (sous "Start a new console")

### Dans la console Bash qui s'ouvre :

### 🔹 **Commande 1 : Cloner le repository**

```bash
git clone https://github.com/TON-USERNAME/tech-info-plus.git
```

**Exemple :**
```bash
git clone https://github.com/rosnyminko/tech-info-plus.git
```

**Tu vas voir :**
```
Cloning into 'tech-info-plus'...
remote: Enumerating objects: 100, done.
remote: Counting objects: 100% (100/100), done.
remote: Compressing objects: 100% (75/75), done.
remote: Total 100 (delta 20), reused 100 (delta 20), pack-reused 0
Receiving objects: 100% (100/100), 1.2 MiB | 2 MiB/s, done.
Resolving deltas: 100% (20/20), done.
```

### 🔹 **Commande 2 : Entrer dans le dossier**

```bash
cd tech-info-plus
```

### 🔹 **Commande 3 : Vérifier que tout est là**

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
LANCER_BACKEND.bat
LANCER_FRONTEND.bat
LANCER_TOUT.bat
```

### 🔹 **Commande 4 : Installer les dépendances Python**

```bash
pip3.10 install --user -r requirements.txt
```

**Ça va installer :**
```
Installing collected packages: fastapi, uvicorn, pymysql, sqlalchemy, etc.
Successfully installed fastapi-0.104.1 uvicorn-0.24.0 ...
```

### 🔹 **Commande 5 : Aller dans le dossier backend**

```bash
cd backend
```

### 🔹 **Commande 6 : Installer les dépendances backend**

```bash
pip3.10 install --user -r requirements.txt
```

✅ **Code installé sur PythonAnywhere !**

---

## 🎯 **RÉCAPITULATIF DES COMMANDES**

### Sur ton PC (Windows) :

```bash
# Ajouter le remote
git remote add origin https://github.com/TON-USERNAME/tech-info-plus.git

# Pousser le code
git push -u origin master
```

### Sur PythonAnywhere (Bash) :

```bash
# Cloner le repository
git clone https://github.com/TON-USERNAME/tech-info-plus.git

# Entrer dans le dossier
cd tech-info-plus

# Installer les dépendances
pip3.10 install --user -r requirements.txt
cd backend
pip3.10 install --user -r requirements.txt
```

---

## 🎨 **ASTUCE : Si tu veux mettre à jour le code plus tard**

### Sur ton PC :

```bash
git add .
git commit -m "Description des modifications"
git push
```

### Sur PythonAnywhere :

```bash
cd tech-info-plus
git pull
```

✅ **Et voilà ! Les modifications sont synchronisées !**

---

## ❓ **PROBLÈMES COURANTS**

### 🔴 Problème 1 : "remote origin already exists"

**Solution :**
```bash
git remote remove origin
git remote add origin https://github.com/TON-USERNAME/tech-info-plus.git
```

### 🔴 Problème 2 : "Authentication failed"

**Solution :** Tu as utilisé ton mot de passe au lieu du token. 
- Crée un Personal Access Token (voir Étape 3)
- Utilise le token à la place du mot de passe

### 🔴 Problème 3 : "Permission denied"

**Solution :** Vérifie que :
- Tu es bien connecté au bon compte GitHub
- Le repository est bien en "Public"
- Ton token a les droits "repo"

---

## 🚀 **PROCHAINES ÉTAPES**

Une fois le code sur PythonAnywhere :

1. ✅ Configurer MySQL
2. ✅ Créer la base de données
3. ✅ Configurer l'application Web
4. ✅ Lancer l'application

**Prêt à continuer ?** 🎯

