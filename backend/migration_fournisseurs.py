#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Migration : Attribuer des numéros automatiques aux fournisseurs existants
"""

from database_mysql import get_db, Fournisseur
from datetime import datetime

def migrer_fournisseurs():
    """Attribuer des numéros automatiques aux fournisseurs sans numéro"""
    
    # Obtenir une session de base de données
    db = next(get_db())
    
    try:
        # Récupérer tous les fournisseurs sans numéro
        fournisseurs_sans_numero = db.query(Fournisseur).filter(
            Fournisseur.numero_fournisseur.is_(None)
        ).order_by(Fournisseur.id_fournisseur).all()
        
        if not fournisseurs_sans_numero:
            print("✅ Aucun fournisseur sans numéro trouvé.")
            return
        
        print(f"📋 Trouvé {len(fournisseurs_sans_numero)} fournisseur(s) sans numéro")
        
        # Attribuer un numéro à chacun
        year = datetime.now().year
        compteur = 1
        
        for fournisseur in fournisseurs_sans_numero:
            numero = f"FOUR-{year}-{compteur:03d}"
            fournisseur.numero_fournisseur = numero
            print(f"  ✅ {fournisseur.nom_fournisseur} → {numero}")
            compteur += 1
        
        # Sauvegarder les modifications
        db.commit()
        print(f"\n🎉 Migration terminée ! {len(fournisseurs_sans_numero)} fournisseur(s) mis à jour.")
        
    except Exception as e:
        print(f"❌ Erreur lors de la migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 MIGRATION DES FOURNISSEURS")
    print("=" * 60)
    migrer_fournisseurs()
    print("=" * 60)


