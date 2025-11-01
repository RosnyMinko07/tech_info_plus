#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Serveur d'exécution pour packaging (PyInstaller)
Ce fichier démarre l'application sans reload (compatible avec un exécutable unique).
"""
import os
import sys
from database_mysql import init_database, SessionLocal, Utilisateur
from passlib.hash import bcrypt


def create_admin_user():
    try:
        db = SessionLocal()
        admin = db.query(Utilisateur).filter(Utilisateur.nom_utilisateur == "admin").first()
        if not admin:
            print("📝 Création de l'utilisateur admin...")
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
    print("=" * 80)
    print("🚀 TECH INFO PLUS - DÉMARRAGE BACKEND (packaged)")
    print("=" * 80)

    if not init_database():
        print("❌ Échec initialisation base de données")
        return False

    if not create_admin_user():
        print("❌ Échec création utilisateur admin")
        return False

    print("\n" + "=" * 80)
    print("🌐 DÉMARRAGE DU SERVEUR... (packaged)")
    print("=" * 80)
    print("📍 Backend: http://127.0.0.1:8000")
    print("📚 Documentation: http://127.0.0.1:8000/docs")
    print("=" * 80)
    print("\n⏳ Appuyez sur CTRL+C pour arrêter le serveur\n")

    import uvicorn
    # Important: disable reload when running inside a single-file executable
    uvicorn.run(
        "app:app",
        host="127.0.0.1",
        port=8000,
        reload=False,
        log_level="info"
    )


if __name__ == "__main__":
    main()
