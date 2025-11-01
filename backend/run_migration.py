#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MIGRATION AUTOMATIQUE - Exécution avec DATABASE_URL prédéfini
"""

import pymysql
import psycopg2
from psycopg2.extras import execute_values
import os
from dotenv import load_dotenv
from datetime import datetime
from urllib.parse import quote_plus

# Charger les variables d'environnement
load_dotenv('config.env')

# Configuration MySQL (source)
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_PORT = int(os.getenv('MYSQL_PORT', '3306'))
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'tech_info_plus')

# Configuration PostgreSQL Supabase (destination)
# Encoder le mot de passe pour gérer les caractères spéciaux
password = "jojo@9999"
encoded_password = quote_plus(password)
SUPABASE_URL = f"postgresql://postgres:{encoded_password}@db.wcianircmewxqrbsmmvo.supabase.co:5432/postgres"

print("\n" + "="*70)
print("MIGRATION MYSQL → SUPABASE POSTGRESQL")
print("="*70 + "\n")

# Connexion MySQL
print("📦 Connexion à MySQL...")
try:
    mysql_conn = pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DATABASE,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
    print("✅ Connexion MySQL réussie\n")
except Exception as e:
    print(f"❌ Erreur connexion MySQL: {e}")
    exit(1)

# Connexion PostgreSQL
print("📦 Connexion à Supabase PostgreSQL...")
try:
    pg_conn = psycopg2.connect(
        host="db.wcianircmewxqrbsmmvo.supabase.co",
        port=5432,
        user="postgres",
        password="jojo@9999",
        database="postgres",
        sslmode="require"
    )
    pg_conn.autocommit = False
    print("✅ Connexion Supabase réussie\n")
except Exception as e:
    print(f"❌ Erreur connexion Supabase: {e}")
    print("\nVérifiez que:")
    print("1. Votre DATABASE_URL est correct")
    print("2. Votre mot de passe ne contient pas de caractères spéciaux non échappés")
    print("3. Vous avez accès à Internet")
    exit(1)

mysql_cursor = mysql_conn.cursor()
pg_cursor = pg_conn.cursor()

# Ordre de migration (respecter les dépendances FK)
TABLES_ORDER = [
    'entreprise',
    'utilisateur',
    'fournisseur',
    'client',
    'article',
    'devis',
    'ligne_devis',
    'facture',
    'ligne_facture',
    'reglement',
    'vente_comptoir',
    'ligne_vente',
    'mouvement_stock',
    'signalement_bug'
]

def convert_value(value):
    """Convertir les valeurs MySQL vers PostgreSQL"""
    if value is None:
        return None
    if isinstance(value, (datetime,)):
        return value
    if isinstance(value, bytes):
        return value.decode('utf-8')
    return value

def migrate_table(table_name):
    """Migrer une table de MySQL vers PostgreSQL"""
    print(f"📋 Migration de la table '{table_name}'...")
    
    try:
        # Lire les données de MySQL
        mysql_cursor.execute(f"SELECT * FROM {table_name}")
        rows = mysql_cursor.fetchall()
        
        if not rows:
            print(f"   ⚠️  Table '{table_name}' vide, ignorée\n")
            return
        
        # Obtenir les noms de colonnes
        columns = list(rows[0].keys())
        
        # Préparer les données pour PostgreSQL
        values = []
        for row in rows:
            row_values = [convert_value(row[col]) for col in columns]
            values.append(tuple(row_values))
        
        # Construire la requête INSERT
        columns_str = ', '.join(columns)
        placeholders = ', '.join(['%s'] * len(columns))
        insert_query = f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})"
        
        # Insérer dans PostgreSQL
        pg_cursor.executemany(insert_query, values)
        
        # Réinitialiser la séquence pour les colonnes SERIAL
        # Trouver la colonne id principale
        id_column = None
        for col in columns:
            if col.startswith('id_'):
                id_column = col
                break
        
        if id_column:
            pg_cursor.execute(f"""
                SELECT setval(
                    pg_get_serial_sequence('{table_name}', '{id_column}'),
                    COALESCE((SELECT MAX({id_column}) FROM {table_name}), 1),
                    true
                )
            """)
        
        print(f"   ✅ {len(rows)} lignes migrées\n")
        
    except Exception as e:
        print(f"   ❌ Erreur: {e}\n")
        raise

try:
    print("🚀 Début de la migration...\n")
    
    for table in TABLES_ORDER:
        migrate_table(table)
    
    # Valider toutes les transactions
    pg_conn.commit()
    
    print("="*70)
    print("✅ MIGRATION TERMINÉE AVEC SUCCÈS !")
    print("="*70)
    print("\nToutes vos données ont été transférées vers Supabase PostgreSQL.")
    print("\n📊 RÉSUMÉ:")
    print("   - Utilisateurs: Migrés avec mots de passe")
    print("   - Clients: Migrés")
    print("   - Articles: Migrés")
    print("   - Factures/Devis: Migrés")
    print("   - Historique: Migré")
    print("\n🎯 PROCHAINES ÉTAPES:")
    print("   1. Configurer DATABASE_URL sur Render")
    print("   2. Redéployer votre backend")
    print("   3. Tester la connexion\n")
    
except Exception as e:
    print("\n" + "="*70)
    print("❌ ERREUR DURANT LA MIGRATION")
    print("="*70)
    print(f"\nErreur: {e}")
    print("\nAnnulation des modifications...")
    pg_conn.rollback()
    print("✅ Rollback effectué, aucune donnée n'a été modifiée sur Supabase\n")
    
finally:
    mysql_cursor.close()
    mysql_conn.close()
    pg_cursor.close()
    pg_conn.close()
    print("🔒 Connexions fermées\n")

