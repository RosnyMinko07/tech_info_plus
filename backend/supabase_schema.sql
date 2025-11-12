-- Schema PostgreSQL pour Supabase
-- Conversion depuis MySQL

-- Table article
CREATE TABLE IF NOT EXISTS article (
  id_article SERIAL PRIMARY KEY,
  code_article VARCHAR(50) UNIQUE,
  designation VARCHAR(100) NOT NULL,
  description TEXT,
  type_article VARCHAR(20) DEFAULT 'PRODUIT',
  prix_achat DECIMAL(10,2),
  prix_vente DECIMAL(10,2),
  prix_service DECIMAL(10,2),
  stock_initial INTEGER DEFAULT 0,
  stock_actuel INTEGER DEFAULT 0,
  stock_alerte INTEGER DEFAULT 10,
  unite VARCHAR(20) DEFAULT 'PIECE',
  categorie VARCHAR(50),
  image_path TEXT,
  actif BOOLEAN DEFAULT TRUE,
  id_fournisseur INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table client
CREATE TABLE IF NOT EXISTS client (
  id_client SERIAL PRIMARY KEY,
  numero_client VARCHAR(20) UNIQUE,
  nom VARCHAR(100) NOT NULL,
  type_client VARCHAR(20) DEFAULT 'Particulier',
  ville VARCHAR(50),
  telephone VARCHAR(20),
  email VARCHAR(100),
  nif VARCHAR(20),
  adresse TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table devis
CREATE TABLE IF NOT EXISTS devis (
  id_devis SERIAL PRIMARY KEY,
  numero_devis VARCHAR(20) NOT NULL UNIQUE,
  id_client INTEGER NOT NULL,
  id_utilisateur INTEGER,
  date_devis DATE NOT NULL,
  date_validite DATE,
  validite INTEGER DEFAULT 30,
  total_ht DECIMAL(10,2) DEFAULT 0.00,
  total_tva DECIMAL(10,2) DEFAULT 0.00,
  total_ttc DECIMAL(10,2) DEFAULT 0.00,
  statut VARCHAR(20) DEFAULT 'brouillon',
  description VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  precompte_applique INTEGER DEFAULT 0
);

-- Table entreprise
CREATE TABLE IF NOT EXISTS entreprise (
  id_entreprise SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  adresse TEXT,
  telephone VARCHAR(20),
  email VARCHAR(100),
  nif VARCHAR(20),
  logo_path TEXT,
  taux_tva DECIMAL(5,2) DEFAULT 18.00,
  devise VARCHAR(10) DEFAULT 'XAF',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table facture
CREATE TABLE IF NOT EXISTS facture (
  id_facture SERIAL PRIMARY KEY,
  numero_facture VARCHAR(20) NOT NULL UNIQUE,
  id_client INTEGER NOT NULL,
  date_facture DATE NOT NULL,
  date_echeance DATE,
  total_ht DECIMAL(10,2) DEFAULT 0.00,
  total_tva DECIMAL(10,2) DEFAULT 0.00,
  total_ttc DECIMAL(10,2) DEFAULT 0.00,
  statut VARCHAR(20) DEFAULT 'brouillon',
  mode_paiement VARCHAR(20),
  description VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  id_devis INTEGER,
  precompte_applique INTEGER DEFAULT 0,
  montant_avance FLOAT DEFAULT 0,
  montant_reste FLOAT DEFAULT 0,
  type_facture VARCHAR(20) DEFAULT 'NORMALE',
  id_utilisateur INTEGER
);

-- Table fournisseur
CREATE TABLE IF NOT EXISTS fournisseur (
  id_fournisseur SERIAL PRIMARY KEY,
  numero_fournisseur VARCHAR(20),
  nom_fournisseur VARCHAR(100) NOT NULL,
  adresse TEXT,
  telephone VARCHAR(20),
  email VARCHAR(100),
  pays VARCHAR(50),
  nif VARCHAR(20),
  ville VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table ligne_devis
CREATE TABLE IF NOT EXISTS ligne_devis (
  id_ligne SERIAL PRIMARY KEY,
  id_devis INTEGER NOT NULL,
  id_article INTEGER NOT NULL,
  quantite INTEGER NOT NULL,
  prix_unitaire DECIMAL(10,2) NOT NULL,
  total_ht DECIMAL(10,2) NOT NULL
);

-- Table ligne_facture
CREATE TABLE IF NOT EXISTS ligne_facture (
  id_ligne SERIAL PRIMARY KEY,
  id_facture INTEGER NOT NULL,
  id_article INTEGER NOT NULL,
  quantite INTEGER NOT NULL,
  prix_unitaire DECIMAL(10,2) NOT NULL,
  total_ht DECIMAL(10,2) NOT NULL,
  montant_ht FLOAT NOT NULL DEFAULT 0
);

-- Table ligne_vente
CREATE TABLE IF NOT EXISTS ligne_vente (
  id_ligne SERIAL PRIMARY KEY,
  id_vente INTEGER NOT NULL,
  id_article INTEGER NOT NULL,
  quantite INTEGER NOT NULL,
  prix_unitaire DECIMAL(10,2) NOT NULL,
  total_ht DECIMAL(10,2) NOT NULL
);

-- Table mouvement_stock
CREATE TABLE IF NOT EXISTS mouvement_stock (
  id_mouvement SERIAL PRIMARY KEY,
  id_article INTEGER NOT NULL,
  type_mouvement VARCHAR(20) NOT NULL,
  quantite INTEGER NOT NULL,
  reference VARCHAR(50),
  date_mouvement TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table reglement
CREATE TABLE IF NOT EXISTS reglement (
  id_reglement SERIAL PRIMARY KEY,
  numero_reglement VARCHAR(20) UNIQUE,
  id_facture INTEGER,
  montant DECIMAL(10,2) NOT NULL,
  date_reglement DATE NOT NULL,
  mode_paiement VARCHAR(20) NOT NULL,
  reference VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table signalement_bug
CREATE TABLE IF NOT EXISTS signalement_bug (
  id_signalement SERIAL PRIMARY KEY,
  titre VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priorite VARCHAR(20) DEFAULT 'MOYENNE' CHECK (priorite IN ('FAIBLE', 'MOYENNE', 'ELEVEE', 'CRITIQUE')),
  statut VARCHAR(20) DEFAULT 'OUVERT' CHECK (statut IN ('OUVERT', 'EN_COURS', 'RESOLU', 'FERME')),
  date_signalement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_resolution TIMESTAMP,
  id_utilisateur INTEGER NOT NULL
);

-- Table utilisateur
CREATE TABLE IF NOT EXISTS utilisateur (
  id_utilisateur SERIAL PRIMARY KEY,
  nom_utilisateur VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'utilisateur',
  statut VARCHAR(20) DEFAULT 'ACTIF',
  telephone VARCHAR(20),
  actif BOOLEAN DEFAULT TRUE,
  droits TEXT DEFAULT '{}',
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table vente_comptoir
CREATE TABLE IF NOT EXISTS vente_comptoir (
  id_vente SERIAL PRIMARY KEY,
  numero_vente VARCHAR(20) NOT NULL UNIQUE,
  date_vente TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  montant_total DECIMAL(10,2) NOT NULL,
  mode_paiement VARCHAR(20) NOT NULL,
  notes TEXT
);

-- Contraintes de clés étrangères
ALTER TABLE article
  ADD CONSTRAINT fk_article_fournisseur 
  FOREIGN KEY (id_fournisseur) 
  REFERENCES fournisseur(id_fournisseur);

ALTER TABLE devis
  ADD CONSTRAINT fk_devis_client 
  FOREIGN KEY (id_client) 
  REFERENCES client(id_client);

ALTER TABLE devis
  ADD CONSTRAINT fk_devis_utilisateur 
  FOREIGN KEY (id_utilisateur) 
  REFERENCES utilisateur(id_utilisateur) 
  ON DELETE SET NULL;

ALTER TABLE facture
  ADD CONSTRAINT fk_facture_client 
  FOREIGN KEY (id_client) 
  REFERENCES client(id_client);

ALTER TABLE facture
  ADD CONSTRAINT fk_facture_devis 
  FOREIGN KEY (id_devis) 
  REFERENCES devis(id_devis);

ALTER TABLE facture
  ADD CONSTRAINT fk_facture_utilisateur 
  FOREIGN KEY (id_utilisateur) 
  REFERENCES utilisateur(id_utilisateur);

ALTER TABLE ligne_devis
  ADD CONSTRAINT fk_ligne_devis_devis 
  FOREIGN KEY (id_devis) 
  REFERENCES devis(id_devis);

ALTER TABLE ligne_devis
  ADD CONSTRAINT fk_ligne_devis_article 
  FOREIGN KEY (id_article) 
  REFERENCES article(id_article);

ALTER TABLE ligne_facture
  ADD CONSTRAINT fk_ligne_facture_facture 
  FOREIGN KEY (id_facture) 
  REFERENCES facture(id_facture);

ALTER TABLE ligne_facture
  ADD CONSTRAINT fk_ligne_facture_article 
  FOREIGN KEY (id_article) 
  REFERENCES article(id_article);

ALTER TABLE ligne_vente
  ADD CONSTRAINT fk_ligne_vente_vente 
  FOREIGN KEY (id_vente) 
  REFERENCES vente_comptoir(id_vente);

ALTER TABLE ligne_vente
  ADD CONSTRAINT fk_ligne_vente_article 
  FOREIGN KEY (id_article) 
  REFERENCES article(id_article);

ALTER TABLE mouvement_stock
  ADD CONSTRAINT fk_mouvement_stock_article 
  FOREIGN KEY (id_article) 
  REFERENCES article(id_article);

ALTER TABLE reglement
  ADD CONSTRAINT fk_reglement_facture 
  FOREIGN KEY (id_facture) 
  REFERENCES facture(id_facture);

ALTER TABLE signalement_bug
  ADD CONSTRAINT fk_signalement_bug_utilisateur 
  FOREIGN KEY (id_utilisateur) 
  REFERENCES utilisateur(id_utilisateur) 
  ON DELETE CASCADE;

