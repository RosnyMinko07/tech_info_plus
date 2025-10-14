#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de lancement du serveur FastAPI
"""

import os
import sys
from database_mysql import init_database, SessionLocal, Utilisateur
from passlib.hash import bcrypt

def create_admin_user():
    """
    Crée un utilisateur admin par défaut si nécessaire
    """
    try:
        db = SessionLocal()
        
        # Vérifier si admin existe
        admin = db.query(Utilisateur).filter(Utilisateur.nom_utilisateur == "admin").first()
        
        if not admin:
            print("📝 Création de l'utilisateur admin...")
            
            # Créer admin
            hashed_password = bcrypt.hash("admin123")
            admin = Utilisateur(
                nom_utilisateur="admin",
                mot_de_passe=hashed_password,
                role="Administrateur",
                email="admin@techinfoplus.ga",
                actif=True,
                droits="tous"
            )
            db.add(admin)
            db.commit()
            print("✅ Utilisateur admin créé (login: admin / password: admin123)")
        else:
            print("✅ Utilisateur admin existe déjà")
        
        db.close()
        return True
    except Exception as e:
        print(f"❌ Erreur création admin : {e}")
        return False


def main():
    """
    Fonction principale
    """
    print("=" * 80)
    print("🚀 TECH INFO PLUS - DÉMARRAGE BACKEND")
    print("=" * 80)
    
    # 1. Initialiser la base de données
    if not init_database():
        print("❌ Échec initialisation base de données")
        return False
    
    # 2. Créer l'utilisateur admin
    if not create_admin_user():
        print("❌ Échec création utilisateur admin")
        return False
    
    # 3. Démarrer le serveur
    print("\n" + "=" * 80)
    print("🌐 DÉMARRAGE DU SERVEUR...")
    print("=" * 80)
    print("📍 Backend: http://localhost:8000")
    print("📚 Documentation: http://localhost:8000/docs")
    print("=" * 80)
    print("\n⏳ Appuyez sur CTRL+C pour arrêter le serveur\n")
    
    # Lancer uvicorn
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )


if __name__ == "__main__":
    main()

