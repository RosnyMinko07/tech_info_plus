# 🌐 Créer une Base de Données MySQL Gratuite sur db4free.net

---

## ⚠️ **IMPORTANT À SAVOIR**

**db4free.net** est un service de **test** gratuit :
- ✅ **Gratuit** et **illimité**
- ✅ MySQL dernière version
- ✅ Accès phpMyAdmin
- ⚠️ **Pour TEST uniquement** (pas pour production)
- ⚠️ Peut avoir des pannes occasionnelles
- ⚠️ Pas de garantie de sécurité

**Pour notre cas (tester l'application), c'est parfait !** 😊

---

## 🎯 **ÉTAPE 1 : Créer un Compte**

### 1.1 Aller sur le site

👉 **https://www.db4free.net**

### 1.2 Créer un compte

1. Sur la page d'accueil, clique sur **"phpMyAdmin"** (en haut à droite)
   
   OU va directement sur :
   
   👉 **https://www.db4free.net/signup.php**

2. Tu vas voir un formulaire d'inscription

---

## 🎯 **ÉTAPE 2 : Remplir le Formulaire**

### Informations à fournir :

```
┌─────────────────────────────────────────────────────┐
│ Database Name *                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ tech_info_plus                                  │ │ ← Nom de ta base
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ Username *                                           │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ton_username                                    │ │ ← Choisis un nom
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ Password *                                           │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ••••••••••••                                    │ │ ← Mot de passe fort
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ Password (repeat) *                                  │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ••••••••••••                                    │ │ ← Même mot de passe
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ Email *                                              │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ton@email.com                                   │ │ ← Ton email
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ ☑ I have read and accepted the Terms of Service    │
│                                                      │
│ [Sign up]                                            │
└─────────────────────────────────────────────────────┘
```

### 📝 **Conseils pour le formulaire :**

1. **Database Name** : `tech_info_plus` (ou un nom court)
   - Doit être unique sur db4free.net
   - Si le nom existe déjà, essaie : `tech_info_2025`, `techinfo_db`, etc.

2. **Username** : Ton nom d'utilisateur
   - Peut être différent du nom de la base
   - Exemple : `rosny_minko`, `techfactu`, etc.

3. **Password** : Un mot de passe fort
   - Au moins 8 caractères
   - **NOTE-LE BIEN !** Tu en auras besoin

4. **Email** : Ton adresse email
   - Tu recevras un email de confirmation

### Coche la case "Terms of Service"

### Clique sur **"Sign up"**

---

## 🎯 **ÉTAPE 3 : Confirmer ton Email**

### 3.1 Vérifier ton email

1. Va dans ta boîte email
2. Cherche un email de **"db4free.net"**
3. Ouvre l'email

### 3.2 Cliquer sur le lien de confirmation

L'email contient un lien comme :
```
https://www.db4free.net/signup.php?confirm=...
```

Clique sur ce lien pour activer ton compte.

✅ **Compte activé !**

---

## 🎯 **ÉTAPE 4 : Noter les Informations de Connexion**

Une fois le compte créé, tu recevras un email avec :

```
┌─────────────────────────────────────────────────────┐
│ Your db4free.net Account Details                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Database name : tech_info_plus                      │
│ Username      : ton_username                        │
│ Password      : ton_mot_de_passe                    │
│ Server        : db4free.net                         │
│ Port          : 3306                                │
│                                                      │
│ phpMyAdmin    : https://www.db4free.net/phpMyAdmin  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**⚠️ NOTE CES INFORMATIONS !** Tu en auras besoin pour le fichier `.env`

---

## 🎯 **ÉTAPE 5 : Tester la Connexion**

### Via phpMyAdmin :

1. Va sur **https://www.db4free.net/phpMyAdmin**
2. Entre :
   - **Username** : ton_username
   - **Password** : ton_mot_de_passe
3. Clique sur **"Go"**

✅ **Si tu arrives sur phpMyAdmin, c'est bon !**

### Via le terminal (pour vérifier depuis PythonAnywhere) :

```bash
mysql -h db4free.net -u ton_username -p tech_info_plus
```

Entre ton mot de passe quand demandé.

---

## 🎯 **ÉTAPE 6 : Créer le Fichier .env**

### Sur PythonAnywhere, dans la console Bash :

```bash
cd ~/tech_info_plus/backend
nano .env
```

### Colle cette configuration :

```env
MYSQL_HOST=db4free.net
MYSQL_USER=ton_username
MYSQL_PASSWORD=ton_mot_de_passe
MYSQL_DATABASE=tech_info_plus
MYSQL_PORT=3306
```

**⚠️ Remplace par TES vraies valeurs !**

**Exemple concret :**
```env
MYSQL_HOST=db4free.net
MYSQL_USER=rosny_minko
MYSQL_PASSWORD=MonMotDePasse123!
MYSQL_DATABASE=tech_info_plus
MYSQL_PORT=3306
```

### Sauvegarder :
- **Ctrl+O** → Entrée → **Ctrl+X**

✅ **Configuration terminée !**

---

## 🎯 **ÉTAPE 7 : Tester la Connexion depuis PythonAnywhere**

### Créer un script de test :

```bash
cd ~/tech_info_plus/backend
nano test_db4free.py
```

### Coller ce code :

```python
import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 60)
print("🔍 TEST DE CONNEXION À DB4FREE.NET")
print("=" * 60)

