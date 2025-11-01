# 🐛 Debug Erreur Serveur Vercel → Render

---

## 🔍 DIAGNOSTIC

L'erreur "Connexion au serveur impossible" peut venir de plusieurs choses.

---

## ✅ CHECKLIST DE VÉRIFICATION

### 1. Backend Render fonctionne ?

**Testez dans votre navigateur** :

```
https://tech-info-plus.onrender.com/docs
```

**Si ça marche** → Backend OK ✅  
**Si ça ne marche pas** → Backend a un problème ❌

---

### 2. Backend en veille ?

**Render Free = Mise en veille après 15 min d'inactivité**

**Symptôme** : Le premier accès après 15 min prend 30-60 secondes

**Solution** : Attendez 1 minute et réessayez

---

### 3. Variable d'environnement pas prise en compte ?

**Problème** : `REACT_APP_API_URL` configuré APRÈS le premier déploiement

**Solution** : **REDÉPLOYEZ** après avoir ajouté la variable !

**Sur Vercel** :
1. Allez dans **Deployments**
2. Cliquez sur le **"..."** du dernier déploiement
3. Cliquez **"Redeploy"**

---

### 4. URL incorrecte ?

**Vérifiez l'URL exacte** sur Render :

1. Allez sur https://dashboard.render.com
2. Cliquez sur votre service backend
3. **En haut**, vous verrez l'URL : `https://XXXXX.onrender.com`
4. **Copiez exactement** cette URL

**Sur Vercel**, mettez EXACTEMENT cette URL dans :
```
Key: REACT_APP_API_URL
Value: https://exactement-cette-url.onrender.com
```

⚠️ **SANS `/api` à la fin !**

---

### 5. CORS Error dans la console ?

**Ouvrez la console** (F12 → Console)

**Si vous voyez** :
```
Access-Control-Allow-Origin
CORS policy
```

**Solution** : Backend doit être redémarré sur Render

1. Sur Render → Votre service
2. Cliquez **"Manual Deploy"** → **"Deploy latest commit"**
3. Attendez 2-3 minutes

---

### 6. Variable d'environnement mal écrite ?

**Sur Vercel**, vérifiez :

```
❌ Wrong: react_app_api_url
❌ Wrong: REACT_APP_API_URL  (espace)
✅ Good: REACT_APP_API_URL   (pas d'espace)
```

---

## 🎯 DIAGNOSTIC RAPIDE

**Ouvrez la console du navigateur** (F12 → Console) :

**Copiez l'erreur exacte** que vous voyez et dites-moi :

1. ❌ `Network Error` ?
2. ❌ `Cannot connect` ?
3. ❌ `404 Not Found` ?
4. ❌ `CORS Error` ?
5. ❌ `Timeout` ?
6. ❌ Autre ?

---

## 🔧 SOLUTIONS RAPIDES

### Solution 1 : Redéployer Vercel

```
Vercel → Deployments → "..." → Redeploy
```

### Solution 2 : Redéployer Render

```
Render → Service → Manual Deploy → Deploy latest commit
```

### Solution 3 : Vérifier la variable

```
Vercel → Settings → Environment Variables
REACT_APP_API_URL = https://tech-info-plus.onrender.com
Redéployer
```

---

## 💡 AIDE

**Dites-moi** :
1. L'erreur exacte dans la console (F12)
2. Si `https://tech-info-plus.onrender.com/docs` fonctionne
3. Si vous avez bien redéployé après avoir ajouté la variable

**Je vous dirai exactement ce qui ne va pas !**

---

🚀 **99% des cas = Il faut REDÉPLOYER après avoir changé la variable !**

