#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de migration pour ajouter les colonnes manquantes à la table article
"""

import pymysql
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv('config.env')

def migrer_table_article():
    """Ajoute les colonnes manquantes à la table article"""
    
    try:
        # Connexion à MySQL
        connexion = pymysql.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'tech_info_plus'),
            charset='utf8mb4'
        )
        
        cursor = connexion.cursor()
        
        print("Migration de la table 'article'...")
        
        # Liste des colonnes à ajouter
        colonnes = [
            ("type_article", "VARCHAR(20) DEFAULT 'PRODUIT' AFTER description"),
            ("actif", "BOOLEAN DEFAULT TRUE AFTER image_path")
        ]
        
        for nom_colonne, definition in colonnes:
            try:
                # Vérifier si la colonne existe déjà
                cursor.execute(f"""
                    SELECT COUNT(*) 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = '{os.getenv('DB_NAME', 'tech_info_plus')}' 
                    AND TABLE_NAME = 'article' 
                    AND COLUMN_NAME = '{nom_colonne}'
                """)
                
                existe = cursor.fetchone()[0]
                
                if existe == 0:
                    # Ajouter la colonne
                    cursor.execute(f"ALTER TABLE article ADD COLUMN {nom_colonne} {definition}")
                    connexion.commit()
                    print(f"  OK Colonne '{nom_colonne}' ajoutee")
                else:
                    print(f"  INFO Colonne '{nom_colonne}' existe deja")
            
            except Exception as e:
                print(f"  WARN Erreur pour '{nom_colonne}': {e}")
        
        # Mettre à jour les articles existants pour avoir type_article = 'PRODUIT'
        try:
            cursor.execute("""
                UPDATE article 
                SET type_article = 'PRODUIT' 
                WHERE type_article IS NULL OR type_article = ''
            """)
            connexion.commit()
            print("  OK Articles existants mis a jour avec type_article = 'PRODUIT'")
        except Exception as e:
            print(f"  WARN Erreur mise a jour: {e}")
        
        # Mettre à jour actif = TRUE pour tous les articles existants
        try:
            cursor.execute("""
                UPDATE article 
                SET actif = TRUE 
                WHERE actif IS NULL
            """)
            connexion.commit()
            print("  OK Articles existants mis a jour avec actif = TRUE")
        except Exception as e:
            print(f"  WARN Erreur mise a jour actif: {e}")
        
        cursor.close()
        connexion.close()
        
        print("\nOK Migration terminee avec succes !")
        print("\nVous pouvez maintenant creer des articles.")
        
    except Exception as e:
        print(f"\nERREUR de migration: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("Demarrage de la migration de la table article...")
    print("="*60)
    migrer_table_article()
    print("="*60)

