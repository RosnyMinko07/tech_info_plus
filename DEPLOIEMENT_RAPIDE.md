# ⚡ Déploiement Rapide - Tech Info Plus

Guide ultra-rapide pour déployer Tech Info Plus sur Netlify (Frontend) + Render (Backend).

---

## 🎯 En 5 Minutes

### 1️⃣ Backend sur Render

1. Allez sur https://render.com → Connectez GitHub
2. **New Web Service** → Repository `tech_info_plus`
3. Configuration :
   ```
   Name: tech-info-plus-backend
   Root Directory: backend
   Build: pip install -r requirements.txt
   Start: uvicorn app:app --host 0.0.0.0 --port $PORT
   ```
4. Variables d'environnement (ajoutez) :
   ```
   MYSQL_HOST=votre-host
   MYSQL_USER=votre-user
   MYSQL_PASSWORD=votre-password
   MYSQL_DATABASE=tech_info_plus
   MYSQL_PORT=3306
   ENVIRONMENT=production
   ```
5. **Create** → Attendre 5 min
6. **Copier l'URL** : `https://tech-info-plus-backend.onrender.com`

### 2️⃣ Frontend sur Netlify

1. Allez sur https://netlify.com → Connectez GitHub
2. **New site** → Repository `tech_info_plus`
3. Configuration :
   ```
   Base directory: frontend
   Build command: npm install && npm run build
   Publish directory: frontend/build
   ```
4. Variables d'environnement :
   ```
   REACT_APP_API_URL=https://tech-info-plus-backend.onrender.com
   ```
   (Remplacez par votre vraie URL Render !)
5. **Deploy** → Attendre 2 min
6. **Copier l'URL** : `https://tech-info-plus.netlify.app`

### 3️⃣ MySQL

**Besoin d'une base MySQL gratuite ?** 

Options :
- **PlanetScale** : https://planetscale.com (recommandé)
- **Railway** : https://railway.app
- **AWS RDS** : Essai gratuit 12 mois

### 4️⃣ Finaliser

Retournez sur Render → Mettez à jour :
```
FRONTEND_URL=https://tech-info-plus.netlify.app
```

Redéployez le backend (Manual Deploy).

---

## ✅ C'est Tout !

Vos URLs :
- Frontend : `https://votre-app.netlify.app`
- Backend : `https://tech-info-plus-backend.onrender.com`
- API Docs : `/docs` sur le backend

Connexion : `admin` / `admin`

---

## 📖 Documentation Complète

Pour plus de détails, lisez : **`GUIDE_DEPLOIEMENT_NETLIFY_RENDER.md`**

---

🚀 **Bon déploiement !**

