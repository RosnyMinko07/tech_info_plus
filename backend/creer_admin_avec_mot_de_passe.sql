-- ============================================================
-- CRÉER UN UTILISATEUR ADMIN AVEC MOT DE PASSE CONNU
-- ============================================================
-- 
-- IMPORTANT : Ce script supprime l'ancien admin et en crée un nouveau
-- avec un mot de passe que VOUS connaissez !
--
-- Mot de passe choisi : admin123
-- (Vous pourrez le changer après la première connexion)
--
-- ============================================================

-- 1. Supprimer l'ancien admin s'il existe
DELETE FROM utilisateurs WHERE nom_utilisateur = 'admin' OR email = 'admin@techinfoplus.com';

-- 2. Créer le nouvel admin avec mot de passe "admin123"
-- Hash bcrypt de "admin123" = $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QzKz2K
INSERT INTO utilisateurs (
    nom_utilisateur,
    mot_de_passe,
    nom,
    email,
    role,
    statut,
    date_creation,
    derniere_connexion
) VALUES (
    'admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QzKz2K',
    'Administrateur',
    'admin@techinfoplus.com',
    'admin',
    'actif',
    NOW(),
    NOW()
);

-- 3. Vérifier que l'admin a bien été créé
SELECT 
    id_utilisateur,
    nom_utilisateur,
    email,
    role,
    statut,
    date_creation
FROM utilisateurs 
WHERE nom_utilisateur = 'admin';

-- ============================================================
-- POUR SE CONNECTER APRÈS :
-- ============================================================
-- Username : admin
-- Password : admin123
-- ============================================================







