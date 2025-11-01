# 🚀 Comment Uploader sur PythonAnywhere

Le projet est trop gros pour l'upload direct. Voici les 2 meilleures solutions :

---

## ✅ **MÉTHODE 1 : Via GitHub (RECOMMANDÉE)**

### Étape 1 : Créer un repository GitHub

1. Va sur **https://github.com**
2. Clique sur **"New repository"** (bouton vert)
3. Nom du repository : `tech-info-plus`
4. Description : `Application de gestion commerciale - React + FastAPI`
5. **Laisse le repository PUBLIC** (gratuit)
6. **NE COCHE PAS** "Initialize this repository with README"
7. Clique sur **"Create repository"**

### Étape 2 : Pousser le code sur GitHub

```bash
# Ajouter l'URL de ton repository (remplace USERNAME par ton nom GitHub)
git remote add origin https://github.com/USERNAME/tech-info-plus.git

# Pousser le code
git push -u origin master
```

### Étape 3 : Cloner depuis PythonAnywhere

1. Va sur **https://www.pythonanywhere.com**
2. Connecte-toi à ton compte
3. Va dans **"Consoles"** → **"Bash"**
4. Dans le terminal Bash, tape :

```bash
# Cloner le repository
git clone https://github.com/USERNAME/tech-info-plus.git

# Entrer dans le dossier
cd tech-info-plus

# Installer les dépendances
pip3.10 install --user -r requirements.txt
```

✅ **C'EST FAIT !** Ton code est maintenant sur PythonAnywhere !

---

## ✅ **MÉTHODE 2 : Via fichiers ZIP (Si pas de GitHub)**

### Étape 1 : Créer un fichier ZIP (sans node_modules et .venv)

```bash
# Créer un ZIP de seulement les fichiers nécessaires
7z a -tzip tech_info_plus.zip backend frontend logos *.bat *.md *.txt -xr!node_modules -xr!.venv
```

### Étape 2 : Upload via PythonAnywhere

1. Va sur **https://www.pythonanywhere.com**
2. Va dans **"Files"**
3. Clique sur **"Upload a file"**
4. Sélectionne `tech_info_plus.zip`
5. Attends que l'upload se termine

### Étape 3 : Décompresser sur PythonAnywhere

Dans la console Bash de PythonAnywhere :

```bash
# Décompresser
unzip tech_info_plus.zip -d tech_info_plus

# Entrer dans le dossier
cd tech_info_plus

# Installer les dépendances
pip3.10 install --user -r requirements.txt
```

---

## 📊 **Comparaison des méthodes**

| Critère | GitHub | ZIP |
|---------|--------|-----|
| **Vitesse** | ⚡ Rapide | 🐌 Lent |
| **Facilité** | ✅ Facile | ⚠️ Moyen |
| **Mises à jour** | ✅ `git pull` | ❌ Re-upload |
| **Taille limite** | ♾️ Illimité | 💾 ~500 MB |
| **Recommandé** | ✅ OUI | ⚠️ Si pas GitHub |

---

## 🎯 **Quelle méthode choisir ?**

### ✅ **Choisis GitHub si :**
- Tu as un compte GitHub (gratuit)
- Tu veux des mises à jour faciles
- Tu veux partager ton code

### ⚠️ **Choisis ZIP si :**
- Tu n'as pas de compte GitHub
- Tu veux juste tester rapidement
- C'est un one-shot

---

## 🚀 **PROCHAINES ÉTAPES**

Une fois le code uploadé sur PythonAnywhere :

1. **Configurer MySQL**
2. **Configurer l'application Web**
3. **Lancer l'application**

---

**Tu veux quelle méthode ? (GitHub ou ZIP)**

