# 🔍 Vérifier que MySQL Fonctionne sur PythonAnywhere

---

## 🎯 **MÉTHODE 1 : Test de Connexion MySQL (Rapide)**

### Dans la console Bash de PythonAnywhere :

```bash
mysql -h TON-USERNAME.mysql.pythonanywhere-services.com -u TON-USERNAME -p
```

**Remplace `TON-USERNAME` par ton vrai username !**

**Exemple :**
```bash
mysql -h rosnyminko.mysql.pythonanywhere-services.com -u rosnyminko -p
```

### Quand il demande le mot de passe :
- Tape ton **mot de passe MySQL** (celui que tu as défini)
- Appuie sur **Entrée**

### ✅ Si ça marche, tu verras :
```
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 12345
Server version: 5.7.x MySQL Community Server

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

mysql>
```

### Vérifier que la base existe :
```sql
SHOW DATABASES;
```

**Tu devrais voir :**
```
+-----------------------------+
| Database                    |
+-----------------------------+
| information_schema          |
| TON-USERNAME$tech_info_plus |
+-----------------------------+
```

### Utiliser la base :
```sql
USE TON-USERNAME$tech_info_plus;
```

**Exemple :**
```sql
USE rosnyminko$tech_info_plus;
```

### Vérifier les tables (si elles existent) :
```sql
SHOW TABLES;
```

### Quitter MySQL :
```sql
exit;
```

---

## 🎯 **MÉTHODE 2 : Test avec Python (Plus Complet)**

### Créer un script de test :

```bash
cd ~/tech_info_plus/backend
nano test_mysql.py
```

### Colle ce code :

```python
#!/usr/bin/env python3
import pymysql
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

print("=" * 60)
print("🔍 TEST DE CONNEXION MYSQL")
print("=" * 60)

# Récupérer les informations de connexion
host = os.getenv('MYSQL_HOST')
user = os.getenv('MYSQL_USER')
password = os.getenv('MYSQL_PASSWORD')
database = os.getenv('MYSQL_DATABASE')
port = int(os.getenv('MYSQL_PORT', 3306))

print(f"\n📝 Informations de connexion :")
print(f"   Host     : {host}")
print(f"   User     : {user}")
print(f"   Database : {database}")
print(f"   Port     : {port}")
print(f"   Password : {'*' * len(password) if password else 'NON DÉFINI'}")

print("\n🔄 Tentative de connexion...")

try:
    # Connexion à MySQL
    connection = pymysql.connect(
        host=host,
        user=user,
        password=password,
        database=database,
        port=port,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
    
    print("✅ CONNEXION RÉUSSIE !")
    
    # Tester une requête
    with connection.cursor() as cursor:
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()
        print(f"\n📊 Version MySQL : {version['VERSION()']}")
        
        cursor.execute("SELECT DATABASE()")
        db = cursor.fetchone()
        print(f"📊 Base actuelle : {db['DATABASE()']}")
        
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print(f"\n📋 Tables dans la base ({len(tables)}) :")
        if tables:
            for table in tables:
                table_name = list(table.values())[0]
                print(f"   ✅ {table_name}")
        else:
            print("   ⚠️  Aucune table (c'est normal si c'est une nouvelle base)")
    
    connection.close()
    print("\n" + "=" * 60)
    print("✅ TEST TERMINÉ AVEC SUCCÈS !")
    print("=" * 60)
    
except pymysql.err.OperationalError as e:
    print(f"\n❌ ERREUR DE CONNEXION :")
    print(f"   {e}")
    print("\n🔧 Vérifications à faire :")
    print("   1. Le mot de passe MySQL est-il correct ?")
    print("   2. Le host est-il correct ?")
    print("   3. La base de données existe-t-elle ?")
    print("   4. Le fichier .env est-il bien configuré ?")
    
except Exception as e:
    print(f"\n❌ ERREUR INATTENDUE :")
    print(f"   {e}")
```

### Sauvegarder et quitter :
- **Ctrl+O** → Entrée → **Ctrl+X**

### Exécuter le test :
```bash
python3.10 test_mysql.py
```

### ✅ Si tout fonctionne, tu verras :
```
============================================================
🔍 TEST DE CONNEXION MYSQL
============================================================

📝 Informations de connexion :
   Host     : rosnyminko.mysql.pythonanywhere-services.com
   User     : rosnyminko
   Database : rosnyminko$tech_info_plus
   Port     : 3306
   Password : ********

🔄 Tentative de connexion...
✅ CONNEXION RÉUSSIE !

📊 Version MySQL : 5.7.44
📊 Base actuelle : rosnyminko$tech_info_plus

📋 Tables dans la base (0) :
   ⚠️  Aucune table (c'est normal si c'est une nouvelle base)

============================================================
✅ TEST TERMINÉ AVEC SUCCÈS !
============================================================
```

