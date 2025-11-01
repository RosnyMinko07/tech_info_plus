# 🔄 Migration vers PostgreSQL - Supabase

---

## ❌ PROBLÈME

- **Supabase** = PostgreSQL (pas MySQL)
- **Votre projet** = Configuré pour MySQL
- **Incompatibilité** !

---

## ✅ SOLUTION

**Migrer vers PostgreSQL** pour utiliser Supabase.

---

## 🔧 ÉTAPES DE MIGRATION

### ÉTAPE 1 : Modifier les requirements.txt

**Fichier** : `backend/requirements.txt`

**Ajoutez** :
```bash
psycopg2-binary>=2.9.9
```

**Supprimez** :
```bash
pymysql>=1.1.0  # Pas besoin pour PostgreSQL
```

---

### ÉTAPE 2 : Modifier database_mysql.py → database.py

**Renommez** : `backend/database_mysql.py` → `backend/database.py`

**Changez** :
- Tous les imports
- Ligne 25 : `DATABASE_URL`

**De** :
```python
DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}?charset=utf8mb4"
```

**Vers** :
```python
DATABASE_URL = os.getenv('DATABASE_URL', f"postgresql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}")
```

---

### ÉTAPE 3 : Variables d'environnement Render

**Sur Render**, configurez :

```bash
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.cerxxxswrodgutarejit.supabase.co:5432/postgres
```

**OU séparément** :

```bash
MYSQL_HOST=db.cerxxxswrodgutarejit.supabase.co
MYSQL_PORT=5432
MYSQL_USER=postgres
MYSQL_PASSWORD=[YOUR_PASSWORD]
MYSQL_DATABASE=postgres
```

⚠️ **ATTENTION** : Le port est **5432** (PostgreSQL), pas 3306 (MySQL) !

---

### ÉTAPE 4 : Modifier tous les imports

**Cherchez** tous les fichiers qui importent `database_mysql` :

```bash
from database_mysql import ...
```

**Remplacez** par :
```bash
from database import ...
```

---

## ⚠️ COMPATIBILITÉ SQLAlchemy

**Bonne nouvelle** : SQLAlchemy supporte PostgreSQL nativement !

- ✅ Les modèles sont **compatibles**
- ✅ Les colonnes sont **compatibles**
- ✅ Les relations sont **compatibles**

**Presque rien à changer dans le code !**

---

## 🎯 COMMANDES GIT

Après modifications :

```bash
git add .
git commit -m "Migration vers PostgreSQL pour Supabase"
git push
```

---

## ⚠️ ALTERNATIVE : Créer une base MySQL

Si vous ne voulez PAS migrer vers PostgreSQL :

1. Créez une base MySQL gratuite sur **PlanetScale** ou **Railway**
2. Configurez ces credentials sur Render
3. Gardez votre code MySQL actuel

---

## ✅ RÉSUMÉ

- **PostgreSQL** = Supabase
- **MySQL** = Necessite une autre base
- **Migration** = Changer database_mysql.py et les imports

---

🚀 **Je peux faire la migration pour vous si vous voulez !**

