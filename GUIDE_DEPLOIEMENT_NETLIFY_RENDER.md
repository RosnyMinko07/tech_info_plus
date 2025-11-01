# 🚀 Guide de Déploiement - Tech Info Plus

Déploiement du frontend sur **Netlify** et du backend sur **Render**.

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Base de Données MySQL](#base-de-données-mysql)
3. [Déploiement Backend (Render)](#déploiement-backend-render)
4. [Déploiement Frontend (Netlify)](#déploiement-frontend-netlify)
5. [Configuration Finale](#configuration-finale)
6. [Dépannage](#dépannage)

---

## 📋 Prérequis

- ✅ Compte GitHub avec le projet **tech_info_plus** déployé
- ✅ Compte **Render** (https://render.com - compte gratuit disponible)
- ✅ Compte **Netlify** (https://netlify.com - compte gratuit disponible)
- ✅ Base de données MySQL externe (Render, PlanetScale, Railway, ou autre)

---

## 🗄️ Base de Données MySQL

### Option 1 : MySQL sur Render (Recommandé)

1. **Créer une base MySQL sur Render** :
   - Allez sur https://dashboard.render.com
   - Cliquez sur **"New +"** → **"PostgreSQL"** (Render ne supporte pas MySQL directement, voir Option 2)

### Option 2 : MySQL Externe (Alternatives gratuites)

**Alternatives recommandées** :
- **PlanetScale** (https://planetscale.com) - MySQL gratuit
- **Railway** (https://railway.app) - MySQL gratuit avec 5$/mois après crédits
- **AWS RDS** (https://aws.amazon.com/rds) - Essai gratuit 12 mois
- **Aiven** (https://aiven.io) - Trial gratuit

#### Configuration PlanetScale (Recommandé)

1. Créez un compte sur https://planetscale.com
2. Créez une base **"tech_info_plus"**
3. Récupérez les credentials :
   - Host, Port, User, Password, Database

⚠️ **Important** : Noter ces credentials, vous en aurez besoin pour Render !

---

## 🔧 Déploiement Backend (Render)

### Étape 1 : Créer le Service Web sur Render

1. Allez sur https://dashboard.render.com
2. Cliquez sur **"New +"** → **"Web Service"**
3. Connectez votre repository GitHub **tech_info_plus**

### Étape 2 : Configuration du Service

#### Informations de Base :
- **Name** : `tech-info-plus-backend`
- **Region** : `Oregon` (ou plus proche de vous)
- **Branch** : `main`
- **Root Directory** : `backend`
- **Runtime** : `Python 3`
- **Build Command** : `pip install -r requirements.txt`
- **Start Command** : `uvicorn app:app --host 0.0.0.0 --port $PORT`

#### Variables d'Environnement :

Ajoutez ces variables dans **"Environment Variables"** :

```bash
MYSQL_HOST=votre-host-mysql.com
MYSQL_PORT=3306
MYSQL_USER=votre-username
MYSQL_PASSWORD=votre-password
MYSQL_DATABASE=tech_info_plus

ENVIRONMENT=production

SECRET_KEY=genere-une-cle-secrete-forte

FRONTEND_URL=https://votre-app.netlify.app
```

⚠️ **Important** :
- Remplacez `votre-host-mysql.com`, `votre-username`, `votre-password` par vos vrais credentials MySQL
- Générez une `SECRET_KEY` forte (ou utilisez : https://generate-secret.vercel.app/32)
- `FRONTEND_URL` sera mis à jour après le déploiement Netlify

### Étape 3 : Déployer

1. Cliquez sur **"Create Web Service"**
2. Attendez le déploiement (5-10 minutes)
3. **Noter l'URL** : `https://tech-info-plus-backend.onrender.com`

⚠️ **Note** : Le plan gratuit met le service en veille après 15 min d'inactivité. Le premier démarrage peut prendre 30-60 secondes.

---

## 🌐 Déploiement Frontend (Netlify)

### Étape 1 : Créer le Site sur Netlify

1. Allez sur https://app.netlify.com
2. Cliquez sur **"Add new site"** → **"Import an existing project"**
3. Connectez votre repository GitHub **tech_info_plus**

### Étape 2 : Configuration du Build

#### Paramètres de Build :
- **Branch to deploy** : `main`
- **Base directory** : `frontend`
- **Build command** : `npm install && npm run build`
- **Publish directory** : `frontend/build`

### Étape 3 : Variables d'Environnement

Dans **"Site settings"** → **"Environment variables"**, ajoutez :

```bash
REACT_APP_API_URL=https://tech-info-plus-backend.onrender.com
```

⚠️ **Remplacez** `https://tech-info-plus-backend.onrender.com` par votre vraie URL Render !

### Étape 4 : Déployer

1. Cliquez sur **"Deploy site"**
2. Attendez le build (2-3 minutes)
3. **Noter l'URL** : `https://tech-info-plus.netlify.app`

---

## ⚙️ Configuration Finale

### 1. Mettre à jour l'URL Frontend sur Render

1. Retournez sur Render
2. Modifiez la variable `FRONTEND_URL` avec l'URL Netlify :
   ```bash
   FRONTEND_URL=https://tech-info-plus.netlify.app
   ```
3. Cliquez sur **"Manual Deploy"** → **"Deploy latest commit"**

### 2. Initialiser la Base de Données

1. Connectez-vous à votre base MySQL externe
2. Exécutez le script `backend/init.sql` (si existe)

Ou créez les tables manuellement :
```sql
-- Exécutez les commandes SQL nécessaires pour créer les tables
-- Les tables seront créées automatiquement au premier démarrage si la configuration SQLAlchemy est correcte
```

### 3. Vérifier les URLs

- ✅ Backend Render : `https://tech-info-plus-backend.onrender.com`
- ✅ Backend Docs : `https://tech-info-plus-backend.onrender.com/docs`
- ✅ Frontend Netlify : `https://tech-info-plus.netlify.app`

---

## 🔍 Dépannage

### Problème : Frontend ne peut pas se connecter au backend

**Solution** :
- Vérifiez que `REACT_APP_API_URL` est bien configuré sur Netlify
- Vérifiez que l'URL backend est correcte (testez `/docs` sur Render)
- Vérifiez CORS dans `backend/app.py` (doit autoriser l'origine Netlify)

### Problème : Erreur de connexion à MySQL

**Solution** :
- Vérifiez tous les credentials MySQL sur Render
- Assurez-vous que la base de données existe
- Vérifiez que MySQL autorise les connexions depuis l'IP Render

### Problème : Build échoue sur Netlify

**Solution** :
- Vérifiez les logs de build sur Netlify
- Assurez-vous que `package.json` contient `"react-scripts": "^5.0.1"`
- Essayez de nettoyer : `rm -rf frontend/node_modules frontend/package-lock.json`

### Problème : Build échoue sur Render

**Solution** :
- Vérifiez les logs de build sur Render
- Assurez-vous que `requirements.txt` est à jour
- Vérifiez que le `Root Directory` est bien `backend`

### Problème : Service Render en veille

**Solution** :
- C'est normal pour le plan gratuit
- Le premier démarrage prend 30-60 secondes
- Pour éviter ça, utilisez un service de wake-up (pingbot.info) ou passez au plan payant

---

## 📝 URLs Finales

Une fois déployé, vos URLs seront :

```
Frontend : https://tech-info-plus.netlify.app
Backend  : https://tech-info-plus-backend.onrender.com
API Docs : https://tech-info-plus-backend.onrender.com/docs
```

---

## 🔐 Connexion par Défaut

- **Username** : `admin`
- **Password** : `admin`

⚠️ **Changez le mot de passe immédiatement après le premier déploiement !**

---

## ✅ Checklist de Déploiement

- [ ] GitHub repository configuré et à jour
- [ ] Base de données MySQL externe créée
- [ ] Render service créé et déployé
- [ ] Variables d'environnement Render configurées
- [ ] Backend accessible sur `/docs`
- [ ] Netlify site créé et déployé
- [ ] Variable `REACT_APP_API_URL` configurée sur Netlify
- [ ] Frontend accessible et fonctionnel
- [ ] Base de données initialisée
- [ ] Connexion fonctionnelle
- [ ] Changement du mot de passe admin

---

## 🎉 Félicitations !

Votre application **Tech Info Plus** est maintenant en ligne ! 🚀

---

## 📞 Support

En cas de problème, consultez :
- Logs Render : https://dashboard.render.com
- Logs Netlify : https://app.netlify.com → Site → Deploys → Deploy logs
- Documentation FastAPI : https://fastapi.tiangolo.com
- Documentation React : https://reactjs.org

---

**Bon déploiement ! 🎉**

