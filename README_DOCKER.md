# 🐳 TECH INFO PLUS - GUIDE DOCKER COMPLET

## 📋 Table des matières
1. [Prérequis](#prérequis)
2. [Installation Docker](#installation-docker)
3. [Lancement rapide](#lancement-rapide)
4. [Architecture](#architecture)
5. [Commandes utiles](#commandes-utiles)
6. [Dépannage](#dépannage)
7. [Configuration avancée](#configuration-avancée)

---

## 🔧 Prérequis

### Windows
- **Docker Desktop pour Windows** (version 4.0 ou supérieure)
- **WSL 2** activé (Windows Subsystem for Linux)
- Au moins **4 GB de RAM** disponible
- **10 GB d'espace disque** libre

### Linux
- **Docker Engine** (version 20.10 ou supérieure)
- **Docker Compose** (version 2.0 ou supérieure)
- Au moins **4 GB de RAM** disponible
- **10 GB d'espace disque** libre

### Mac
- **Docker Desktop pour Mac** (version 4.0 ou supérieure)
- Au moins **4 GB de RAM** disponible
- **10 GB d'espace disque** libre

---

## 📥 Installation Docker

### Windows

1. **Télécharger Docker Desktop**
   - Aller sur : https://www.docker.com/products/docker-desktop
   - Télécharger la version Windows
   - Installer en suivant les instructions

2. **Activer WSL 2**
   ```powershell
   wsl --install
   ```

3. **Vérifier l'installation**
   ```powershell
   docker --version
   docker-compose --version
   ```

### Linux (Ubuntu/Debian)

```bash
# Mettre à jour les paquets
sudo apt-get update

# Installer les dépendances
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Ajouter la clé GPG officielle de Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Ajouter le dépôt Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installer Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Ajouter votre utilisateur au groupe docker
sudo usermod -aG docker $USER

# Redémarrer la session
newgrp docker

# Vérifier l'installation
docker --version
docker compose version
```

### Mac

1. **Télécharger Docker Desktop**
   - Aller sur : https://www.docker.com/products/docker-desktop
   - Télécharger la version Mac (Intel ou Apple Silicon)
   - Installer en glissant dans Applications

2. **Vérifier l'installation**
   ```bash
   docker --version
   docker-compose --version
   ```

---

## 🚀 Lancement rapide

### Méthode 1 : Avec le script batch (Windows)

```powershell
# Double-cliquer sur le fichier
LANCER_DOCKER.bat
```

### Méthode 2 : En ligne de commande

```bash
# 1. Aller dans le dossier du projet
cd tech_info_plus

# 2. Lancer tous les services
docker-compose up -d

# 3. Attendre que tout démarre (environ 30 secondes)

# 4. Ouvrir l'application dans le navigateur
# Frontend : http://localhost:3000
# Backend API : http://localhost:8000
# Documentation API : http://localhost:8000/docs
```

### Identifiants par défaut

- **Utilisateur** : `admin`
- **Mot de passe** : `admin123`

---

## 🏗️ Architecture

L'application est composée de **3 services Docker** :

```
┌─────────────────────────────────────────────────────────────┐
│                    TECH INFO PLUS                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   FRONTEND   │  │   BACKEND    │  │    MYSQL     │    │
│  │              │  │              │  │              │    │
│  │   React      │→→│   FastAPI    │→→│   Database   │    │
│  │   Port 3000  │  │   Port 8000  │  │   Port 3307  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Services

1. **mysql** (Base de données)
   - Image : `mysql:8.0`
   - Port : `3307` (externe) → `3306` (interne)
   - Volume : `mysql_data` (persistance des données)

2. **backend** (API FastAPI)
   - Build : `./backend/Dockerfile`
   - Port : `8000`
   - Dépend de : `mysql`

3. **frontend** (Interface React)
   - Build : `./frontend/Dockerfile`
   - Port : `3000`
   - Dépend de : `backend`

---

## 🛠️ Commandes utiles

### Démarrage et arrêt

```bash
# Démarrer tous les services
docker-compose up -d

# Démarrer en mode verbose (voir les logs)
docker-compose up

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ SUPPRIME LES DONNÉES)
docker-compose down -v
```

### Logs et monitoring

```bash
# Voir les logs de tous les services
docker-compose logs

# Voir les logs d'un service spécifique
docker-compose logs frontend
docker-compose logs backend
docker-compose logs mysql

# Suivre les logs en temps réel
docker-compose logs -f

# Voir les logs des 100 dernières lignes
docker-compose logs --tail=100
```

### Gestion des services

```bash
# Redémarrer un service
docker-compose restart backend

# Redémarrer tous les services
docker-compose restart

# Voir l'état des services
docker-compose ps

# Voir les ressources utilisées
docker stats
```

### Accès aux conteneurs

```bash
# Accéder au shell du backend
docker-compose exec backend bash

# Accéder au shell du frontend
docker-compose exec frontend sh

# Accéder à MySQL
docker-compose exec mysql mysql -u tech_user -p
# Mot de passe : tech_password_2025
```

### Rebuild et mise à jour

```bash
# Rebuild un service après modification du code
docker-compose build backend

# Rebuild tous les services
docker-compose build

# Rebuild et redémarrer
docker-compose up -d --build

# Forcer la recréation des conteneurs
docker-compose up -d --force-recreate
```

### Nettoyage

```bash
# Supprimer les conteneurs arrêtés
docker container prune

# Supprimer les images non utilisées
docker image prune

# Supprimer les volumes non utilisés
docker volume prune

# Nettoyage complet (⚠️ ATTENTION)
docker system prune -a --volumes
```

---

## 🔍 Dépannage

### Problème : Les ports sont déjà utilisés

**Erreur** : `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solution** :
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>

# Ou changer les ports dans docker-compose.yml
ports:
  - "3001:3000"  # Au lieu de 3000:3000
```

### Problème : MySQL ne démarre pas

**Erreur** : `mysql exited with code 1`

**Solution** :
```bash
# Supprimer le volume MySQL et recréer
docker-compose down -v
docker-compose up -d
```

### Problème : Le backend ne se connecte pas à MySQL

**Erreur** : `Can't connect to MySQL server`

**Solution** :
```bash
# Vérifier que MySQL est bien démarré
docker-compose ps

# Attendre que MySQL soit prêt (healthcheck)
docker-compose logs mysql

# Redémarrer le backend
docker-compose restart backend
```

### Problème : Le frontend affiche une page blanche

**Solution** :
```bash
# Vérifier les logs du frontend
docker-compose logs frontend

# Rebuild le frontend
docker-compose build frontend
docker-compose up -d frontend

# Vider le cache du navigateur
# Ctrl + Shift + R (Windows/Linux)
# Cmd + Shift + R (Mac)
```

### Problème : Erreur CORS

**Erreur** : `Access-Control-Allow-Origin`

**Solution** :
```bash
# Vérifier que le backend autorise le frontend
# Dans backend/app.py, vérifier CORS_ORIGINS

# Redémarrer le backend
docker-compose restart backend
```

### Problème : Les modifications ne sont pas prises en compte

**Solution** :
```bash
# Rebuild avec --no-cache
docker-compose build --no-cache

# Forcer la recréation
docker-compose up -d --force-recreate --build
```

---

## ⚙️ Configuration avancée

### Variables d'environnement

Modifier le fichier `config.env.docker` :

```env
# Base de données
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_USER=tech_user
MYSQL_PASSWORD=VOTRE_MOT_DE_PASSE_SECURISE
MYSQL_DATABASE=tech_info_plus

# Backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000

# Frontend
REACT_APP_API_URL=http://localhost:8000
```

### Changer les ports

Modifier `docker-compose.yml` :

```yaml
services:
  frontend:
    ports:
      - "3001:3000"  # Port externe : Port interne
  
  backend:
    ports:
      - "8001:8000"
  
  mysql:
    ports:
      - "3308:3306"
```

### Utiliser une base de données externe

Modifier `docker-compose.yml` :

```yaml
services:
  backend:
    environment:
      MYSQL_HOST=votre-serveur-mysql.com
      MYSQL_PORT=3306
      MYSQL_USER=votre_utilisateur
      MYSQL_PASSWORD=votre_mot_de_passe
      MYSQL_DATABASE=tech_info_plus
```

Et commenter ou supprimer le service `mysql`.

### Mode production

Pour déployer en production :

1. **Changer les mots de passe** dans `config.env.docker`
2. **Désactiver le mode debug** :
   ```yaml
   backend:
     command: ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
     # Enlever --reload
   ```
3. **Builder le frontend en mode production** :
   ```dockerfile
   # Dans frontend/Dockerfile
   RUN npm run build
   CMD ["npx", "serve", "-s", "build", "-l", "3000"]
   ```

---

## 📊 Sauvegarde et restauration

### Sauvegarder la base de données

```bash
# Créer un backup
docker-compose exec mysql mysqldump -u tech_user -ptech_password_2025 tech_info_plus > backup_$(date +%Y%m%d).sql

# Ou avec root
docker-compose exec mysql mysqldump -u root -proot_password_2025 tech_info_plus > backup_$(date +%Y%m%d).sql
```

### Restaurer la base de données

```bash
# Restaurer depuis un backup
docker-compose exec -T mysql mysql -u tech_user -ptech_password_2025 tech_info_plus < backup_20250101.sql
```

---

## 🎯 Accès aux services

Une fois l'application lancée :

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Interface utilisateur |
| **Backend API** | http://localhost:8000 | API REST |
| **Documentation API** | http://localhost:8000/docs | Swagger UI |
| **MySQL** | localhost:3307 | Base de données |

---

## 📞 Support

En cas de problème :

1. Vérifier les logs : `docker-compose logs`
2. Vérifier l'état des services : `docker-compose ps`
3. Redémarrer les services : `docker-compose restart`
4. Consulter la documentation : `README.md`

---

## 📝 Notes importantes

- ⚠️ **Ne jamais utiliser les mots de passe par défaut en production**
- 💾 **Faire des sauvegardes régulières de la base de données**
- 🔄 **Mettre à jour Docker régulièrement**
- 🛡️ **Configurer un firewall pour la production**

---

**Développé avec ❤️ par Tech Info Plus**


