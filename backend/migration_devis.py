#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de migration pour ajouter les colonnes manquantes à la table devis
"""

import pymysql
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv('config.env')

def migrer_table_devis():
    """Ajoute les colonnes manquantes à la table devis"""
    
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
        
        print("Migration de la table 'devis'...")
        
        # Liste des colonnes à ajouter
        colonnes = [
            ("validite", "INT DEFAULT 30 AFTER date_validite"),
            ("description", "TEXT AFTER validite"),
            ("precompte_applique", "INT DEFAULT 0 AFTER notes")
        ]
        
        for nom_colonne, definition in colonnes:
            try:
                # Vérifier si la colonne existe déjà
                cursor.execute(f"""
                    SELECT COUNT(*) 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = '{os.getenv('DB_NAME', 'tech_info_plus')}' 
                    AND TABLE_NAME = 'devis' 
                    AND COLUMN_NAME = '{nom_colonne}'
                """)
                
                existe = cursor.fetchone()[0]
                
                if existe == 0:
                    # Ajouter la colonne
                    cursor.execute(f"ALTER TABLE devis ADD COLUMN {nom_colonne} {definition}")
                    connexion.commit()
                    print(f"  OK Colonne '{nom_colonne}' ajoutee")
                else:
                    print(f"  INFO Colonne '{nom_colonne}' existe deja")
            
            except Exception as e:
                print(f"  WARN Erreur pour '{nom_colonne}': {e}")
        
        # Mettre à jour les devis existants
        try:
            cursor.execute("""
                UPDATE devis 
                SET validite = 30 
                WHERE validite IS NULL
            """)
            connexion.commit()
            print("  OK Devis existants mis a jour avec validite = 30")
        except Exception as e:
            print(f"  WARN Erreur mise a jour validite: {e}")
        
        try:
            cursor.execute("""
                UPDATE devis 
                SET precompte_applique = 0 
                WHERE precompte_applique IS NULL
            """)
            connexion.commit()
            print("  OK Devis existants mis a jour avec precompte_applique = 0")
        except Exception as e:
            print(f"  WARN Erreur mise a jour precompte: {e}")
        
        # Mettre à jour description depuis notes si vide
        try:
            cursor.execute("""
                UPDATE devis 
                SET description = notes 
                WHERE description IS NULL AND notes IS NOT NULL
            """)
            connexion.commit()
            print("  OK Descriptions mises a jour depuis notes")
        except Exception as e:
            print(f"  WARN Erreur mise a jour description: {e}")
        
        cursor.close()
        connexion.close()
        
        print("\nOK Migration terminee avec succes !")
        print("\nVous pouvez maintenant creer des devis.")
        
    except Exception as e:
        print(f"\nERREUR de migration: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("Demarrage de la migration de la table devis...")
    print("="*60)
    migrer_table_devis()
    print("="*60)

