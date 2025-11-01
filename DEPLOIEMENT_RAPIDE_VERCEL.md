# ⚡ Déploiement Rapide Vercel + Render

Guide ultra-rapide pour déployer Tech Info Plus.

---

## 🎯 En 3 Minutes

### 1️⃣ Backend sur Render (✅ DÉJÀ FAIT)

Votre backend est déjà déployé ! Parfait.

URL backend : `https://tech-info-plus-backend.onrender.com`

---

### 2️⃣ Frontend sur Vercel

1. Allez sur **https://vercel.com** → Login GitHub
2. **Add New Project** → Repository `tech_info_plus`
3. Configurez :
   ```
   Framework Preset: Create React App
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: build
   ```
4. **Environment Variables** (CRITIQUE) :
   ```
   REACT_APP_API_URL=https://tech-info-plus-backend.onrender.com
   ```
   (Remplacez par votre vraie URL Render !)
5. **Deploy** → Attendre 2 min
6. **Votre URL** : `https://tech-info-plus.vercel.app`

---

### 3️⃣ Autoriser CORS

Sur Render, ajoutez/modifiez :
```
FRONTEND_URL=https://tech-info-plus.vercel.app
```

Redéployez le backend (cliquez "Manual Deploy").

---

## ✅ C'est Fait !

**Vos URLs** :
- Frontend : `https://tech-info-plus.vercel.app`
- Backend : `https://tech-info-plus-backend.onrender.com`
- Docs API : `/docs` sur le backend

**Connexion** : `admin` / `admin`

---

## 📖 Guide Complet

Pour plus de détails : **`GUIDE_DEPLOIEMENT_VERCEL_RENDER.md`**

---

🚀 **Allez-y !**

