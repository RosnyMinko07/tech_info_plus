#!/usr/bin/env python3
"""
Générer un hash bcrypt compatible pour le mot de passe admin
"""

from passlib.hash import bcrypt

password = "admin123"

print("=" * 70)
print("GÉNÉRATION DE HASH BCRYPT POUR ADMIN")
print("=" * 70)

print(f"\nMot de passe : {password}")
print("\n⏳ Génération du hash avec passlib...")

# Générer le hash avec passlib (comme le backend)
hash_password = bcrypt.hash(password)

print(f"\n✅ Hash généré :\n{hash_password}")

print("\n" + "=" * 70)
print("SCRIPT SQL À EXÉCUTER SUR SUPABASE :")
print("=" * 70)

sql_script = f"""
-- Supprimer l'ancien admin
DELETE FROM utilisateur WHERE nom_utilisateur = 'admin';

-- Créer l'admin avec le nouveau hash
INSERT INTO utilisateur (
    nom_utilisateur,
    email,
    mot_de_passe,
    role,
    statut,
    actif,
    droits,
    date_creation,
    created_at
) VALUES (
    'admin',
    'admin@techinfoplus.com',
    '{hash_password}',
    'ADMIN',
    'ACTIF',
    true,
    '{{"all": true}}',
    NOW(),
    NOW()
);

-- Vérifier
SELECT nom_utilisateur, email, role, statut, actif FROM utilisateur WHERE nom_utilisateur = 'admin';
"""

print(sql_script)

print("\n" + "=" * 70)
print("INSTRUCTIONS :")
print("=" * 70)
print("1. Copiez le script SQL ci-dessus")
print("2. Allez sur Supabase SQL Editor")
print("3. Collez et exécutez le script")
print("4. Essayez de vous connecter avec :")
print("   Username: admin")
print("   Password: admin123")
print("=" * 70)

# Vérifier que le hash fonctionne
print("\n🧪 Test de vérification :")
is_valid = bcrypt.verify(password, hash_password)
print(f"   Hash valide : {is_valid} {'✅' if is_valid else '❌'}")







