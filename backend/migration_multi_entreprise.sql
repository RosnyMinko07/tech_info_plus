-- ============================================================
-- MIGRATION SaaS - ÉTAPE 1 : MULTI-ENTREPRISE (multi-tenant)
-- ============================================================
-- Compatible PostgreSQL / Supabase. À exécuter dans le SQL Editor.
--
-- Ce script :
--   1. S'assure qu'une entreprise existe (Tech Info Plus) et ajoute
--      les colonnes SaaS à la table entreprise (slug, statut, ...)
--   2. Ajoute id_entreprise dans toutes les tables métier (16 tables)
--   3. Rattache toutes les données existantes à cette entreprise
--   4. Met id_entreprise en NOT NULL + clé étrangère + index
--   5. Rend les numéros (facture, devis, ...) uniques PAR entreprise
--
-- IMPORTANT :
--   - Faire une SAUVEGARDE avant (Supabase > Database > Backups).
--   - Le script est idempotent : on peut le relancer sans casse.
--   - TRANSITION : un DEFAULT temporaire (= l'entreprise existante) est
--     posé sur id_entreprise pour que l'ancien backend continue de
--     fonctionner. Il sera retiré à l'étape 2 (voir fin du fichier).
--   - nom_utilisateur et email restent uniques GLOBALEMENT (login).
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Table entreprise : colonnes SaaS + entreprise par défaut
-- ------------------------------------------------------------
ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS slug VARCHAR(60);
ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS statut VARCHAR(20) NOT NULL DEFAULT 'ACTIF';
ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS date_fin_essai TIMESTAMP NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_entreprise_slug') THEN
        ALTER TABLE entreprise ADD CONSTRAINT uq_entreprise_slug UNIQUE (slug);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_entreprise_statut') THEN
        ALTER TABLE entreprise ADD CONSTRAINT ck_entreprise_statut
            CHECK (statut IN ('ESSAI', 'ACTIF', 'SUSPENDU', 'RESILIE'));
    END IF;
END $$;

-- Créer l'entreprise d'origine si la table est vide
INSERT INTO entreprise (nom, slug, statut)
SELECT 'Tech Info Plus', 'tech-info-plus', 'ACTIF'
WHERE NOT EXISTS (SELECT 1 FROM entreprise);

-- Donner un slug à l'entreprise d'origine si elle n'en a pas
UPDATE entreprise
SET slug = 'tech-info-plus'
WHERE id_entreprise = (SELECT MIN(id_entreprise) FROM entreprise)
  AND slug IS NULL
  AND NOT EXISTS (SELECT 1 FROM entreprise WHERE slug = 'tech-info-plus');

-- ------------------------------------------------------------
-- 2 à 4. id_entreprise dans chaque table métier
-- ------------------------------------------------------------
DO $$
DECLARE
    v_ent    INTEGER := (SELECT MIN(id_entreprise) FROM entreprise);
    v_table  TEXT;
    v_tables TEXT[] := ARRAY[
        'utilisateur', 'client', 'fournisseur', 'article',
        'devis', 'ligne_devis', 'facture', 'ligne_facture',
        'reglement', 'vente_comptoir', 'ligne_vente',
        'avoir', 'ligne_avoir', 'stock',
        'mouvement_stock', 'signalement_bug'
    ];
BEGIN
    FOREACH v_table IN ARRAY v_tables LOOP
        -- Ignorer une table absente de cette base
        IF to_regclass('public.' || v_table) IS NULL THEN
            RAISE NOTICE 'Table % absente : ignorée', v_table;
            CONTINUE;
        END IF;

        -- 2. Ajouter la colonne
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS id_entreprise INTEGER', v_table);

        -- 3. Rattacher les données existantes
        EXECUTE format('UPDATE %I SET id_entreprise = %s WHERE id_entreprise IS NULL', v_table, v_ent);

        -- 4. NOT NULL + DEFAULT temporaire + clé étrangère + index
        EXECUTE format('ALTER TABLE %I ALTER COLUMN id_entreprise SET DEFAULT %s', v_table, v_ent);
        EXECUTE format('ALTER TABLE %I ALTER COLUMN id_entreprise SET NOT NULL', v_table);

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_' || v_table || '_entreprise') THEN
            EXECUTE format(
                'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (id_entreprise)
                 REFERENCES entreprise(id_entreprise) ON DELETE RESTRICT',
                v_table, 'fk_' || v_table || '_entreprise');
        END IF;

        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (id_entreprise)',
                       'idx_' || v_table || '_entreprise', v_table);
    END LOOP;
