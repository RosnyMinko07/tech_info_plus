# 🔑 Comment Créer un Personal Access Token sur GitHub

---

## 🎯 **MÉTHODE 1 : Lien Direct (Le Plus Rapide)**

### Clique directement sur ce lien :

👉 **https://github.com/settings/tokens/new**

Ce lien t'emmène directement à la page de création de token !

---

## 🎯 **MÉTHODE 2 : Navigation Manuelle**

Si le lien ne marche pas, voici comment y aller :

### **Étape 1 : Va sur GitHub**
→ https://github.com

### **Étape 2 : Clique sur ta photo de profil** (en haut à droite)

```
┌─────────────────────────────────────┐
│  GitHub              👤  [Ta photo]  │ ← Clique ici
└─────────────────────────────────────┘
```

### **Étape 3 : Dans le menu, clique sur "Settings"**

```
👤 Signed in as TON-USERNAME
   ─────────────────────────────
   Your profile
   Your repositories
   Your organizations
   Your stars
   ─────────────────────────────
   ⚙️  Settings            ← Clique ici
   ─────────────────────────────
   Sign out
```

### **Étape 4 : Dans la barre de gauche, descends et clique sur "Developer settings"**

```
Barre de gauche (descends tout en bas) :
┌──────────────────────────────┐
│ Profile                      │
│ Account                      │
│ Appearance                   │
│ ...                          │
│ ...                          │
│ 🔧 Developer settings        │ ← Clique ici (tout en bas)
└──────────────────────────────┘
```

### **Étape 5 : Clique sur "Personal access tokens"**

```
Developer settings
┌──────────────────────────────┐
│ GitHub Apps                  │
│ OAuth Apps                   │
│ 🔑 Personal access tokens   │ ← Clique ici
│    > Tokens (classic)        │
│    > Fine-grained tokens     │
└──────────────────────────────┘
```

### **Étape 6 : Clique sur "Tokens (classic)"**

```
Personal access tokens
┌──────────────────────────────┐
│ > Tokens (classic)           │ ← Clique ici
│   Fine-grained tokens        │
└──────────────────────────────┘
```

### **Étape 7 : Clique sur "Generate new token" → "Generate new token (classic)"**

```
Personal access tokens (classic)
┌────────────────────────────────────────┐
│  [Generate new token ▼]                │ ← Clique ici
│     Generate new token (classic)       │ ← Puis clique ici
│     Generate new token (beta)          │
└────────────────────────────────────────┘
```

---

## 🎯 **ÉTAPE 8 : Remplir le Formulaire**

Tu vas voir une page avec un formulaire. Voici comment le remplir :

### **Note** (Description du token)
```
┌─────────────────────────────────────────┐
│ Note *                                   │
│ ┌─────────────────────────────────────┐ │
│ │ tech-info-plus                      │ │ ← Tape ça
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### **Expiration**
```
┌─────────────────────────────────────────┐
│ Expiration *                             │
│ ┌─────────────────────────────────────┐ │
│ │ 90 days                   ▼         │ │ ← Choisis ça
│ └─────────────────────────────────────┘ │
│                                          │
│ OU si tu veux qu'il n'expire jamais :    │
│ ┌─────────────────────────────────────┐ │
│ │ No expiration             ▼         │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### **Select scopes** (IMPORTANT !)
```
Descends un peu et tu vas voir :

Select scopes

☑️  repo                          ← Coche cette case
    Full control of private repositories

    ☑️  repo:status               ← Toutes ces sous-cases
    ☑️  repo_deployment           ← se cochent
    ☑️  public_repo               ← automatiquement
    ☑️  repo:invite
    ☑️  security_events

☐  workflow                       ← Laisse le reste décoché
☐  write:packages
☐  delete:packages
...
```

**⚠️ TRÈS IMPORTANT : Coche SEULEMENT la case "repo" (la première) !**

### **Étape 9 : Clique sur "Generate token"** (bouton vert en bas)

```
┌─────────────────────────────────────────┐
│                                          │
│  [Generate token]  ← Clique ici (vert)  │
│                                          │
└─────────────────────────────────────────┘
```

---

## 🎯 **ÉTAPE 10 : COPIER LE TOKEN**

**⚠️ ATTENTION : C'EST L'ÉTAPE LA PLUS IMPORTANTE !**

Tu vas voir une page avec ton token :

```
┌──────────────────────────────────────────────────────────┐
│ ✅ Personal access token created                        │
│                                                           │
│ Make sure to copy your personal access token now.        │
│ You won't be able to see it again!                       │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx      [📋]  │ │ ← COPIE ÇA !
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### **Comment copier :**

1. **Clique sur l'icône 📋** (à droite du token)
   
   OU

2. **Sélectionne le token avec ta souris** et fais **Ctrl+C**

### **Où coller le token :**

**🔴 NE LE PERDS PAS !** Tu ne pourras plus le voir après avoir quitté cette page !

**Colle-le ici temporairement (pour ne pas l'oublier) :**

```
─────────────────────────────────────────────────
MON TOKEN GITHUB :

ghp_

─────────────────────────────────────────────────
```

---

## 🎯 **UTILISER LE TOKEN**

Quand tu vas pousser le code avec `git push`, GitHub va demander :

```
Username: [TON-USERNAME-GITHUB]
Password: [COLLE TON TOKEN ICI - PAS TON MOT DE PASSE !]
```

**⚠️ IMPORTANT :**
- ❌ Ne tape PAS ton mot de passe GitHub
- ✅ Colle le TOKEN (qui commence par `ghp_`)

---

## 🎯 **RÉCAPITULATIF RAPIDE**

1. **Va sur** → https://github.com/settings/tokens/new
2. **Note** : `tech-info-plus`
3. **Expiration** : `90 days` (ou `No expiration`)
4. **Coche** : ☑️ `repo` (SEULEMENT cette case)
5. **Clique** : `Generate token`
6. **📋 COPIE LE TOKEN** (tu ne le reverras plus !)
7. **Garde-le précieusement** (colle-le dans un fichier texte)

---

## ❓ **PROBLÈMES COURANTS**

### 🔴 "Je ne vois pas Developer settings"

**Solution :** Assure-toi d'être connecté à ton compte GitHub.
Va directement sur → https://github.com/settings/tokens/new

### 🔴 "Je ne vois plus mon token après l'avoir créé"

**Solution :** C'est normal ! GitHub ne montre le token qu'UNE SEULE FOIS.
Tu dois en créer un nouveau → https://github.com/settings/tokens/new

### 🔴 "Le token ne marche pas"

**Solution :** Vérifie que :
- Tu as bien coché la case "repo"
- Le token n'a pas expiré
- Tu utilises le token (pas ton mot de passe)

---

## 🚀 **PROCHAINE ÉTAPE**

Une fois que tu as ton token, tu peux pousser le code :

```bash
git remote add origin https://github.com/TON-USERNAME/tech-info-plus.git
git push -u origin master
```

Quand Git demande le mot de passe, colle ton TOKEN !

**✅ Dis-moi quand tu as créé ton token !** 🎉

