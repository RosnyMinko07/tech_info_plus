-- ============================================================
-- CRÉER UN UTILISATEUR ADMIN POUR SUPABASE (avec UUID)
-- ============================================================
-- 
-- Ce script crée un utilisateur admin compatible avec votre
-- structure de table utilisateur (avec UUID)
--
-- INFORMATIONS DE CONNEXION :
-- Username : admin
-- Password : admin123
--
-- ============================================================

-- 1. Activer l'extension uuid si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Supprimer l'ancien admin s'il existe
DELETE FROM utilisateur WHERE nom_utilisateur = 'admin' OR email = 'admin@techinfoplus.com';

-- 3. Créer le nouvel utilisateur admin
INSERT INTO utilisateur (
    nom_utilisateur,
    email,
    mot_de_passe,
    role,
    statut,
    telephone,
    actif,
    droits,
    date_creation,
    created_at
) VALUES (
    'admin',
    'admin@techinfoplus.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QzKz2K',  -- Hash de "admin123"
    'ADMIN',
    'ACTIF',
    '+243 000 000 000',
    true,
    '{"all": true}',
    NOW(),
    NOW()
);

-- 4. Vérifier que l'admin a bien été créé
SELECT 
    id_utilisateur,
    nom_utilisateur,
    email,
    role,
    statut,
    actif,
    date_creation
FROM utilisateur 
WHERE nom_utilisateur = 'admin';

-- ============================================================
-- ✅ POUR SE CONNECTER APRÈS :
-- ============================================================
-- Username : admin
-- Password : admin123
-- ============================================================
--
-- 📝 NOTE : Changez le mot de passe après la première connexion !
--
-- ============================================================







