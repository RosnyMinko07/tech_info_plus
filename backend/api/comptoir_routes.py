#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Routes API pour le comptoir (vente rapide)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from database_mysql import get_db, Article, MouvementStock, VenteComptoir, LigneVente, Facture, LigneFacture, Utilisateur, Client

router = APIRouter(prefix="/api/comptoir", tags=["Comptoir"])


class ArticleComptoirResponse(BaseModel):
    id_article: int
    code_article: Optional[str]
    designation: str
    prix_vente: float
    stock_actuel: int
    image_path: Optional[str]
    type_article: Optional[str]
    
    class Config:
        from_attributes = True


class PanierItem(BaseModel):
    id_article: int
    quantite: int
    prix_unitaire: float


class VenteComptoirRequest(BaseModel):
    articles: List[PanierItem]
    montant_recu: float
    type_vente: str = "COMPTOIR"  # COMPTOIR ou RETOUR
    notes: Optional[str] = None


@router.get("/articles/search")
async def search_articles_comptoir(
    q: str,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Recherche rapide d'articles pour le comptoir
    """
    articles = db.query(Article).filter(
        (Article.designation.contains(q)) |
        (Article.code_article.contains(q))
    ).filter(
        Article.actif == True
    ).limit(limit).all()
    
    return [
        ArticleComptoirResponse.from_orm(article)
        for article in articles
    ]


@router.get("/articles/populaires")
async def get_articles_populaires(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Récupère les articles les plus vendus
    """
    # Pour l'instant, retourner tous les articles actifs
    articles = db.query(Article).filter(
        Article.actif == True,
        Article.stock_actuel > 0
    ).limit(limit).all()
    
    return [
        ArticleComptoirResponse.from_orm(article)
        for article in articles
    ]


@router.get("/verifier-ventes-aujourd-hui")
async def verifier_ventes_aujourdhui(db: Session = Depends(get_db)):
    """
    Vérifie s'il y a eu des ventes aujourd'hui (comme Python ligne 184-204)
    """
    try:
        aujourd_hui = date.today()
        
        # Compter les ventes du jour depuis facture (type_facture = COMPTOIR)
        nombre_ventes = db.query(Facture).filter(
            Facture.date_facture == aujourd_hui,
            Facture.type_facture == 'COMPTOIR'
        ).count()
        
        return {
            "ventes_aujourd_hui": nombre_ventes > 0,
            "nombre_ventes": nombre_ventes
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur vérification ventes: {str(e)}")


@router.get("/ventes/aujourdhui")
async def get_ventes_aujourdhui(db: Session = Depends(get_db)):
    """
    Récupère les ventes du jour pour le comptoir (depuis FACTURE comme Python ligne 909-920)
    """
    aujourd_hui = date.today()
    
    # 🔥 Lit depuis FACTURE comme le code Python
    ventes = db.query(Facture).filter(
        Facture.date_facture == aujourd_hui,
        Facture.type_facture.in_(['COMPTOIR', 'RETOUR'])
    ).all()
    
    # Calculer total en tenant compte des retours (négatifs) - COMME PYTHON ligne 910-916
    total_jour = sum(
        float(v.montant_avance or 0) if v.type_facture == 'COMPTOIR' else -float(v.montant_avance or 0)
        for v in ventes
    )
    nb_ventes = len(ventes)
    
    return {
        "total_jour": total_jour,
        "nb_ventes": nb_ventes,
        "ventes": [
            {
                "numero": v.numero_facture,
                "montant": float(v.montant_ttc or 0),
                "heure": v.created_at.strftime("%H:%M") if v.created_at else ""
            }
            for v in ventes
        ]
    }


@router.post("/vente")
async def creer_vente_comptoir(
    vente: VenteComptoirRequest,
    db: Session = Depends(get_db)
):
    """
    Crée une vente comptoir rapide
    """
    try:
        # Calculer les totaux
        montant_ht = 0.0
        montant_ttc = 0.0
        
        for item in vente.articles:
            article = db.query(Article).filter(Article.id_article == item.id_article).first()
            if not article:
                raise HTTPException(status_code=404, detail=f"Article {item.id_article} non trouvé")
            
            # PAS DE VÉRIFICATION DE STOCK comme Python (ligne 1238-1291)
            # Le stock peut devenir négatif, c'est géré après
            
            montant_ligne = item.quantite * item.prix_unitaire
            montant_ht += montant_ligne
            montant_ttc += montant_ligne
        
        # 🔥 SYSTÈME PYTHON ORIGINAL : Double écriture (facture + vente_comptoir)
        # Générer le numéro de facture
        last_facture = db.query(Facture).order_by(Facture.id_facture.desc()).first()
        next_num = (last_facture.id_facture + 1) if last_facture else 1
        numero_facture = f"F{datetime.now().strftime('%Y%m%d%H%M%S')}"  # Comme Python
        
        # 1. Créer la FACTURE (table principale pour historique)
        # Trouver ou créer le client COMPTOIR (comme Python ligne 1267)
        client_comptoir = db.query(Client).filter(Client.id_client == 1).first()
        if not client_comptoir:
            # Créer le client COMPTOIR s'il n'existe pas
            client_comptoir = Client(
                nom="COMPTOIR",
                type_client="Particulier",
                telephone="",
                email="",
                adresse=""
            )
            db.add(client_comptoir)
            db.flush()
        
        nouvelle_facture = Facture(
            numero_facture=numero_facture,
            type_facture=vente.type_vente,  # COMPTOIR ou RETOUR
            date_facture=date.today(),
            total_ht=montant_ht,
            total_tva=0.0,  # Pas de TVA au comptoir
            total_ttc=montant_ttc,
            montant_avance=abs(montant_ttc),  # Toujours payé cash au comptoir
            montant_reste=0,
            statut="Payée",
            mode_paiement="ESPÈCES",
            notes=vente.notes,
            id_client=client_comptoir.id_client  # Client COMPTOIR (comme Python ligne 1267)
        )
        db.add(nouvelle_facture)
        db.flush()
        
        # 2. Créer aussi dans vente_comptoir (pour vérifications)
        nouvelle_vente_comptoir = VenteComptoir(
            numero_vente=numero_facture,  # Même numéro que la facture
            date_vente=datetime.now(),
            montant_total=montant_ttc,
            mode_paiement="ESPÈCES" if vente.type_vente != "RETOUR" else "REMBOURSEMENT",
            notes=vente.notes
        )
        db.add(nouvelle_vente_comptoir)
        db.flush()
        
        # 3. Créer les lignes (dans les 2 tables) et mettre à jour le stock
        for item in vente.articles:
            article = db.query(Article).filter(Article.id_article == item.id_article).first()
            
            # Créer ligne dans ligne_facture (pour historique/rapports)
            ligne_facture = LigneFacture(
                id_facture=nouvelle_facture.id_facture,
                id_article=item.id_article,
                quantite=item.quantite,
                prix_unitaire=item.prix_unitaire,
                total_ht=item.quantite * item.prix_unitaire,
                montant_ht=item.quantite * item.prix_unitaire
            )
            db.add(ligne_facture)
            
            # Créer ligne dans ligne_vente (pour vérifications)
            ligne_vente = LigneVente(
                id_vente=nouvelle_vente_comptoir.id_vente,
                id_article=item.id_article,
                quantite=item.quantite,
                prix_unitaire=item.prix_unitaire,
                total_ht=item.quantite * item.prix_unitaire
            )
            db.add(ligne_vente)
            
            # Mettre à jour le stock pour les produits (comme Python ligne 1293-1355)
            if article.type_article == "PRODUIT":
                if vente.type_vente == "RETOUR":
                    # Mode retour : AJOUTER au stock (comme Python ligne 1294-1299)
                    article.stock_actuel = (article.stock_actuel or 0) + abs(item.quantite)
                    type_mouvement = "ENTREE"
                    type_operation = "Retour comptoir"
                else:
                    # Mode vente : ENLEVER du stock (comme Python ligne 1326-1331)
                    article.stock_actuel = (article.stock_actuel or 0) - abs(item.quantite)
                    type_mouvement = "SORTIE"
                    type_operation = "Vente comptoir"
                
                # Créer un mouvement de stock (comme Python ligne 1319-1323 et 1351-1355)
                mouvement = MouvementStock(
                    id_article=item.id_article,
                    type_mouvement=type_mouvement,
                    quantite=abs(item.quantite),
                    date_mouvement=datetime.now(),
                    reference=f"{type_operation} {numero_facture}"
                )
                db.add(mouvement)
        
        db.commit()
        db.refresh(nouvelle_facture)
        
        return {
            "success": True,
            "facture_id": nouvelle_facture.id_facture,
            "numero_facture": numero_facture,
            "montant_ttc": montant_ttc,
            "montant_recu": vente.montant_recu,
            "monnaie": vente.montant_recu - montant_ttc
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur création vente: {str(e)}")


@router.get("/ventes")
async def get_ventes_comptoir(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Récupère toutes les ventes comptoir depuis la table FACTURE (comme Python)
    """
    try:
        # 🔥 LIT DEPUIS FACTURE comme le code Python ligne 1442-1451
        # UTILISE SEULEMENT LES VRAIES COLONNES (pas les @property)
        factures = db.query(
            Facture.id_facture,
            Facture.numero_facture,
            Facture.created_at,
            Facture.total_ttc,  # 🔥 Vraie colonne, pas montant_ttc
            Client.nom.label('client_nom'),
            Utilisateur.nom_utilisateur,
            Facture.type_facture
        ).outerjoin(
            Client, Facture.id_client == Client.id_client
        ).outerjoin(
            Utilisateur, Facture.id_utilisateur == Utilisateur.id_utilisateur
        ).filter(
            Facture.type_facture.in_(['COMPTOIR', 'RETOUR'])
        ).order_by(
            Facture.created_at.desc()
        ).limit(limit).all()
        
        # Formater les données pour le frontend
        ventes_data = []
        for facture in factures:
            # facture est un tuple : (id_facture, numero_facture, created_at, total_ttc, client_nom, nom_utilisateur, type_facture)
            id_facture = facture[0]
            numero_facture = facture[1]
            created_at = facture[2]
            total_ttc = facture[3]
            client_nom = facture[4]
            nom_utilisateur = facture[5]
            type_facture = facture[6]
            
            # Récupérer les lignes de cette facture
            lignes = db.query(LigneFacture, Article.designation).join(
                Article, LigneFacture.id_article == Article.id_article
            ).filter(
                LigneFacture.id_facture == id_facture
            ).all()
            
            ventes_data.append({
                "id_facture": id_facture,
                "numero_facture": numero_facture,
                "date_vente": created_at.isoformat() if created_at else None,
                "montant_total": float(total_ttc or 0),
                "type_facture": type_facture,
                "client_nom": "Retour Comptoir" if type_facture == "RETOUR" else "Comptoir",
                "vendeur": nom_utilisateur or "Système",
                "lignes": [
                    {
                        "id_ligne": ligne[0].id_ligne_facture if hasattr(ligne[0], 'id_ligne_facture') else ligne[0].id_ligne,
                        "id_article": ligne[0].id_article,
                        "quantite": ligne[0].quantite,
                        "prix_unitaire": float(ligne[0].prix_unitaire or 0),
                        "total_ht": float(ligne[0].total_ht or ligne[0].montant_ht or 0),
                        "article_nom": ligne[1] or "Article supprimé"
                    }
                    for ligne in lignes
                ]
            })
        
        return ventes_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur récupération ventes: {str(e)}")


@router.get("/ventes/{id_facture}")
async def get_vente_by_id(
    id_facture: int,
    db: Session = Depends(get_db)
):
    """
    Récupère une vente comptoir spécifique depuis FACTURE (comme Python)
    """
    try:
        facture = db.query(Facture).filter(
            Facture.id_facture == id_facture,
            Facture.type_facture.in_(['COMPTOIR', 'RETOUR'])
        ).first()
        
        if not facture:
            raise HTTPException(status_code=404, detail="Vente non trouvée")
        
        # Récupérer les lignes de cette facture
        lignes = db.query(LigneFacture, Article.designation).join(
            Article, LigneFacture.id_article == Article.id_article
        ).filter(
            LigneFacture.id_facture == facture.id_facture
        ).all()
        
        return {
            "id_facture": facture.id_facture,
            "numero_facture": facture.numero_facture,
            "date_vente": facture.created_at.isoformat() if facture.created_at else None,
            "montant_total": float(facture.montant_ttc or 0),
            "type_facture": facture.type_facture,
            "notes": facture.notes,
            "lignes": [
                {
                    "id_ligne": ligne[0].id_ligne_facture,
                    "id_article": ligne[0].id_article,
                    "quantite": ligne[0].quantite,
                    "prix_unitaire": float(ligne[0].prix_unitaire or 0),
                    "total_ht": float(ligne[0].montant_ttc or 0),
                    "article_nom": ligne[1] or "Article supprimé"
                }
                for ligne in lignes
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur récupération vente: {str(e)}")


@router.delete("/ventes/{id_facture}")
async def supprimer_vente_comptoir(
    id_facture: int,
    db: Session = Depends(get_db)
):
    """
    Supprime une vente comptoir depuis FACTURE et restaure le stock (comme Python ligne 1676-1746)
    """
    try:
        # Récupérer la facture
        facture = db.query(Facture).filter(
            Facture.id_facture == id_facture,
            Facture.type_facture.in_(['COMPTOIR', 'RETOUR'])
        ).first()
        
        if not facture:
            raise HTTPException(status_code=404, detail="Vente non trouvée")
        
        numero_facture = facture.numero_facture
        
        # Récupérer les lignes pour restaurer le stock
        lignes = db.query(LigneFacture, Article).join(
            Article, LigneFacture.id_article == Article.id_article
        ).filter(
            LigneFacture.id_facture == id_facture
        ).all()
        
        # Restaurer le stock pour chaque article (comme Python ligne 1703-1728)
        for ligne_facture, article in lignes:
            if article and article.type_article == "PRODUIT":
                # Remettre en stock
                article.stock_actuel += ligne_facture.quantite
                
                # Créer un mouvement de stock (ENTREE)
                mouvement = MouvementStock(
                    id_article=ligne_facture.id_article,
                    type_mouvement="ENTREE",
                    quantite=ligne_facture.quantite,
                    date_mouvement=datetime.now(),
                    reference=f"Suppression {numero_facture}"
                )
                db.add(mouvement)
        
        # Supprimer les lignes de facture
        db.query(LigneFacture).filter(LigneFacture.id_facture == id_facture).delete()
        
        # Supprimer aussi de vente_comptoir si existe
        db.query(VenteComptoir).filter(VenteComptoir.numero_vente == numero_facture).delete()
        db.query(LigneVente).filter(LigneVente.id_vente.in_(
            db.query(VenteComptoir.id_vente).filter(VenteComptoir.numero_vente == numero_facture)
        )).delete(synchronize_session=False)
        
        # Supprimer la facture
        db.delete(facture)
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Vente {numero_facture} supprimée avec succès",
            "articles_remis_en_stock": len(lignes)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur suppression vente: {str(e)}")


@router.get("/stats")
async def get_stats_comptoir(db: Session = Depends(get_db)):
    """
    Statistiques pour le tableau de bord comptoir (depuis FACTURE comme Python)
    """
    aujourd_hui = date.today()
    
    # 🔥 Lit depuis FACTURE comme le code Python
    ventes_jour = db.query(Facture).filter(
        Facture.date_facture == aujourd_hui,
        Facture.type_facture.in_(['COMPTOIR', 'RETOUR'])
    ).all()
    
    # Calculer total en tenant compte des retours
    total_jour = sum(
        float(v.montant_ttc or 0) if v.type_facture != 'RETOUR' else -float(v.montant_ttc or 0)
        for v in ventes_jour
    )
    
    # Articles les plus vendus
    # (Requête simplifiée - à optimiser avec JOIN)
    articles_populaires = db.query(Article).filter(
        Article.actif == True
    ).limit(10).all()
    
    return {
        "ventes_jour": {
            "total": total_jour,
            "nombre": len(ventes_jour)
        },
        "articles_populaires": [
            {
                "id": a.id_article,
                "nom": a.designation,
                "prix": float(a.prix_vente or 0)
            }
            for a in articles_populaires
        ]
    }
