# 🎯 ÉTAPES SIMPLES - GITHUB

---

## 📝 **AVANT DE COMMENCER**

### ✅ **Étape 0 : As-tu déjà un compte GitHub ?**

**OUI** → Passe à l'Étape 1  
**NON** → Va sur https://github.com/signup et crée un compte (gratuit, 2 minutes)

---

## 🚀 **ÉTAPE 1 : Créer le Repository sur GitHub**

1. **Connecte-toi** sur → https://github.com
2. **Clique sur le bouton vert** "New" (en haut à gauche)
3. **Remplis :**
   - **Repository name** : `tech-info-plus`
   - **Description** : `Application de gestion commerciale`
   - **Visibilité** : Choisis **Public** (gratuit)
   - **NE COCHE RIEN** en dessous (pas de README, pas de .gitignore)
4. **Clique sur** "Create repository"

✅ **Repository créé !**

---

## 🚀 **ÉTAPE 2 : Noter ton Username**

**Sur la page du repository, tu verras une URL comme :**

```
https://github.com/TON-USERNAME/tech-info-plus
```

**Note ton USERNAME** (on en aura besoin)

**Exemple :**
- Si l'URL est `https://github.com/rosnyminko/tech-info-plus`
- Alors ton USERNAME est : `rosnyminko`

📝 **Mon username GitHub est : ________________**

---

## 🚀 **ÉTAPE 3 : Créer un Personal Access Token**

**Pourquoi ?** GitHub n'accepte plus les mots de passe normaux depuis 2021.

### Comment créer un token :

1. **Va sur** → https://github.com/settings/tokens
2. **Clique sur** → "Generate new token" → "Generate new token (classic)"
3. **Remplis :**
   - **Note** : `tech-info-plus`
   - **Expiration** : Choisis "90 days" (ou "No expiration" si tu veux)
   - **Select scopes** : Coche SEULEMENT ☑️ **repo** (toutes les sous-cases seront cochées automatiquement)
4. **Clique sur** "Generate token" (bouton vert en bas)
5. **⚠️ COPIE LE TOKEN IMMÉDIATEMENT** (tu ne le reverras plus !)

Le token ressemble à : `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

📝 **Colle ton token ici (pour ne pas l'oublier) : ________________**

✅ **Token créé !**

---

## 🚀 **ÉTAPE 4 : Pousser le Code depuis ton PC**

**Ouvre PowerShell ou CMD dans le dossier du projet**

### 🔹 Commande 1 : Ajouter le remote

```bash
git remote add origin https://github.com/TON-USERNAME/tech-info-plus.git
```

**⚠️ REMPLACE `TON-USERNAME` par ton vrai username !**

**Exemple :**
```bash
git remote add origin https://github.com/rosnyminko/tech-info-plus.git
```

### 🔹 Commande 2 : Pousser le code

```bash
git push -u origin master
```

**GitHub va demander :**
```
Username: [Entre ton username]
Password: [Colle ton TOKEN (pas ton mot de passe !)]
```

**Attends quelques secondes...**

Tu devrais voir :
```
Enumerating objects: 100, done.
Writing objects: 100% (100/100), 1.2 MiB | 500 KiB/s, done.
To https://github.com/TON-USERNAME/tech-info-plus.git
 * [new branch]      master -> master
```

✅ **Code uploadé sur GitHub !**

### 🔹 Vérifie sur GitHub

Va sur `https://github.com/TON-USERNAME/tech-info-plus`

Tu devrais voir tous tes fichiers : `backend/`, `frontend/`, `logos/`, etc.

---

## 🚀 **ÉTAPE 5 : Télécharger sur PythonAnywhere**

1. **Va sur** → https://www.pythonanywhere.com
2. **Connecte-toi** à ton compte
3. **Clique sur** "Consoles" → "Bash"
4. **Dans la console Bash, copie-colle ces commandes :**

```bash
# Cloner le repository
git clone https://github.com/TON-USERNAME/tech-info-plus.git

# Entrer dans le dossier
cd tech-info-plus

# Installer les dépendances
pip3.10 install --user -r requirements.txt

# Installer les dépendances backend
cd backend
pip3.10 install --user -r requirements.txt
```

**⚠️ N'oublie pas de remplacer `TON-USERNAME` !**

✅ **Code installé sur PythonAnywhere !**

---

## 🎯 **RÉCAPITULATIF**

| Étape | Action | Statut |
|-------|--------|--------|
| 1 | Créer repository sur GitHub | ☐ |
| 2 | Noter mon username | ☐ |
| 3 | Créer Personal Access Token | ☐ |
| 4 | Pousser le code (git push) | ☐ |
| 5 | Cloner sur PythonAnywhere | ☐ |

---

## ❓ **PROBLÈMES ?**

### 🔴 "remote origin already exists"

```bash
git remote remove origin
git remote add origin https://github.com/TON-USERNAME/tech-info-plus.git
```

### 🔴 "Authentication failed"

Tu as utilisé ton mot de passe au lieu du token.  
Utilise le token que tu as créé à l'Étape 3.

### 🔴 "Permission denied"

Vérifie que :
- Le repository est bien en "Public"
- Ton token a les droits "repo"

---

## 🚀 **PROCHAINES ÉTAPES**

Une fois le code sur PythonAnywhere :
1. Configurer MySQL
2. Créer la base de données
3. Configurer l'application Web
4. Lancer l'application

**Tu es prêt ? Dis-moi quand tu veux commencer ! 🎯**

