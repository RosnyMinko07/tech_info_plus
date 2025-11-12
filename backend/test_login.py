#!/usr/bin/env python3
"""
Script pour tester l'authentification et débugger le problème 401
"""

import os
from passlib.hash import bcrypt
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# URL Supabase
DATABASE_URL = "postgresql://postgres:jojo%409999@db.wcianircmewxqrbsmmvo.supabase.co:5432/postgres"

print("=" * 70)
print("TEST D'AUTHENTIFICATION")
print("=" * 70)

# Connexion à la base
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print("\n🔍 Étape 1 : Vérifier si l'admin existe")
print("-" * 70)

result = db.execute(text("""
    SELECT 
        id_utilisateur,
        nom_utilisateur,
        email,
        role,
        statut,
        actif,
        LEFT(mot_de_passe, 30) as mot_de_passe_debut,
        LENGTH(mot_de_passe) as longueur_mdp
    FROM utilisateur 
    WHERE nom_utilisateur = 'admin'
"""))

user = result.fetchone()

if not user:
    print("❌ AUCUN UTILISATEUR 'admin' TROUVÉ !")
    print("\n💡 L'utilisateur n'existe pas dans la base.")
    print("   Exécutez le script SQL CREER_ADMIN_SUPABASE_UUID.sql sur Supabase !")
    db.close()
    exit(1)

print(f"✅ Utilisateur trouvé:")
print(f"   ID: {user[0]}")
print(f"   Username: {user[1]}")
print(f"   Email: {user[2]}")
print(f"   Role: {user[3]}")
print(f"   Statut: {user[4]}")
print(f"   Actif: {user[5]}")
print(f"   Hash début: {user[6]}")
print(f"   Longueur hash: {user[7]} caractères")

# Vérifier le champ actif
if not user[5]:
    print("\n❌ PROBLÈME : Le compte est DÉSACTIVÉ (actif=False)")
    db.close()
    exit(1)

print("\n🔍 Étape 2 : Récupérer le hash complet du mot de passe")
print("-" * 70)

result = db.execute(text("""
    SELECT mot_de_passe 
    FROM utilisateur 
    WHERE nom_utilisateur = 'admin'
"""))

user_password_hash = result.fetchone()[0]
print(f"Hash stocké dans la DB:\n{user_password_hash}")

print("\n🔍 Étape 3 : Tester la vérification du mot de passe")
print("-" * 70)

test_password = "admin123"
print(f"Mot de passe testé: {test_password}")

try:
    print("\n⏳ Vérification avec bcrypt.verify()...")
    is_valid = bcrypt.verify(test_password, user_password_hash)
    
    if is_valid:
        print("✅ MOT DE PASSE CORRECT !")
        print("\n🎉 L'AUTHENTIFICATION DEVRAIT FONCTIONNER !")
    else:
        print("❌ MOT DE PASSE INCORRECT !")
        print("\n💡 Le hash dans la base ne correspond pas à 'admin123'")
        print("   Solutions:")
        print("   1. Vérifiez que vous avez bien exécuté le bon script SQL")
        print("   2. Réessayez de créer l'utilisateur avec CREER_ADMIN_SUPABASE_UUID.sql")
        
except Exception as e:
    print(f"❌ ERREUR lors de la vérification: {e}")
    print(f"   Type: {type(e).__name__}")

print("\n🔍 Étape 4 : Générer un nouveau hash pour comparaison")
print("-" * 70)

new_hash = bcrypt.hash(test_password)
print(f"Nouveau hash généré:\n{new_hash}")
print(f"\nHash attendu:\n$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QzKz2K")

print("\n" + "=" * 70)
print("FIN DU TEST")
print("=" * 70)

db.close()