END $$;

-- ------------------------------------------------------------
-- 5. Numéros uniques PAR entreprise (au lieu de globalement)
-- ------------------------------------------------------------
-- Supprime l'ancienne contrainte/index UNIQUE sur la colonne seule,
-- quel que soit son nom, puis crée UNIQUE (id_entreprise, colonne).
DO $$
DECLARE
    v_pair TEXT[];
    v_pairs TEXT[][] := ARRAY[
        ARRAY['article',        'code_article'],
        ARRAY['client',         'numero_client'],
        ARRAY['fournisseur',    'numero_fournisseur'],
        ARRAY['devis',          'numero_devis'],
        ARRAY['facture',        'numero_facture'],
        ARRAY['reglement',      'numero_reglement'],
        ARRAY['avoir',          'numero_avoir'],
        ARRAY['vente_comptoir', 'numero_vente']
    ];
    v_table TEXT;
    v_col   TEXT;
    v_name  TEXT;
    r       RECORD;
BEGIN
    FOREACH v_pair SLICE 1 IN ARRAY v_pairs LOOP
        v_table := v_pair[1];
        v_col   := v_pair[2];
        v_name  := 'uq_' || v_table || '_entreprise_' || v_col;

        IF to_regclass('public.' || v_table) IS NULL THEN
            CONTINUE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_schema = 'public' AND table_name = v_table AND column_name = v_col) THEN
            RAISE NOTICE 'Colonne %.% absente : ignorée', v_table, v_col;
            CONTINUE;
        END IF;

        -- a) Contraintes UNIQUE portant uniquement sur cette colonne
        FOR r IN
            SELECT c.conname
            FROM pg_constraint c
            JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
            WHERE c.conrelid = ('public.' || v_table)::regclass
              AND c.contype = 'u'
              AND array_length(c.conkey, 1) = 1
              AND a.attname = v_col
        LOOP
            EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', v_table, r.conname);
        END LOOP;

        -- b) Index UNIQUE "libres" (non liés à une contrainte) sur cette colonne seule
        FOR r IN
            SELECT ic.relname AS idxname
            FROM pg_index i
            JOIN pg_class ic ON ic.oid = i.indexrelid
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = i.indkey[0]
            WHERE i.indrelid = ('public.' || v_table)::regclass
              AND i.indisunique
              AND NOT i.indisprimary
              AND i.indnatts = 1
              AND a.attname = v_col
              AND NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = i.indexrelid)
        LOOP
            EXECUTE format('DROP INDEX %I', r.idxname);
        END LOOP;

        -- c) Nouvelle contrainte composite
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = v_name) THEN
            EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I UNIQUE (id_entreprise, %I)',
                           v_table, v_name, v_col);
        END IF;
    END LOOP;
END $$;

-- ------------------------------------------------------------
-- Vérification : nombre de lignes par table et par entreprise
-- ------------------------------------------------------------
DO $$
DECLARE
    v_table TEXT;
    v_total BIGINT;
    v_null  BIGINT;
BEGIN
    FOR v_table IN
        SELECT table_name FROM information_schema.columns
        WHERE table_schema = 'public' AND column_name = 'id_entreprise' AND table_name <> 'entreprise'
        ORDER BY table_name
    LOOP
        EXECUTE format('SELECT COUNT(*), COUNT(*) FILTER (WHERE id_entreprise IS NULL) FROM %I', v_table)
            INTO v_total, v_null;
        RAISE NOTICE '% : % lignes, % sans entreprise', rpad(v_table, 18), v_total, v_null;
    END LOOP;
END $$;

COMMIT;

-- ============================================================
-- À EXÉCUTER PLUS TARD (fin de l'étape 2, quand le backend
-- renseigne lui-même id_entreprise à chaque INSERT) :
-- retirer le DEFAULT temporaire pour qu'un oubli dans le code
-- provoque une erreur au lieu d'une fuite de données.
-- ============================================================
-- DO $$
-- DECLARE v_table TEXT;
-- BEGIN
--     FOR v_table IN
--         SELECT table_name FROM information_schema.columns
--         WHERE table_schema = 'public' AND column_name = 'id_entreprise' AND table_name <> 'entreprise'
--     LOOP
--         EXECUTE format('ALTER TABLE %I ALTER COLUMN id_entreprise DROP DEFAULT', v_table);
--     END LOOP;
-- END $$;
