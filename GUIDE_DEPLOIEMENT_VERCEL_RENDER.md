# 🚀 Guide Déploiement - Frontend Vercel + Backend Render

Déploiement de **Tech Info Plus** :
- **Frontend** : Vercel
- **Backend** : Render (déjà déployé ✅)

---

## 📋 Prérequis

- ✅ Compte Vercel : https://vercel.com
- ✅ Backend déjà déployé sur Render
- ✅ URL du backend Render (ex: `https://tech-info-plus-backend.onrender.com`)
- ✅ Repository GitHub à jour

---

## 🌐 Déploiement Frontend sur Vercel

### Étape 1 : Créer le Projet sur Vercel

1. **Allez sur** https://vercel.com
2. **Login** avec votre compte GitHub
3. Cliquez **"Add New..."** → **"Project"**
4. Sélectionnez le repository **`RosnyMinko07/tech_info_plus`**

### Étape 2 : Configuration du Build

Vercel va détecter automatiquement React, mais configurez :

**Framework Preset** : `Create React App`

**Root Directory** : `frontend`

**Build Command** : `npm run build` (automatique)

**Output Directory** : `build` (automatique)

---

### Étape 3 : Variables d'Environnement

⚠️ **IMPORTANT** : Avant de déployer, ajoutez la variable d'environnement !

Dans la section **"Environment Variables"**, cliquez **"Add"** :

```
Key: REACT_APP_API_URL
Value: https://tech-info-plus-backend.onrender.com
```

⚠️ **Remplacez par votre vraie URL Render !**

---

### Étape 4 : Déployer

1. Cliquez **"Deploy"**
2. Attendez 2-3 minutes
3. Vercel va builder votre frontend
4. **Votre URL** : `https://tech-info-plus.vercel.app`

---

## ⚙️ Configuration Automatique

Le fichier `vercel.json` à la racine configure automatiquement :
- ✅ Redirections SPA (toutes les routes → index.html)
- ✅ Cache des assets statiques
- ✅ Headers de sécurité

---

## 🔗 Lier Vercel au Backend Render

### Après le déploiement Vercel

Vous devez mettre à jour votre backend Render pour autoriser CORS depuis Vercel :

1. **Retournez sur Render** : https://dashboard.render.com
2. **Allez** sur votre service backend
3. **Environment** → Ajoutez/modifiez :

   ```
   Key: FRONTEND_URL
   Value: https://tech-info-plus.vercel.app
   ```

4. **Cliquez "Save Changes"** (ça va redéployer automatiquement)

---

## ✅ Vérification Finale

### 1. Testez le Backend

```
https://tech-info-plus-backend.onrender.com/docs
```

Vous devriez voir la documentation Swagger de l'API.

### 2. Testez le Frontend

```
https://tech-info-plus.vercel.app
```

Vous devriez voir la page de connexion.

### 3. Testez la Connexion

Connectez-vous avec :
- **Username** : `admin`
- **Password** : `admin`

---

## 🐛 Dépannage

### Problème : "Network Error" ou "Cannot connect to backend"

**Solution** :

1. Vérifiez que `REACT_APP_API_URL` est bien configuré sur Vercel
2. Ouvrez la console du navigateur (F12) → Vérifiez les erreurs
3. Testez l'URL du backend dans un navigateur : `https://backend.onrender.com/docs`

### Problème : CORS Error

**Solution** :

1. Vérifiez que `FRONTEND_URL` est bien configuré sur Render
2. Redéployez le backend sur Render (Manual Deploy)
3. Vérifiez les logs Render pour voir si le démarrage est OK

### Problème : Frontend charge mais reste en loading

**Solution** :

1. Vérifiez les logs Vercel → Deploy logs
2. Vérifiez que le build s'est terminé sans erreur
3. Vérifiez la console du navigateur pour les erreurs JavaScript

### Problème : Render en veille (15 min d'inactivité)

**Solution** :

- C'est normal pour le plan gratuit
- Le premier démarrage prend 30-60 secondes
- Pour éviter ça, utilisez un service de wake-up ou passez au plan payant

---

## 📝 Configuration Finale

### URLs Finales

```
Frontend : https://tech-info-plus.vercel.app
Backend  : https://tech-info-plus-backend.onrender.com
API Docs : https://tech-info-plus-backend.onrender.com/docs
```

### Variables d'Environnement

**Sur Vercel** :
```
REACT_APP_API_URL=https://tech-info-plus-backend.onrender.com
```

**Sur Render** :
```
MYSQL_HOST=votre-host-supabase
MYSQL_PORT=3306
MYSQL_USER=votre-user
MYSQL_PASSWORD=votre-password
MYSQL_DATABASE=tech_info_plus
ENVIRONMENT=production
FRONTEND_URL=https://tech-info-plus.vercel.app
```

---

## 🎉 C'est Tout !

Votre application **Tech Info Plus** est maintenant en ligne !

- ✅ Frontend sur Vercel
- ✅ Backend sur Render
- ✅ Base de données MySQL sur Supabase

---

## 📞 Support

En cas de problème :

1. **Logs Vercel** : https://vercel.com/dashboard → Project → Deployments → View Logs
2. **Logs Render** : https://dashboard.render.com → Service → Logs
3. **Console navigateur** : F12 → Network / Console

---

🚀 **Bon déploiement !**

