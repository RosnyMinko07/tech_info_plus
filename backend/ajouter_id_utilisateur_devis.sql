-- Ajouter la colonne id_utilisateur à la table devis
ALTER TABLE `devis` 
ADD COLUMN `id_utilisateur` INT NULL AFTER `id_client`,
ADD FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur`(`id_utilisateur`) ON DELETE SET NULL;

-- Mettre à jour les devis existants avec l'utilisateur admin (ID: 1) par défaut
UPDATE `devis` SET `id_utilisateur` = 1 WHERE `id_utilisateur` IS NULL;


