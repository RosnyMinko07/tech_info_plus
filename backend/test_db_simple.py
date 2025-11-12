#!/usr/bin/env python3
"""
Script ultra-simple pour tester la connexion à Supabase
"""

import os
import psycopg2
from urllib.parse import urlparse

# Votre URL Supabase
DATABASE_URL = "postgresql://postgres:jojo%409999@db.wcianircmewxqrbsmmvo.supabase.co:5432/postgres"

print("=" * 60)
print("TEST DE CONNEXION SUPABASE")
print("=" * 60)

# Parser l'URL
url = urlparse(DATABASE_URL)
print(f"\n📡 Connexion à:")
print(f"   Host: {url.hostname}")
print(f"   Port: {url.port}")
print(f"   Database: {url.path[1:]}")
print(f"   User: {url.username}")
print(f"   Password: {'*' * len(url.password)}")

try:
    print("\n🔌 Tentative de connexion...")
    conn = psycopg2.connect(DATABASE_URL)
    print("✅ CONNEXION RÉUSSIE !")
    
    # Tester une requête
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    version = cursor.fetchone()
    print(f"\n✅ PostgreSQL version: {version[0]}")
    
    # Vérifier les tables
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)
    tables = cursor.fetchall()
    print(f"\n✅ Tables trouvées ({len(tables)}):")
    for table in tables:
        print(f"   - {table[0]}")
    
    cursor.close()
    conn.close()
    
    print("\n" + "=" * 60)
    print("✅ TOUT FONCTIONNE ! La base de données est OK.")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ ERREUR DE CONNEXION:")
    print(f"   {type(e).__name__}: {e}")
    print("\n" + "=" * 60)
    print("❌ LA CONNEXION A ÉCHOUÉ !")
    print("=" * 60)
    print("\nVérifiez:")
    print("1. Que Supabase est bien actif")
    print("2. Que le mot de passe est correct")
    print("3. Que l'IP est autorisée dans Supabase")







