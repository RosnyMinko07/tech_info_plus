#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test de connexion à Supabase PostgreSQL
"""
import os
import psycopg2

# Récupérer DATABASE_URL depuis l'environnement
DATABASE_URL = os.getenv('DATABASE_URL')

print("="*70)
print("TEST DE CONNEXION SUPABASE")
print("="*70)
print()

if not DATABASE_URL:
    print("❌ DATABASE_URL n'est pas défini !")
    print("   Vérifiez les variables d'environnement sur Render")
    exit(1)

print(f"✅ DATABASE_URL trouvé")
print(f"   Format: {DATABASE_URL[:30]}...{DATABASE_URL[-20:]}")
print()

print("📦 Tentative de connexion à Supabase...")
try:
    conn = psycopg2.connect(DATABASE_URL)
    print("✅ CONNEXION RÉUSSIE !")
    print()
    
    # Test simple : compter les tables
    cursor = conn.cursor()
    cursor.execute("""
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    """)
    count = cursor.fetchone()[0]
    print(f"📊 Nombre de tables trouvées: {count}")
    
    # Vérifier si la table utilisateur existe
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'utilisateur'
        )
    """)
    user_table_exists = cursor.fetchone()[0]
    
    if user_table_exists:
        print("✅ Table 'utilisateur' existe")
        
        # Compter les utilisateurs
        cursor.execute("SELECT COUNT(*) FROM utilisateur")
        user_count = cursor.fetchone()[0]
        print(f"👥 Nombre d'utilisateurs: {user_count}")
        
        if user_count == 0:
            print("⚠️  ATTENTION: Aucun utilisateur dans la base !")
            print("   Vous devez exécuter CREER_ADMIN_SUPABASE.sql")
    else:
        print("❌ Table 'utilisateur' n'existe pas !")
        print("   Vous devez exécuter backend/supabase_schema.sql sur Supabase")
    
    cursor.close()
    conn.close()
    print()
    print("="*70)
    print("✅ TEST TERMINÉ AVEC SUCCÈS")
    print("="*70)
    
except Exception as e:
    print(f"❌ ERREUR DE CONNEXION: {e}")
    print()
    print("Causes possibles:")
    print("1. DATABASE_URL mal formaté")
    print("2. Mot de passe incorrect")
    print("3. Hôte Supabase inaccessible depuis Render")
    print("4. Firewall bloquant la connexion")
    print()
    print("="*70)
    exit(1)

