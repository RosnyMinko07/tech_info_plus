# 📦 GUIDE DE DISTRIBUTION - TECH INFO PLUS

## ✅ Fichier à envoyer

**Vous devez envoyer UN SEUL fichier :**

```
TECH_INFO_PLUS_Installer.exe
```

Ce fichier se trouve à la racine de votre projet après la compilation.

---

## 📍 Où trouver le fichier `.exe` ?

Après avoir exécuté `compiler_installateur.bat`, le fichier est créé ici :

```
C:\Users\Rosny Minko\Desktop\techfactu\tech_info_plus\TECH_INFO_PLUS_Installer.exe
```

👉 **C'est ce fichier unique que vous devez envoyer aux autres utilisateurs.**

---

## 📤 Comment envoyer le fichier ?

### Option 1 : Envoi direct (petit fichier < 50 MB)
- **Email** : Joindre le fichier `.exe` à un email
- **USB/Clé** : Copier le fichier sur une clé USB
- **Cloud** (WeTransfer, Google Drive, Dropbox) : Uploader et partager le lien

### Option 2 : Compression (si le fichier est volumineux)
Si le `.exe` fait plus de 50 MB, compressez-le avec WinRAR ou 7-Zip :

```batch
# Créer un ZIP avec WinRAR
WinRAR a TECH_INFO_PLUS_Installer.zip TECH_INFO_PLUS_Installer.exe
```

---

## 🖥️ Instructions pour les utilisateurs

**Envoyez ces instructions aux utilisateurs finaux :**

### Avant l'installation

1. ✅ **XAMPP doit être installé** et **MySQL doit être démarré**
   - Ouvrir XAMPP Control Panel
   - Cliquer sur "Start" pour MySQL

2. ⚠️ **Antivirus** : L'antivirus peut bloquer le fichier `.exe`
   - Si bloqué, ajoutez une exception temporaire
   - Voir le fichier `GUIDE_ANTIVIRUS.md` pour plus de détails

### Installation

1. **Double-cliquer** sur `TECH_INFO_PLUS_Installer.exe`
2. Suivre les instructions à l'écran
3. L'installation peut prendre 5-15 minutes selon la connexion internet
4. À la fin, un raccourci `LANCER_TECH_INFO_PLUS.bat` sera créé sur le Bureau

### Utilisation

1. **Démarrer XAMPP MySQL** (si pas déjà démarré)
2. **Double-cliquer** sur `LANCER_TECH_INFO_PLUS.bat` sur le Bureau
3. L'application s'ouvrira automatiquement dans le navigateur

---

## 📋 Résumé

### ✅ À ENVOYER
- ✅ **Un seul fichier** : `TECH_INFO_PLUS_Installer.exe`

### ❌ À NE PAS ENVOYER
- ❌ Les fichiers sources du projet
- ❌ Le dossier `backend/`
- ❌ Le dossier `frontend/`
- ❌ Les fichiers `.bat` de compilation
- ❌ Le dossier `build/` ou `dist/`

**Le fichier `.exe` contient TOUT ce qui est nécessaire !** 🎯

---

## 🔍 Vérification

Pour vérifier que le `.exe` est prêt à être distribué :

1. ✅ Le fichier `TECH_INFO_PLUS_Installer.exe` existe dans le dossier du projet
2. ✅ La taille du fichier est > 10 MB (contient backend + frontend)
3. ✅ Vous avez testé l'installation sur une machine propre
4. ✅ L'application fonctionne après installation

---

## 🆘 Support

Si les utilisateurs rencontrent des problèmes :

1. **MySQL non démarré** : Vérifier XAMPP
2. **Antivirus bloque** : Voir `GUIDE_ANTIVIRUS.md`
3. **Dépendances manquantes** : Le script les installe automatiquement au démarrage
4. **Erreur d'installation** : Relancer l'installateur

---

**💡 Astuce** : Créez un fichier `LISEZ-MOI.txt` simple avec ces instructions et envoyez-le avec le `.exe` !








