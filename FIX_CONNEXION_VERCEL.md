# 🔧 Fix Connexion Frontend Vercel → Backend Render

---

## ❌ PROBLÈME

"Connexion au serveur impossible" → Le frontend Vercel ne peut pas contacter le backend Render.

---

## ✅ SOLUTION

Le problème vient de la variable d'environnement `REACT_APP_API_URL` sur Vercel.

### 🔴 Erreur Commune

Ne pas mettre `/api` à la fin de l'URL !

```
❌ REACT_APP_API_URL=https://backend.onrender.com/api  ❌ MAL !
```

Le code ajoute automatiquement `/api` dans `api.js` !

---

## 🎯 CORRECTION RAPIDE

### Sur Vercel :

1. **Allez sur** : https://vercel.com/dashboard
2. Sélectionnez votre projet
3. **Settings** → **Environment Variables**
4. Vérifiez/modifiez :

   ```
   Key: REACT_APP_API_URL
   Value: https://tech-info-plus-backend.onrender.com
   ```

   ⚠️ **SANS le /api à la fin !**

5. **Redeploy** : Allez dans **Deployments** → Cliquez sur les **"..."** → **"Redeploy"**

---

## 🔍 VÉRIFICATIONS

### 1. Vérifier l'URL du Backend

Testez dans votre navigateur :

```
https://tech-info-plus-backend.onrender.com/docs
```

Si ça marche → Backend OK ✅

Si ça ne marche pas → Problème backend ❌

---

### 2. Vérifier la Console du Navigateur

Sur Vercel (F12 → Console), vous devriez voir :

```
OPTION 1 - Connexion OK :
✅ Requête vers : https://backend.onrender.com/api/auth/login

OPTION 2 - Erreur :
❌ Network Error
❌ Cannot GET /api/...
```

---

### 3. Vérifier les Logs Render

Allez sur : https://dashboard.render.com

Votre service backend → **Logs**

Vérifiez :

```
✅ Démarrage de Tech Info Plus API v2.0
✅ Connexion MySQL réussie !
✅ Serveur API prêt!
```

Si erreur → Backend a un problème

---

## 🐛 DÉPANNAGE

### Problème : Backend en veille

**Symptôme** : Le premier démarrage prend 30-60 secondes

**Solution** : C'est normal pour le plan gratuit Render. Attendez 1 minute et réessayez.

---

### Problème : CORS Error

**Erreur** : `Access-Control-Allow-Origin` dans la console

**Solution** : Le backend doit avoir `allow_origins=["*"]` dans `app.py` (déjà fait ✅)

Vérifiez sur Render que le backend est bien redémarré.

---

### Problème : 404 Not Found

**Erreur** : `Cannot GET /api/...` ou `404`

**Causes possibles** :

1. ❌ Mauvais URL backend
2. ❌ Backend pas démarré
3. ❌ Root Directory incorrect sur Render

**Solution** :
- Vérifiez que `Root Directory: backend` sur Render
- Vérifiez les logs Render
- Testez manuellement `/docs`

---

### Problème : 500 Internal Server Error

**Erreur** : Backend répond mais avec erreur 500

**Solution** :
1. Regardez les **logs Render**
2. Vérifiez que **MySQL Supabase** est bien connecté
3. Vérifiez que toutes les **variables d'environnement** sont correctes sur Render

---

## 📝 CHECKLIST FINALE

- [ ] Backend Render accessible sur `/docs`
- [ ] `REACT_APP_API_URL` configuré sur Vercel (SANS /api)
- [ ] Frontend Vercel redéployé
- [ ] Backend Render redémarré
- [ ] Console navigateur ne montre pas d'erreur CORS
- [ ] Logs Render montrent "Serveur API prêt!"

---

## 🔗 URLS À VÉRIFIER

```
Backend Health : https://backend.onrender.com/health
Backend Docs   : https://backend.onrender.com/docs
Frontend       : https://votre-app.vercel.app
```

---

## 💡 AIDE

**Donnez-moi :**
1. L'URL de votre backend Render
2. L'erreur exacte dans la console (F12)
3. Les logs Render

**Je vous dirai exactement ce qui ne va pas !**

---

🚀 **Fix rapide = REDÉPLOY sur Vercel avec la bonne REACT_APP_API_URL !**

