#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de correction des numéros pour garantir l'ordre séquentiel
"""

from database_mysql import get_db, Client, Devis, Facture, Reglement, Avoir
from datetime import datetime

def corriger_numeros_clients():
    """Corriger les numéros de clients pour garantir l'ordre séquentiel"""
    db = next(get_db())
    
    try:
        # Récupérer tous les clients triés par date de création
        clients = db.query(Client).order_by(Client.created_at).all()
        
        print(f"📋 Trouvé {len(clients)} client(s)")
        
        year = datetime.now().year
        compteur = 1
        
        for client in clients:
            numero_correct = f"CLI-{year}-{compteur:03d}"
            
            if client.numero_client != numero_correct:
                print(f"  ⚙️  {client.nom}: {client.numero_client} → {numero_correct}")
                client.numero_client = numero_correct
                compteur += 1
            else:
                print(f"  ✅ {client.nom}: {client.numero_client} (déjà correct)")
                compteur += 1
        
        db.commit()
        print(f"\n🎉 {len(clients)} client(s) mis à jour !")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        db.rollback()
    finally:
        db.close()

def corriger_numeros_devis():
    """Corriger les numéros de devis pour garantir l'ordre séquentiel"""
    db = next(get_db())
    
    try:
        # Récupérer tous les devis triés par date de création
        devis_list = db.query(Devis).order_by(Devis.created_at).all()
        
        print(f"📋 Trouvé {len(devis_list)} devis")
        
        year = datetime.now().year
        compteur = 1
        
        for devis in devis_list:
            numero_correct = f"DEV-{year}-{compteur:03d}"
            
            if devis.numero_devis != numero_correct:
                print(f"  ⚙️  Devis {devis.id_devis}: {devis.numero_devis} → {numero_correct}")
                devis.numero_devis = numero_correct
                compteur += 1
            else:
                print(f"  ✅ Devis {devis.id_devis}: {devis.numero_devis} (déjà correct)")
                compteur += 1
        
        db.commit()
        print(f"\n🎉 {len(devis_list)} devis mis à jour !")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        db.rollback()
    finally:
        db.close()

def corriger_numeros_factures():
    """Corriger les numéros de factures pour garantir l'ordre séquentiel"""
    db = next(get_db())
    
    try:
        # Récupérer toutes les factures triées par date de création
        factures = db.query(Facture).order_by(Facture.created_at).all()
        
        print(f"📋 Trouvé {len(factures)} facture(s)")
        
        year = datetime.now().year
        compteur = 1
        
        for facture in factures:
            numero_correct = f"FAC-{year}-{compteur:03d}"
            
            if facture.numero_facture != numero_correct:
                print(f"  ⚙️  Facture {facture.id_facture}: {facture.numero_facture} → {numero_correct}")
                facture.numero_facture = numero_correct
                compteur += 1
            else:
                print(f"  ✅ Facture {facture.id_facture}: {facture.numero_facture} (déjà correct)")
                compteur += 1
        
        db.commit()
        print(f"\n🎉 {len(factures)} facture(s) mise à jour !")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        db.rollback()
    finally:
        db.close()

def tout_corriger():
    """Corriger tous les numéros dans l'ordre"""
    print("=" * 70)
    print("🔧 CORRECTION DES NUMÉROS SÉQUENTIELS")
    print("=" * 70)
    
    print("\n📌 CORRECTION DES CLIENTS...")
    print("-" * 70)
    corriger_numeros_clients()
    
    print("\n📌 CORRECTION DES DEVIS...")
    print("-" * 70)
    corriger_numeros_devis()
    
    print("\n📌 CORRECTION DES FACTURES...")
    print("-" * 70)
    corriger_numeros_factures()
    
    print("\n" + "=" * 70)
    print("✅ CORRECTION TERMINÉE !")
    print("=" * 70)

if __name__ == "__main__":
    tout_corriger()