---

## 🎯 **MÉTHODE 3 : Vérifier depuis l'Interface PythonAnywhere**

### 1. Va dans l'onglet "Databases"
- Tu devrais voir ta base : `TON-USERNAME$tech_info_plus`

### 2. Clique sur "Start a console on this database"
- Ça ouvre une console MySQL directement connectée à ta base

### 3. Tu peux taper des commandes SQL :
```sql
SHOW TABLES;
SELECT DATABASE();
```

---

## 🎯 **MÉTHODE 4 : Test Rapide avec SQLAlchemy**

### Créer un script de test SQLAlchemy :

```bash
cd ~/tech_info_plus/backend
nano test_sqlalchemy.py
```

### Colle ce code :

```python
#!/usr/bin/env python3
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

print("🔍 Test de connexion avec SQLAlchemy...")

# Créer l'URL de connexion
host = os.getenv('MYSQL_HOST')
user = os.getenv('MYSQL_USER')
password = os.getenv('MYSQL_PASSWORD')
database = os.getenv('MYSQL_DATABASE')

DATABASE_URL = f"mysql+pymysql://{user}:{password}@{host}/{database}"

try:
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as connection:
        result = connection.execute(text("SELECT VERSION()"))
        version = result.fetchone()[0]
        print(f"✅ Connexion SQLAlchemy OK !")
        print(f"📊 Version MySQL : {version}")
        
except Exception as e:
    print(f"❌ Erreur : {e}")
```

### Exécuter :
```bash
python3.10 test_sqlalchemy.py
```

---

## 📋 **RÉCAPITULATIF DES TESTS**

| Méthode | Commande | Vérifie |
|---------|----------|---------|
| **1. MySQL direct** | `mysql -h ... -u ... -p` | Connexion MySQL brute |
| **2. Script Python** | `python3.10 test_mysql.py` | PyMySQL + .env |
| **3. Interface Web** | Databases → Console | Interface graphique |
| **4. SQLAlchemy** | `python3.10 test_sqlalchemy.py` | ORM SQLAlchemy |

---

## ❓ **PROBLÈMES COURANTS**

### 🔴 "Access denied for user"

**Causes possibles :**
- Mot de passe incorrect
- Username incorrect
- Host incorrect

**Solution :**
```bash
# Vérifier le fichier .env
cat ~/tech_info_plus/backend/.env
```

### 🔴 "Can't connect to MySQL server"

**Causes possibles :**
- Host incorrect (doit contenir `.mysql.pythonanywhere-services.com`)
- MySQL pas initialisé sur PythonAnywhere

**Solution :**
- Va dans "Databases" sur PythonAnywhere
- Vérifie que MySQL est bien initialisé

### 🔴 "Unknown database"

**Causes possibles :**
- La base n'existe pas
- Nom de base incorrect (oubli du `$`)

**Solution :**
```bash
# Vérifier les bases existantes
mysql -h TON-USERNAME.mysql.pythonanywhere-services.com -u TON-USERNAME -p -e "SHOW DATABASES;"
```

### 🔴 "No module named 'pymysql'"

**Solution :**
```bash
pip3.10 install --user pymysql
```

---

## 🚀 **COMMANDES RAPIDES À COPIER-COLLER**

### Test MySQL direct :
```bash
mysql -h TON-USERNAME.mysql.pythonanywhere-services.com -u TON-USERNAME -p
```

### Créer et exécuter le script de test :
```bash
cd ~/tech_info_plus/backend
cat > test_mysql.py << 'EOF'
import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

try:
    connection = pymysql.connect(
        host=os.getenv('MYSQL_HOST'),
        user=os.getenv('MYSQL_USER'),
        password=os.getenv('MYSQL_PASSWORD'),
        database=os.getenv('MYSQL_DATABASE'),
        port=int(os.getenv('MYSQL_PORT', 3306))
    )
    print("✅ CONNEXION MYSQL OK !")
    connection.close()
except Exception as e:
    print(f"❌ ERREUR : {e}")
EOF

python3.10 test_mysql.py
```

---

## ✅ **Si tous les tests passent :**

Tu es prêt pour :
1. ✅ Créer l'application Web
2. ✅ Configurer le WSGI
3. ✅ Lancer l'application !

**Dis-moi le résultat des tests !** 😊

