# 🖥️ Tech Info Plus

Application web de gestion commerciale complète développée avec React et FastAPI.

---

## 🚀 Fonctionnalités

### 📊 **Gestion Commerciale**
- **Articles** : Gestion des produits et services
- **Clients & Fournisseurs** : Gestion des contacts commerciaux
- **Stock** : Suivi en temps réel des stocks
- **Inventaire** : Gestion complète des inventaires

### 💰 **Facturation**
- **Devis** : Création et validation de devis
- **Factures** : Facturation complète avec gestion des paiements
- **Avoirs** : Gestion des retours et remboursements
- **Comptoir** : Ventes directes au comptoir

### 📈 **Rapports & Statistiques**
- **Dashboard** : Vue d'ensemble en temps réel
- **Chiffre d'affaires** : Statistiques de vente
- **Statistiques clients** : Analyses détaillées
- **Mouvements de stock** : Historique complet

### 👥 **Gestion Utilisateurs**
- **Multi-utilisateurs** : Gestion des comptes
- **Droits d'accès** : Contrôle des permissions
- **Historique** : Traçabilité des actions

### 🎨 **Interface**
- **Thème sombre/clair** : Personnalisation de l'interface
- **Design moderne** : Interface intuitive et responsive
- **Popups élégants** : Confirmations avec SweetAlert2

---

## 📋 Prérequis

### Backend
- Python 3.8+
- MySQL 5.7+ ou MariaDB 10.3+

### Frontend
- Node.js 14+
- npm ou yarn

---

## 🔧 Installation

### 1. Cloner le projet

```bash
git clone https://github.com/votre-username/tech_info_plus.git
cd tech_info_plus
```

### 2. Configuration de la base de données

Créer une base MySQL :

```sql
CREATE DATABASE tech_info_plus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Backend (FastAPI)

```bash
# Créer un environnement virtuel
python -m venv .venv

# Activer l'environnement
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```

Configurer les variables d'environnement dans `backend/.env` :

```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=tech_info_plus
MYSQL_PORT=3306
```

### 4. Frontend (React)

```bash
cd frontend

# Installer les dépendances
npm install

# Configurer l'URL de l'API dans frontend/.env
echo "REACT_APP_API_URL=http://localhost:8000/api" > .env
```

---

## 🎯 Lancement

### Option 1 : Lancement automatique (Windows)

Double-cliquez sur **`LANCER_TOUT.bat`**

### Option 2 : Lancement manuel

#### Backend
```bash
# Windows
LANCER_BACKEND.bat

# Linux/Mac
cd backend
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Backend accessible sur : http://localhost:8000
Documentation API : http://localhost:8000/docs

#### Frontend
```bash
# Windows
LANCER_FRONTEND.bat

# Linux/Mac
cd frontend
npm start
```

Frontend accessible sur : http://localhost:3000

---

## 🔑 Connexion par défaut

- **Username** : `admin`
- **Password** : `admin`

⚠️ **Important** : Changez le mot de passe après la première connexion !

---

## 📁 Structure du projet

```
tech_info_plus/
├── backend/              # Backend FastAPI
│   ├── app.py           # Application principale
│   ├── database_mysql.py # Modèles SQLAlchemy
│   └── .env             # Configuration (à créer)
├── frontend/            # Frontend React
│   ├── public/          # Fichiers statiques
│   ├── src/
│   │   ├── components/  # Composants React
│   │   ├── pages/       # Pages de l'application
│   │   ├── context/     # Contextes React (auth, theme)
│   │   ├── styles/      # Fichiers CSS
│   │   └── utils/       # Utilitaires
│   └── package.json     # Dépendances npm
├── logos/               # Logos de l'entreprise
├── requirements.txt     # Dépendances Python
└── README.md           # Ce fichier
```

---

## 🛠️ Technologies utilisées

### Backend
- **FastAPI** : Framework web Python moderne
- **SQLAlchemy** : ORM pour MySQL
- **PyMySQL** : Driver MySQL
- **Uvicorn** : Serveur ASGI
- **ReportLab** : Génération de PDF

### Frontend
- **React** : Bibliothèque UI
- **React Router** : Navigation
- **Axios** : Requêtes HTTP
- **SweetAlert2** : Popups élégants
- **CSS3** : Styles avec variables CSS

---

## 🐛 Dépannage

### Backend ne démarre pas
- Vérifiez que MySQL est démarré
- Vérifiez les identifiants dans `backend/.env`
- Vérifiez que le port 8000 n'est pas déjà utilisé

### Frontend ne démarre pas
- Exécutez `npm install` dans le dossier `frontend`
- Vérifiez que le port 3000 n'est pas déjà utilisé
- Vérifiez l'URL de l'API dans `frontend/.env`

### Erreur de connexion à la base de données
- Vérifiez que MySQL est démarré (XAMPP, WAMP, etc.)
- Vérifiez que la base `tech_info_plus` existe
- Vérifiez les identifiants MySQL dans `backend/.env`

### CORS Error
- Vérifiez que le backend est bien démarré
- Vérifiez l'URL dans `REACT_APP_API_URL`

---

## 📝 Licence

Projet privé - Tous droits réservés

---

## 👨‍💻 Support

Pour toute question ou problème, contactez le développeur.

---

## 🔄 Mise à jour

Pour mettre à jour l'application :

```bash
# Backend
cd backend
pip install -r requirements.txt --upgrade

# Frontend
cd frontend
npm update
```

---

## ✅ Checklist de démarrage

- [ ] MySQL installé et démarré
- [ ] Base de données `tech_info_plus` créée
- [ ] Python 3.8+ installé
- [ ] Node.js 14+ installé
- [ ] Dépendances backend installées (`pip install -r requirements.txt`)
- [ ] Dépendances frontend installées (`npm install`)
- [ ] Fichier `backend/.env` configuré
- [ ] Fichier `frontend/.env` configuré
- [ ] Backend lancé et accessible sur http://localhost:8000
- [ ] Frontend lancé et accessible sur http://localhost:3000
- [ ] Connexion réussie avec admin/admin

**Tout coché ? Vous êtes prêt ! 🎉**


