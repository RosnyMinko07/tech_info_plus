#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour mettre à jour les factures existantes avec l'ID utilisateur
"""

from database_mysql import get_db, Facture, Utilisateur

def migrer_id_utilisateur():
    """Mettre à jour toutes les factures sans id_utilisateur"""
    db = next(get_db())
    
    try:
        # Récupérer l'utilisateur admin par défaut (ID: 1)
        admin = db.query(Utilisateur).filter(Utilisateur.id_utilisateur == 1).first()
        
        if not admin:
            print("❌ Aucun utilisateur admin trouvé (ID: 1)")
            return
        
        print(f"✅ Utilisateur admin trouvé: {admin.nom_utilisateur}")
        
        # Compter les factures sans id_utilisateur
        factures_sans_utilisateur = db.query(Facture).filter(
            Facture.id_utilisateur == None
        ).count()
        
        print(f"📊 Nombre de factures sans utilisateur: {factures_sans_utilisateur}")
        
        if factures_sans_utilisateur == 0:
            print("✅ Toutes les factures ont déjà un utilisateur assigné")
            return
        
        # Mettre à jour toutes les factures sans id_utilisateur
        updated = db.query(Facture).filter(
            Facture.id_utilisateur == None
        ).update({
            Facture.id_utilisateur: 1  # Assigner l'admin par défaut
        })
        
        db.commit()
        
        print(f"✅ {updated} facture(s) mise(s) à jour avec succès")
        print(f"   Toutes les factures sans utilisateur ont été assignées à: {admin.nom_utilisateur}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur lors de la migration: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("MIGRATION: Mise à jour des factures avec l'ID utilisateur")
    print("=" * 60)
    migrer_id_utilisateur()
    print("=" * 60)


