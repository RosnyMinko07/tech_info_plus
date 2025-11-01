# 🔴 FIX : Erreur CORS 500 - Backend ne démarre pas

---

## ❌ ERREUR ACTUELLE

```
Status code: 500
CORS Missing Allow Origin
Network Error
```

**Causes** : Le backend Render renvoie une erreur 500 = **Il ne démarre pas correctement !**

---

## ✅ SOLUTION

Le backend ne démarre PAS parce que **MySQL Supabase n'est pas configuré** !

---

## 🔧 VÉRIFIER LES LOGS RENDER

**C'est LA priorité !**

1. Allez sur **https://dashboard.render.com**
2. Cliquez sur votre service backend **`tech-info-plus`**
3. Cliquez sur **"Logs"** (à gauche ou en haut)

**Vous devriez voir** :

```
❌ ERREUR: Impossible de se connecter à MySQL
❌ Erreur connexion MySQL : ...
```

---

## 🎯 FIX : Configurer MySQL Supabase sur Render

### ÉTAPE 1 : Vérifier les variables d'environnement

Sur Render → Votre service → **Environment**

**Vérifiez que vous avez** :

```bash
MYSQL_HOST=db.xxxxx.supabase.co
MYSQL_PORT=3306
MYSQL_USER=postgres.xxxxx
MYSQL_PASSWORD=votre_password
MYSQL_DATABASE=postgres
```

⚠️ **Replacez par vos VRAIES valeurs de Supabase !**

---

### ÉTAPE 2 : Récupérer les bonnes valeurs Supabase

1. Allez sur **https://supabase.com/dashboard**
2. Votre projet → **Settings** → **Database**
3. Cherchez **"Connection string"** ou **"Connection pooling"**
4. **Copiez** :
   - Host
   - Port
   - Database
   - User
   - Password

---

### ÉTAPE 3 : Mettre à jour sur Render

1. Sur Render → **Environment Variables**
2. **Modifiez** les 5 variables MySQL
3. **Cliquez "Save Changes"** (ou "Save")
4. **Redéployez** : "Manual Deploy" → "Deploy latest commit"

---

## 🔍 VÉRIFICATIONS

### 1. Logs après redéploiement

Vous devriez voir :

```
✅ Connexion MySQL réussie !
✅ Migration terminée avec succès !
✅ Serveur API prêt!
```

**Si vous voyez encore des erreurs MySQL** → Les credentials sont incorrects ❌

---

### 2. Test URL

**Testez** :
```
https://tech-info-plus.onrender.com/docs
```

**Si ça marche** → Backend OK ✅  
**Si 500 ou erreur** → MySQL mal configuré ❌

---

### 3. Test login après

Une fois le backend OK :
1. Ouvrez votre app Vercel
2. Essayez de vous connecter
3. **Ça devrait marcher !** ✅

---

## ❗ ERREURS COMMUNES

### Erreur : "Access denied"

**Cause** : Mauvais user/password

**Fix** : Vérifiez les credentials Supabase

---

### Erreur : "Can't connect to host"

**Cause** : Mauvais host ou port

**Fix** : 
- Utilisez le host du **Connection Pooler** (parfois différent)
- Vérifiez le port (généralement 3306 ou 6543)

---

### Erreur : "Unknown database"

**Cause** : Mauvaise base de données

**Fix** : Vérifiez le nom de la database (généralement `postgres` sur Supabase)

---

## 📝 CHECKLIST FIX

- [ ] Logs Render affichent l'erreur exacte
- [ ] Toutes les 5 variables MySQL sont configurées
- [ ] Les credentials Supabase sont corrects
- [ ] Render redéployé après modification
- [ ] Logs montrent "Connexion MySQL réussie"
- [ ] `/docs` fonctionne
- [ ] Test login fonctionne

---

## 💡 AIDE

**Copiez-moi les logs Render** après le redéploiement, je vous dirai exactement ce qui ne va pas !

**Fichier** : Render → Service → Logs → Copiez les 50 dernières lignes

---

🚀 **Une fois MySQL configuré = Tout marchera !**

