-- ============================================================
-- MIGRATION : Ajout de la traçabilité (dernière connexion + qui a supprimé)
-- ============================================================
-- 
-- Compatible PostgreSQL/Supabase
-- Ce script ajoute :
-- 1. Le champ derniere_connexion dans la table utilisateur
-- 2. Les champs supprime_par et date_suppression dans la table article
--
-- ============================================================

-- 1. Ajouter le champ derniere_connexion dans utilisateur (si n'existe pas)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'utilisateur' AND column_name = 'derniere_connexion'
    ) THEN
        ALTER TABLE utilisateur 
        ADD COLUMN derniere_connexion TIMESTAMP NULL;
    END IF;
END $$;

-- 2. Ajouter les champs de traçabilité dans article (si n'existent pas)
DO $$ 
BEGIN
    -- Ajouter supprime_par
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'article' AND column_name = 'supprime_par'
    ) THEN
        ALTER TABLE article 
        ADD COLUMN supprime_par INTEGER NULL;
    END IF;
    
    -- Ajouter date_suppression
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'article' AND column_name = 'date_suppression'
    ) THEN
        ALTER TABLE article 
        ADD COLUMN date_suppression TIMESTAMP NULL;
    END IF;
END $$;

-- 3. Ajouter la clé étrangère pour supprime_par (si n'existe pas)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_article_supprime_par'
    ) THEN
        ALTER TABLE article 
        ADD CONSTRAINT fk_article_supprime_par 
        FOREIGN KEY (supprime_par) REFERENCES utilisateur(id_utilisateur) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================
-- ✅ Migration terminée
-- ============================================================
-- 
-- Les nouveaux champs sont maintenant disponibles :
-- - utilisateur.derniere_connexion : Dernière heure de connexion
-- - article.supprime_par : ID de l'utilisateur qui a supprimé
-- - article.date_suppression : Date de suppression
--
-- ============================================================

