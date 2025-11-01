# 🔗 Lier Supabase MySQL à Render - Guide Étape par Étape

## 📋 Ce que VOUS devez faire :

---

### ÉTAPE 1 : Récupérer les credentials MySQL sur Supabase

1. **Allez sur** https://supabase.com/dashboard
2. **Sélectionnez votre projet** Tech Info Plus
3. **Settings** (⚙️ en bas à gauche)
4. **Database** → Section **"Connection info"** ou **"Connection string"**
5. **Cherchez "Connection string"** ou **"Pooler"** (section MySQL)

Vous verrez quelque chose comme :

```
mysql://user.abc123:password@db.abc123.supabase.co:3306/postgres
```

**OU vous verrez séparément :**
- Host: `db.xxxxx.supabase.co`
- Port: `3306` ou `6543`
- Database: `postgres` (ou autre nom)
- User: `postgres.xxxxx`
- Password: `votre_password_secret`

---

### ÉTAPE 2 : Configurer Render avec ces credentials

1. **Allez sur** https://dashboard.render.com
2. Si vous n'avez pas encore créé le service, cliquez **"New +"** → **"Web Service"**
3. **Connectez** le repository `tech_info_plus`
4. Configurez les paramètres :
   ```
   Name: tech-info-plus-backend
   Region: Oregon (ou celui que vous voulez)
   Branch: main
   Root Directory: backend
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn app:app --host 0.0.0.0 --port $PORT
   Instance Type: Free
   ```

5. **Avant de cliquer "Create"**, descendez à **"Environment"** ou **"Environment Variables"**

6. **Ajoutez ces variables** (avec VOS vraies valeurs de Supabase) :

   ```bash
   Key: MYSQL_HOST
   Value: db.xxxxx.supabase.co
   
   Key: MYSQL_PORT
   Value: 3306
   
   Key: MYSQL_USER
   Value: postgres.xxxxx
   
   Key: MYSQL_PASSWORD
   Value: votre_password_secret
   
   Key: MYSQL_DATABASE
   Value: postgres
   
   Key: ENVIRONMENT
   Value: production
   ```

7. **Cliquez "Create Web Service"** ou "Save Changes"

---

### ÉTAPE 3 : Vérifier le déploiement

1. **Attendez 5-10 minutes** que Render build et déploie
2. **Vérifiez les logs** → Vous devriez voir :
   ```
   ✅ Connexion MySQL réussie !
   ✅ Migration terminée avec succès !
   ✅ Serveur API prêt!
   ```

3. **Testez votre backend** :
   - URL principale : `https://tech-info-plus-backend.onrender.com`
   - API Docs : `https://tech-info-plus-backend.onrender.com/docs`

---

## ❗ Si ça ne marche pas :

### Problème : "Can't connect to MySQL"

**Solutions :**

1. **Vérifiez que le host est correct** :
   - Utilisez le host de la **section "Connection Pooling"** si disponible
   - Parfois c'est `pooler.supabase.com` au lieu de `db.xxx.supabase.co`

2. **Vérifiez le port** :
   - MySQL standard : `3306`
   - Si vous utilisez pooler : `6543`

3. **Vérifiez le firewall Supabase** :
   - Settings → Database → Connection Pooling
   - Assurez-vous que les connexions externes sont autorisées

### Problème : "Access denied"

**Solutions :**

1. Vérifiez que `MYSQL_USER` et `MYSQL_PASSWORD` sont corrects
2. Essayez de réinitialiser le mot de passe dans Settings → Database → Reset password

---

## 📞 Besoin d'aide ?

**Donnez-moi :**
1. Ce que vous voyez dans Supabase (masquez les mots de passe)
2. Les erreurs que vous obtenez dans les logs Render
3. Une capture d'écran (en privé)

**Je ne peux PAS :**
- Accéder à vos comptes Supabase ou Render
- Créer le service à votre place
- Voir vos credentials

---

🚀 **Une fois configuré, votre backend sera en ligne !**

