#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TECH INFO PLUS - BACKEND FASTAPI COMPLET
Recréation identique de l'application desktop en version web
"""

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sys
import os
from datetime import datetime, date, timedelta
import json
from passlib.hash import bcrypt

# Ajouter le répertoire racine au path Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Importer la configuration MySQL
from database_mysql import get_db, test_connection, create_tables
from database_mysql import (
    Client, Article, Facture, Devis, Reglement, Avoir, LigneAvoir,
    Utilisateur, Fournisseur, Entreprise, MouvementStock,
    LigneFacture, LigneDevis, SignalementBug, VenteComptoir, LigneVente
)

# Importer les routes des modules (avec try/except pour éviter les erreurs)
try:
    from api.comptoir_routes import router as comptoir_router
    routes_imported = True
except ImportError as e:
    print(f"[WARNING] Erreur import routes: {e}")
    print("[WARNING] Les routes Comptoir ne seront pas disponibles")
    routes_imported = False

# ==================== UTILITAIRES ====================

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

# Modèles Pydantic pour l'API
class ClientCreate(BaseModel):
    nom: str
    adresse: Optional[str] = None
    telephone: Optional[str] = None
    email: Optional[str] = None
    nif: Optional[str] = None
    type_client: str = "particulier"
    numero_client: Optional[str] = None
    ville: Optional[str] = None

class ClientResponse(BaseModel):
    id_client: int
    nom: str
    adresse: Optional[str]
    telephone: Optional[str]
    email: Optional[str]
    nif: Optional[str]
    type_client: str
    numero_client: Optional[str]
    ville: Optional[str]
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ArticleCreate(BaseModel):
    code_article: Optional[str] = None
    designation: str  # Changé de "nom" à "designation"
    description: Optional[str] = None
    type_article: str = "PRODUIT"  # PRODUIT ou SERVICE
    prix_achat: Optional[float] = None
    prix_vente: Optional[float] = None
    prix_service: Optional[float] = None
    stock_initial: Optional[int] = 0
    stock_actuel: int = 0
    stock_alerte: int = 10  # Changé de "stock_minimum" à "stock_alerte"
    unite: str = "PIECE"
    categorie: Optional[str] = None
    image_path: Optional[str] = None
    actif: Optional[bool] = True
    id_fournisseur: Optional[int] = None

class ArticleResponse(BaseModel):
    id_article: int
    code_article: Optional[str]
    designation: str  # Changé de "nom" à "designation"
    description: Optional[str]
    prix_achat: Optional[float]
    prix_vente: Optional[float]
    prix_service: Optional[float] = None
    stock_initial: Optional[int] = 0
    stock_actuel: int
    stock_alerte: Optional[int] = 10  # Changé de "stock_minimum" à "stock_alerte"
    unite: str
    categorie: Optional[str]
    image_path: Optional[str] = None
    id_fournisseur: Optional[int] = None
    created_at: Optional[datetime] = None
    supprime_par: Optional[int] = None  # ID de l'utilisateur qui a supprimé
    date_suppression: Optional[datetime] = None  # Date de suppression

    class Config:
        from_attributes = True

class FournisseurCreate(BaseModel):
    nom_fournisseur: str
    adresse: Optional[str] = None
    telephone: Optional[str] = None
    email: Optional[str] = None
    ville: Optional[str] = None
    pays: Optional[str] = None
    nif: Optional[str] = None
    numero_fournisseur: Optional[str] = None

class FournisseurResponse(BaseModel):
    id_fournisseur: int
    nom_fournisseur: str
    adresse: Optional[str] = None
    telephone: Optional[str] = None
    email: Optional[str] = None
    ville: Optional[str] = None
    pays: Optional[str] = None
    nif: Optional[str] = None
    numero_fournisseur: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class FactureCreate(BaseModel):
    id_client: int
    date_facture: date
    date_echeance: Optional[date] = None
    montant_ht: Optional[float] = 0.0
    montant_ttc: Optional[float] = 0.0
    montant_avance: Optional[float] = 0.0
    montant_reste: Optional[float] = 0.0
    description: Optional[str] = None
    precompte_actif: Optional[int] = 0
    statut: str = "En attente"
    mode_paiement: Optional[str] = None
    notes: Optional[str] = None
    type_facture: Optional[str] = 'NORMALE'
    lignes: Optional[List[dict]] = []

class FactureResponse(BaseModel):
    id_facture: int
    numero_facture: str
    type_facture: Optional[str] = 'NORMALE'  # NORMALE, COMPTOIR, RETOUR
    id_client: int
    date_facture: date
    date_echeance: Optional[date]
    montant_ht: Optional[float] = 0.0
    montant_ttc: Optional[float] = 0.0
    montant_avance: Optional[float] = 0.0
    montant_reste: Optional[float] = 0.0
    description: Optional[str] = None
    precompte_applique: Optional[int] = 0
    statut: str
    mode_paiement: Optional[str]
    notes: Optional[str]
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class LigneDevisCreate(BaseModel):
    id_article: int
    quantite: int = 1
    prix_unitaire: float
    montant_ht: Optional[float] = None
    total_ht: Optional[float] = None
    montant_ttc: Optional[float] = None

class DevisCreate(BaseModel):
    numero_devis: Optional[str] = None
    id_client: int
    date_devis: date
    validite: Optional[int] = 30
    description: Optional[str] = None
    montant_ht: Optional[float] = 0.0
    montant_ttc: Optional[float] = 0.0
    total_ht: Optional[float] = None
    total_ttc: Optional[float] = None
    precompte_applique: int = 0
    statut: str = "En attente"
    lignes: Optional[List[LigneDevisCreate]] = []

class DevisResponse(BaseModel):
    id_devis: int
    numero_devis: str
    id_client: int
    date_devis: date
    validite: Optional[int]
    description: Optional[str]
    montant_ht: float
    montant_ttc: float
    statut: str
    precompte_applique: Optional[int]
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UtilisateurCreate(BaseModel):
    nom_utilisateur: str
    mot_de_passe: str
    role: str = "utilisateur"
    email: Optional[str] = None
    telephone: Optional[str] = None

class UtilisateurResponse(BaseModel):
    id_utilisateur: int
    nom_utilisateur: str
    role: str
    email: Optional[str] = None
    telephone: Optional[str] = None
    actif: bool = True
    droits: Optional[str] = None  # Champ JSON des droits
    date_creation: Optional[datetime] = None
    created_at: Optional[datetime] = None
    derniere_connexion: Optional[datetime] = None  # Dernière heure de connexion

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    nom_utilisateur: str
    mot_de_passe: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    utilisateur: UtilisateurResponse

# Créer l'application FastAPI
app = FastAPI(
    title="Tech Info Plus API",
    description="API complète pour le système de facturation et gestion de stock",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuration CORS pour React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🔥 Autoriser TOUTES les origines pour accès réseau local
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sécurité
security = HTTPBearer()

# Enregistrer les routers (si importés avec succès)
if routes_imported:
    app.include_router(comptoir_router)
    print("[OK] Routes Comptoir chargees")

# -- Servir le frontend build (si présent) pour produire une application "tout-en-un" --
try:
    # Chemin attendu du build créé par `npm run build` (frontend/build)
    frontend_build_path = os.path.normpath(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "build")
    )

    if os.path.isdir(frontend_build_path):
        # Monter les fichiers statiques (l'API garde la priorité sur les routes)
        app.mount("/", StaticFiles(directory=frontend_build_path, html=True), name="frontend")
        print(f"[OK] Frontend statique monte depuis: {frontend_build_path}")

        # Fallback SPA: servir index.html pour les routes non-API (utile quand le build existe)
        index_file = os.path.join(frontend_build_path, "index.html")

        if os.path.exists(index_file):
            @app.get("/{full_path:path}", include_in_schema=False)
            async def spa_catchall(request: Request, full_path: str):
                # Laisser passer les appels aux routes d'API/doc
                if request.url.path.startswith("/api") or request.url.path.startswith("/docs") or request.url.path.startswith("/redoc"):
                    raise HTTPException(status_code=404)
                return FileResponse(index_file)
except Exception as _e:
    # Ne doit pas empêcher l'application de démarrer si quelque chose échoue
    print(f"[WARNING] Impossible de monter le frontend statique: {_e}")

# Routes principales
@app.get("/")
async def root():
    """Point d'entrée de l'API"""
    return {
        "message": "Tech Info Plus API",
        "version": "2.0.0",
        "docs": "/docs",
        "status": "running",
        "features": [
            "Gestion des clients",
            "Gestion des articles",
            "Facturation",
            "Devis",
            "Comptoir",
            "Règlements",
            "Avoirs",
            "Stock",
            "Inventaire",
            "Utilisateurs",
            "Rapports",
            "Signalement bugs"
        ]
    }

@app.get("/health")
async def health_check():
    """Vérification de l'état de l'API"""
    db_status = test_connection()
    return {
        "status": "healthy" if db_status else "unhealthy",
        "database": "connected" if db_status else "disconnected",
        "timestamp": datetime.now().isoformat()
    }

# ==================== AUTHENTIFICATION ====================

@app.post("/api/auth/login", response_model=LoginResponse)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Connexion utilisateur"""
    # Vérifier si l'utilisateur existe
    user = db.query(Utilisateur).filter(
        Utilisateur.nom_utilisateur == login_data.nom_utilisateur
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur introuvable"
        )
    
    # Vérifier si l'utilisateur est actif
    if not user.actif:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ce compte est désactivé. Contactez l'administrateur"
        )
    
    # Vérifier le mot de passe avec bcrypt
    try:
        if not bcrypt.verify(login_data.mot_de_passe, user.mot_de_passe):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Mot de passe incorrect"
            )
    except ValueError:
        # Erreur de déchiffrement du mot de passe
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mot de passe incorrect"
        )
    except Exception as e:
        print(f"Erreur vérification mot de passe: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mot de passe incorrect"
        )
    
    # Mettre à jour la dernière connexion
    derniere_connexion_now = datetime.now()
    try:
        # Mettre à jour directement via SQL (plus fiable)
        from sqlalchemy import text
        result = db.execute(
            text("UPDATE utilisateur SET derniere_connexion = :now WHERE id_utilisateur = :id"),
            {"now": derniere_connexion_now, "id": user.id_utilisateur}
        )
        db.commit()
        print(f"✅ UPDATE SQL exécuté, lignes affectées: {result.rowcount}")
        
        # Recharger l'utilisateur depuis la base (expirer la session pour forcer le rechargement)
        db.expire(user)
        db.refresh(user)
        
        # Si refresh ne fonctionne pas, recharger manuellement
        if not user.derniere_connexion or user.derniere_connexion != derniere_connexion_now:
            print(f"⚠️ Refresh n'a pas fonctionné, rechargement manuel...")
            user = db.query(Utilisateur).filter(Utilisateur.id_utilisateur == user.id_utilisateur).first()
        
        print(f"✅ Dernière connexion mise à jour pour {user.nom_utilisateur}: {user.derniere_connexion}")
    except Exception as e:
        print(f"⚠️ Erreur mise à jour dernière connexion: {e}")
        import traceback
        traceback.print_exc()
        # Ne pas bloquer la connexion si la colonne n'existe pas encore
        db.rollback()
        # Mettre quand même la valeur en mémoire pour la réponse
        user.derniere_connexion = derniere_connexion_now
        print(f"⚠️ Valeur mise en mémoire uniquement: {user.derniere_connexion}")
    
    # Créer le token (simplifié)
    access_token = f"token_{user.id_utilisateur}_{datetime.now().timestamp()}"
    
    # S'assurer que derniere_connexion est bien défini dans l'objet user
    if not hasattr(user, 'derniere_connexion') or user.derniere_connexion is None:
        user.derniere_connexion = derniere_connexion_now
        print(f"⚠️ derniere_connexion manquant, valeur forcée: {user.derniere_connexion}")
    
    # Utiliser model_validate au lieu de from_orm (Pydantic v2)
    try:
        utilisateur_response = UtilisateurResponse.model_validate(user)
    except Exception as e:
        print(f"⚠️ Erreur model_validate, fallback vers from_orm: {e}")
        # Fallback vers from_orm si model_validate ne fonctionne pas
        utilisateur_response = UtilisateurResponse.from_orm(user)
    
    # Vérifier que la valeur est bien dans la réponse
    if utilisateur_response.derniere_connexion:
        print(f"✅ derniere_connexion dans réponse: {utilisateur_response.derniere_connexion}")
    else:
        print(f"⚠️ derniere_connexion manquant dans réponse, valeur forcée")
        utilisateur_response.derniere_connexion = derniere_connexion_now
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        utilisateur=utilisateur_response
    )

# ==================== CLIENTS ====================

