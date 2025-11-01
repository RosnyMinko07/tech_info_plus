#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour ajouter la colonne id_utilisateur à la table devis
"""

from sqlalchemy import text
from database_mysql import get_db

def ajouter_id_utilisateur_devis():
    """Ajouter la colonne id_utilisateur à la table devis"""
    db = next(get_db())
    
    try:
        # Vérifier si la colonne existe déjà
        result = db.execute(text("SHOW COLUMNS FROM devis LIKE 'id_utilisateur'"))
        if result.fetchone():
            print("✅ La colonne id_utilisateur existe déjà dans la table devis")
            return
        
        # Ajouter la colonne
        print("📝 Ajout de la colonne id_utilisateur à la table devis...")
        db.execute(text("""
            ALTER TABLE devis 
            ADD COLUMN id_utilisateur INT NULL AFTER id_client,
            ADD FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE SET NULL
        """))
        
        # Mettre à jour les devis existants
        print("📝 Mise à jour des devis existants avec l'utilisateur admin (ID: 1)...")
        db.execute(text("UPDATE devis SET id_utilisateur = 1 WHERE id_utilisateur IS NULL"))
        
        db.commit()
        
        print("✅ Colonne id_utilisateur ajoutée avec succès")
        print("   Tous les devis existants ont été assignés à l'utilisateur admin")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur lors de l'ajout de la colonne: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("MIGRATION: Ajout id_utilisateur à la table devis")
    print("=" * 60)
    ajouter_id_utilisateur_devis()
    print("=" * 60)

