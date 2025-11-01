# ⚙️ Configuration Automatique pour Vercel

## 📝 IMPORTANT

Le fichier `vercel.json` contient maintenant une configuration automatique.

Mais vous devez **Remplacer l'URL du backend** dans `vercel.json` !

---

## 🔧 FICHIER À MODIFIER

Fichier : `vercel.json` (à la racine du projet)

Ligne 8 actuelle :
```json
"REACT_APP_API_URL": "https://tech-info-plus-backend.onrender.com"
```

**Remplacez par** :
```json
"REACT_APP_API_URL": "https://VOTRE-URL-RENDER.onrender.com"
```

---

## 🎯 COMMENT TROUVER VOTRE URL RENDER

1. Allez sur https://dashboard.render.com
2. Cliquez sur votre service backend
3. **Votre URL** est en haut : `https://nom-du-service.onrender.com`

**Copiez cette URL** et mettez-la dans `vercel.json` !

---

## ✅ APRÈS MODIFICATION

1. Commitez et pushez sur GitHub :
   ```bash
   git add vercel.json
   git commit -m "Configuration URL backend Render"
   git push
   ```

2. Sur Vercel :
   - Settings → Deployments
   - Cliquez "Redeploy"

---

## 💡 ALTERNATIVE

Vous pouvez aussi configurer directement sur Vercel (sans modifier `vercel.json`) :

1. Allez sur Vercel → Your Project → Settings → Environment Variables
2. Ajoutez :
   ```
   Key: REACT_APP_API_URL
   Value: https://votre-backend.onrender.com
   ```
3. Redeploy

---

🚀 **Configuration automatique = Une fois fait, plus besoin de configurer manuellement !**