@app.get("/api/clients", response_model=List[ClientResponse])
async def get_clients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Récupérer tous les clients"""
    clients = db.query(Client).offset(skip).limit(limit).all()
    return clients

@app.get("/api/clients/{client_id}")
async def get_client(client_id: int, db: Session = Depends(get_db)):
    """Récupérer un client par ID"""
    try:
        client = db.query(Client).filter(Client.id_client == client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail="Client non trouvé")
        
        # Ajouter des statistiques du client
        factures_count = db.query(Facture).filter(Facture.id_client == client_id).count()
        devis_count = db.query(Devis).filter(Devis.id_client == client_id).count()
        
        # Calculer le CA total du client
        ca_total = db.query(func.sum(Facture.montant_avance)).filter(
            Facture.id_client == client_id,
            Facture.statut != 'Annulée'
        ).scalar() or 0
        
        # Dernière facture
        derniere_facture = db.query(Facture).filter(
            Facture.id_client == client_id
        ).order_by(Facture.date_facture.desc()).first()
        
        return {
            "id_client": client.id_client,
            "nom": client.nom,
            "adresse": client.adresse,
            "telephone": client.telephone,
            "email": client.email,
            "nif": client.nif,
            "type_client": client.type_client,
            "date_creation": client.created_at,
            "statistiques": {
                "nb_factures": factures_count,
                "nb_devis": devis_count,
                "ca_total": float(ca_total),
                "derniere_facture": derniere_facture.date_facture if derniere_facture else None
            }
        }
    except Exception as e:
        print(f"Erreur get_client: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@app.post("/api/clients", response_model=ClientResponse)
async def create_client(client: ClientCreate, db: Session = Depends(get_db)):
    """Créer un nouveau client"""
    # Générer un numéro client automatique si non fourni
    if not client.numero_client:
        last_client = db.query(Client).order_by(Client.id_client.desc()).first()
        next_num = (last_client.id_client + 1) if last_client else 1
        year = datetime.now().year
        client.numero_client = f"CLI-{year}-{next_num:03d}"
    
    db_client = Client(**client.dict())
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

@app.put("/api/clients/{client_id}")
async def update_client(client_id: int, data: dict, db: Session = Depends(get_db)):
    """Mettre à jour un client"""
    try:
        print(f"🔍 DEBUG - Modification client {client_id}: {data}")
        
        db_client = db.query(Client).filter(Client.id_client == client_id).first()
        if not db_client:
            raise HTTPException(status_code=404, detail="Client non trouvé")
        
        # Mettre à jour les champs
        for key, value in data.items():
            if hasattr(db_client, key) and value is not None:
                setattr(db_client, key, value)
        
        db.commit()
        db.refresh(db_client)
        
        print(f"  Client {db_client.nom} modifié avec succès!")
        return db_client
    except Exception as e:
        db.rollback()
        print(f"  ERREUR modification client: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@app.delete("/api/clients/{client_id}")
async def delete_client(client_id: int, force: bool = False, db: Session = Depends(get_db)):
    """Supprimer un client"""
    try:
        db_client = db.query(Client).filter(Client.id_client == client_id).first()
        if not db_client:
            raise HTTPException(status_code=404, detail="Client non trouvé")
        
        # Vérifier s'il y a des factures ou devis liés
        factures_count = db.query(Facture).filter(Facture.id_client == client_id).count()
        devis_count = db.query(Devis).filter(Devis.id_client == client_id).count()
        
        if factures_count > 0 or devis_count > 0:
            if force:
                # Supprimer les documents liés d'abord
                print(f"Suppression forcée: {factures_count} factures et {devis_count} devis")
                
                # Supprimer les lignes de factures liées
                factures_client = db.query(Facture).filter(Facture.id_client == client_id).all()
                for facture in factures_client:
                    db.query(LigneFacture).filter(LigneFacture.id_facture == facture.id_facture).delete()
                
                # Supprimer les factures
                db.query(Facture).filter(Facture.id_client == client_id).delete()
                
                # Supprimer les lignes de devis liées
                devis_client = db.query(Devis).filter(Devis.id_client == client_id).all()
                for devis in devis_client:
                    db.query(LigneDevis).filter(LigneDevis.id_devis == devis.id_devis).delete()
                
                # Supprimer les devis
                db.query(Devis).filter(Devis.id_client == client_id).delete()
                
                print(f"Documents supprimés: {factures_count} factures et {devis_count} devis")
            else:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Impossible de supprimer ce client car il a {factures_count} facture(s) et {devis_count} devis. Supprimez d'abord les documents liés ou utilisez l'option 'Supprimer définitivement'."
                )
        
        db.delete(db_client)
        db.commit()
        return {"message": "Client supprimé avec succès"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erreur suppression client: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

# ==================== ARTICLES ====================

@app.get("/api/articles/generate-code")
async def generate_code_article(db: Session = Depends(get_db)):
    """Générer un code article séquentiel"""
    try:
        last_article = db.query(Article).order_by(Article.id_article.desc()).first()
        next_num = (last_article.id_article + 1) if last_article else 1
        code = f"ART-{next_num:04d}"
        return code
    except Exception as e:
        print(f"Erreur génération code: {e}")
        return "ART-0001"

@app.get("/api/articles")
async def get_articles(skip: int = 0, limit: int = 100, inclure_inactifs: bool = False, db: Session = Depends(get_db)):
    """Récupérer tous les articles (uniquement actifs par défaut)"""
    try:
        query = db.query(Article)
        
        # Par défaut, ne retourner que les articles actifs
        if not inclure_inactifs:
            query = query.filter(Article.actif == True)
        
        articles = query.offset(skip).limit(limit).all()
        return articles
    except Exception as e:
        print(f"Erreur chargement articles: {e}")
        import traceback
        traceback.print_exc()
        return []

@app.get("/api/articles/{article_id}")
async def get_article(article_id: int, db: Session = Depends(get_db)):
    """Récupérer un article par ID avec statistiques"""
    try:
        article = db.query(Article).filter(Article.id_article == article_id).first()
        if not article:
            raise HTTPException(status_code=404, detail="Article non trouvé")
        
        # Récupérer l'utilisateur qui a supprimé l'article si applicable
        utilisateur_suppression = None
        if article.supprime_par:
            utilisateur_suppression = db.query(Utilisateur).filter(
                Utilisateur.id_utilisateur == article.supprime_par
            ).first()
        
        # Ajouter des statistiques de l'article
        # Nombre de ventes (lignes de factures)
        ventes_count = db.query(LigneFacture).filter(LigneFacture.id_article == article_id).count()
        
        # Quantité totale vendue
        quantite_vendue = db.query(func.sum(LigneFacture.quantite)).filter(
            LigneFacture.id_article == article_id
        ).scalar() or 0
        
        # Chiffre d'affaires généré par cet article
        ca_article = db.query(func.sum(LigneFacture.total_ht)).filter(
            LigneFacture.id_article == article_id
        ).scalar() or 0
        
        # Dernière vente
        derniere_vente = db.query(LigneFacture).join(Facture).filter(
            LigneFacture.id_article == article_id
        ).order_by(Facture.date_facture.desc()).first()
        
        return {
            "id_article": article.id_article,
            "code_article": article.code_article,
            "designation": article.designation,
            "description": article.description,
            "prix_achat": float(article.prix_achat),
            "prix_vente": float(article.prix_vente),
            "stock_actuel": article.stock_actuel,
            "stock_minimum": article.stock_alerte,
            "type_article": article.type_article,
            "image_url": article.image_path,
            "id_fournisseur": article.id_fournisseur,
            "created_at": article.created_at,
            "actif": article.actif,
            "supprime_par": article.supprime_par,
            "supprime_par_nom": utilisateur_suppression.nom_utilisateur if utilisateur_suppression else None,
            "date_suppression": article.date_suppression.isoformat() if article.date_suppression else None,
            "statistiques": {
                "nb_ventes": ventes_count,
                "quantite_vendue": int(quantite_vendue),
                "ca_genere": float(ca_article),
                "derniere_vente": derniere_vente.facture.date_facture if derniere_vente else None
            }
        }
    except Exception as e:
        print(f"Erreur get_article: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@app.post("/api/articles")
async def create_article(article: ArticleCreate, db: Session = Depends(get_db)):
    """Créer un nouvel article"""
    try:
        # Générer un code article automatique si non fourni
        if not article.code_article:
            last_article = db.query(Article).order_by(Article.id_article.desc()).first()
            next_num = (last_article.id_article + 1) if last_article else 1
            article.code_article = f"ART-{next_num:04d}"
        
        db_article = Article(**article.dict())
        db.add(db_article)
        db.commit()
        db.refresh(db_article)
        return db_article
    except Exception as e:
        db.rollback()
        print(f"Erreur création article: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Erreur lors de la création: {str(e)}")

@app.put("/api/articles/{article_id}")
async def update_article(article_id: int, data: dict, db: Session = Depends(get_db)):
    """Mettre à jour un article"""
    try:
        print(f"🔍 DEBUG - Modification article {article_id}: {data}")
        db_article = db.query(Article).filter(Article.id_article == article_id).first()
        if not db_article:
            raise HTTPException(status_code=404, detail="Article non trouvé")
        
        # Mettre à jour les champs
        for key, value in data.items():
            if hasattr(db_article, key) and (value is not None or key in ['id_fournisseur']):
                setattr(db_article, key, value)
        
        db.commit()
        db.refresh(db_article)
        return db_article
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erreur mise à jour article: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Erreur lors de la mise à jour: {str(e)}")

@app.delete("/api/articles/{article_id}")
async def delete_article(article_id: int, request: Request, db: Session = Depends(get_db)):
    """Supprimer un article (désactiver)"""
    db_article = db.query(Article).filter(Article.id_article == article_id).first()
    if not db_article:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    
    # Enregistrer qui a supprimé l'article
    id_utilisateur = get_current_user_id(request)
    db_article.actif = False
    db_article.supprime_par = id_utilisateur
    db_article.date_suppression = datetime.now()
    db.commit()
    return {"message": "Article désactivé avec succès"}

# ==================== MOUVEMENTS DE STOCK ====================

@app.get("/api/mouvements")
async def get_mouvements(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Récupérer tous les mouvements de stock avec infos articles"""
    try:
        mouvements = db.query(MouvementStock).order_by(MouvementStock.date_mouvement.desc()).offset(skip).limit(limit).all()
        
        # Enrichir avec les infos des articles
        result = []
        for mvt in mouvements:
            article = db.query(Article).filter(Article.id_article == mvt.id_article).first()
            result.append({
                "id_mouvement": mvt.id_mouvement,
                "id_article": mvt.id_article,
                "article_designation": article.designation if article else "Article inconnu",
                "article_code": article.code_article if article else "",
                "type_mouvement": mvt.type_mouvement,
                "quantite": mvt.quantite,
                "date_mouvement": mvt.date_mouvement.isoformat() if mvt.date_mouvement else None,
                "reference": mvt.reference,
                "motif": mvt.motif if hasattr(mvt, 'motif') else None
            })
        return result
    except Exception as e:
        print(f"Erreur chargement mouvements: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@app.get("/api/mouvements/{mouvement_id}")
async def get_mouvement(mouvement_id: int, db: Session = Depends(get_db)):
    """Récupérer un mouvement par ID"""
    mouvement = db.query(MouvementStock).filter(MouvementStock.id_mouvement == mouvement_id).first()
    if not mouvement:
        raise HTTPException(status_code=404, detail="Mouvement non trouvé")
    
    article = db.query(Article).filter(Article.id_article == mouvement.id_article).first()
    return {
        "id_mouvement": mouvement.id_mouvement,
        "id_article": mouvement.id_article,
        "article_designation": article.designation if article else "Article inconnu",
        "type_mouvement": mouvement.type_mouvement,
        "quantite": mouvement.quantite,
        "date_mouvement": mouvement.date_mouvement.isoformat() if mouvement.date_mouvement else None,
        "reference": mouvement.reference,
        "motif": mouvement.motif if hasattr(mouvement, 'motif') else None
    }

class MouvementCreate(BaseModel):
    id_article: int
    type_mouvement: str
    quantite: int
    reference: Optional[str] = None

@app.post("/api/mouvements")
async def create_mouvement(mouvement: MouvementCreate, db: Session = Depends(get_db)):
    """Créer un mouvement de stock manuel"""
    try:
        # Vérifier que l'article existe
        article = db.query(Article).filter(Article.id_article == mouvement.id_article).first()
        if not article:
            raise HTTPException(status_code=404, detail="Article non trouvé")
        
        # Créer le mouvement
        nouveau_mvt = MouvementStock(
            id_article=mouvement.id_article,
            type_mouvement=mouvement.type_mouvement,
            quantite=mouvement.quantite,
            reference=mouvement.reference or f"MVT-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            date_mouvement=datetime.now()
        )
        db.add(nouveau_mvt)
        
        # Mettre à jour le stock de l'article
        if mouvement.type_mouvement == "ENTREE":
            article.stock_actuel = (article.stock_actuel or 0) + mouvement.quantite
        elif mouvement.type_mouvement == "SORTIE":
            if (article.stock_actuel or 0) < mouvement.quantite:
                raise HTTPException(status_code=400, detail="Stock insuffisant")
            article.stock_actuel = (article.stock_actuel or 0) - mouvement.quantite
        
        db.commit()
        db.refresh(nouveau_mvt)
        return nouveau_mvt
    except Exception as e:
        db.rollback()
        print(f"Erreur création mouvement: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

# ==================== FACTURES ====================

@app.get("/api/factures")
async def get_factures(
    skip: int = 0, 
    limit: int = 100, 
    id_client: int = None,  # Filtre par client
    type_facture: str = None,  # Filtre par type (NORMALE, COMPTOIR, RETOUR)
    db: Session = Depends(get_db)
):
    """Récupérer toutes les factures avec infos client (avec filtres optionnels)"""
    try:
        # Construire la requête de base
        query = db.query(Facture).join(Client, Facture.id_client == Client.id_client)
        
        # Appliquer les filtres si fournis
        if id_client:
            query = query.filter(Facture.id_client == id_client)
        
        if type_facture:
            query = query.filter(Facture.type_facture == type_facture)
        
        # Exécuter la requête avec pagination
        factures = query.offset(skip).limit(limit).all()
        
        result = []
        for facture in factures:
            client = db.query(Client).filter(Client.id_client == facture.id_client).first()
            # Récupérer l'utilisateur créateur
            utilisateur = None
            if facture.id_utilisateur:
                utilisateur = db.query(Utilisateur).filter(Utilisateur.id_utilisateur == facture.id_utilisateur).first()
            
            result.append({
                "id_facture": facture.id_facture,
                "numero_facture": facture.numero_facture,
                "type_facture": facture.type_facture,
                "id_client": facture.id_client,
                "date_facture": facture.date_facture.isoformat() if facture.date_facture else None,
                "date_echeance": facture.date_echeance.isoformat() if facture.date_echeance else None,
                "montant_ht": facture.montant_ht,
                "montant_ttc": facture.montant_ttc,
                "montant_avance": facture.montant_avance,
                "montant_reste": facture.montant_reste,
                "description": facture.description,
                "precompte_applique": facture.precompte_applique,
                "statut": facture.statut,
                "mode_paiement": facture.mode_paiement,
                "notes": facture.notes,
                "created_at": facture.created_at.isoformat() if facture.created_at else None,
                "client_nom": client.nom if client else "N/A",
                "client_telephone": client.telephone if client else "",
                "cree_par": utilisateur.nom_utilisateur if utilisateur else "Système"  # 🔥 Nom du créateur
            })
        return result
    except Exception as e:
        print(f"Erreur chargement factures: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@app.get("/api/factures/{facture_id}")
async def get_facture(facture_id: int, db: Session = Depends(get_db)):
    """Récupérer une facture par ID avec infos client"""
    facture = db.query(Facture).filter(Facture.id_facture == facture_id).first()
    if not facture:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    
    # Récupérer les infos client
    client = db.query(Client).filter(Client.id_client == facture.id_client).first()
    
    # Récupérer le devis si existe
    devis = None
    if facture.id_devis:
        devis = db.query(Devis).filter(Devis.id_devis == facture.id_devis).first()
    
    return {
        "id_facture": facture.id_facture,
        "numero_facture": facture.numero_facture,
        "type_facture": facture.type_facture,
        "date_facture": facture.date_facture.isoformat() if facture.date_facture else None,
        "date_echeance": facture.date_echeance.isoformat() if facture.date_echeance else None,
        "description": facture.description,
        "montant_ht": facture.montant_ht,
        "montant_ttc": facture.montant_ttc,
        "montant_avance": facture.montant_avance,
        "montant_reste": facture.montant_reste,
        "statut": facture.statut,
        "precompte_applique": facture.precompte_applique,
        # Infos client
        "client_nom": client.nom if client else None,
        "client_adresse": client.adresse if client else None,
        "client_telephone": client.telephone if client else None,
        "client_email": client.email if client else None,
        "client_nif": client.nif if client else None,
        # Infos devis
        "devis_numero": devis.numero_devis if devis else None
    }

@app.get("/api/factures/{facture_id}/lignes")
async def get_lignes_facture(facture_id: int, db: Session = Depends(get_db)):
    """Récupérer les lignes d'une facture - EXACTEMENT comme Python ligne 1165-1196"""
    try:
        # Vérifier que la facture existe
        facture = db.query(Facture).filter(Facture.id_facture == facture_id).first()
        if not facture:
            raise HTTPException(status_code=404, detail="Facture non trouvée")
        
        # Récupérer les lignes de la facture (comme Python ligne 1172-1180)
        lignes = db.query(LigneFacture, Article).join(
            Article, LigneFacture.id_article == Article.id_article, isouter=True
        ).filter(
            LigneFacture.id_facture == facture_id
        ).all()
        
        # Formater les lignes (comme Python ligne 1186-1189)
        lignes_formatees = []
        for ligne_facture, article in lignes:
            if article:  # Vérifier que l'article existe
                lignes_formatees.append({
                    "id_article": article.id_article,
                    "designation": article.designation,
                    "code_article": article.code_article,
                    "quantite": ligne_facture.quantite,
                    "prix_unitaire": float(ligne_facture.prix_unitaire or 0),
                    "montant_ht": float(ligne_facture.montant_ht or 0),
                    "type_article": article.type_article  # Ajouter le type d'article
                })
        
        return lignes_formatees
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"  ERREUR récupération lignes facture: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

class LigneFactureCreate(BaseModel):
    id_article: int
    quantite: int
    prix_unitaire: float
    montant_ht: float

@app.post("/api/factures")
async def create_facture(data: dict, request: Request, db: Session = Depends(get_db)):
    """Créer une nouvelle facture - EXACTEMENT comme Python ligne 1544-1579"""
    try:
        # Récupérer l'ID utilisateur connecté
        id_utilisateur = get_current_user_id(request)
        print(f"  🔑 Facture créée par l'utilisateur ID: {id_utilisateur}")
        print(f"🔍 DEBUG - Données reçues: {data}")
        
        # Générer un numéro de facture automatique
        last_facture = db.query(Facture).order_by(Facture.id_facture.desc()).first()
        next_num = (last_facture.id_facture + 1) if last_facture else 1
        year = datetime.now().year
        numero_facture = f"FAC-{year}-{next_num:03d}"
        
        # Extraire les données EXACTEMENT comme Python
        id_client = data.get('id_client')
        date_facture = data.get('date_facture')
        montant_ht = float(data.get('montant_ht', 0))
        montant_ttc = float(data.get('montant_ttc', 0))
        montant_avance = float(data.get('montant_avance', 0))
        montant_reste = float(data.get('montant_reste', 0))
        
        # 🔥 Déterminer le statut automatiquement selon le montant payé
        if montant_avance >= montant_ttc and montant_ttc > 0:
            statut = "Payée"
        elif montant_avance > 0:
            statut = "Partiellement payée"
        else:
            statut = data.get('statut', 'En attente')
        
        id_devis = data.get('id_devis')
        description = data.get('description', '')
        precompte_applique = 1 if data.get('precompte_actif') else 0
        type_facture = data.get('type_facture', 'NORMALE')
        lignes = data.get('lignes', [])
        
        print(f"  Numéro: {numero_facture}, Client: {id_client}, Montant TTC: {montant_ttc}")
        
        # Créer la facture EXACTEMENT comme Python (ligne 1544-1547)
        db_facture = Facture(
            numero_facture=numero_facture,
            date_facture=date_facture,
            total_ht=montant_ht,
            total_ttc=montant_ttc,
            statut=statut,
            id_client=id_client,
            id_utilisateur=id_utilisateur,  # 🔥 ID de l'utilisateur connecté
            id_devis=id_devis,
            montant_avance=montant_avance,
            montant_reste=montant_reste,
            description=description,
            precompte_applique=precompte_applique,
            type_facture=type_facture
        )
        db.add(db_facture)
        db.flush()
        
        print(f"  Facture créée avec ID: {db_facture.id_facture}")
        
        # Sauvegarder les lignes EXACTEMENT comme Python (ligne 1560-1579)
        for ligne in lignes:
            id_article = ligne['id_article']
            quantite = ligne['quantite']
            prix_unitaire = ligne['prix_unitaire']
            montant_ht_ligne = quantite * prix_unitaire
            
            # Récupérer l'article pour vérifier le stock
            article = db.query(Article).filter(Article.id_article == id_article).first()
            
            # 🔥 VÉRIFICATION DE STOCK pour les produits
            if article and article.type_article == 'PRODUIT':
                # Vérifier que le stock est suffisant
                if quantite > article.stock_actuel:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"❌ Stock insuffisant pour '{article.designation}'. Stock disponible: {article.stock_actuel}, Quantité demandée: {quantite}"
                    )
                
                # Vérifier que le stock n'est pas à zéro
                if article.stock_actuel <= 0:
                    raise HTTPException(
                        status_code=400,
                        detail=f"❌ Stock épuisé pour '{article.designation}'. Impossible de créer une facture pour un article en rupture de stock."
                    )
            
            # Appliquer précompte si actif ET que c'est un SERVICE
            montant_ttc_ligne = montant_ht_ligne
            if precompte_applique:
                if article and article.type_article == 'SERVICE':
                    precompte = montant_ht_ligne * 0.095
                    montant_ttc_ligne = montant_ht_ligne - precompte
            
            db_ligne = LigneFacture(
                quantite=quantite,
                prix_unitaire=prix_unitaire,
                montant_ht=montant_ht_ligne,
                total_ht=montant_ht_ligne,
                id_facture=db_facture.id_facture,
                id_article=id_article
            )
            db.add(db_ligne)
        
        print(f"  {len(lignes)} lignes ajoutées")
        
        # Décrémenter le stock si payé (comme Python ligne 1581-1599)
        if montant_avance > 0:
            for ligne in lignes:
                article = db.query(Article).filter(Article.id_article == ligne['id_article']).first()
                if article:
                    article.stock_actuel = (article.stock_actuel or 0) - ligne['quantite']
                    
                    mouvement = MouvementStock(
                        id_article=ligne['id_article'],
                        type_mouvement='SORTIE',
                        quantite=ligne['quantite'],
                        date_mouvement=datetime.now(),
                        reference=f"Facture {numero_facture}"
                    )
                    db.add(mouvement)
            print(f"  Stock décrémenté pour {len(lignes)} articles")
        
        db.commit()
        db.refresh(db_facture)
        
        print(f"  Facture {numero_facture} enregistrée avec succès!")
        
        # Retourner avec infos client
        client = db.query(Client).filter(Client.id_client == id_client).first()
        return {
            "id_facture": db_facture.id_facture,
            "numero_facture": numero_facture,
            "type_facture": type_facture,
            "id_client": id_client,
            "date_facture": date_facture,
            "montant_ht": montant_ht,
            "montant_ttc": montant_ttc,
            "montant_avance": montant_avance,
            "montant_reste": montant_reste,
            "description": description,
            "precompte_applique": precompte_applique,
            "statut": statut,
            "client_nom": client.nom if client else "N/A"
        }
    except Exception as e:
        db.rollback()
        print(f"  ERREUR création facture: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@app.put("/api/factures/{facture_id}")
async def update_facture(facture_id: int, data: dict, db: Session = Depends(get_db)):
    """Modifier une facture existante"""
    try:
        print(f"🔍 DEBUG - Modification facture {facture_id}")
        print(f"🔍 DEBUG - Données reçues: {data}")
        
        # Récupérer la facture
        facture = db.query(Facture).filter(Facture.id_facture == facture_id).first()
        if not facture:
            raise HTTPException(status_code=404, detail="Facture non trouvée")
        
        print(f"🔍 DEBUG - Facture trouvée: {facture.numero_facture}")
        
        # Mettre à jour les champs un par un avec gestion d'erreurs
        try:
            facture.numero_facture = data.get('numero_facture', facture.numero_facture)
            facture.id_client = data.get('id_client', facture.id_client)
            facture.date_facture = data.get('date_facture', facture.date_facture)
            facture.total_ht = float(data.get('montant_ht', data.get('total_ht', facture.total_ht)))
            facture.total_tva = float(data.get('montant_tva', data.get('total_tva', facture.total_tva if hasattr(facture, 'total_tva') else 0)))
            facture.total_ttc = float(data.get('montant_ttc', data.get('total_ttc', facture.total_ttc)))
            facture.statut = data.get('statut', facture.statut)
            facture.montant_avance = float(data.get('montant_avance', facture.montant_avance))
            facture.montant_reste = float(data.get('montant_reste', facture.montant_reste))
            
            # Gérer description et notes (peuvent être interchangeables)
            if 'description' in data:
                facture.description = data['description']
            if 'notes' in data:
                facture.notes = data['notes']
            
            facture.precompte_applique = 1 if data.get('precompte_actif') else 0
            facture.type_facture = data.get('type_facture', facture.type_facture)
            
            print(f"  DEBUG - Champs mis à jour avec succès")
        except Exception as e:
            print(f"  DEBUG - Erreur lors de la mise à jour des champs: {e}")
            raise
        
        # Supprimer les anciennes lignes
        db.query(LigneFacture).filter(LigneFacture.id_facture == facture_id).delete()
        
        # Ajouter les nouvelles lignes
        lignes = data.get('lignes', [])
        for ligne in lignes:
            db_ligne = LigneFacture(
                quantite=ligne['quantite'],
                prix_unitaire=ligne['prix_unitaire'],
                montant_ht=ligne['quantite'] * ligne['prix_unitaire'],
                total_ht=ligne['quantite'] * ligne['prix_unitaire'],
                id_facture=facture_id,
                id_article=ligne['id_article']
            )
            db.add(db_ligne)
        
        db.commit()
        db.refresh(facture)
        
        print(f"  Facture {facture.numero_facture} modifiée avec succès!")
        
        # Retourner avec infos client
        client = db.query(Client).filter(Client.id_client == facture.id_client).first()
        return {
            "id_facture": facture.id_facture,
            "numero_facture": facture.numero_facture,
            "type_facture": facture.type_facture,
            "id_client": facture.id_client,
            "date_facture": str(facture.date_facture),
            "montant_ht": float(facture.total_ht),
            "montant_ttc": float(facture.total_ttc),
            "montant_avance": float(facture.montant_avance),
            "montant_reste": float(facture.montant_reste),
            "description": facture.description,
            "precompte_applique": facture.precompte_applique,
            "statut": facture.statut,
            "client_nom": client.nom if client else "N/A"
        }
    except Exception as e:
        db.rollback()
        print(f"  ERREUR modification facture: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@app.put("/api/factures/{facture_id}/annuler")
async def annuler_facture(facture_id: int, db: Session = Depends(get_db)):
    """Annuler une facture (marquer comme Annulée au lieu de supprimer)"""
    try:
        # Récupérer la facture
        facture = db.query(Facture).filter(Facture.id_facture == facture_id).first()
        if not facture:
            raise HTTPException(status_code=404, detail="Facture non trouvée")
        
        # Vérifier si déjà annulée
        if facture.statut == 'Annulée':
            raise HTTPException(status_code=400, detail="Cette facture est déjà annulée")
        
        numero_facture = facture.numero_facture
        
        # Récupérer les lignes de facture pour restaurer le stock
        lignes = db.query(LigneFacture, Article).join(
            Article, LigneFacture.id_article == Article.id_article, isouter=True
        ).filter(
            LigneFacture.id_facture == facture_id
        ).all()
        
        # Restaurer le stock pour chaque article
        for ligne_facture, article in lignes:
            if article and article.type_article == "PRODUIT":
                # Remettre en stock
                article.stock_actuel = (article.stock_actuel or 0) + ligne_facture.quantite
                
                # Créer un mouvement de stock (ENTREE)
                mouvement = MouvementStock(
                    id_article=ligne_facture.id_article,
                    type_mouvement="ENTREE",
                    quantite=ligne_facture.quantite,
                    date_mouvement=datetime.now(),
                    reference=f"Annulation {numero_facture}"
                )
                db.add(mouvement)
        
        # Marquer la facture comme annulée
        facture.statut = 'Annulée'
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Facture {numero_facture} annulée avec succès",
            "articles_remis_en_stock": len(lignes)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"  ERREUR annulation facture: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'annulation : {str(e)}")

@app.delete("/api/factures/{facture_id}")
async def delete_facture(facture_id: int, db: Session = Depends(get_db)):
    """Supprimer une facture - EXACTEMENT comme Python interface/facturation.py ligne 1965-1994"""
    try:
        # Récupérer la facture
        facture = db.query(Facture).filter(Facture.id_facture == facture_id).first()
        if not facture:
            raise HTTPException(status_code=404, detail="Facture non trouvée")
        
        numero_facture = facture.numero_facture
        
        # Récupérer les lignes de facture pour restaurer le stock
        lignes = db.query(LigneFacture, Article).join(
            Article, LigneFacture.id_article == Article.id_article, isouter=True
        ).filter(
            LigneFacture.id_facture == facture_id
        ).all()
        
        # Restaurer le stock pour chaque article (comme Python)
        for ligne_facture, article in lignes:
            if article and article.type_article == "PRODUIT":
                # Remettre en stock
                article.stock_actuel = (article.stock_actuel or 0) + ligne_facture.quantite
                
                # Créer un mouvement de stock (ENTREE)
                mouvement = MouvementStock(
                    id_article=ligne_facture.id_article,
                    type_mouvement="ENTREE",
                    quantite=ligne_facture.quantite,
                    date_mouvement=datetime.now(),
                    reference=f"Suppression {numero_facture}"
                )
                db.add(mouvement)
        
        # Supprimer d'abord les règlements associés
        db.query(Reglement).filter(Reglement.id_facture == facture_id).delete()
        
        # Supprimer les lignes de facture (comme Python ligne 1982)
        db.query(LigneFacture).filter(LigneFacture.id_facture == facture_id).delete()
        
        # Supprimer la facture (comme Python ligne 1985)
        db.delete(facture)
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Facture {numero_facture} supprimée avec succès",
            "articles_remis_en_stock": len(lignes)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"  ERREUR suppression facture: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression : {str(e)}")

# ==================== DEVIS ====================

@app.get("/api/devis")
async def get_devis(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Récupérer tous les devis avec informations enrichies"""
    try:
        devis_list = db.query(Devis).order_by(Devis.created_at.desc()).offset(skip).limit(limit).all()
        
        result = []
        for devis in devis_list:
            # Récupérer le client
            client = db.query(Client).filter(Client.id_client == devis.id_client).first()
            
            # Vérifier si le devis est facturé
            facture = db.query(Facture).filter(Facture.id_devis == devis.id_devis).first()
            
            # Récupérer l'utilisateur créateur
            utilisateur = None
            if devis.id_utilisateur:
                utilisateur = db.query(Utilisateur).filter(Utilisateur.id_utilisateur == devis.id_utilisateur).first()
            
            devis_dict = {
                "id_devis": devis.id_devis,
                "numero_devis": devis.numero_devis,
                "date_devis": devis.date_devis,
                "validite": devis.validite or 30,
                "description": devis.description or devis.notes or "",
                "montant_ht": float(devis.total_ht or 0),
                "montant_ttc": float(devis.total_ttc or 0),
                "total_ht": float(devis.total_ht or 0),
                "total_ttc": float(devis.total_ttc or 0),
                "statut": devis.statut or "En attente",
                "precompte_applique": devis.precompte_applique or 0,
                "id_client": devis.id_client,
                "client_nom": client.nom if client else "N/A",
                "facture_numero": facture.numero_facture if facture else None,
                "id_facture": facture.id_facture if facture else None,
                "created_at": devis.created_at,
                "cree_par": utilisateur.nom_utilisateur if utilisateur else "Système"  # 🔥 Nom du créateur
            }
            result.append(devis_dict)
        
        return result
    except Exception as e:
        print(f"Erreur chargement devis: {e}")
        import traceback
        traceback.print_exc()
        return []

@app.post("/api/devis", response_model=DevisResponse)
async def create_devis(devis: DevisCreate, request: Request, db: Session = Depends(get_db)):
    """Créer un nouveau devis"""
    print("=" * 60)
    print("🔵 CRÉATION DEVIS - DÉBUT")
    print(f"Données reçues: {devis.dict()}")
    print("=" * 60)
    
    try:
        # Récupérer l'ID utilisateur connecté
        id_utilisateur = get_current_user_id(request)
        print(f"  🔑 Devis créé par l'utilisateur ID: {id_utilisateur}")
        
        # Générer un numéro de devis automatique si non fourni
        if not devis.numero_devis:
            last_devis = db.query(Devis).order_by(Devis.id_devis.desc()).first()
            next_num = (last_devis.id_devis + 1) if last_devis else 1
            year = datetime.now().year
            numero_devis = f"DEV-{year}-{next_num:03d}"
        else:
            numero_devis = devis.numero_devis
        
        # Créer le devis
        devis_data = devis.dict(exclude={'numero_devis', 'lignes'})
        
        # Mapper montant_ht/montant_ttc vers total_ht/total_ttc pour la DB
        if 'total_ht' not in devis_data or devis_data['total_ht'] is None:
            devis_data['total_ht'] = devis_data.pop('montant_ht', 0.0)
        else:
            devis_data.pop('montant_ht', None)
            
        if 'total_ttc' not in devis_data or devis_data['total_ttc'] is None:
            devis_data['total_ttc'] = devis_data.pop('montant_ttc', 0.0)
        else:
            devis_data.pop('montant_ttc', None)
            
        if 'description' in devis_data and not devis_data.get('notes'):
            devis_data['notes'] = devis_data.get('description')
        
        db_devis = Devis(
            numero_devis=numero_devis,
            id_utilisateur=id_utilisateur,  # 🔥 ID de l'utilisateur connecté
            **devis_data
        )
        db.add(db_devis)
        db.commit()
        db.refresh(db_devis)
        
        # Ajouter les lignes si fournies
        if hasattr(devis, 'lignes') and devis.lignes:
            for ligne_data in devis.lignes:
                ligne_dict = ligne_data.dict()
                
                # La table MySQL utilise 'total_ht', pas 'montant_ht'
                # Mapper montant_ht vers total_ht si nécessaire
                if 'montant_ht' in ligne_dict and ligne_dict['montant_ht'] is not None:
                    ligne_dict['total_ht'] = ligne_dict.pop('montant_ht')
                elif 'total_ht' not in ligne_dict or ligne_dict['total_ht'] is None:
                    # Calculer total_ht si manquant
                    ligne_dict['total_ht'] = ligne_dict.get('quantite', 1) * ligne_dict.get('prix_unitaire', 0)
                
                # Supprimer les champs non utilisés
                ligne_dict.pop('montant_ht', None)
                ligne_dict.pop('montant_ttc', None)
                
                ligne = LigneDevis(
                    id_devis=db_devis.id_devis,
                    id_article=ligne_dict['id_article'],
                    quantite=ligne_dict['quantite'],
                    prix_unitaire=ligne_dict['prix_unitaire'],
                    total_ht=ligne_dict['total_ht']
                )
                db.add(ligne)
            db.commit()
            
            # Recalculer les totaux du devis après ajout des lignes
            lignes_devis = db.query(LigneDevis).filter(LigneDevis.id_devis == db_devis.id_devis).all()
            total_ht = sum(ligne.total_ht for ligne in lignes_devis)
            
            # Calculer le précompte si activé
            total_precompte = 0
            if db_devis.precompte_applique:
                # Récupérer les articles pour vérifier le type
                for ligne in lignes_devis:
                    article = db.query(Article).filter(Article.id_article == ligne.id_article).first()
                    if article and article.type_article == 'SERVICE':
                        total_precompte += ligne.total_ht * 0.095  # 9.5%
            
            total_ttc = total_ht - total_precompte
            
            # Mettre à jour le devis avec les totaux calculés
            db_devis.total_ht = total_ht
            db_devis.total_ttc = total_ttc
            db.commit()
            db.refresh(db_devis)
        
        print("  DEVIS CRÉÉ AVEC SUCCÈS")
        return db_devis
        
    except Exception as e:
        print(f"  ERREUR CRÉATION DEVIS: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/devis/generate-numero")
async def generate_numero_devis(db: Session = Depends(get_db)):
    """Générer un numéro de devis automatique"""
    last_devis = db.query(Devis).order_by(Devis.id_devis.desc()).first()
    next_num = (last_devis.id_devis + 1) if last_devis else 1
    year = datetime.now().year
    numero_devis = f"DEV-{year}-{next_num:03d}"
    return numero_devis

@app.get("/api/devis/{devis_id}", response_model=DevisResponse)
async def get_devis_by_id(devis_id: int, db: Session = Depends(get_db)):
    """Récupérer un devis par ID"""
    devis = db.query(Devis).filter(Devis.id_devis == devis_id).first()
    if not devis:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    return devis

@app.get("/api/devis/{devis_id}/lignes")
async def get_devis_lignes(devis_id: int, db: Session = Depends(get_db)):
    """Récupérer les lignes d'un devis"""
    try:
        # Vérifier que le devis existe
        devis = db.query(Devis).filter(Devis.id_devis == devis_id).first()
        if not devis:
            raise HTTPException(status_code=404, detail="Devis non trouvé")
        
        # Récupérer les lignes
        lignes = db.query(LigneDevis).filter(LigneDevis.id_devis == devis_id).all()
        
        # Enrichir les lignes avec les informations des articles
        lignes_enrichies = []
        for ligne in lignes:
            article = db.query(Article).filter(Article.id_article == ligne.id_article).first()
            ligne_dict = {
                "id_article": ligne.id_article,
                "designation": article.designation if article else "N/A",
                "quantite": ligne.quantite,
                "prix_unitaire": float(ligne.prix_unitaire),
                "montant_total": float(ligne.total_ht if hasattr(ligne, 'total_ht') else ligne.quantite * ligne.prix_unitaire)
            }
            lignes_enrichies.append(ligne_dict)
        
        return lignes_enrichies
    except HTTPException:
        raise
    except Exception as e:
        print(f"  ERREUR GET LIGNES DEVIS: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@app.get("/api/devis/{devis_id}/details")
async def get_devis_details(devis_id: int, db: Session = Depends(get_db)):
    """Récupérer un devis avec ses lignes et informations client"""
    devis = db.query(Devis).filter(Devis.id_devis == devis_id).first()
    if not devis:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    # Récupérer les lignes
    lignes = db.query(LigneDevis).filter(LigneDevis.id_devis == devis_id).all()
    
    # Récupérer le client
    client = db.query(Client).filter(Client.id_client == devis.id_client).first()
    
    # Enrichir les lignes avec les informations des articles
    lignes_enrichies = []
    for ligne in lignes:
        article = db.query(Article).filter(Article.id_article == ligne.id_article).first()
        ligne_dict = {
            "id_ligne_devis": ligne.id_ligne if hasattr(ligne, 'id_ligne') else ligne.id_ligne_devis if hasattr(ligne, 'id_ligne_devis') else None,
            "id_article": ligne.id_article,
            "quantite": ligne.quantite,
            "prix_unitaire": ligne.prix_unitaire,
            "montant_ht": ligne.total_ht if hasattr(ligne, 'total_ht') else 0,
            "total_ht": ligne.total_ht if hasattr(ligne, 'total_ht') else 0,
            "designation": article.designation if article else "N/A",
            "article_designation": article.designation if article else "N/A",
            "article_nom": article.designation if article else "N/A",
            "type_article": article.type_article if article else "PRODUIT"  # Ajouter le type d'article
        }
        lignes_enrichies.append(ligne_dict)
    
    return {
        "id_devis": devis.id_devis,
        "numero_devis": devis.numero_devis,
        "date_devis": devis.date_devis,
        "duree_validite": devis.validite,
        "description": devis.description or devis.notes or "",
        "montant_ht": devis.total_ht if hasattr(devis, 'total_ht') else 0,
        "montant_ttc": devis.total_ttc if hasattr(devis, 'total_ttc') else 0,
        "total_ht": devis.total_ht if hasattr(devis, 'total_ht') else 0,
        "total_ttc": devis.total_ttc if hasattr(devis, 'total_ttc') else 0,
        "statut": devis.statut,
        "precompte_applique": devis.precompte_applique,
        "id_client": devis.id_client,
        "client_nom": client.nom if client else "N/A",
        "client_adresse": client.adresse if client else "",
        "client_telephone": client.telephone if client else "",
        "client_email": client.email if client else "",
        "client_nif": client.nif if client else "",
        "lignes": lignes_enrichies
    }

@app.put("/api/devis/{devis_id}")
async def update_devis(devis_id: int, data: dict, db: Session = Depends(get_db)):
    """Mettre à jour un devis"""
    try:
        print(f"🔍 DEBUG - Modification devis {devis_id}: {data}")
        
        db_devis = db.query(Devis).filter(Devis.id_devis == devis_id).first()
        if not db_devis:
            raise HTTPException(status_code=404, detail="Devis non trouvé")
        
        # Mettre à jour les champs du devis
        db_devis.id_client = data.get('id_client', db_devis.id_client)
        db_devis.numero_devis = data.get('numero_devis', db_devis.numero_devis)
        db_devis.date_devis = data.get('date_devis', db_devis.date_devis)
        db_devis.date_validite = data.get('date_validite', db_devis.date_validite)
        db_devis.statut = data.get('statut', db_devis.statut)
        db_devis.notes = data.get('notes', db_devis.notes)
        
        # Accepter les deux formats : total_* ou montant_*
        db_devis.total_ht = float(data.get('total_ht', data.get('montant_ht', db_devis.total_ht)))
        db_devis.total_tva = float(data.get('total_tva', data.get('montant_tva', db_devis.total_tva if hasattr(db_devis, 'total_tva') else 0)))
        db_devis.total_ttc = float(data.get('total_ttc', data.get('montant_ttc', db_devis.total_ttc)))
        
        # Supprimer les anciennes lignes
        db.query(LigneDevis).filter(LigneDevis.id_devis == devis_id).delete()
        
        # Ajouter les nouvelles lignes
        lignes = data.get('lignes', [])
        for ligne in lignes:
            # Calculer le total
            total_ligne = ligne.get('montant_total', ligne.get('total_ht', ligne['quantite'] * ligne['prix_unitaire']))
            
            db_ligne = LigneDevis(
                id_devis=devis_id,
                id_article=ligne['id_article'],
                quantite=ligne['quantite'],
                prix_unitaire=ligne['prix_unitaire'],
                total_ht=float(total_ligne)
            )
            db.add(db_ligne)
        
        db.commit()
        db.refresh(db_devis)
        
        print(f"  Devis {db_devis.numero_devis} modifié avec succès!")
        
        # Retourner avec infos client
        client = db.query(Client).filter(Client.id_client == db_devis.id_client).first()
        return {
            "id_devis": db_devis.id_devis,
            "numero_devis": db_devis.numero_devis,
            "id_client": db_devis.id_client,
            "date_devis": str(db_devis.date_devis),
            "montant_ht": float(db_devis.total_ht),
            "montant_ttc": float(db_devis.total_ttc),
            "validite": db_devis.validite,
            "description": db_devis.description,
            "statut": db_devis.statut,
            "client_nom": client.nom if client else "N/A"
        }
    except Exception as e:
        db.rollback()
        print(f"  ERREUR modification devis: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@app.put("/api/devis/{devis_id}/annuler")
async def annuler_devis(devis_id: int, db: Session = Depends(get_db)):
    """Annuler un devis (marquer comme Annulé au lieu de supprimer)"""
    try:
        db_devis = db.query(Devis).filter(Devis.id_devis == devis_id).first()
        if not db_devis:
            raise HTTPException(status_code=404, detail="Devis non trouvé")
        
        # Vérifier si déjà annulé
        if db_devis.statut == 'Annulé':
            raise HTTPException(status_code=400, detail="Ce devis est déjà annulé")
        
        # Marquer le devis comme annulé
        db_devis.statut = 'Annulé'
        db.commit()
        
        return {
            "success": True,
            "message": f"Devis {db_devis.numero_devis} annulé avec succès"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"  ERREUR annulation devis: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'annulation : {str(e)}")

@app.delete("/api/devis/{devis_id}")
async def delete_devis(devis_id: int, db: Session = Depends(get_db)):
    """Supprimer un devis"""
    db_devis = db.query(Devis).filter(Devis.id_devis == devis_id).first()
    if not db_devis:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    # Supprimer les lignes d'abord
    db.query(LigneDevis).filter(LigneDevis.id_devis == devis_id).delete()
    
    # Supprimer le devis
    db.delete(db_devis)
    db.commit()
    return {"message": "Devis supprimé avec succès"}

@app.put("/api/devis/{devis_id}/valider")
async def valider_devis(devis_id: int, db: Session = Depends(get_db)):
    """Valider un devis (passer de 'En attente' à 'Accepté') ET créer une facture"""
    db_devis = db.query(Devis).filter(Devis.id_devis == devis_id).first()
    if not db_devis:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    # 1. Changer le statut du devis
    db_devis.statut = "Accepté"
    db.commit()
    
    # 2. Créer une facture à partir du devis
    # Générer un numéro de facture
    last_facture = db.query(Facture).order_by(Facture.id_facture.desc()).first()
    next_num = (last_facture.id_facture + 1) if last_facture else 1
    year = datetime.now().year
    numero_facture = f"FAC-{year}-{next_num:03d}"
    
    # Créer la facture (NON PAYÉE initialement)
    # Le statut sera mis à jour lors du premier règlement
    facture = Facture(
        numero_facture=numero_facture,
        type_facture='NORMALE',
        id_client=db_devis.id_client,
        id_utilisateur=db_devis.id_utilisateur,  # 🔥 Hériter de l'utilisateur qui a créé le devis
        date_facture=date.today(),
        date_echeance=date.today() + timedelta(days=30),
        montant_ht=db_devis.total_ht,
        montant_ttc=db_devis.total_ttc,
        montant_avance=0,  #   Aucun paiement encore
        montant_reste=db_devis.total_ttc,  #   Tout reste à payer
        description=db_devis.description or f"Facture issue du devis {db_devis.numero_devis}",
        precompte_applique=db_devis.precompte_applique,
        statut='IMPAYÉE',  #   IMPAYÉE (pas 'En attente')
        mode_paiement=None,
        notes=db_devis.notes or db_devis.description,
        id_devis=db_devis.id_devis
    )
    db.add(facture)
    db.commit()
    db.refresh(facture)
    
    # 3. Copier les lignes du devis vers la facture
    lignes_devis = db.query(LigneDevis).filter(LigneDevis.id_devis == devis_id).all()
    print(f"  Copie de {len(lignes_devis)} ligne(s) du devis {db_devis.numero_devis} vers facture {numero_facture}")
    
    for ligne_devis in lignes_devis:
        ligne_facture = LigneFacture(
            id_facture=facture.id_facture,
            id_article=ligne_devis.id_article,
            quantite=ligne_devis.quantite,
            prix_unitaire=ligne_devis.prix_unitaire,
            total_ht=ligne_devis.total_ht
        )
        db.add(ligne_facture)
        print(f"    Ligne ajoutée: {ligne_devis.quantite}x article {ligne_devis.id_article} = {ligne_devis.total_ht} FCFA")
    
    db.commit()
    print(f"  Facture {numero_facture} créée avec {len(lignes_devis)} ligne(s)")
    
    return {
        "message": "Devis validé et facture créée avec succès",
        "devis": db_devis,
        "facture": facture,
        "numero_facture": numero_facture
    }

# ==================== STATISTIQUES DASHBOARD ====================

@app.get("/api/stats/dashboard")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Récupérer les statistiques du dashboard - EXACTEMENT comme Python ligne 324-417"""
    try:
        from sqlalchemy import func, case
        
        # Statistique 1: Clients (ligne 329)
        nb_clients = db.query(func.count(Client.id_client)).scalar() or 0
        
        # Statistique 2: Articles (ligne 330)
        nb_articles = db.query(func.count(Article.id_article)).scalar() or 0
        
        # Statistique 3: Factures Normales (ligne 331)
        nb_factures_normales = db.query(func.count(Facture.id_facture)).filter(
            Facture.type_facture == 'NORMALE'
        ).scalar() or 0
        
        # Statistique 4: Ventes Comptoir (ligne 332)
        nb_ventes_comptoir = db.query(func.count(Facture.id_facture)).filter(
            Facture.type_facture == 'COMPTOIR'
        ).scalar() or 0
        
        # Statistique 5: Devis (ligne 333)
        nb_devis = db.query(func.count(Devis.id_devis)).scalar() or 0
        
        # Statistique 6: Règlements (ligne 334)
        nb_reglements = db.query(func.count(Reglement.id_reglement)).scalar() or 0
        
        # Statistique 7: Avoirs (ligne 335)
        nb_avoirs = db.query(func.count(Avoir.id_avoir)).scalar() or 0
        
        # Statistique 8: Chiffre d'Affaires avec retours soustraits (ligne 336-361)
        # 🔥 Mélange: COMPTOIR/RETOUR utilise total_ttc, NORMALE utilise montant_avance (déjà payé)
        # 🔥 CORRECTION: Pour facturation NORMALE, ne comptabiliser que les factures payées (statut Payée)
        ca_total = db.query(
            func.coalesce(
                func.sum(
                    case(
                        (Facture.type_facture == 'RETOUR', -Facture.total_ttc),
                        (Facture.type_facture == 'COMPTOIR', Facture.total_ttc),
                        else_=Facture.montant_avance  # NORMALE utilise montant déjà payé
                    )
                ),
                0
            )
        ).filter(
            Facture.statut != 'Annulée'
        ).filter(
            # Pour factures NORMALES: seulement celles payées (montant_avance > 0)
            # Pour COMPTOIR/RETOUR: toutes les non-annulées
            ((Facture.type_facture == 'NORMALE') & (Facture.montant_avance > 0)) |
            (Facture.type_facture.in_(['COMPTOIR', 'RETOUR']))
        ).scalar() or 0
        
        # Statistique 9: Créances (Impayés) (ligne 363-372)
        creances = db.query(
            func.coalesce(func.sum(Facture.montant_reste), 0)
        ).filter(
            Facture.statut != 'Annulée',
            Facture.montant_reste > 0
        ).scalar() or 0
        
        return {
            "nb_clients": int(nb_clients),
            "nb_articles": int(nb_articles),
            "nb_factures_normales": int(nb_factures_normales),
            "nb_ventes_comptoir": int(nb_ventes_comptoir),
            "nb_devis": int(nb_devis),
            "nb_reglements": int(nb_reglements),
            "nb_avoirs": int(nb_avoirs),
            "ca_total": float(ca_total),
            "creances": float(creances)
        }
    except Exception as e:
        print(f"Erreur récupération stats dashboard: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats/ventes-mois")
async def get_ventes_par_mois(db: Session = Depends(get_db)):
    """Récupérer les ventes par mois SEPAREES par type (Comptoir, Normale, Total)"""
    try:
        from sqlalchemy import func, case, extract
        
        annee_actuelle = datetime.now().year
        
        # VENTES COMPTOIR NETTES par mois (retours soustraits)
        # 🔥 CORRECTION: Utiliser total_ttc (montant réel vendu) au lieu de montant_avance (montant reçu)
        resultats_comptoir = db.query(
            extract('month', Facture.date_facture).label('mois'),
            func.coalesce(
                func.sum(
                    case(
                        # Les factures de retour impactent le net en négatif
                        (Facture.type_facture == 'RETOUR', -Facture.total_ttc),
                        # Les ventes comptoir impactent en positif
                        (Facture.type_facture == 'COMPTOIR', Facture.total_ttc),
                        # Autres types n'impactent pas la série comptoir
                        else_=0
                    )
                ),
                0
            ).label('total')
        ).filter(
            extract('year', Facture.date_facture) == annee_actuelle,
            Facture.statut != 'Annulée'
        ).group_by(
            extract('month', Facture.date_facture)
        ).order_by('mois').all()
        
        # VENTES NORMALES par mois (sans retours)
        # 🔥 Pour facturation NORMALE: utiliser montant_avance (montant déjà payé) car paiement différé possible
        # 🔥 CORRECTION: Ne comptabiliser que les factures payées (montant_avance > 0)
        resultats_normales = db.query(
            extract('month', Facture.date_facture).label('mois'),
            func.coalesce(func.sum(Facture.montant_avance), 0).label('total')
        ).filter(
            extract('year', Facture.date_facture) == annee_actuelle,
            Facture.type_facture == 'NORMALE',
            Facture.statut != 'Annulée',
            Facture.montant_avance > 0  # Seulement les factures payées
        ).group_by(
            extract('month', Facture.date_facture)
        ).order_by('mois').all()
        
        # TOTAL (avec retours soustraits) - MySQL compatible
        # 🔥 Mélange: COMPTOIR/RETOUR utilise total_ttc, NORMALE utilise montant_avance (déjà payé)
        # 🔥 CORRECTION: Pour facturation NORMALE, ne comptabiliser que les factures payées (montant_avance > 0)
        resultats_total = db.query(
            extract('month', Facture.date_facture).label('mois'),
            func.coalesce(
                func.sum(
                    case(
                        (Facture.type_facture == 'RETOUR', -Facture.total_ttc),
                        (Facture.type_facture == 'COMPTOIR', Facture.total_ttc),
                        else_=Facture.montant_avance  # NORMALE utilise montant déjà payé
                    )
                ),
                0
            ).label('total')
        ).filter(
            extract('year', Facture.date_facture) == annee_actuelle,
            Facture.statut != 'Annulée'
        ).filter(
            # Pour factures NORMALES: seulement celles payées (montant_avance > 0)
            # Pour COMPTOIR/RETOUR: toutes les non-annulées
            ((Facture.type_facture == 'NORMALE') & (Facture.montant_avance > 0)) |
            (Facture.type_facture.in_(['COMPTOIR', 'RETOUR']))
        ).group_by(
            extract('month', Facture.date_facture)
        ).order_by('mois').all()
        
        # Créer les dicts (mois en tant qu'entier maintenant)
        comptoir_dict = {int(row.mois): float(row.total) for row in resultats_comptoir}
        normales_dict = {int(row.mois): float(row.total) for row in resultats_normales}
        total_dict = {int(row.mois): float(row.total) for row in resultats_total}
        
        # Préparer les données pour tous les 12 mois
        totaux_comptoir = []
        totaux_normales = []
        totaux_total = []
        
        for i in range(1, 13):
            val_comp = comptoir_dict.get(i, 0)
            val_norm = normales_dict.get(i, 0)
            val_total = total_dict.get(i, 0)
            # Empêcher les valeurs négatives dans les graphes
            totaux_comptoir.append(val_comp if val_comp > 0 else 0)
            totaux_normales.append(val_norm if val_norm > 0 else 0)
            totaux_total.append(val_total if val_total > 0 else 0)
        
        return {
            "mois": ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                    'Juillet', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'],
            "totaux_comptoir": totaux_comptoir,
            "totaux_normales": totaux_normales,
            "totaux_total": totaux_total,
            "annee": annee_actuelle
        }
        
    except Exception as e:
        print(f"Erreur ventes par mois: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats/activite-recente")
async def get_activite_recente(db: Session = Depends(get_db)):
    """Récupérer l'activité récente - EXACTEMENT comme Python ligne 583-700"""
    try:
        from datetime import timedelta
        
        date_limite = date.today() - timedelta(days=7)
        activites = []
        
        # Factures récentes (ligne 588-598)
        factures = db.query(Facture, Client).join(
            Client, Facture.id_client == Client.id_client, isouter=True
        ).filter(
            Facture.date_facture >= date_limite
        ).order_by(Facture.date_facture.desc()).limit(10).all()
        
        for facture, client in factures:
            activites.append({
                "type_activite": "facture",
                "numero": facture.numero_facture,
                "client_nom": client.nom if client else "N/A",
                "montant": float(facture.montant_ttc or facture.total_ttc or 0),
                "date_activite": facture.date_facture.isoformat() if facture.date_facture else None,
                "statut": facture.statut
            })
        
        # Devis récents (ligne 600-611)
        devis = db.query(Devis, Client).join(
            Client, Devis.id_client == Client.id_client, isouter=True
        ).filter(
            Devis.date_devis >= date_limite
        ).order_by(Devis.date_devis.desc()).limit(10).all()
        
        for dev, client in devis:
            activites.append({
                "type_activite": "devis",
                "numero": dev.numero_devis,
                "client_nom": client.nom if client else "N/A",
                "montant": float(dev.montant_ttc or dev.total_ttc or 0),
                "date_activite": dev.date_devis.isoformat() if dev.date_devis else None,
                "statut": dev.statut
            })
        
        # Trier toutes les activités par date décroissante et prendre les 10 premières (ligne 625)
        activites.sort(key=lambda x: x['date_activite'] or '', reverse=True)
        activites = activites[:10]
        
        return activites
        
    except Exception as e:
        print(f"Erreur activité récente: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ==================== RECHERCHE ====================

@app.get("/api/search/clients")
async def search_clients(q: str, db: Session = Depends(get_db)):
    """Rechercher des clients"""
    clients = db.query(Client).filter(
        Client.nom.contains(q) | 
        Client.email.contains(q) |
        Client.telephone.contains(q)
    ).limit(10).all()
    return clients

@app.get("/api/search/articles")
async def search_articles(q: str, inclure_inactifs: bool = False, db: Session = Depends(get_db)):
    """Rechercher des articles (uniquement actifs par défaut)"""
    query = db.query(Article).filter(
        Article.designation.contains(q) |
        Article.code_article.contains(q) |
        Article.categorie.contains(q)
    )
    
    # Par défaut, ne retourner que les articles actifs
    if not inclure_inactifs:
        query = query.filter(Article.actif == True)
    
    articles = query.limit(10).all()
    return articles


# ============================================================================
# FOURNISSEURS
# ============================================================================

@app.get("/api/fournisseurs", response_model=List[FournisseurResponse])
async def get_fournisseurs(db: Session = Depends(get_db)):
    """Récupérer tous les fournisseurs"""
    fournisseurs = db.query(Fournisseur).all()
    return fournisseurs

@app.get("/api/fournisseurs/{fournisseur_id}")
async def get_fournisseur(fournisseur_id: int, db: Session = Depends(get_db)):
    """Récupérer un fournisseur par ID avec statistiques"""
    try:
        fournisseur = db.query(Fournisseur).filter(Fournisseur.id_fournisseur == fournisseur_id).first()
        if not fournisseur:
            raise HTTPException(status_code=404, detail="Fournisseur non trouvé")
        
        # Ajouter des statistiques du fournisseur
        articles_count = db.query(Article).filter(Article.id_fournisseur == fournisseur_id).count()
        
        # Calculer le montant total des achats (articles avec ce fournisseur)
        montant_total_achats = db.query(func.sum(Article.prix_achat * Article.stock_actuel)).filter(
            Article.id_fournisseur == fournisseur_id
        ).scalar() or 0
        
        # Dernier article reçu
        dernier_article = db.query(Article).filter(
            Article.id_fournisseur == fournisseur_id
        ).order_by(Article.created_at.desc()).first()
        
        return {
            "id_fournisseur": fournisseur.id_fournisseur,
            "nom_fournisseur": fournisseur.nom_fournisseur,
            "adresse": fournisseur.adresse,
            "telephone": fournisseur.telephone,
            "email": fournisseur.email,
            "ville": fournisseur.ville,
            "pays": fournisseur.pays,
            "nif": fournisseur.nif,
            "created_at": fournisseur.created_at,
            "statistiques": {
                "nb_articles": articles_count,
                "montant_total_achats": float(montant_total_achats),
                "dernier_article": dernier_article.created_at if dernier_article else None
            }
        }
    except Exception as e:
        print(f"Erreur get_fournisseur: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@app.post("/api/fournisseurs", response_model=FournisseurResponse)
async def create_fournisseur(fournisseur: FournisseurCreate, db: Session = Depends(get_db)):
    """Créer un nouveau fournisseur"""
    # Générer un numéro de fournisseur automatique si non fourni
    fournisseur_data = fournisseur.dict()
    if not fournisseur_data.get('numero_fournisseur'):
        last_fournisseur = db.query(Fournisseur).order_by(Fournisseur.id_fournisseur.desc()).first()
        next_num = (last_fournisseur.id_fournisseur + 1) if last_fournisseur else 1
        year = datetime.now().year
        fournisseur_data['numero_fournisseur'] = f"FOUR-{year}-{next_num:03d}"
    
    new_fournisseur = Fournisseur(**fournisseur_data)
    db.add(new_fournisseur)
    db.commit()
    db.refresh(new_fournisseur)
    return new_fournisseur

@app.put("/api/fournisseurs/{fournisseur_id}")
async def update_fournisseur(fournisseur_id: int, data: dict, db: Session = Depends(get_db)):
    """Mettre à jour un fournisseur"""
    try:
        print(f"🔍 DEBUG - Modification fournisseur {fournisseur_id}: {data}")
        
        db_fournisseur = db.query(Fournisseur).filter(Fournisseur.id_fournisseur == fournisseur_id).first()
        if not db_fournisseur:
            raise HTTPException(status_code=404, detail="Fournisseur non trouvé")
        
        # Mettre à jour les champs
        for key, value in data.items():
            if hasattr(db_fournisseur, key) and value is not None:
                setattr(db_fournisseur, key, value)
        
        db.commit()
        db.refresh(db_fournisseur)
        
        print(f"  Fournisseur {db_fournisseur.nom_fournisseur} modifié avec succès!")
        return db_fournisseur
    except Exception as e:
        db.rollback()
        print(f"  ERREUR modification fournisseur: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@app.delete("/api/fournisseurs/{fournisseur_id}")
async def delete_fournisseur(fournisseur_id: int, db: Session = Depends(get_db)):
    """Supprimer un fournisseur"""
    fournisseur = db.query(Fournisseur).filter(Fournisseur.id_fournisseur == fournisseur_id).first()
    if not fournisseur:
        raise HTTPException(status_code=404, detail="Fournisseur non trouvé")
    
    db.delete(fournisseur)
    db.commit()
    return {"message": "Fournisseur supprimé avec succès"}


# ============================================================================
# RÈGLEMENTS
# ============================================================================

@app.get("/api/reglements")
async def get_reglements(db: Session = Depends(get_db)):
    """Récupérer tous les règlements avec informations enrichies"""
    try:
        reglements_list = db.query(Reglement).order_by(Reglement.date_reglement.desc()).all()
        
        result = []
        for reglement in reglements_list:
            # Récupérer la facture
            facture = db.query(Facture).filter(Facture.id_facture == reglement.id_facture).first()
            
            # Récupérer le client via la facture
            client = None
            if facture:
                client = db.query(Client).filter(Client.id_client == facture.id_client).first()
            
            reglement_dict = {
                "id_reglement": reglement.id_reglement,
                "id_facture": reglement.id_facture,
                "montant": float(reglement.montant or 0),
                "mode_paiement": reglement.mode_paiement,
                "date_reglement": reglement.date_reglement,
                "reference": reglement.reference if hasattr(reglement, 'reference') else None,
                "notes": reglement.notes if hasattr(reglement, 'notes') else None,
                "statut": reglement.statut if hasattr(reglement, 'statut') else None,
                "facture_numero": facture.numero_facture if facture else "N/A",
                "client_nom": client.nom if client else "N/A",
                "created_at": reglement.created_at if hasattr(reglement, 'created_at') else None
            }
            result.append(reglement_dict)
        
        return result
    except Exception as e:
        print(f"Erreur chargement règlements: {e}")
        import traceback
        traceback.print_exc()
        return []

@app.get("/api/factures/{facture_id}/reglements")
async def get_reglements_facture(facture_id: int, db: Session = Depends(get_db)):
    """Récupérer tous les règlements d'une facture"""
    try:
        reglements = db.query(Reglement).filter(Reglement.id_facture == facture_id).order_by(Reglement.date_reglement.desc()).all()
        
        result = []
        for reglement in reglements:
            result.append({
                "id_reglement": reglement.id_reglement,
                "id_facture": reglement.id_facture,
                "montant": float(reglement.montant or 0),
                "mode_paiement": reglement.mode_paiement,
                "reference": reglement.reference,
                "date_reglement": reglement.date_reglement.isoformat() if reglement.date_reglement else None
            })
        
        return result
    except Exception as e:
        print(f"Erreur récupération règlements facture: {e}")
        return []

@app.get("/api/reglements/{reglement_id}")
async def get_reglement(reglement_id: int, db: Session = Depends(get_db)):
    """Récupérer un règlement par ID avec détails de la facture"""
    try:
        reglement = db.query(Reglement).filter(Reglement.id_reglement == reglement_id).first()
        if not reglement:
            raise HTTPException(status_code=404, detail="Règlement non trouvé")
        
        # Récupérer la facture associée
        facture = db.query(Facture).filter(Facture.id_facture == reglement.id_facture).first()
        
        # Récupérer le client de la facture
        client = None
        if facture and facture.id_client:
            client = db.query(Client).filter(Client.id_client == facture.id_client).first()
        
        return {
            "id_reglement": reglement.id_reglement,
            "id_facture": reglement.id_facture,
            "montant": float(reglement.montant),
            "mode_paiement": reglement.mode_paiement,
            "date_reglement": reglement.date_reglement,
            "reference": reglement.reference,
            "created_at": reglement.created_at,
            "facture": {
                "numero_facture": facture.numero_facture if facture else None,
                "date_facture": facture.date_facture if facture else None,
                "montant_ht": float(facture.total_ht) if facture else None,
                "montant_ttc": float(facture.total_ttc) if facture else None,
                "statut": facture.statut if facture else None
            } if facture else None,
            "client": {
                "nom": client.nom if client else None,
                "telephone": client.telephone if client else None,
                "email": client.email if client else None
            } if client else None
        }
    except Exception as e:
        print(f"Erreur get_reglement: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@app.post("/api/reglements")
async def create_reglement(reglement: dict, db: Session = Depends(get_db)):
    """Créer un nouveau règlement - EXACTEMENT comme Python reglements.py ligne 617-728"""
    try:
        facture = db.query(Facture).filter(Facture.id_facture == reglement['id_facture']).first()
        if not facture:
            raise HTTPException(status_code=404, detail="Facture non trouvée")
        
        # Vérifier si la facture est déjà entièrement payée
        montant_ttc = facture.montant_ttc or facture.total_ttc or 0
        montant_avance_actuel = facture.montant_avance or 0
        montant_reste = montant_ttc - montant_avance_actuel
        
        if montant_reste <= 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Impossible d'ajouter un règlement : la facture {facture.numero_facture} est déjà entièrement payée"
            )
        
        # Vérifier que le montant du règlement ne dépasse pas le montant restant
        montant_reglement = reglement.get('montant', 0)
        if montant_reglement > montant_reste:
            raise HTTPException(
                status_code=400,
                detail=f"Le montant du règlement ({montant_reglement} FCFA) dépasse le montant restant ({montant_reste} FCFA)"
            )
        
        # Vérifier si c'est le PREMIER paiement (ligne 657-663)
        premier_paiement = (montant_avance_actuel == 0)
        
        print(f"🔍 Règlement - Premier paiement: {premier_paiement}, montant_avance actuel: {montant_avance_actuel}")
        
        # Générer un numéro de règlement automatique si non fourni
        if 'numero_reglement' not in reglement or not reglement.get('numero_reglement'):
            last_reglement = db.query(Reglement).order_by(Reglement.id_reglement.desc()).first()
            next_num = (last_reglement.id_reglement + 1) if last_reglement else 1
            year = datetime.now().year
            reglement['numero_reglement'] = f"REG-{year}-{next_num:03d}"
        
        # Créer le règlement
        new_reglement = Reglement(**reglement)
        db.add(new_reglement)
        
        # Mettre à jour la facture (ligne 671-677)
        montant_avance = facture.montant_avance or 0
        nouveau_montant_avance = montant_avance + reglement['montant']
        facture.montant_avance = nouveau_montant_avance
        
        montant_ttc = facture.montant_ttc or facture.total_ttc or 0
        facture.montant_reste = montant_ttc - nouveau_montant_avance
        
        # Mettre à jour le statut
        if facture.montant_reste <= 0:
            facture.statut = "Payée"
        elif nouveau_montant_avance > 0:
            facture.statut = "Partiellement payée"
        
        # Si c'est le PREMIER paiement, décrémenter le stock (ligne 680-725)
        if premier_paiement:
            print(f"🔥 PREMIER PAIEMENT détecté - Décrémentation du stock pour facture {facture.numero_facture}")
            
            # Récupérer toutes les lignes de la facture
            lignes = db.query(LigneFacture, Article).join(
                Article, LigneFacture.id_article == Article.id_article
            ).filter(
                LigneFacture.id_facture == facture.id_facture
            ).all()
            
            for ligne_facture, article in lignes:
                # Décrémenter le stock_actuel (ligne 692-697)
                article.stock_actuel = (article.stock_actuel or 0) - ligne_facture.quantite
                
                # Créer un mouvement de stock SORTIE (ligne 719-723)
                mouvement = MouvementStock(
                    id_article=article.id_article,
                    type_mouvement='SORTIE',
                    quantite=ligne_facture.quantite,
                    date_mouvement=datetime.now(),
                    reference=f"Facture {facture.numero_facture}"
                )
                db.add(mouvement)
            
            print(f"  Stock décrémenté pour {len(lignes)} article(s) - Facture {facture.numero_facture}")
        
        db.commit()
        db.refresh(new_reglement)
        return new_reglement
    except Exception as e:
        db.rollback()
        print(f"Erreur création règlement: {e}")
        raise HTTPException(status_code=400, detail=f"Erreur lors de la création du règlement: {str(e)}")

@app.delete("/api/reglements/{reglement_id}")
async def delete_reglement(reglement_id: int, db: Session = Depends(get_db)):
    """Supprimer un règlement"""
    reglement = db.query(Reglement).filter(Reglement.id_reglement == reglement_id).first()
    if not reglement:
        raise HTTPException(status_code=404, detail="Règlement non trouvé")
    
    # Restaurer le montant dans la facture
    facture = db.query(Facture).filter(Facture.id_facture == reglement.id_facture).first()
    if facture:
        facture.montant_avance = (facture.montant_avance or 0) - reglement.montant
        montant_ttc = facture.montant_ttc or facture.total_ttc or 0
        facture.montant_reste = montant_ttc - facture.montant_avance
        
        # Mettre à jour le statut
        if facture.montant_reste >= montant_ttc:
            facture.statut = "En attente"
        elif facture.montant_avance > 0:
            facture.statut = "Partiellement payée"
    
    db.delete(reglement)
    db.commit()
    return {"message": "Règlement supprimé avec succès"}


# ============================================================================
# AVOIRS
# ============================================================================

@app.get("/api/avoirs")
async def get_avoirs(db: Session = Depends(get_db)):
    """Récupérer tous les avoirs avec informations enrichies"""
    try:
        avoirs_list = db.query(Avoir).order_by(Avoir.created_at.desc()).all()
        
        result = []
        for avoir in avoirs_list:
            # Récupérer la facture si liée
            facture = None
            client = None
            id_client = None
            
            if avoir.id_facture:
                facture = db.query(Facture).filter(Facture.id_facture == avoir.id_facture).first()
                if facture:
                    # Récupérer le client via la facture
                    id_client = facture.id_client
                    client = db.query(Client).filter(Client.id_client == facture.id_client).first()
            
            avoir_dict = {
                "id_avoir": avoir.id_avoir,
                "numero_avoir": avoir.numero_avoir,
                "date_avoir": avoir.date_avoir,
                "id_client": id_client,
                "id_facture": avoir.id_facture,
                "motif": avoir.motif,
                "montant_ttc": float(avoir.montant or 0),  # MySQL a seulement 'montant'
                "statut": avoir.statut or "EN_ATTENTE",
                "client_nom": client.nom if client else "N/A",
                "facture_numero": facture.numero_facture if facture else None,
                "created_at": avoir.created_at if hasattr(avoir, 'created_at') else None
            }
            result.append(avoir_dict)
        
        return result
    except Exception as e:
        print(f"Erreur chargement avoirs: {e}")
        import traceback
        traceback.print_exc()
        return []

@app.get("/api/avoirs/generate-numero")
async def generate_numero_avoir(db: Session = Depends(get_db)):
    """Générer un numéro d'avoir automatique"""
    try:
        last_avoir = db.query(Avoir).order_by(Avoir.id_avoir.desc()).first()
        next_num = (last_avoir.id_avoir + 1) if last_avoir else 1
        year = datetime.now().year
        numero_avoir = f"AVO-{year}-{next_num:03d}"
        return {"numero_avoir": numero_avoir}  # Retourner un JSON au lieu d'une chaîne
    except Exception as e:
        print(f"  Erreur génération numéro avoir: {e}")
        import traceback
        traceback.print_exc()
        # Retourner un numéro par défaut en cas d'erreur
        return {"numero_avoir": f"AVO-{datetime.now().year}-001"}

@app.get("/api/avoirs/{avoir_id}")
async def get_avoir(avoir_id: int, db: Session = Depends(get_db)):
    """Récupérer un avoir par ID"""
    avoir = db.query(Avoir).filter(Avoir.id_avoir == avoir_id).first()
    if not avoir:
        raise HTTPException(status_code=404, detail="Avoir non trouvé")
    return avoir

@app.get("/api/avoirs/{avoir_id}/details")
async def get_avoir_details(avoir_id: int, db: Session = Depends(get_db)):
    """Récupérer un avoir avec informations complètes"""
    try:
        avoir = db.query(Avoir).filter(Avoir.id_avoir == avoir_id).first()
        if not avoir:
            raise HTTPException(status_code=404, detail="Avoir non trouvé")
        
        # Récupérer la facture si liée pour avoir l'id_client
        facture = None
        client = None
        id_client = None
        
        if avoir.id_facture:
            facture = db.query(Facture).filter(Facture.id_facture == avoir.id_facture).first()
            if facture:
                id_client = facture.id_client
                client = db.query(Client).filter(Client.id_client == facture.id_client).first()
        
        # Récupérer les lignes
        lignes = db.query(LigneAvoir).filter(LigneAvoir.id_avoir == avoir_id).all()
        lignes_data = []
        for ligne in lignes:
            article = db.query(Article).filter(Article.id_article == ligne.id_article).first()
            lignes_data.append({
                "id_article": ligne.id_article,
                "designation": article.designation if article else "N/A",
                "quantite": ligne.quantite,
                "prix_unitaire": float(ligne.prix_unitaire),
                "montant_ht": float(ligne.montant_ht) if hasattr(ligne, 'montant_ht') else 0.0
            })
        
        return {
            "id_avoir": avoir.id_avoir,
            "numero_avoir": avoir.numero_avoir,
            "date_avoir": str(avoir.date_avoir),
            "id_facture": avoir.id_facture,
            "id_client": id_client,  # Récupéré depuis la facture
            "motif": avoir.motif,
            "montant_ht": float(avoir.montant),
            "montant_tva": 0.0,  # Pas de colonne montant_tva dans la table avoir
            "montant_ttc": float(avoir.montant),
            "statut": avoir.statut,
            "client_nom": client.nom if client else "N/A",
            "facture_numero": facture.numero_facture if facture else None,
            "lignes": lignes_data
        }
    except Exception as e:
        print(f"  ERREUR GET AVOIR DETAILS: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@app.post("/api/avoirs")
async def create_avoir(avoir: dict, db: Session = Depends(get_db)):
    """Créer un nouvel avoir avec ses lignes (comme Python ligne 1410-1511)"""
    try:
        # Extraire les lignes si présentes
        lignes_data = avoir.pop('lignes', [])
        
        # Générer un numéro si non fourni
        if not avoir.get('numero_avoir'):
            last_avoir = db.query(Avoir).order_by(Avoir.id_avoir.desc()).first()
            next_num = (last_avoir.id_avoir + 1) if last_avoir else 1
            year = datetime.now().year
            avoir['numero_avoir'] = f"AVO-{year}-{next_num:03d}"
        
        # Convertir date_avoir si c'est une string
        if 'date_avoir' in avoir and isinstance(avoir['date_avoir'], str):
            from datetime import datetime as dt
            avoir['date_avoir'] = dt.strptime(avoir['date_avoir'], '%Y-%m-%d').date()
        
        # Créer l'avoir
        new_avoir = Avoir(**avoir)
        db.add(new_avoir)
        db.flush()  # Pour obtenir l'ID sans commit
        
        # Créer les lignes d'avoir
        for ligne_data in lignes_data:
            ligne = LigneAvoir(
                id_avoir=new_avoir.id_avoir,
                id_article=ligne_data['id_article'],
                quantite=ligne_data['quantite'],
                prix_unitaire=ligne_data['prix_unitaire'],
                montant_ht=ligne_data.get('montant_ht', 0)
            )
            db.add(ligne)
        
        db.commit()
        db.refresh(new_avoir)
        return new_avoir
    except Exception as e:
        db.rollback()
        print(f"  Erreur création avoir: {e}")
        print(f"  Données reçues: {avoir}")
        print(f"  Lignes reçues: {lignes_data}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Erreur lors de la création de l'avoir: {str(e)}")

@app.put("/api/avoirs/{avoir_id}")
async def update_avoir(avoir_id: int, data: dict, db: Session = Depends(get_db)):
    """Mettre à jour un avoir"""
    try:
        print(f"🔍 DEBUG - Modification avoir {avoir_id}: {data}")
        
        db_avoir = db.query(Avoir).filter(Avoir.id_avoir == avoir_id).first()
        if not db_avoir:
            raise HTTPException(status_code=404, detail="Avoir non trouvé")
        
        # Vérifier si l'avoir a déjà été traité (validé ou refusé)
        if db_avoir.statut in ['VALIDE', 'TRAITE', 'REFUSE']:
            raise HTTPException(
                status_code=400, 
                detail=f"Impossible de modifier un avoir {db_avoir.statut.lower()}. Seuls les avoirs 'EN_ATTENTE' peuvent être modifiés."
            )
        
        # Mettre à jour les champs de l'avoir (ATTENTION: pas de id_client dans la table)
        db_avoir.numero_avoir = data.get('numero_avoir', db_avoir.numero_avoir)
        db_avoir.id_facture = data.get('id_facture', db_avoir.id_facture)
        db_avoir.date_avoir = data.get('date_avoir', db_avoir.date_avoir)
        db_avoir.motif = data.get('motif', db_avoir.motif)
        db_avoir.statut = data.get('statut', db_avoir.statut)
        
        # La table avoir a seulement 'montant', pas montant_ht/tva/ttc séparés
        # Utiliser montant_ttc comme valeur principale
        montant_value = float(data.get('montant_ttc', data.get('total_ttc', data.get('montant_ht', data.get('total_ht', db_avoir.montant)))))
        db_avoir.montant = montant_value
        
        # Supprimer les anciennes lignes
        db.query(LigneAvoir).filter(LigneAvoir.id_avoir == avoir_id).delete()
        
        # Ajouter les nouvelles lignes
        lignes = data.get('lignes', [])
        for ligne in lignes:
            # Calculer le total
            total_ligne = ligne.get('montant_total', ligne.get('montant_ht', ligne['quantite'] * ligne['prix_unitaire']))
            
            db_ligne = LigneAvoir(
                id_avoir=avoir_id,
                id_article=ligne['id_article'],
                quantite=ligne['quantite'],
                prix_unitaire=ligne['prix_unitaire'],
                montant_ht=float(total_ligne)
            )
            db.add(db_ligne)
        
        db.commit()
        db.refresh(db_avoir)
        
        print(f"  Avoir {db_avoir.numero_avoir} modifié avec succès!")
        
        # Récupérer l'id_client depuis la facture
        id_client = None
        if db_avoir.id_facture:
            facture = db.query(Facture).filter(Facture.id_facture == db_avoir.id_facture).first()
            if facture:
                id_client = facture.id_client
        
        return {
            "id_avoir": db_avoir.id_avoir,
            "numero_avoir": db_avoir.numero_avoir,
            "id_facture": db_avoir.id_facture,
            "id_client": id_client,  # Récupéré depuis la facture
            "date_avoir": str(db_avoir.date_avoir),
            "motif": db_avoir.motif,
            "statut": db_avoir.statut,
            "montant_ht": float(db_avoir.montant),
            "montant_tva": 0.0,
            "montant_ttc": float(db_avoir.montant)
        }
    except Exception as e:
        db.rollback()
        print(f"  ERREUR MODIFICATION AVOIR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@app.delete("/api/avoirs/{avoir_id}")
async def delete_avoir(avoir_id: int, db: Session = Depends(get_db)):
    """Supprimer un avoir"""
    db_avoir = db.query(Avoir).filter(Avoir.id_avoir == avoir_id).first()
    if not db_avoir:
        raise HTTPException(status_code=404, detail="Avoir non trouvé")
    
    # Vérifier si l'avoir a déjà été traité (validé ou refusé)
    if db_avoir.statut in ['VALIDE', 'TRAITE', 'REFUSE']:
        raise HTTPException(
            status_code=400, 
            detail=f"Impossible de supprimer un avoir {db_avoir.statut.lower()}. Seuls les avoirs 'EN_ATTENTE' peuvent être supprimés."
        )
    
    # Supprimer les lignes d'abord
    db.query(LigneAvoir).filter(LigneAvoir.id_avoir == avoir_id).delete()
    
    db.delete(db_avoir)
    db.commit()
    return {"message": "Avoir supprimé avec succès"}


@app.get("/api/avoirs/{avoir_id}/lignes")
async def get_lignes_avoir(avoir_id: int, db: Session = Depends(get_db)):
    """Récupérer les lignes d'un avoir avec détails des articles"""
    try:
        lignes = db.query(LigneAvoir, Article).join(
            Article, LigneAvoir.id_article == Article.id_article
        ).filter(
            LigneAvoir.id_avoir == avoir_id
        ).all()
        
        result = []
        for ligne, article in lignes:
            result.append({
                "id_ligne_avoir": ligne.id_ligne_avoir,
                "id_article": ligne.id_article,
                "designation": article.designation,
                "quantite": ligne.quantite,
                "prix_unitaire": float(ligne.prix_unitaire or 0),
                "montant_ht": float(ligne.montant_ht or 0),
                "montant_ttc": float(ligne.montant_ttc or 0)
            })
        
        return result
    except Exception as e:
        print(f"Erreur chargement lignes avoir: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/factures/{facture_id}/articles-disponibles")
async def get_articles_facture_pour_avoir(facture_id: int, db: Session = Depends(get_db)):
    """Récupérer les articles d'une facture pour sélection dans un avoir (comme Python ligne 1168-1192)"""
    try:
        lignes = db.query(LigneFacture, Article).join(
            Article, LigneFacture.id_article == Article.id_article
        ).filter(
            LigneFacture.id_facture == facture_id
        ).all()
        
        result = []
        for ligne, article in lignes:
            result.append({
                "id_article": article.id_article,
                "designation": article.designation,
                "type_article": article.type_article,
                "quantite_facture": ligne.quantite,
                "prix_unitaire": float(ligne.prix_unitaire or 0),
                "montant_ht": float(ligne.montant_ht or ligne.total_ht or 0),
                "montant_ttc": float(ligne.montant_ht or ligne.total_ht or 0)  # Approximation
            })
        
        return result
    except Exception as e:
        print(f"Erreur chargement articles facture: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/avoirs/{avoir_id}/valider")
async def valider_avoir(avoir_id: int, db: Session = Depends(get_db)):
    """Valider un avoir - EXACTEMENT comme Python ligne 1573-1722"""
    try:
        from sqlalchemy import func
        
        print(f"\n{'='*80}")
        print(f"🔄 VALIDATION AVOIR ID: {avoir_id}")
        print(f"{'='*80}")
        
        # Récupérer l'avoir
        db_avoir = db.query(Avoir).filter(Avoir.id_avoir == avoir_id).first()
        if not db_avoir:
            raise HTTPException(status_code=404, detail="Avoir non trouvé")
        
        print(f"📄 Avoir: {db_avoir.numero_avoir} - Montant: {db_avoir.montant} FCFA")
        
        # 1. Vérifier si déjà traité (ligne 1577-1592)
        if db_avoir.statut == 'TRAITE':
            raise HTTPException(status_code=400, detail="Cet avoir a déjà été traité")
        
        # 2. Valider l'avoir - TRAITE pas VALIDE (ligne 1595)
        db_avoir.statut = 'TRAITE'
        print(f"  Statut avoir changé: {db_avoir.statut}")
        
        # 3. Récupérer la facture associée (ligne 1597-1610)
        facture = db.query(Facture).filter(Facture.id_facture == db_avoir.id_facture).first()
        if not facture:
            raise HTTPException(status_code=404, detail="Facture associée non trouvée")
        
        print(f"📄 Facture: {facture.numero_facture}")
        print(f"   Avant: montant_avance={facture.montant_avance}, montant_reste={facture.montant_reste}, statut={facture.statut}")
        
        montant_avoir = float(db_avoir.montant or 0)  # MySQL a seulement 'montant'
        
        # 4. Créer un remboursement (règlement négatif) (ligne 1612-1627)
        # Vérifier si remboursement n'existe pas déjà
        remboursement_existe = db.query(Reglement).filter(
            Reglement.reference == f"Remboursement avoir {db_avoir.numero_avoir}",
            Reglement.montant == -montant_avoir
        ).first()
        
        if not remboursement_existe:
            remboursement = Reglement(
                id_facture=facture.id_facture,
                montant=-montant_avoir,  # Négatif pour remboursement
                date_reglement=datetime.now().date(),
                mode_paiement="REMBOURSEMENT",
                reference=f"Remboursement avoir {db_avoir.numero_avoir}"
            )
            db.add(remboursement)
            db.flush()  #   Flush pour que le règlement soit pris en compte dans le calcul
            print(f"  Remboursement créé: {-montant_avoir} FCFA")
        else:
            print(f"    Remboursement existe déjà")
        
        # 5. Calculer le nouveau solde de la facture (ligne 1629-1637)
        #    NE PAS CHANGER LE STATUT SI LA FACTURE ÉTAIT PAYÉE !
        # L'avoir est un REMBOURSEMENT, pas un impayé
        
        statut_avant = facture.statut
        etait_payee = (statut_avant == "Payée")
        
        total_reglements = db.query(
            func.coalesce(func.sum(Reglement.montant), 0)
        ).filter(
            Reglement.id_facture == facture.id_facture
        ).scalar() or 0
        
        print(f"  Total règlements (avec remboursement): {total_reglements} FCFA")
        
        montant_ttc_facture = float(facture.montant_ttc or facture.total_ttc or 0)
        solde_restant = montant_ttc_facture - total_reglements
        
        print(f"  Calcul: {montant_ttc_facture} - {total_reglements} = {solde_restant} FCFA")
        print(f"🔍 État avant: {statut_avant} | Était payée: {etait_payee}")
        
        # 6. Mettre à jour le statut SEULEMENT si facture n'était pas déjà payée
        if etait_payee:
            # Facture reste PAYÉE car tout avait déjà été réglé
            facture.statut = "Payée"
            # Montant_avance = montant_ttc car elle était entièrement payée
            facture.montant_avance = montant_ttc_facture
            facture.montant_reste = 0
            print(f"  Facture reste PAYÉE (avoir = remboursement seulement)")
        else:
            # Facture n'était pas payée, recalcul normal
            if solde_restant <= 0:
                facture.statut = "Payée"
            elif solde_restant < montant_ttc_facture:
                facture.statut = "Partiellement payée"
            else:
                facture.statut = "En attente"
            
            facture.montant_reste = max(0, solde_restant)
            facture.montant_avance = montant_ttc_facture - facture.montant_reste
        
        print(f"   Après: montant_avance={facture.montant_avance}, montant_reste={facture.montant_reste}, statut={facture.statut}")
        
        # 7. Remettre les articles en stock (ligne 1658-1722)
        # Utiliser les lignes de l'AVOIR (pas de la facture) si elles existent
        try:
            lignes_avoir = db.query(LigneAvoir, Article).join(
                Article, LigneAvoir.id_article == Article.id_article
            ).filter(
                LigneAvoir.id_avoir == db_avoir.id_avoir
            ).all()
            
            print(f"  {len(lignes_avoir)} ligne(s) d'avoir trouvée(s)")
            
            # Si pas de lignes d'avoir, fallback sur les lignes de la facture (ancien comportement)
            if not lignes_avoir:
                print(f"    Aucune ligne d'avoir, utilisation des lignes de facture")
                lignes_avoir = db.query(LigneFacture, Article).join(
                    Article, LigneFacture.id_article == Article.id_article
                ).filter(
                    LigneFacture.id_facture == facture.id_facture
                ).all()
                print(f"  {len(lignes_avoir)} ligne(s) de facture trouvée(s)")
        except Exception as e:
            print(f"  Erreur récupération lignes: {e}")
            lignes_avoir = []
        
        nb_articles_stock = 0
        for ligne, article in lignes_avoir:
            # Ne traiter que les PRODUITS (pas les SERVICES)
            if article.type_article != 'PRODUIT':
                print(f"⏭   Article {article.designation} est un SERVICE, pas de stock")
                continue
            # Remettre en stock (ligne 1713-1718)
            quantite_retour = ligne.quantite
            stock_avant = article.stock_actuel or 0
            article.stock_actuel = stock_avant + quantite_retour
            nb_articles_stock += 1
            
            # Utiliser designation au lieu de nom
            nom_article = getattr(article, 'nom', None) or getattr(article, 'designation', 'Article')
            print(f"  Article {nom_article}: stock {stock_avant} → {article.stock_actuel} (+{quantite_retour})")
            
            # Créer mouvement de stock ENTREE (ligne 1720-1723)
            mouvement = MouvementStock(
                id_article=article.id_article,
                type_mouvement="ENTREE",
                quantite=quantite_retour,
                date_mouvement=datetime.now(),
                reference=f"Retour avoir {db_avoir.numero_avoir}"
            )
            db.add(mouvement)
        
        print(f"  {nb_articles_stock} article(s) remis en stock")
        print(f"💾 Commit des changements...")
        
        db.commit()
        db.refresh(db_avoir)
        
        print(f"  VALIDATION TERMINÉE")
        print(f"{'='*80}\n")
        
        return {
            "success": True,
            "message": f"Avoir {db_avoir.numero_avoir} validé et traité",
            "avoir": {
                "id_avoir": db_avoir.id_avoir,
                "numero_avoir": db_avoir.numero_avoir,
                "statut": db_avoir.statut,
                "montant_ttc": montant_avoir
            },
            "facture_nouveau_statut": facture.statut,
            "facture_solde_restant": float(solde_restant)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"  ERREUR validation avoir: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@app.put("/api/avoirs/{avoir_id}/refuser")
async def refuser_avoir(avoir_id: int, db: Session = Depends(get_db)):
    """Refuser un avoir"""
    db_avoir = db.query(Avoir).filter(Avoir.id_avoir == avoir_id).first()
    if not db_avoir:
        raise HTTPException(status_code=404, detail="Avoir non trouvé")
    
    db_avoir.statut = "REFUSE"
    db.commit()
    db.refresh(db_avoir)
    return {"message": "Avoir refusé", "avoir": db_avoir}


# ============================================================================
# MOUVEMENTS STOCK
# ============================================================================

@app.get("/api/mouvements")
async def get_mouvements(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Récupérer tous les mouvements de stock avec informations enrichies"""
    try:
        mouvements = db.query(MouvementStock).order_by(MouvementStock.date_mouvement.desc()).offset(skip).limit(limit).all()
        
        result = []
        for mouvement in mouvements:
            # Récupérer l'article
            article = db.query(Article).filter(Article.id_article == mouvement.id_article).first()
            
            mouvement_dict = {
                "id_mouvement": mouvement.id_mouvement,
                "id_article": mouvement.id_article,
                "type_mouvement": mouvement.type_mouvement,
                "quantite": mouvement.quantite,
                "motif": mouvement.motif,
                "reference": mouvement.reference if hasattr(mouvement, 'reference') else None,
                "date_mouvement": mouvement.date_mouvement,
                "article_designation": article.designation if article else "N/A",
                "created_at": mouvement.created_at if hasattr(mouvement, 'created_at') else None
            }
            result.append(mouvement_dict)
        
        return result
    except Exception as e:
        print(f"Erreur chargement mouvements: {e}")
        import traceback
        traceback.print_exc()
        return []

@app.post("/api/mouvements")
async def create_mouvement(mouvement: dict, db: Session = Depends(get_db)):
    """Créer un nouveau mouvement de stock"""
    try:
        # Créer le mouvement
        new_mouvement = MouvementStock(
            id_article=mouvement['id_article'],
            type_mouvement=mouvement['type_mouvement'],
            quantite=mouvement['quantite'],
            motif=mouvement.get('motif', ''),
            reference=mouvement.get('reference', ''),
            date_mouvement=datetime.now()
        )
        db.add(new_mouvement)
        
        # Mettre à jour le stock de l'article
        article = db.query(Article).filter(Article.id_article == mouvement['id_article']).first()
        if article:
            if mouvement['type_mouvement'] == 'ENTREE':
                article.stock_actuel += mouvement['quantite']
            else:  # SORTIE
                article.stock_actuel -= mouvement['quantite']
                if article.stock_actuel < 0:
                    article.stock_actuel = 0
        
        db.commit()
        db.refresh(new_mouvement)
        return new_mouvement
    except Exception as e:
        db.rollback()
        print(f"Erreur création mouvement: {e}")
        raise HTTPException(status_code=400, detail=f"Erreur lors de la création du mouvement: {str(e)}")

@app.get("/api/stock/stats")
async def get_stock_stats(db: Session = Depends(get_db)):
    """Récupérer les statistiques du stock (uniquement articles actifs)"""
    try:
        # Articles en stock (seulement produits actifs)
        total = db.query(Article).filter(
            Article.type_article == 'PRODUIT',
            Article.actif == True
        ).count()
        
        # Stock faible (stock_actuel <= stock_alerte)
        faible = db.query(Article).filter(
            Article.type_article == 'PRODUIT',
            Article.actif == True,
            Article.stock_actuel <= Article.stock_alerte,
            Article.stock_actuel > 0
        ).count()
        
        # Stock critique (stock_actuel = 0)
        critique = db.query(Article).filter(
            Article.type_article == 'PRODUIT',
            Article.actif == True,
            Article.stock_actuel == 0
        ).count()
        
        # Valeur du stock (uniquement articles actifs)
        articles = db.query(Article).filter(
            Article.type_article == 'PRODUIT',
            Article.actif == True
        ).all()
        valeur = sum(a.stock_actuel * (a.prix_achat or 0) for a in articles)
        
        return {
            "total": total,
            "faible": faible,
            "critique": critique,
            "valeur": valeur
        }
    except Exception as e:
        print(f"Erreur stats stock: {e}")
        return {"total": 0, "faible": 0, "critique": 0, "valeur": 0}


# ============================================================================
# UTILISATEURS
# ============================================================================

@app.get("/api/utilisateurs")
async def get_utilisateurs(db: Session = Depends(get_db)):
    """Récupérer tous les utilisateurs"""
    utilisateurs = db.query(Utilisateur).all()
    return utilisateurs

@app.get("/api/utilisateurs/{utilisateur_id}")
async def get_utilisateur(utilisateur_id: int, db: Session = Depends(get_db)):
    """Récupérer un utilisateur par ID"""
    utilisateur = db.query(Utilisateur).filter(Utilisateur.id_utilisateur == utilisateur_id).first()
    if not utilisateur:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return utilisateur

@app.post("/api/utilisateurs")
async def create_utilisateur(utilisateur: dict, db: Session = Depends(get_db)):
    """Créer un nouvel utilisateur"""
    # Hasher le mot de passe si fourni
    if "mot_de_passe" in utilisateur:
        utilisateur["mot_de_passe"] = bcrypt.hash(utilisateur["mot_de_passe"])
    
    new_utilisateur = Utilisateur(**utilisateur)
    db.add(new_utilisateur)
    db.commit()
    db.refresh(new_utilisateur)
    return new_utilisateur

@app.put("/api/utilisateurs/{utilisateur_id}")
async def update_utilisateur(utilisateur_id: int, utilisateur: dict, db: Session = Depends(get_db)):
    """Mettre à jour un utilisateur"""
    db_utilisateur = db.query(Utilisateur).filter(Utilisateur.id_utilisateur == utilisateur_id).first()
    if not db_utilisateur:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Hasher le mot de passe si modifié
    if "mot_de_passe" in utilisateur:
        utilisateur["mot_de_passe"] = bcrypt.hash(utilisateur["mot_de_passe"])
    
    for key, value in utilisateur.items():
        setattr(db_utilisateur, key, value)
    
    db.commit()
    db.refresh(db_utilisateur)
    return db_utilisateur

@app.delete("/api/utilisateurs/{utilisateur_id}")
async def delete_utilisateur(utilisateur_id: int, db: Session = Depends(get_db)):
    """Supprimer un utilisateur"""
    utilisateur = db.query(Utilisateur).filter(Utilisateur.id_utilisateur == utilisateur_id).first()
    if not utilisateur:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    db.delete(utilisateur)
    db.commit()
    return {"message": "Utilisateur supprimé avec succès"}

@app.put("/api/utilisateurs/{utilisateur_id}/droits")
async def update_droits_utilisateur(utilisateur_id: int, droits_data: dict, db: Session = Depends(get_db)):
    """Mettre à jour les droits d'un utilisateur"""
    utilisateur = db.query(Utilisateur).filter(Utilisateur.id_utilisateur == utilisateur_id).first()
    if not utilisateur:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    import json
    try:
        # Récupérer les droits
        droits = droits_data.get('droits', {})
        
        # Vérifier si c'est déjà une string JSON (pour rétrocompatibilité)
        if isinstance(droits, str):
            # Si c'est déjà une string, on la parse puis re-stringify pour valider
            droits = json.loads(droits)
        
        # Convertir en JSON string pour stockage en base
        droits_json = json.dumps(droits)
        utilisateur.droits = droits_json
        
        print(f"✅ Droits mis à jour pour utilisateur {utilisateur_id}: {droits_json}")
        
        db.commit()
        db.refresh(utilisateur)
        return {"message": "Droits mis à jour avec succès", "utilisateur": utilisateur}
    except json.JSONDecodeError as e:
        db.rollback()
        print(f"❌ Erreur parsing JSON droits: {e}")
        raise HTTPException(status_code=400, detail=f"Format JSON invalide: {str(e)}")
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur mise à jour droits: {e}")
        raise HTTPException(status_code=400, detail=f"Erreur: {str(e)}")


# ============================================================================
# INVENTAIRE
# ============================================================================

@app.post("/api/inventaire/valider")
async def valider_inventaire(ajustements: dict, db: Session = Depends(get_db)):
    """Valider un inventaire et créer les ajustements - EXACTEMENT comme Python inventaire.py ligne 429-512"""
    try:
        articles_ajustes = ajustements.get('articles', [])
        
        if not articles_ajustes:
            raise HTTPException(status_code=400, detail="Aucun ajustement à traiter")
        
        ajustements_count = 0
        
        for article_data in articles_ajustes:
            id_article = article_data.get('id_article')
            quantite_reelle = article_data.get('quantite_reelle', 0)
            stock_systeme = article_data.get('stock_systeme', 0)
            ecart = quantite_reelle - stock_systeme
            
            if ecart == 0:  # Pas d'écart, on passe
                continue
            
            # Mettre à jour le stock_actuel (ligne 473-478)
            article = db.query(Article).filter(Article.id_article == id_article).first()
            if article:
                article.stock_actuel = quantite_reelle
                
                # Créer le mouvement d'ajustement (ligne 467-471)
                mouvement = MouvementStock(
                    id_article=id_article,
                    type_mouvement='AJUSTEMENT',
                    quantite=abs(ecart),
                    reference=f"Inventaire du {datetime.now().strftime('%d/%m/%Y')}",
                    date_mouvement=datetime.now()
                )
                db.add(mouvement)
                
                ajustements_count += 1
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Inventaire validé avec succès ! {ajustements_count} ajustement(s) créé(s)",
            "ajustements": ajustements_count
        }
        
    except Exception as e:
        db.rollback()
        print(f"  Erreur validation inventaire: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")


# ============================================================================
# RAPPORTS
# ============================================================================

@app.get("/api/rapports/{type_rapport}")
async def get_rapport(type_rapport: str, periode: str = "ce_mois", db: Session = Depends(get_db)):
    """Récupérer un rapport selon le type"""
    try:
        # Calculer les dates selon la période
        aujourd_hui = datetime.now().date()
        
        if periode == "aujourdhui":
            date_debut = aujourd_hui
            date_fin = aujourd_hui
        elif periode == "cette_semaine":
            date_debut = aujourd_hui - timedelta(days=aujourd_hui.weekday())
            date_fin = aujourd_hui
        elif periode == "ce_mois":
            date_debut = aujourd_hui.replace(day=1)
            date_fin = aujourd_hui
        elif periode == "cette_annee":
            date_debut = aujourd_hui.replace(month=1, day=1)
            date_fin = aujourd_hui
        else:
            date_debut = aujourd_hui.replace(day=1)
            date_fin = aujourd_hui
        
        # Générer le rapport selon le type
        if type_rapport == "ventes":
            from sqlalchemy import func, extract
            
            # Ventes par montant réellement payé (montant_avance) - ligne 275-287 rapports.py
            factures = db.query(Facture).filter(
                Facture.date_facture >= date_debut,
                Facture.date_facture <= date_fin,
                Facture.statut != 'Annulée'
            ).all()
            
            # CA net: montant encaissé avec retours soustraits
            # 🔥 CORRECTION: Utiliser la même logique que le dashboard
            # COMPTOIR/RETOUR: utiliser total_ttc (montant réel vendu)
            # NORMALE: utiliser montant_avance (montant déjà payé, seulement si payée)
            from sqlalchemy import case
            ca_total = db.query(
                func.coalesce(
                    func.sum(
                        case(
                            (Facture.type_facture == 'RETOUR', -Facture.total_ttc),
                            (Facture.type_facture == 'COMPTOIR', Facture.total_ttc),
                            else_=Facture.montant_avance  # NORMALE utilise montant déjà payé
                        )
                    ),
                    0
                )
            ).filter(
                Facture.date_facture >= date_debut,
                Facture.date_facture <= date_fin,
                Facture.statut != 'Annulée'
            ).filter(
                # Pour factures NORMALES: seulement celles payées (montant_avance > 0)
                # Pour COMPTOIR/RETOUR: toutes les non-annulées
                ((Facture.type_facture == 'NORMALE') & (Facture.montant_avance > 0)) |
                (Facture.type_facture.in_(['COMPTOIR', 'RETOUR']))
            ).scalar() or 0
            nb_ventes = len(factures)
            ticket_moyen = ca_total / nb_ventes if nb_ventes > 0 else 0
            
            # Évolution des ventes (par mois pour l'année, par jour pour le mois)
            evolution_labels = []
            evolution_data = []
            
            if periode == "cette_annee":
                # Ventes par mois
                # 🔥 CORRECTION: Utiliser la même logique (total_ttc pour COMPTOIR/RETOUR, montant_avance pour NORMALE payée)
                ventes_par_mois = db.query(
                    extract('month', Facture.date_facture).label('mois'),
                    func.coalesce(
                        func.sum(
                            case(
                                (Facture.type_facture == 'RETOUR', -Facture.total_ttc),
                                (Facture.type_facture == 'COMPTOIR', Facture.total_ttc),
                                else_=Facture.montant_avance  # NORMALE utilise montant déjà payé
                            )
                        ),
                        0
                    ).label('total')
                ).filter(
                    Facture.date_facture >= date_debut,
                    Facture.date_facture <= date_fin,
                    Facture.statut != 'Annulée'
                ).filter(
                    ((Facture.type_facture == 'NORMALE') & (Facture.montant_avance > 0)) |
                    (Facture.type_facture.in_(['COMPTOIR', 'RETOUR']))
                ).group_by('mois').order_by('mois').all()
                
                mois_noms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
                for i in range(1, 13):
                    evolution_labels.append(mois_noms[i-1])
                    montant = next((float(v.total or 0) for v in ventes_par_mois if v.mois == i), 0)
                    # Empêcher valeurs négatives sur le graphe
                    evolution_data.append(montant if montant > 0 else 0)
            
            elif periode == "ce_mois":
                # Ventes par jour du mois
                # 🔥 CORRECTION: Utiliser la même logique (total_ttc pour COMPTOIR/RETOUR, montant_avance pour NORMALE payée)
                ventes_par_jour = db.query(
                    extract('day', Facture.date_facture).label('jour'),
                    func.coalesce(
                        func.sum(
                            case(
                                (Facture.type_facture == 'RETOUR', -Facture.total_ttc),
                                (Facture.type_facture == 'COMPTOIR', Facture.total_ttc),
                                else_=Facture.montant_avance  # NORMALE utilise montant déjà payé
                            )
                        ),
                        0
                    ).label('total')
                ).filter(
                    Facture.date_facture >= date_debut,
                    Facture.date_facture <= date_fin,
                    Facture.statut != 'Annulée'
                ).filter(
                    ((Facture.type_facture == 'NORMALE') & (Facture.montant_avance > 0)) |
                    (Facture.type_facture.in_(['COMPTOIR', 'RETOUR']))
                ).group_by('jour').order_by('jour').all()
                
                # Tous les jours du mois
                import calendar
                nb_jours = calendar.monthrange(aujourd_hui.year, aujourd_hui.month)[1]
                for jour in range(1, nb_jours + 1):
                    evolution_labels.append(str(jour))
                    montant = next((float(v.total or 0) for v in ventes_par_jour if v.jour == jour), 0)
                    # Empêcher valeurs négatives sur le graphe
                    evolution_data.append(montant if montant > 0 else 0)
            
            else:
                # Pour les autres périodes, grouper par semaine
                # 🔥 CORRECTION: Utiliser la même logique (total_ttc pour COMPTOIR/RETOUR, montant_avance pour NORMALE payée)
                ventes_par_semaine = db.query(
                    extract('week', Facture.date_facture).label('semaine'),
                    func.coalesce(
                        func.sum(
                            case(
                                (Facture.type_facture == 'RETOUR', -Facture.total_ttc),
                                (Facture.type_facture == 'COMPTOIR', Facture.total_ttc),
                                else_=Facture.montant_avance  # NORMALE utilise montant déjà payé
                            )
                        ),
                        0
                    ).label('total')
                ).filter(
                    Facture.date_facture >= date_debut,
                    Facture.date_facture <= date_fin,
                    Facture.statut != 'Annulée'
                ).filter(
                    ((Facture.type_facture == 'NORMALE') & (Facture.montant_avance > 0)) |
                    (Facture.type_facture.in_(['COMPTOIR', 'RETOUR']))
                ).group_by('semaine').order_by('semaine').all()
                
                for v in ventes_par_semaine:
                    evolution_labels.append(f"Sem {int(v.semaine)}")
                    val = float(v.total or 0)
                    evolution_data.append(val if val > 0 else 0)
            
            return {
                "nb_ventes": nb_ventes,
                "ca_total": ca_total,
                "ticket_moyen": ticket_moyen,
                "periode": periode,
                "date_debut": str(date_debut),
                "date_fin": str(date_fin),
                "evolution_labels": evolution_labels,
                "evolution_data": evolution_data
            }
        
        elif type_rapport == "clients":
            clients = db.query(Client).all()
            nouveaux_mois = db.query(Client).filter(
                Client.created_at >= date_debut if hasattr(Client, 'created_at') else True
            ).count()
            
            return {
                "nb_clients": len(clients),
                "nouveaux_mois": nouveaux_mois,
                "actifs": len(clients),
                "periode": periode
            }
        
        elif type_rapport == "produits":
            # Récupérer les produits avec statistiques de vente (comme Python ligne 413-423)
            from sqlalchemy import func
            
            produits_ventes = db.query(
                Article.designation,
                Article.type_article,
                Article.prix_vente,
                Article.stock_actuel,
                func.count(LigneFacture.id_ligne_facture).label('nb_ventes'),
                func.coalesce(func.sum(LigneFacture.quantite), 0).label('quantite_vendue'),
                func.coalesce(func.sum(LigneFacture.total_ht), 0).label('montant_total')
            ).outerjoin(
                LigneFacture, Article.id_article == LigneFacture.id_article
            ).outerjoin(
                Facture, LigneFacture.id_facture == Facture.id_facture
            ).filter(
                (Facture.statut != 'Annulée') | (Facture.statut == None)
            ).group_by(
                Article.id_article, Article.designation, Article.type_article, 
                Article.prix_vente, Article.stock_actuel
            ).order_by(
                func.coalesce(func.sum(LigneFacture.total_ht), 0).desc()
            ).all()
            
            # Stats globales
            articles = db.query(Article).all()
            articles_produits = [a for a in articles if a.type_article == 'PRODUIT']
            valeur_stock = sum(a.stock_actuel * (a.prix_vente or 0) for a in articles_produits)
            stock_faible = sum(1 for a in articles_produits if a.stock_actuel < a.stock_alerte and a.stock_actuel > 0)
            
            return {
                "nb_articles": len(articles),
                "valeur_stock": valeur_stock,
                "stock_faible": stock_faible,
                "produits": [{
                    "designation": p.designation,
                    "type_article": p.type_article,
                    "prix_vente": float(p.prix_vente or 0),
                    "stock_actuel": p.stock_actuel or 0,
                    "nb_ventes": p.nb_ventes,
                    "quantite_vendue": float(p.quantite_vendue),
                    "montant_total": float(p.montant_total)
                } for p in produits_ventes],
                "periode": periode
            }
        
        elif type_rapport == "reglements":
            reglements = db.query(Reglement).filter(
                Reglement.date_reglement >= date_debut,
                Reglement.date_reglement <= date_fin
            ).all()
            
            montant_total = sum(float(r.montant or 0) for r in reglements)
            
            return {
                "nb_reglements": len(reglements),
                "montant_total": montant_total,
                "periode": periode
            }
        
        elif type_rapport == "impayes":
            factures = db.query(Facture).filter(
                Facture.montant_reste > 0
            ).all()
            
            montant_impayes = sum(float(f.montant_reste or 0) for f in factures)
            
            return {
                "nb_factures": len(factures),
                "montant_impayes": montant_impayes,
                "periode": periode
            }
        
        elif type_rapport == "tresorerie":
            # Trésorerie basée sur montant_avance (argent réellement encaissé) - ligne 668-677
            from sqlalchemy import func, case
            
            # Encaissé (montant payé sur toutes les factures non annulées)
            factures = db.query(Facture).filter(Facture.statut != 'Annulée').all()
            encaisse = sum(float(f.montant_avance or 0) for f in factures)
            
            # Créances (montant restant à payer)
            creances = sum(float(f.montant_reste or 0) for f in factures if f.montant_reste and f.montant_reste > 0)
            
            # Ventes comptoir
            ventes_comptoir = sum(float(f.montant_avance or 0) for f in factures if f.type_facture == 'COMPTOIR')
            
            # Règlements par mode de paiement (ligne 680-687)
            reglements_par_mode = db.query(
                Reglement.mode_paiement,
                func.count(Reglement.id_reglement).label('nb'),
                func.coalesce(func.sum(Reglement.montant), 0).label('total')
            ).group_by(Reglement.mode_paiement).order_by(func.sum(Reglement.montant).desc()).all()
            
            modes_paiement = [
                {
                    "mode": r.mode_paiement or "N/A",
                    "nb": r.nb,
                    "total": float(r.total)
                } for r in reglements_par_mode
            ]
            
            return {
                "encaisse": encaisse,  # Total encaissé
                "creances": creances,  # Total à recevoir
                "ventes_comptoir": ventes_comptoir,  # Ventes comptoir
                "total_actif": encaisse + creances,  # Total actif
                "modes_paiement": modes_paiement,
                "periode": periode
            }
        
        elif type_rapport == "avoirs":
            # Avoirs avec montant_ttc (ligne 793-802 rapports.py)
            avoirs = db.query(Avoir).filter(
                Avoir.date_avoir >= date_debut,
                Avoir.date_avoir <= date_fin
            ).all()
            
            # Montant total basé sur 'montant' (MySQL) qui correspond à montant_ttc (SQLite)
            montant_total = sum(float(a.montant or 0) for a in avoirs)
            
            # Comptage par statut (ligne 828-845)
            valides = sum(1 for a in avoirs if a.statut in ['VALIDE', 'TRAITE'])
            en_attente = sum(1 for a in avoirs if a.statut == 'EN_ATTENTE')
            
            return {
                "nb_avoirs": len(avoirs),
                "montant_total": montant_total,
                "valides": valides,
                "en_attente": en_attente,
                "periode": periode
            }
        
        return {"error": "Type de rapport inconnu"}
        
    except Exception as e:
        print(f"Erreur génération rapport: {e}")
        import traceback
        traceback.print_exc()
        return {
            "error": str(e),
            "nb_ventes": 0,
            "ca_total": 0,
            "ticket_moyen": 0
        }


# ============================================================================
# AUTH ME
# ============================================================================

@app.get("/api/auth/me")
async def get_current_user_info(db: Session = Depends(get_db)):
    """Récupérer les informations de l'utilisateur connecté"""
    # Pour l'instant, retourner l'admin par défaut
    utilisateur = db.query(Utilisateur).filter(Utilisateur.nom_utilisateur == "admin").first()
    if not utilisateur:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return utilisateur


# Fonction de démarrage
@app.on_event("startup")
async def startup_event():
    """Événement de démarrage de l'application"""
    print("=" * 60)
    print("🚀 Démarrage de Tech Info Plus API v2.0")
    print("=" * 60)
    
    # Vérifier la connexion MySQL et créer les tables si nécessaire
    print("\n🗄️  Initialisation de la base de données...")
    try:
        if test_connection():
            print("  ✅ Connexion MySQL OK")
            print("\n  🔄 Migration automatique des tables...")
            # Créer toutes les tables automatiquement via SQLAlchemy
            if create_tables():
                print("  ✅ Migration terminée avec succès !")
            else:
                print("  ⚠️  Erreur lors de la migration des tables")
        else:
            print("  ❌ ERREUR: Impossible de se connecter à MySQL")
            print("  💡 Vérifiez que XAMPP MySQL est démarré sur le port 3306")
    except Exception as e:
        print(f"  ❌ Erreur initialisation base de données: {str(e)}")
    
    print("\n✅ Serveur API prêt!")
    print("=" * 60)

# ============================================================================
# CONFIGURATION ENTREPRISE
# ============================================================================

@app.get("/api/entreprise/config")
async def get_entreprise_config(db: Session = Depends(get_db)):
    """Récupérer la configuration de l'entreprise"""
    try:
        entreprise = db.query(Entreprise).first()
        if entreprise:
            return {
                "id_entreprise": entreprise.id_entreprise,
                "nom": entreprise.nom,
                "adresse": entreprise.adresse,
                "telephone": entreprise.telephone,
                "email": entreprise.email,
                "nif": entreprise.nif if hasattr(entreprise, 'nif') else None,
                "devise": entreprise.devise if hasattr(entreprise, 'devise') else "FCFA",
                "taux_tva": entreprise.taux_tva if hasattr(entreprise, 'taux_tva') else 9.5,
                "logo_path": entreprise.logo_path if hasattr(entreprise, 'logo_path') else None,
                "slogan": entreprise.slogan if hasattr(entreprise, 'slogan') else None,
                "site_web": entreprise.site_web if hasattr(entreprise, 'site_web') else None,
                "compte_bancaire": entreprise.compte_bancaire if hasattr(entreprise, 'compte_bancaire') else None
            }
        return None
    except Exception as e:
        print(f"Erreur chargement config entreprise: {e}")
        return None

@app.post("/api/entreprise/config")
async def update_entreprise_config(config: dict, db: Session = Depends(get_db)):
    """Mettre à jour la configuration de l'entreprise"""
    try:
        entreprise = db.query(Entreprise).first()
        
        if entreprise:
            # Mise à jour
            for key, value in config.items():
                if hasattr(entreprise, key):
                    setattr(entreprise, key, value)
        else:
            # Création
            entreprise = Entreprise(**config)
            db.add(entreprise)
        
        db.commit()
        db.refresh(entreprise)
        return {"message": "Configuration enregistrée avec succès", "entreprise": entreprise}
    except Exception as e:
        db.rollback()
        print(f"Erreur mise à jour config: {e}")
        raise HTTPException(status_code=400, detail=f"Erreur: {str(e)}")


# ============================================================================
# GESTION DES BUGS
# ============================================================================

@app.get("/api/bugs")
async def get_all_bugs(db: Session = Depends(get_db)):
    """Récupérer tous les signalements de bugs avec infos utilisateur"""
    try:
        from sqlalchemy import case
        
        bugs = db.query(
            SignalementBug.id_signalement,
            SignalementBug.titre,
            SignalementBug.description,
            SignalementBug.priorite,
            SignalementBug.statut,
            SignalementBug.date_signalement,
            SignalementBug.date_resolution,
            Utilisateur.nom_utilisateur,
            Utilisateur.role
        ).join(
            Utilisateur, SignalementBug.id_utilisateur == Utilisateur.id_utilisateur
        ).order_by(
            case(
                (SignalementBug.priorite == 'CRITIQUE', 1),
                (SignalementBug.priorite == 'ELEVEE', 2),
                (SignalementBug.priorite == 'MOYENNE', 3),
                (SignalementBug.priorite == 'FAIBLE', 4),
                else_=5
            ),
            SignalementBug.date_signalement.desc()
        ).all()
        
        return [{
            "id_signalement": bug.id_signalement,
            "titre": bug.titre,
            "description": bug.description,
            "priorite": bug.priorite,
            "statut": bug.statut,
            "date_signalement": bug.date_signalement.isoformat() if bug.date_signalement else None,
            "date_resolution": bug.date_resolution.isoformat() if bug.date_resolution else None,
            "nom_utilisateur": bug.nom_utilisateur,
            "role": bug.role
        } for bug in bugs]
        
    except Exception as e:
        print(f"Erreur récupération bugs: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/bugs/stats")
async def get_bugs_stats(db: Session = Depends(get_db)):
    """Récupérer les statistiques des bugs"""
    try:
        from datetime import datetime, timedelta
        from sqlalchemy import func
        
        # Total bugs
        total = db.query(func.count(SignalementBug.id_signalement)).scalar() or 0
        
        # Bugs ouverts (OUVERT ou EN_COURS)
        ouverts = db.query(func.count(SignalementBug.id_signalement)).filter(
            SignalementBug.statut.in_(['OUVERT', 'EN_COURS'])
        ).scalar() or 0
        
        # Bugs résolus ce mois
        debut_mois = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        resolus_mois = db.query(func.count(SignalementBug.id_signalement)).filter(
            SignalementBug.statut == 'RESOLU',
            SignalementBug.date_resolution >= debut_mois
        ).scalar() or 0
        
        return {
            "total": total,
            "ouverts": ouverts,
            "resolus_mois": resolus_mois
        }
        
    except Exception as e:
        print(f"Erreur stats bugs: {e}")
        return {"total": 0, "ouverts": 0, "resolus_mois": 0}

@app.post("/api/bugs")
async def create_bug(bug: dict, request: Request, db: Session = Depends(get_db)):
    """Créer un nouveau signalement de bug"""
    try:
        # Récupérer l'utilisateur depuis le token
        auth_header = request.headers.get('Authorization')
        id_utilisateur = 1  # Valeur par défaut
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.replace('Bearer ', '')
            # Extraire l'ID utilisateur du token (format: token_{id}_{timestamp})
            try:
                parts = token.split('_')
                if len(parts) >= 2:
                    id_utilisateur = int(parts[1])
                    print(f"  ID utilisateur extrait du token: {id_utilisateur}")
            except (ValueError, IndexError) as e:
                print(f"   Erreur extraction ID utilisateur: {e}")
                # Garder la valeur par défaut
        
        print(f"🐛 Création bug par utilisateur ID: {id_utilisateur}")
        print(f"   Titre: {bug.get('titre')}")
        print(f"   Priorité: {bug.get('priorite')}")
        
        nouveau_bug = SignalementBug(
            titre=bug.get('titre'),
            description=bug.get('description'),
            priorite=bug.get('priorite', 'MOYENNE'),
            id_utilisateur=id_utilisateur
        )
        
        db.add(nouveau_bug)
        db.commit()
        db.refresh(nouveau_bug)
        
        print(f"  Bug créé avec succès - ID: {nouveau_bug.id_signalement}")
        
        return {
            "message": "Bug créé avec succès",
            "id_signalement": nouveau_bug.id_signalement
        }
        
    except Exception as e:
        db.rollback()
        print(f"  Erreur création bug: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/bugs/{bug_id}")
async def update_bug(bug_id: int, bug: dict, db: Session = Depends(get_db)):
    """Modifier un signalement de bug"""
    try:
        bug_db = db.query(SignalementBug).filter(
            SignalementBug.id_signalement == bug_id
        ).first()
        
        if not bug_db:
            raise HTTPException(status_code=404, detail="Bug non trouvé")
        
        # Mettre à jour les champs
        if 'titre' in bug:
            bug_db.titre = bug['titre']
        if 'description' in bug:
            bug_db.description = bug['description']
        if 'priorite' in bug:
            bug_db.priorite = bug['priorite']
        if 'statut' in bug:
            bug_db.statut = bug['statut']
            # Si résolu, mettre la date de résolution
            if bug['statut'] == 'RESOLU' and not bug_db.date_resolution:
                bug_db.date_resolution = datetime.now()
        
        db.commit()
        return {"message": "Bug modifié avec succès"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erreur modification bug: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/bugs/{bug_id}")
async def delete_bug(bug_id: int, db: Session = Depends(get_db)):
    """Supprimer un signalement de bug"""
    try:
        bug_db = db.query(SignalementBug).filter(
            SignalementBug.id_signalement == bug_id
        ).first()
        
        if not bug_db:
            raise HTTPException(status_code=404, detail="Bug non trouvé")
        
        db.delete(bug_db)
        db.commit()
        
        return {"message": "Bug supprimé avec succès"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erreur suppression bug: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ADMIN: NETTOYAGE COMPLET ====================
from fastapi import APIRouter

@app.delete("/api/admin/nettoyage/all")
async def purge_all_data(db: Session = Depends(get_db)):
    """
    Attention: Cette route supprime toutes les données métier (ordre intégrité FK):
    LignesAvoir -> Avoir -> LigneFacture -> LigneDevis -> Reglement -> Facture -> Devis -> LigneVente -> VenteComptoir -> MouvementStock -> Article/Client/Fournisseur/Bug
    mais garde Utilisateurs/Configuration. Opération IRRÉVERSIBLE.
    """
    try:
        db.query(LigneAvoir).delete()
        db.query(Avoir).delete()
        db.query(LigneFacture).delete()
        db.query(LigneDevis).delete()
        db.query(Reglement).delete()
        db.query(Facture).delete()
        db.query(Devis).delete()
        db.query(LigneVente).delete()
        db.query(VenteComptoir).delete()
        db.query(MouvementStock).delete()
        db.query(Article).delete()
        db.query(Client).delete()
        db.query(Fournisseur).delete()
        db.query(SignalementBug).delete()
        db.commit()
        return {"message": "Toutes les données métiers (hors utilisateurs et config) ont été effacées avec succès."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur lors du nettoyage: {str(e)}")

    
if __name__ == "__main__":
    import uvicorn
    print("  Démarrage du serveur FastAPI...")
    print("  Documentation: http://localhost:8000/docs")
    print("  Interface alternative: http://localhost:8000/redoc")
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

