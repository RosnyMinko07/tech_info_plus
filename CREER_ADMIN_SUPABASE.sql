-- ================================================================
-- CRÉER UN UTILISATEUR ADMIN SUR SUPABASE
-- ================================================================
-- À exécuter dans Supabase SQL Editor
-- ================================================================

-- 1. Créer l'utilisateur admin
INSERT INTO utilisateur (
  nom_utilisateur, 
  email, 
  mot_de_passe, 
  role, 
  statut, 
  telephone,
  actif,
  droits
) VALUES (
  'admin',
  'admin@techinfoplus.ga',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QzKz2K',
  'ADMIN',
  'ACTIF',
  '+241 6XX XX XX XX',
  true,
  'TOUS'
);

-- 2. Créer les données de base de l'entreprise
INSERT INTO entreprise (
  nom,
  adresse,
  telephone,
  email,
  nif,
  taux_tva,
  devise
) VALUES (
  'Tech Info Plus',
  'Port-gentil, Saint Paul',
  '+241 6XX XX XX XX',
  'contact@techinfoplus.ga',
  'G1234567890123',
  9.50,
  'XAF'
);

-- ================================================================
-- IDENTIFIANTS DE CONNEXION ADMIN :
-- ================================================================
-- Username: admin
-- Password: admin123
-- ================================================================
-- 
-- Après la première connexion, changez le mot de passe !
-- ================================================================

