# 📊 Créer la Base de Données MySQL sur PythonAnywhere

---

## 🎯 **ÉTAPE 1 : Initialiser MySQL**

### 1.1 Aller dans l'onglet Databases

1. Sur PythonAnywhere, clique sur **"Databases"** (dans le menu en haut)
2. Tu vas voir une page avec une section **"MySQL"**

### 1.2 Initialiser MySQL (si pas déjà fait)

**Si tu vois "MySQL is not enabled" :**

1. Tu verras un champ **"MySQL password"**
2. **Définis un mot de passe** (note-le bien !)
   - Exemple : `MonMotDePasse123!`
   - ⚠️ **IMPORTANT : Note ce mot de passe, tu en auras besoin !**
3. Clique sur **"Initialize MySQL"**
4. Attends quelques secondes...

✅ **MySQL initialisé !**

**Si MySQL est déjà initialisé :**
- Tu verras directement la section "Databases"
- Passe à l'étape suivante

---

## 🎯 **ÉTAPE 2 : Créer la Base de Données**

### 2.1 Créer la base

1. Tu vas voir une section **"Create a new database"**
2. Dans le champ texte, tape :
   ```
   tech_info_plus
   ```
3. Clique sur le bouton **"Create"**

✅ **Base de données créée !**

### 2.2 Vérifier que la base existe

Tu devrais maintenant voir dans la liste des bases :
```
TON-USERNAME$tech_info_plus
```

**Exemple :**
Si ton username est `rosnyminko`, tu verras :
```
rosnyminko$tech_info_plus
```

---

## 🎯 **ÉTAPE 3 : Noter les Informations de Connexion**

### 3.1 Informations importantes

Sur la page "Databases", tu vas voir tes informations MySQL :

```
┌─────────────────────────────────────────────────────────────┐
│ MySQL                                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Host: TON-USERNAME.mysql.pythonanywhere-services.com       │
│                                                              │
│ Your MySQL username: TON-USERNAME                           │
│                                                              │
│ Databases:                                                   │
│   • TON-USERNAME$tech_info_plus                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Copie ces informations

**Note ces informations quelque part (tu en auras besoin) :**

```
Host     : TON-USERNAME.mysql.pythonanywhere-services.com
Database : TON-USERNAME$tech_info_plus
User     : TON-USERNAME
Password : [le mot de passe que tu as défini]
Port     : 3306
```

**Exemple concret :**
Si ton username PythonAnywhere est `rosnyminko` :
```
Host     : rosnyminko.mysql.pythonanywhere-services.com
Database : rosnyminko$tech_info_plus
User     : rosnyminko
Password : MonMotDePasse123!
Port     : 3306
```

⚠️ **IMPORTANT : Le nom de la base contient bien le `$` (dollar) !**

---

## 🎯 **ÉTAPE 4 : Créer le Fichier .env**

Maintenant qu'on a les informations MySQL, on va créer le fichier `.env` :

### 4.1 Retourner dans la console Bash

1. Clique sur **"Consoles"** (en haut)
2. Clique sur ta console **"Bash"** existante (ou ouvre-en une nouvelle)

### 4.2 Aller dans le dossier backend

```bash
cd ~/tech_info_plus/backend
```

### 4.3 Créer le fichier .env

```bash
nano .env
```

### 4.4 Remplir le fichier .env

**Colle ce contenu (en remplaçant par TES vraies valeurs) :**

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
MYSQL_PASSWORD=MonMotDePasse123!
MYSQL_DATABASE=rosnyminko$tech_info_plus
MYSQL_PORT=3306
```

### 4.5 Sauvegarder et quitter

1. Appuie sur **Ctrl+O** (pour sauvegarder)
2. Appuie sur **Entrée** (pour confirmer le nom du fichier)
3. Appuie sur **Ctrl+X** (pour quitter nano)

✅ **Fichier .env créé !**

### 4.6 Vérifier que le fichier existe

```bash
cat .env
```

Tu devrais voir le contenu du fichier s'afficher.

---

## 🎯 **ÉTAPE 5 : Tester la Connexion MySQL (Optionnel)**

Pour vérifier que tout fonctionne :

```bash
mysql -h TON-USERNAME.mysql.pythonanywhere-services.com -u TON-USERNAME -p
```

Quand il demande le mot de passe, tape ton mot de passe MySQL.

**Si ça marche, tu verras :**
```
Welcome to the MySQL monitor.
mysql>
```

**Pour quitter :**
```sql
exit;
```

✅ **Connexion MySQL OK !**

---

## 📋 **RÉCAPITULATIF**

| Étape | Action | Statut |
|-------|--------|--------|
| 1 | Initialiser MySQL | ☐ |
| 2 | Créer la base `tech_info_plus` | ☐ |
| 3 | Noter les informations MySQL | ☐ |
| 4 | Créer le fichier `.env` | ☐ |
| 5 | Tester la connexion (optionnel) | ☐ |

---

## ❓ **PROBLÈMES COURANTS**

### 🔴 "Database name is too long"

**Solution :** Le nom complet est `TON-USERNAME$tech_info_plus`. C'est normal !

### 🔴 "Access denied for user"

**Solution :** Vérifie que :
- Le mot de passe est correct
- Le username est correct (sans le `$`)

### 🔴 "Can't connect to MySQL server"

**Solution :** Vérifie que :
- Le host contient bien `.mysql.pythonanywhere-services.com`
- Tu es bien connecté à Internet

---

## 🚀 **PROCHAINE ÉTAPE**

Une fois le fichier `.env` créé, on va :

1. ✅ Créer l'application Web
2. ✅ Configurer le WSGI
3. ✅ Lancer l'application !

**Dis-moi quand tu as terminé ces étapes !** 😊

