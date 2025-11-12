#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Routes API pour le comptoir (vente rapide)
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from database_mysql import get_db, Article, MouvementStock, Facture, LigneFacture, Utilisateur, Client

router = APIRouter(prefix="/api/comptoir", tags=["Comptoir"])


def get_current_user_id(request: Request) -> int:
    """Extraire l'ID utilisateur du token JWT"""
    try:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.replace('Bearer ', '')
            # Extraire l'ID utilisateur du token (format: token_{id}_{timestamp})
            parts = token.split('_')
            if len(parts) >= 2:
                id_utilisateur = int(parts[1])
                print(f"  🔑 ID utilisateur extrait du token: {id_utilisateur}")
                return id_utilisateur
    except (ValueError, IndexError) as e:
        print(f"   ⚠️ Erreur extraction ID utilisateur: {e}")
    
    # Retourner 1 (admin) par défaut si le token est invalide
    print(f"  ⚠️ Utilisation de l'utilisateur par défaut (ID: 1)")
    return 1


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
    Vérifie s'il y a eu des ventes aujourd'hui et retourne la liste des articles vendus (comme Python ligne 184-204)
    """
    try:
        aujourd_hui = date.today()
        
        # Compter les ventes du jour depuis facture (type_facture = COMPTOIR)
        nombre_ventes = db.query(Facture).filter(
            Facture.date_facture == aujourd_hui,
            Facture.type_facture == 'COMPTOIR'
        ).count()
        
        # Récupérer les articles vendus aujourd'hui (pour le mode retour)
        articles_vendus = []
        if nombre_ventes > 0:
            ventes_factures = db.query(Facture.id_facture).filter(
                Facture.date_facture == aujourd_hui,
                Facture.type_facture == 'COMPTOIR'
            ).subquery()
            
            articles_vendus = db.query(
                LigneFacture.id_article
            ).filter(
                LigneFacture.id_facture.in_(ventes_factures)
            ).distinct().all()
            
            articles_vendus = [row[0] for row in articles_vendus]
        
        return {
            "ventes_aujourd_hui": nombre_ventes > 0,
            "nombre_ventes": nombre_ventes,
            "articles_vendus": [{"id_article": aid} for aid in articles_vendus]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur vérification ventes: {str(e)}")


@router.get("/ventes/aujourdhui")
async def get_ventes_aujourdhui(db: Session = Depends(get_db)):
    """
    Récupère les ventes du jour pour le comptoir (depuis FACTURE comme Python ligne 909-920)
    """
    aujourd_hui = date.today()
    
    # 🔥 Lecture depuis FACTURE en incluant le vendeur (utilisateur)
    ventes = db.query(
        Facture,
        Utilisateur.nom_utilisateur
    ).outerjoin(
        Utilisateur, Facture.id_utilisateur == Utilisateur.id_utilisateur
    ).filter(
        Facture.date_facture == aujourd_hui,
        Facture.type_facture.in_(['COMPTOIR', 'RETOUR'])
    ).all()
    
    # Calculer total en tenant compte des retours (négatifs)
    total_jour = 0.0
    for facture, _ in ventes:
        montant = float((facture.total_ttc or facture.montant_ttc or 0))
        total_jour += montant if facture.type_facture == 'COMPTOIR' else -montant
    
    nb_ventes = len(ventes)
    
    # Préparer les détails des ventes avec leurs lignes
    ventes_detaillees = []
    for facture, vendeur_nom in ventes:
        lignes = db.query(LigneFacture).filter(
            LigneFacture.id_facture == facture.id_facture
        ).all()
        
        ventes_detaillees.append({
            "id_facture": facture.id_facture,
            "numero_facture": facture.numero_facture,
            "montant_total": float(facture.montant_ttc or facture.total_ttc or 0),
            "montant_avance": float(facture.montant_avance or 0),  # Montant reçu
            "type_facture": facture.type_facture,
            "date_vente": facture.created_at.isoformat() if facture.created_at else None,
            "heure": facture.created_at.strftime("%H:%M") if facture.created_at else "",
            "notes": facture.notes or "",
            "id_utilisateur": facture.id_utilisateur,
            "vendeur": vendeur_nom or "Système",
            "client_nom": "Retour Comptoir" if facture.type_facture == "RETOUR" else "Comptoir",
            "lignes": [
                {
                    "id_ligne_facture": ligne.id_ligne_facture,
                    "id_article": ligne.id_article,
                    "quantite": ligne.quantite,
                    "prix_unitaire": float(ligne.prix_unitaire or 0),
                    "montant_ht": float(ligne.montant_ht or 0)
                }
                for ligne in lignes
            ]
        })
    
    return {
        "total_jour": total_jour,
        "nb_ventes": nb_ventes,
        "ventes": ventes_detaillees
    }


@router.post("/vente")
async def creer_vente_comptoir(
    vente: VenteComptoirRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Crée une vente comptoir rapide
    """
    try:
        # Récupérer l'ID utilisateur connecté
        id_utilisateur = get_current_user_id(request)
        print(f"  🔑 Vente créée par l'utilisateur ID: {id_utilisateur}")
        # 🔥 VÉRIFICATION RETOUR : Autoriser SEULEMENT les articles vendus aujourd'hui
        if vente.type_vente == "RETOUR":
            aujourd_hui = date.today()
            
            for item in vente.articles:
                # Vérifier si cet article a été vendu aujourd'hui
                vente_article_aujourdhui = db.query(LigneFacture).join(
                    Facture, LigneFacture.id_facture == Facture.id_facture
                ).filter(
                    Facture.date_facture == aujourd_hui,
                    Facture.type_facture == 'COMPTOIR',
                    LigneFacture.id_article == item.id_article
                ).first()
                
                if not vente_article_aujourdhui:
                    # Article pas vendu aujourd'hui, REFUSER le retour
                    article = db.query(Article).filter(Article.id_article == item.id_article).first()
                    article_nom = article.designation if article else f"Article {item.id_article}"
                    raise HTTPException(
                        status_code=400, 
                        detail=f"❌ RETOUR REFUSÉ : L'article '{article_nom}' n'a pas été vendu aujourd'hui. Seuls les articles vendus aujourd'hui peuvent être retournés."
                    )
                
                # Vérifier que la quantité retournée ne dépasse pas la quantité vendue
                total_vendu_aujourdhui = db.query(
                    func.sum(LigneFacture.quantite)
                ).join(
                    Facture, LigneFacture.id_facture == Facture.id_facture
                ).filter(
                    Facture.date_facture == aujourd_hui,
                    Facture.type_facture == 'COMPTOIR',
                    LigneFacture.id_article == item.id_article
                ).scalar() or 0
                
                total_retourne_aujourdhui = db.query(
                    func.sum(LigneFacture.quantite)
                ).join(
                    Facture, LigneFacture.id_facture == Facture.id_facture
                ).filter(
                    Facture.date_facture == aujourd_hui,
                    Facture.type_facture == 'RETOUR',
                    LigneFacture.id_article == item.id_article
                ).scalar() or 0
                
                quantite_disponible_retour = total_vendu_aujourdhui - total_retourne_aujourdhui
                
                if item.quantite > quantite_disponible_retour:
                    article = db.query(Article).filter(Article.id_article == item.id_article).first()
                    article_nom = article.designation if article else f"Article {item.id_article}"
                    raise HTTPException(
                        status_code=400,
                        detail=f"❌ RETOUR REFUSÉ : Quantité invalide pour '{article_nom}'. Vendu aujourd'hui: {total_vendu_aujourdhui}, Déjà retourné: {total_retourne_aujourdhui}, Disponible pour retour: {quantite_disponible_retour}"
                    )
        
        # Calculer les totaux
        montant_ht = 0.0
        montant_ttc = 0.0
        
        for item in vente.articles:
            article = db.query(Article).filter(Article.id_article == item.id_article).first()
            if not article:
                raise HTTPException(status_code=404, detail=f"Article {item.id_article} non trouvé")
            
            # 🔥 VÉRIFICATION DE STOCK pour les produits
            if article.type_article == 'PRODUIT':
                # Vérifier que le stock est suffisant
                if item.quantite > article.stock_actuel:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"❌ Stock insuffisant pour '{article.designation}'. Stock disponible: {article.stock_actuel}, Quantité demandée: {item.quantite}"
                    )
                
                # Vérifier que le stock n'est pas à zéro
                if article.stock_actuel <= 0:
                    raise HTTPException(
                        status_code=400,
                        detail=f"❌ Stock épuisé pour '{article.designation}'. Impossible de vendre un article en rupture de stock."
                    )
            
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
            montant_ht=montant_ht,  # Utiliser montant_ht, pas total_ht
            montant_ttc=montant_ttc,  # Utiliser montant_ttc, pas total_ttc
            montant_avance=vente.montant_recu if vente.type_vente == 'COMPTOIR' else abs(montant_ttc),  # Montant reçu au comptoir
            montant_reste=0,
            statut="Payée",
            mode_paiement="ESPÈCES",
            notes=vente.notes,
            id_client=client_comptoir.id_client,  # Client COMPTOIR (comme Python ligne 1267)
            id_utilisateur=id_utilisateur  # 🔥 ID de l'utilisateur connecté
        )
        db.add(nouvelle_facture)
        db.flush()
        
        # 2. Créer les lignes dans ligne_facture et mettre à jour le stock
        for item in vente.articles:
            article = db.query(Article).filter(Article.id_article == item.id_article).first()
            
            # Créer ligne dans ligne_facture (pour historique/rapports)
            ligne_facture = LigneFacture(
                id_facture=nouvelle_facture.id_facture,
                id_article=item.id_article,
                quantite=item.quantite,
                prix_unitaire=item.prix_unitaire,
                total_ht=item.quantite * item.prix_unitaire
            )
            db.add(ligne_facture)
            
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
        import traceback
        error_detail = traceback.format_exc()
        print(f"❌ ERREUR CRÉATION VENTE:")
        print(error_detail)
        raise HTTPException(status_code=500, detail=f"Erreur création vente: {str(e)}\n{error_detail}")


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
            
            # Récupérer le montant avance de la facture
            facture_obj = db.query(Facture).filter(Facture.id_facture == id_facture).first()
            montant_avance = float(facture_obj.montant_avance or 0) if facture_obj else 0
            
            ventes_data.append({
                "id_facture": id_facture,
                "numero_facture": numero_facture,
                "date_vente": created_at.isoformat() if created_at else None,
                "montant_total": float(total_ttc or 0),
                "montant_avance": montant_avance,  # Montant reçu
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
        facture = db.query(Facture, Utilisateur.nom_utilisateur).outerjoin(
            Utilisateur, Facture.id_utilisateur == Utilisateur.id_utilisateur
        ).filter(
            Facture.id_facture == id_facture,
            Facture.type_facture.in_(['COMPTOIR', 'RETOUR'])
        ).first()
        
        if not facture:
            raise HTTPException(status_code=404, detail="Vente non trouvée")
        
        facture_obj, vendeur_nom = facture
        
        # Récupérer les lignes de cette facture
        lignes = db.query(LigneFacture, Article.designation).join(
            Article, LigneFacture.id_article == Article.id_article
        ).filter(
            LigneFacture.id_facture == facture_obj.id_facture
        ).all()
        
        return {
            "id_facture": facture_obj.id_facture,
            "numero_facture": facture_obj.numero_facture,
            "date_vente": facture_obj.created_at.isoformat() if facture_obj.created_at else None,
            "montant_total": float(facture_obj.montant_ttc or 0),
            "montant_avance": float(facture_obj.montant_avance or 0),  # Montant reçu
            "type_facture": facture_obj.type_facture,
            "notes": facture_obj.notes,
            "id_utilisateur": facture_obj.id_utilisateur,
            "vendeur": vendeur_nom or "Système",
            "lignes": [
                {
                    "id_ligne": ligne[0].id_ligne_facture,
                    "id_article": ligne[0].id_article,
                    "quantite": ligne[0].quantite,
                    "prix_unitaire": float(ligne[0].prix_unitaire or 0),
                    "total_ht": float(ligne[0].total_ht or ligne[0].montant_ht or 0),
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
