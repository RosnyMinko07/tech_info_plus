-- Script d'initialisation de la base de données Tech Info Plus
-- Ce script crée toutes les tables nécessaires pour l'application

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ==================== TABLE ENTREPRISE ====================
CREATE TABLE IF NOT EXISTS `entreprise` (
  `id_entreprise` INT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(255) NOT NULL,
  `adresse` TEXT,
  `telephone` VARCHAR(50),
  `email` VARCHAR(255),
  `nif` VARCHAR(100),
  `logo_path` LONGTEXT,
  `taux_tva` FLOAT DEFAULT 9.5,
  `devise` VARCHAR(10) DEFAULT 'FCFA',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLE UTILISATEUR ====================
CREATE TABLE IF NOT EXISTS `utilisateur` (
  `id_utilisateur` INT AUTO_INCREMENT PRIMARY KEY,
  `nom_utilisateur` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) UNIQUE,
  `mot_de_passe` VARCHAR(255) NOT NULL,
  `role` VARCHAR(20) NOT NULL,
  `statut` VARCHAR(20),
  `telephone` VARCHAR(20),
  `actif` BOOLEAN DEFAULT TRUE,
  `droits` TEXT,
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLE CLIENT ====================
CREATE TABLE IF NOT EXISTS `client` (
  `id_client` INT AUTO_INCREMENT PRIMARY KEY,
  `numero_client` VARCHAR(20) UNIQUE,
  `nom` VARCHAR(100) NOT NULL,
  `type_client` VARCHAR(20),
  `ville` VARCHAR(50),
  `telephone` VARCHAR(20),
  `email` VARCHAR(100),
  `nif` VARCHAR(20),
  `adresse` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLE FOURNISSEUR ====================
CREATE TABLE IF NOT EXISTS `fournisseur` (
  `id_fournisseur` INT AUTO_INCREMENT PRIMARY KEY,
  `numero_fournisseur` VARCHAR(20),
  `nom_fournisseur` VARCHAR(100) NOT NULL,
  `adresse` TEXT,
  `telephone` VARCHAR(20),
  `email` VARCHAR(100),
  `pays` VARCHAR(50),
  `nif` VARCHAR(20),
  `ville` VARCHAR(50),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLE ARTICLE ====================
CREATE TABLE IF NOT EXISTS `article` (
  `id_article` INT AUTO_INCREMENT PRIMARY KEY,
  `code_article` VARCHAR(50) UNIQUE,
  `designation` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `type_article` VARCHAR(20) DEFAULT 'PRODUIT',
  `prix_achat` FLOAT DEFAULT 0.0,
  `prix_vente` FLOAT DEFAULT 0.0,
  `prix_service` FLOAT,
  `stock_initial` INT DEFAULT 0,
  `stock_actuel` INT DEFAULT 0,
  `stock_alerte` INT DEFAULT 10,
  `unite` VARCHAR(20) DEFAULT 'PIECE',
  `categorie` VARCHAR(50),
  `image_path` LONGTEXT,
  `actif` BOOLEAN DEFAULT TRUE,
  `id_fournisseur` INT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_fournisseur`) REFERENCES `fournisseur`(`id_fournisseur`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLE DEVIS ====================
CREATE TABLE IF NOT EXISTS `devis` (
  `id_devis` INT AUTO_INCREMENT PRIMARY KEY,
  `numero_devis` VARCHAR(20) UNIQUE NOT NULL,
  `id_client` INT NOT NULL,
  `date_devis` DATE NOT NULL,
  `date_validite` DATE,
  `validite` INT DEFAULT 30,
  `description` TEXT,
  `total_ht` FLOAT DEFAULT 0,
  `total_tva` FLOAT DEFAULT 0,
  `total_ttc` FLOAT DEFAULT 0,
  `precompte_applique` INT DEFAULT 0,
  `statut` VARCHAR(20) DEFAULT 'En attente',
  `notes` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_client`) REFERENCES `client`(`id_client`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLE LIGNE_DEVIS ====================
CREATE TABLE IF NOT EXISTS `ligne_devis` (
  `id_ligne` INT AUTO_INCREMENT PRIMARY KEY,
  `id_devis` INT NOT NULL,
  `id_article` INT NOT NULL,
  `quantite` INT NOT NULL DEFAULT 1,
  `prix_unitaire` FLOAT NOT NULL DEFAULT 0.0,
  `total_ht` FLOAT DEFAULT 0.0,
  FOREIGN KEY (`id_devis`) REFERENCES `devis`(`id_devis`) ON DELETE CASCADE,
  FOREIGN KEY (`id_article`) REFERENCES `article`(`id_article`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLE FACTURE ====================
CREATE TABLE IF NOT EXISTS `facture` (
  `id_facture` INT AUTO_INCREMENT PRIMARY KEY,
  `numero_facture` VARCHAR(20) UNIQUE NOT NULL,
  `type_facture` VARCHAR(20) DEFAULT 'NORMALE',
  `id_utilisateur` INT,
  `id_client` INT,
  `id_devis` INT,
  `date_facture` DATE NOT NULL,
  `date_echeance` DATE,
  `total_ht` FLOAT DEFAULT 0.0,
  `total_tva` FLOAT DEFAULT 0.0,
  `total_ttc` FLOAT DEFAULT 0.0,
  `montant_avance` FLOAT DEFAULT 0.0,
  `montant_reste` FLOAT DEFAULT 0.0,
  `precompte_applique` INT DEFAULT 0,
  `statut` VARCHAR(20) DEFAULT 'En attente',
  `mode_paiement` VARCHAR(20),
  `description` VARCHAR(255),
  `notes` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur`(`id_utilisateur`) ON DELETE SET NULL,
  FOREIGN KEY (`id_client`) REFERENCES `client`(`id_client`) ON DELETE SET NULL,
  FOREIGN KEY (`id_devis`) REFERENCES `devis`(`id_devis`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLE LIGNE_FACTURE ====================
CREATE TABLE IF NOT EXISTS `ligne_facture` (
  `id_ligne` INT AUTO_INCREMENT PRIMARY KEY,
  `id_facture` INT NOT NULL,
  `id_article` INT NOT NULL,
  `quantite` INT NOT NULL DEFAULT 1,
  `prix_unitaire` FLOAT NOT NULL DEFAULT 0.0,
  `total_ht` FLOAT DEFAULT 0.0,
  FOREIGN KEY (`id_facture`) REFERENCES `facture`(`id_facture`) ON DELETE CASCADE,
  FOREIGN KEY (`id_article`) REFERENCES `article`(`id_article`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLE REGLEMENT ====================
CREATE TABLE IF NOT EXISTS `reglement` (
  `id_reglement` INT AUTO_INCREMENT PRIMARY KEY,
  `numero_reglement` VARCHAR(20) UNIQUE,
  `id_facture` INT NOT NULL,
  `date_reglement` DATE NOT NULL,
  `montant` FLOAT NOT NULL,
  `mode_paiement` VARCHAR(20) NOT NULL,
  `reference` VARCHAR(50),
  `notes` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_facture`) REFERENCES `facture`(`id_facture`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLE AVOIR ====================
CREATE TABLE IF NOT EXISTS `avoir` (
  `id_avoir` INT AUTO_INCREMENT PRIMARY KEY,
  `numero_avoir` VARCHAR(20) UNIQUE NOT NULL,
  `id_facture` INT NOT NULL,
  `date_avoir` DATE NOT NULL,
  `motif` TEXT,
  `montant` FLOAT DEFAULT 0.0,
  `statut` VARCHAR(20) DEFAULT 'EN_ATTENTE',
  `notes` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_facture`) REFERENCES `facture`(`id_facture`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLE LIGNE_AVOIR ====================
CREATE TABLE IF NOT EXISTS `ligne_avoir` (
  `id_ligne` INT AUTO_INCREMENT PRIMARY KEY,
  `id_avoir` INT NOT NULL,
  `id_article` INT NOT NULL,
  `code_article` VARCHAR(50),
  `designation` VARCHAR(255),
  `quantite` INT NOT NULL DEFAULT 1,
  `prix_unitaire` FLOAT NOT NULL DEFAULT 0.0,
  `montant_ht` FLOAT DEFAULT 0.0,
  FOREIGN KEY (`id_avoir`) REFERENCES `avoir`(`id_avoir`) ON DELETE CASCADE,
  FOREIGN KEY (`id_article`) REFERENCES `article`(`id_article`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLE MOUVEMENT_STOCK ====================
CREATE TABLE IF NOT EXISTS `mouvement_stock` (
  `id_mouvement` INT AUTO_INCREMENT PRIMARY KEY,
  `id_article` INT NOT NULL,
  `type_mouvement` VARCHAR(20) NOT NULL,
  `quantite` INT NOT NULL,
  `date_mouvement` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `reference` VARCHAR(50),
  `notes` TEXT,
  `id_utilisateur` INT,
  FOREIGN KEY (`id_article`) REFERENCES `article`(`id_article`) ON DELETE CASCADE,
  FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur`(`id_utilisateur`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLE SIGNALEMENT_BUG ====================
CREATE TABLE IF NOT EXISTS `signalement_bug` (
  `id_signalement` INT AUTO_INCREMENT PRIMARY KEY,
  `titre` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `module` VARCHAR(50),
  `priorite` VARCHAR(20) DEFAULT 'MOYENNE',
  `statut` VARCHAR(20) DEFAULT 'NOUVEAU',
  `id_utilisateur` INT,
  `date_signalement` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `date_resolution` DATETIME,
  `notes_resolution` TEXT,
  FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur`(`id_utilisateur`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== DONNÉES INITIALES ====================

-- Insérer une entreprise par défaut
INSERT INTO `entreprise` (`nom`, `adresse`, `telephone`, `email`, `nif`, `taux_tva`, `devise`) 
VALUES ('TECH INFO PLUS', 'Bujumbura, Burundi', '+257 00 00 00 00', 'contact@techinfoplus.bi', 'NIF-XXXXXXXX', 9.5, 'FCFA')
ON DUPLICATE KEY UPDATE `nom`='TECH INFO PLUS';

-- Insérer un utilisateur administrateur par défaut (mot de passe: admin123)
-- Hash bcrypt de 'admin123': $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKfN8kJm6
INSERT INTO `utilisateur` (`nom_utilisateur`, `email`, `mot_de_passe`, `role`, `statut`, `actif`, `droits`) 
VALUES ('admin', 'admin@techinfoplus.bi', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKfN8kJm6', 'ADMIN', 'actif', TRUE, '{"tous": true}')
ON DUPLICATE KEY UPDATE `role`='ADMIN';

-- Insérer un client par défaut
INSERT INTO `client` (`numero_client`, `nom`, `type_client`, `ville`, `telephone`, `email`) 
VALUES ('CLI-0001', 'Client Comptoir', 'particulier', 'Bujumbura', '+257 00 00 00 00', 'comptoir@techinfoplus.bi')
ON DUPLICATE KEY UPDATE `nom`='Client Comptoir';

-- Message de confirmation
SELECT 'Base de données initialisée avec succès!' AS message;
