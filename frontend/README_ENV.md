# Configuration des Variables d'Environnement

Pour le déploiement Netlify, créez un fichier `.env` dans le dossier `frontend/` avec :

```bash
REACT_APP_API_URL=http://localhost:8000
```

Ou dans Netlify, ajoutez cette variable dans **Site settings** → **Environment variables** :

```bash
REACT_APP_API_URL=https://votre-backend.onrender.com
```

⚠️ **Important** : En production, remplacez l'URL par celle de votre backend Render !