host = os.getenv('MYSQL_HOST')
user = os.getenv('MYSQL_USER')
password = os.getenv('MYSQL_PASSWORD')
database = os.getenv('MYSQL_DATABASE')
port = int(os.getenv('MYSQL_PORT', 3306))

print(f"\nHost     : {host}")
print(f"User     : {user}")
print(f"Database : {database}")
print(f"Port     : {port}")

print("\n🔄 Connexion en cours...")

try:
    connection = pymysql.connect(
        host=host,
        user=user,
        password=password,
        database=database,
        port=port,
        connect_timeout=10
    )
    
    print("✅ CONNEXION RÉUSSIE !")
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()[0]
        print(f"\n📊 MySQL Version : {version}")
    
    connection.close()
    print("\n" + "=" * 60)
    print("✅ TEST TERMINÉ AVEC SUCCÈS !")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ ERREUR : {e}")
```

### Sauvegarder et exécuter :

```bash
python3.10 test_db4free.py
```

✅ **Si tu vois "CONNEXION RÉUSSIE", c'est parfait !**

---

## 📋 **RÉCAPITULATIF DES INFORMATIONS**

| Paramètre | Valeur |
|-----------|--------|
| **Host** | `db4free.net` |
| **Port** | `3306` |
| **Database** | `tech_info_plus` (ou le nom que tu as choisi) |
| **Username** | Ton username |
| **Password** | Ton mot de passe |
| **phpMyAdmin** | https://www.db4free.net/phpMyAdmin |

---

## ❓ **PROBLÈMES COURANTS**

### 🔴 "Database name already exists"

**Solution :** Le nom `tech_info_plus` est déjà pris. Essaie :
- `tech_info_2025`
- `techinfo_db`
- `rosny_techinfo`

### 🔴 "Username already exists"

**Solution :** Choisis un autre username, ajoute des chiffres ou ton nom.

### 🔴 "Can't connect to MySQL server"

**Solutions :**
1. Vérifie que tu as bien confirmé ton email
2. Attends 5-10 minutes après l'inscription
3. Vérifie que le host est bien `db4free.net` (sans `www`)

### 🔴 "Access denied"

**Solution :** Vérifie que :
- Le username est correct
- Le mot de passe est correct
- Tu utilises le bon nom de base

---

## 🚀 **PROCHAINES ÉTAPES**

Une fois la connexion testée avec succès :

1. ✅ La base MySQL est prête
2. ✅ Le fichier `.env` est configuré
3. ✅ On peut créer l'application Web sur PythonAnywhere
4. ✅ FastAPI créera automatiquement toutes les tables !

---

## 💡 **AVANTAGES DE DB4FREE.NET**

- ✅ Totalement **gratuit**
- ✅ Pas de limite de temps
- ✅ 200 MB d'espace (largement suffisant pour nos tests)
- ✅ MySQL dernière version
- ✅ phpMyAdmin inclus
- ✅ Accessible depuis n'importe où (y compris PythonAnywhere)

---

**Dis-moi quand tu as créé le compte et testé la connexion !** 😊

