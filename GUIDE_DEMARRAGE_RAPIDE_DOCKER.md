# 🚀 GUIDE DE DÉMARRAGE RAPIDE - DOCKER

## ⚡ En 3 étapes simples !

### 1️⃣ Installer Docker

**Windows** : Télécharger Docker Desktop
- 🔗 https://www.docker.com/products/docker-desktop
- Installer et redémarrer l'ordinateur

**Linux** :
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

**Mac** : Télécharger Docker Desktop
- 🔗 https://www.docker.com/products/docker-desktop

---

### 2️⃣ Lancer l'application

**Windows** : Double-cliquer sur
```
LANCER_DOCKER.bat
```

**Linux/Mac** : Dans le terminal
```bash
cd tech_info_plus
docker-compose up -d
```

---

### 3️⃣ Ouvrir dans le navigateur

```
http://localhost:3000
```

**Identifiants** :
- Utilisateur : `admin`
- Mot de passe : `admin123`

---

## 🛑 Arrêter l'application

```bash
docker-compose down
```

---

## 📋 Commandes essentielles

```bash
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Voir les logs
docker-compose logs -f

# Redémarrer
docker-compose restart

# Voir l'état
docker-compose ps
```

---

## ❓ Problèmes ?

### Port déjà utilisé
```bash
# Changer le port dans docker-compose.yml
ports:
  - "3001:3000"  # Au lieu de 3000:3000
```

### Rebuild après modification
```bash
docker-compose up -d --build
```

### Tout réinitialiser
```bash
docker-compose down -v
docker-compose up -d
```

---

## 📚 Documentation complète

Voir `README_DOCKER.md` pour plus de détails.

---

**C'est tout ! Votre application est prête ! 🎉**


