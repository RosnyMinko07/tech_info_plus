-- Migration pour agrandir le champ image_path
-- De VARCHAR(255) à LONGTEXT pour stocker les images Base64

-- Pour MySQL/MariaDB
ALTER TABLE article MODIFY COLUMN image_path LONGTEXT;

-- Vérifier la modification
DESCRIBE article;

-- Pour PostgreSQL/Supabase (si nécessaire)
-- ALTER TABLE article ALTER COLUMN image_path TYPE TEXT;

