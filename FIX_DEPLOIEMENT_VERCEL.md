# 🔧 Fix Déploiement Vercel - Configuration Manuelle Nécessaire

---

## ❌ ERREUR ACTUELLE

```
Erreur: Commande "cd frontend && npm install && npm run build" sorti avec 1
```

---

## ✅ SOLUTION : Configuration Manuelle sur Vercel

**Le fichier `vercel.json` ne supporte PAS `&&` dans les commandes !**

Il faut configurer **MANUELLEMENT** sur Vercel :

---

## 🎯 ÉTAPES SUR VERCEL

### 1. Créer le Projet

1. Allez sur https://vercel.com
2. **Add New Project** → Repository `tech_info_plus`

### 2. Configurer AVANT de déployer

Avant de cliquer "Deploy", cherchez **"Configure Project"** ou **"Settings"** :

**Root Directory** :
```
frontend
```

**Framework Preset** :
```
Create React App
```

**Build Command** :
```
npm run build
```
(ou laissez vide, Vercel le détectera automatiquement)

**Output Directory** :
```
build
```
(ou laissez vide, Vercel le détectera automatiquement)

### 3. Variables d'Environnement

Cliquez **"Environment Variables"** :

```
Key: REACT_APP_API_URL
Value: https://tech-info-plus.onrender.com
```

### 4. Déployer

Cliquez **"Deploy"**

---

## ✅ FICHIER VERCEL.JSON FINAL

Le fichier `vercel.json` simplifié :

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

C'est tout ! Les autres configurations se font sur Vercel.

---

## 🔍 POURQUOI ÇA NE MARCHAIT PAS ?

- ❌ `buildCommand` avec `&&` ne fonctionne pas dans `vercel.json`
- ❌ `outputDirectory` ne fonctionne pas correctement dans `vercel.json`
- ❌ Il faut configurer **Root Directory** sur le dashboard Vercel

---

## 📝 CHECKLIST VERCEL

- [ ] **Root Directory** : `frontend`
- [ ] **Framework Preset** : `Create React App`
- [ ] **Build Command** : `npm run build` (ou auto)
- [ ] **Output Directory** : `build` (ou auto)
- [ ] **Variable** : `REACT_APP_API_URL` = `https://tech-info-plus.onrender.com`
- [ ] **Deploy** cliqué

---

🚀 **Une fois tout ça fait = ÇA MARCHERA !**

