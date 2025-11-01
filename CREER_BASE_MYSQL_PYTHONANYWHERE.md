# 🔧 Créer la Base de Données MySQL sur PythonAnywhere

---

## 🎯 **MÉTHODE 1 : Via l'Interface Web (LE PLUS SIMPLE)**

### Étape 1 : Quitter le terminal MySQL

Si tu es dans le terminal MySQL, tape :
```sql
exit;
```

### Étape 2 : Aller dans l'onglet Databases

1. Sur PythonAnywhere, clique sur **"Databases"** (dans le menu en haut)
2. Tu vas voir une page avec MySQL

### Étape 3 : Créer la base de données

1. Cherche la section **"Create a new database"**
2. Dans le champ texte, tape :
   ```
   tech_info_plus
   ```
3. Clique sur le bouton **"Create"**

✅ **Base créée !**

### Étape 4 : Vérifier que la base existe

Tu devrais maintenant voir dans la liste :
```
TON-USERNAME$tech_info_plus
```

**Exemple :**
Si ton username est `rosnyminko`, tu verras :
```
rosnyminko$tech_info_plus
```

---

## 🎯 **MÉTHODE 2 : Via le Terminal MySQL**

Si tu préfères créer la base en ligne de commande :

### Étape 1 : Se connecter à MySQL (sans spécifier de base)

```bash
mysql -h TON-USERNAME.mysql.pythonanywhere-services.com -u TON-USERNAME -p
```

Entre ton mot de passe MySQL.

### Étape 2 : Créer la base de données

```sql
CREATE DATABASE IF NOT EXISTS `TON-USERNAME$tech_info_plus` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**⚠️ IMPORTANT : Remplace `TON-USERNAME` par ton vrai username !**

**Exemple :**
```sql
CREATE DATABASE IF NOT EXISTS `rosnyminko$tech_info_plus` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Étape 3 : Vérifier que la base existe

```sql
SHOW DATABASES;
```

Tu devrais voir :
```
+-----------------------------+
| Database                    |
+-----------------------------+
| information_schema          |
| TON-USERNAME$tech_info_plus |
+-----------------------------+
```

### Étape 4 : Utiliser la base

```sql
USE `TON-USERNAME$tech_info_plus`;
```

**Exemple :**
```sql
USE `rosnyminko$tech_info_plus`;
```

Tu devrais voir :
```
Database changed
```

### Étape 5 : Vérifier qu'elle est vide (c'est normal)

```sql
SHOW TABLES;
```

Tu devrais voir :
```
Empty set (0.00 sec)
```

✅ **C'est normal ! Les tables seront créées par FastAPI.**

### Étape 6 : Quitter MySQL

```sql
exit;
```

---

## 🎯 **MÉTHODE 3 : Via la Console Bash**

Tu peux aussi créer la base directement depuis Bash :

```bash
mysql -h TON-USERNAME.mysql.pythonanywhere-services.com -u TON-USERNAME -p -e "CREATE DATABASE IF NOT EXISTS \`TON-USERNAME\\\$tech_info_plus\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

**⚠️ Note les échappements pour le `$` !**

---

## ❓ **PROBLÈMES COURANTS**

### 🔴 "Database name is invalid"

**Cause :** Le nom contient des caractères spéciaux mal échappés.

**Solution :** Utilise la Méthode 1 (interface web), c'est plus simple !

### 🔴 "Access denied"

**Cause :** Tu n'as pas les droits de créer des bases.

**Solution :** Sur PythonAnywhere gratuit, tu ne peux créer des bases QUE via l'interface web (Méthode 1).

### 🔴 Je ne vois pas "Create a new database"

**Cause :** MySQL n'est peut-être pas initialisé.

**Solution :**
1. Va dans "Databases"
2. Si tu vois "MySQL is not enabled", définis un mot de passe
3. Clique sur "Initialize MySQL"

---

## 📋 **RÉCAPITULATIF**

| Étape | Action | Commande/Méthode |
|-------|--------|------------------|
| 1 | Aller dans Databases | Interface web |
| 2 | Créer la base | Tape `tech_info_plus` → Create |
| 3 | Vérifier | Tu devrais voir `USERNAME$tech_info_plus` |

---

## 🚀 **APRÈS LA CRÉATION**

Une fois la base créée, tu dois :

1. ✅ Noter les informations de connexion
2. ✅ Créer le fichier `.env`
3. ✅ Créer l'application Web
4. ✅ Les tables seront créées automatiquement par FastAPI

---

## 💡 **CONSEIL**

**Utilise la Méthode 1 (interface web)** - c'est le plus simple et le plus fiable sur PythonAnywhere gratuit !

---

**Dis-moi quand tu as créé la base !** 😊

