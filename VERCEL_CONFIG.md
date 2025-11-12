# 🚀 Configuration Vercel - Tech Info Plus

## ⚙️ CONFIGURATION SUR LE DASHBOARD VERCEL

### 1️⃣ Paramètres du Projet (Project Settings)

Allez dans **Settings** → **General** :

```
Root Directory:          frontend
Framework Preset:        Create React App
Build Command:           npm run build:vercel
Output Directory:        build
Install Command:         npm install
```

### 2️⃣ Variables d'Environnement (Environment Variables)

Allez dans **Settings** → **Environment Variables** et ajoutez :

| Key | Value | Environment |
|-----|-------|-------------|
| `REACT_APP_API_URL` | `https://tech-info-plus.onrender.com` | Production |
| `CI` | `false` | Production |
| `DISABLE_ESLINT_PLUGIN` | `true` | Production |

### 3️⃣ Redéployer

Après avoir configuré :
1. Allez dans **Deployments**
2. Cliquez sur **Redeploy** du dernier déploiement
3. ✅ Le build devrait maintenant réussir !

---

## 🔧 RÉSOLUTION DES ERREURS COMMUNES

### ❌ Erreur: "Build incorrect"

**Cause**: Warnings ESLint traités comme erreurs en production

**Solution**: 
- ✅ Ajoutez `CI=false` dans les variables d'environnement
- ✅ Utilisez `npm run build:vercel` comme Build Command

### ❌ Erreur: "Module not found"

**Cause**: Root Directory mal configuré

**Solution**: 
- ✅ Assurez-vous que Root Directory = `frontend`

### ❌ Erreur: "Cannot find build directory"

**Cause**: Output Directory incorrect

**Solution**: 
- ✅ Assurez-vous que Output Directory = `build`

---

## 📝 CHECKLIST AVANT DÉPLOIEMENT

- [ ] Root Directory = `frontend`
- [ ] Framework Preset = `Create React App`
- [ ] Build Command = `npm run build:vercel`
- [ ] Output Directory = `build`
- [ ] Variable `REACT_APP_API_URL` ajoutée
- [ ] Variable `CI` = `false` ajoutée
- [ ] Variable `DISABLE_ESLINT_PLUGIN` = `true` ajoutée
- [ ] Code poussé sur GitHub
- [ ] Redéploiement lancé

---

## 🎯 LIENS RAPIDES

- **Dashboard Vercel**: https://vercel.com/dashboard
- **Backend (Render)**: https://tech-info-plus.onrender.com
- **Docs Vercel**: https://vercel.com/docs

---

✅ **Une fois configuré correctement, le déploiement devrait réussir à 100% !**

