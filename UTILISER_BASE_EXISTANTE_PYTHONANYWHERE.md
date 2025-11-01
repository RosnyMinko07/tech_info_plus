# 🔧 Utiliser la Base de Données Existante sur PythonAnywhere

---

## 💡 **COMPRENDRE LA LIMITATION**

Sur le compte **gratuit** de PythonAnywhere :
- ✅ Tu peux créer **1 seule base de données MySQL**
- ❌ Tu ne peux pas en créer d'autres

**Mais ce n'est pas un problème !** On va utiliser la base existante ! 😊

---

## 🎯 **SOLUTION : Utiliser la Base Existante**

### Étape 1 : Identifier ta base existante

1. Va dans **"Databases"** sur PythonAnywhere
2. Tu vas voir une base déjà créée, probablement :
   ```
   TON-USERNAME$default
   ```
   ou
   ```
   TON-USERNAME$NOM-DE-BASE
   ```

**Note le nom exact de cette base !**

---

## 🎯 **OPTION A : Renommer la Base (Recommandé)**

### Via l'interface web :

Malheureusement, PythonAnywhere ne permet pas de renommer directement.

**Mais on peut utiliser la base existante avec son nom actuel !**

---

## 🎯 **OPTION B : Utiliser la Base Existante Telle Quelle**

### Étape 1 : Noter le nom de ta base

**Exemple de noms possibles :**
- `rosnyminko$default`
- `rosnyminko$mydb`
- `rosnyminko$tech_info`

### Étape 2 : Vider la base (si elle contient des données)

#### **Via le terminal MySQL :**

```bash
mysql -h TON-USERNAME.mysql.pythonanywhere-services.com -u TON-USERNAME -p
```

Entre ton mot de passe MySQL.

#### **Lister les bases :**
```sql
SHOW DATABASES;
```

#### **Utiliser ta base existante :**
```sql
USE `TON-USERNAME$NOM-DE-TA-BASE`;
```

**Exemple :**
```sql
USE `rosnyminko$default`;
```

#### **Voir les tables existantes :**
```sql
SHOW TABLES;
```

#### **Supprimer toutes les tables (si nécessaire) :**

Si tu veux partir d'une base propre, supprime les tables une par une :

```sql
DROP TABLE IF EXISTS nom_table1;
DROP TABLE IF EXISTS nom_table2;
-- etc.
```

**OU supprime toutes les tables d'un coup :**

```sql
SET FOREIGN_KEY_CHECKS = 0;

-- Liste toutes les tables et génère les DROP
SELECT CONCAT('DROP TABLE IF EXISTS `', table_name, '`;')
FROM information_schema.tables
WHERE table_schema = DATABASE();

SET FOREIGN_KEY_CHECKS = 1;
```

Copie les commandes `DROP TABLE` générées et exécute-les.

#### **Vérifier que la base est vide :**
```sql
SHOW TABLES;
```

Tu devrais voir :
```
Empty set (0.00 sec)
```

✅ **Base prête à être utilisée !**

---

## 🎯 **OPTION C : Utiliser un Autre Service MySQL Gratuit**

Si tu veux vraiment une nouvelle base, tu peux utiliser un service externe :

### **1. FreeMySQLHosting.net**
- ✅ Gratuit
- ✅ 5 MB d'espace
- 🔗 https://www.freemysqlhosting.net

### **2. db4free.net**
- ✅ Gratuit
- ✅ 200 MB d'espace
- 🔗 https://www.db4free.net

### **3. RemoteMySQL**
- ✅ Gratuit
- ✅ Illimité (avec limitations de performance)
- 🔗 https://remotemysql.com

**Ensuite, tu utiliseras les informations de connexion de ce service dans ton `.env`.**

---

## 🎯 **OPTION D : Upgrade PythonAnywhere (Payant)**

Si tu veux plus de bases de données :

- **Plan "Hacker"** : $5/mois
  - 2 bases MySQL
  - Plus de CPU
  - Plus d'espace

🔗 https://www.pythonanywhere.com/pricing/

---

## 📝 **RECOMMANDATION : Utiliser la Base Existante**

**Je te recommande l'Option B** (utiliser la base existante) car :

✅ **Gratuit**  
✅ **Rapide**  
✅ **Déjà configuré**  
✅ **Pas besoin de service externe**

Il suffit de :
1. Vider la base si elle contient des données
2. Utiliser son nom dans le fichier `.env`

---

## 🔧 **CRÉER LE FICHIER .env avec la Base Existante**

### Étape 1 : Noter les informations

```
Host     : TON-USERNAME.mysql.pythonanywhere-services.com
Database : TON-USERNAME$NOM-DE-TA-BASE-EXISTANTE
User     : TON-USERNAME
Password : [ton mot de passe MySQL]
Port     : 3306
```

**Exemple :**
```
Host     : rosnyminko.mysql.pythonanywhere-services.com
Database : rosnyminko$default
User     : rosnyminko
Password : MonMotDePasse123!
Port     : 3306
```

### Étape 2 : Créer le fichier .env

```bash
cd ~/tech_info_plus/backend
nano .env
```

### Étape 3 : Coller la configuration

```env
MYSQL_HOST=TON-USERNAME.mysql.pythonanywhere-services.com
MYSQL_USER=TON-USERNAME
MYSQL_PASSWORD=ton_mot_de_passe_mysql
MYSQL_DATABASE=TON-USERNAME$NOM-DE-TA-BASE-EXISTANTE
MYSQL_PORT=3306
```

**Exemple concret :**
```env
MYSQL_HOST=rosnyminko.mysql.pythonanywhere-services.com
MYSQL_USER=rosnyminko
MYSQL_PASSWORD=MonMotDePasse123!
MYSQL_DATABASE=rosnyminko$default
MYSQL_PORT=3306
```

### Étape 4 : Sauvegarder
- **Ctrl+O** → Entrée → **Ctrl+X**

✅ **Configuration terminée !**

---

## 🚀 **PROCHAINES ÉTAPES**

Une fois le fichier `.env` créé avec la bonne base :

1. ✅ Créer l'application Web
2. ✅ Configurer le WSGI
3. ✅ FastAPI créera automatiquement toutes les tables !

---

## 💬 **Quelle option tu choisis ?**

**A)** Utiliser la base existante (je te guide pour la vider)  
**B)** Utiliser un service MySQL externe gratuit  
**C)** Upgrade PythonAnywhere (payant)

**Dis-moi et on continue !** 😊

