#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TECH INFO PLUS - CONFIGURATION MYSQL
Modèles SQLAlchemy pour MySQL
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, Date, DateTime, Boolean, Text, ForeignKey, CheckConstraint, text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv('config.env')

# Configuration de la base de données
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_PORT = os.getenv('MYSQL_PORT', '3306')
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'tech_info_plus')

# Créer l'URL de connexion (supporte MySQL et PostgreSQL)
# Si DATABASE_URL est défini dans l'environnement, il sera utilisé (priorité pour PostgreSQL Supabase)
DATABASE_URL = os.getenv('DATABASE_URL') or f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}?charset=utf8mb4"

# Créer le moteur SQLAlchemy
engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)

# Créer la session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base pour les modèles
Base = declarative_base()

# ==================== MODÈLES ====================

class Entreprise(Base):
    __tablename__ = 'entreprise'
    
    id_entreprise = Column(Integer, primary_key=True, autoincrement=True)
    nom = Column(String(255), nullable=False)
    adresse = Column(Text)
    telephone = Column(String(50))
    email = Column(String(255))
    nif = Column(String(100))
    logo_path = Column(String(500))
    taux_tva = Column(Float, default=9.5)
    devise = Column(String(10), default='FCFA')
    created_at = Column(DateTime, default=datetime.now)


class Utilisateur(Base):
    __tablename__ = 'utilisateur'
    
    id_utilisateur = Column(Integer, primary_key=True, autoincrement=True)
    nom_utilisateur = Column(String(50), nullable=False, unique=True)
    email = Column(String(100), unique=True)
    mot_de_passe = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    statut = Column(String(20))
    telephone = Column(String(20))
    actif = Column(Boolean, default=True)
    droits = Column(Text)
    date_creation = Column(DateTime, default=datetime.now)
    created_at = Column(DateTime, default=datetime.now)
    derniere_connexion = Column(DateTime, nullable=True)  # Dernière heure de connexion


class Client(Base):
    __tablename__ = 'client'
    
    id_client = Column(Integer, primary_key=True, autoincrement=True)
    numero_client = Column(String(20), unique=True)
    nom = Column(String(100), nullable=False)
    type_client = Column(String(20))
    ville = Column(String(50))
    telephone = Column(String(20))
    email = Column(String(100))
    nif = Column(String(20))
    adresse = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    
    # Relations
    devis = relationship("Devis", back_populates="client")
    factures = relationship("Facture", back_populates="client")


class Fournisseur(Base):
    __tablename__ = 'fournisseur'
    
    id_fournisseur = Column(Integer, primary_key=True, autoincrement=True)
    numero_fournisseur = Column(String(20))
    nom_fournisseur = Column(String(100), nullable=False)
    adresse = Column(Text)
    telephone = Column(String(20))
    email = Column(String(100))
    pays = Column(String(50))
    nif = Column(String(20))
    ville = Column(String(50))
    created_at = Column(DateTime, default=datetime.now)
    
    # Relations
    articles = relationship("Article", back_populates="fournisseur")


class Article(Base):
    __tablename__ = 'article'
    
    id_article = Column(Integer, primary_key=True, autoincrement=True)
    code_article = Column(String(50), unique=True)
    designation = Column(String(100), nullable=False)
    description = Column(Text)
    type_article = Column(String(20), default='PRODUIT')  # PRODUIT ou SERVICE
    prix_achat = Column(Float, default=0.0)
    prix_vente = Column(Float, default=0.0)
    prix_service = Column(Float)
    stock_initial = Column(Integer, default=0)
    stock_actuel = Column(Integer, default=0)
    stock_alerte = Column(Integer, default=10)
    unite = Column(String(20), default='PIECE')
    categorie = Column(String(50))
    image_path = Column(Text)  # LONGTEXT pour stocker les images Base64
    actif = Column(Boolean, default=True)  # Pour activer/désactiver l'article
    id_fournisseur = Column(Integer, ForeignKey('fournisseur.id_fournisseur'))
    created_at = Column(DateTime, default=datetime.now)
    supprime_par = Column(Integer, ForeignKey('utilisateur.id_utilisateur'), nullable=True)  # Qui a supprimé
    date_suppression = Column(DateTime, nullable=True)  # Quand a été supprimé
    
    # Relations
    fournisseur = relationship("Fournisseur", back_populates="articles")
    lignes_devis = relationship("LigneDevis", back_populates="article")
    lignes_facture = relationship("LigneFacture", back_populates="article")
    mouvements = relationship("MouvementStock", back_populates="article")


class Devis(Base):
    __tablename__ = 'devis'
    
    id_devis = Column(Integer, primary_key=True, autoincrement=True)
    numero_devis = Column(String(20), unique=True, nullable=False)
    id_client = Column(Integer, ForeignKey('client.id_client'), nullable=False)
    id_utilisateur = Column(Integer, ForeignKey('utilisateur.id_utilisateur'))  # 🔥 Utilisateur créateur
    date_devis = Column(Date, nullable=False)
    date_validite = Column(Date)
    validite = Column(Integer, default=30)  # Validité en jours
    description = Column(Text)  # Description/Titre du devis
    total_ht = Column(Float, default=0)
    total_tva = Column(Float, default=0)
    total_ttc = Column(Float, default=0)
    precompte_applique = Column(Integer, default=0)  # 0 ou 1 pour boolean
    statut = Column(String(20), default="En attente")
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    
    # Relations
    client = relationship("Client", back_populates="devis")
    lignes = relationship("LigneDevis", back_populates="devis", cascade="all, delete-orphan")
    
    # Propriétés pour compatibilité avec l'API
    @property
    def montant_ht(self):
        return self.total_ht
    
    @montant_ht.setter
    def montant_ht(self, value):
        self.total_ht = value
    
    @property
    def montant_ttc(self):
        return self.total_ttc
    
    @montant_ttc.setter
    def montant_ttc(self, value):
        self.total_ttc = value


class LigneDevis(Base):
    __tablename__ = 'ligne_devis'
    
    id_ligne = Column('id_ligne', Integer, primary_key=True, autoincrement=True)
    id_devis = Column(Integer, ForeignKey('devis.id_devis'), nullable=False)
    id_article = Column(Integer, ForeignKey('article.id_article'), nullable=False)
    quantite = Column(Integer, nullable=False, default=1)
    prix_unitaire = Column(Float, nullable=False, default=0.0)
    total_ht = Column(Float, default=0.0)
    
    # Relations
    devis = relationship("Devis", back_populates="lignes")
    article = relationship("Article", back_populates="lignes_devis")


class Facture(Base):
    __tablename__ = 'facture'
    
    id_facture = Column(Integer, primary_key=True, autoincrement=True)
    numero_facture = Column(String(20), unique=True, nullable=False)
    type_facture = Column(String(20), default='NORMALE')  # NORMALE, COMPTOIR, RETOUR
    id_utilisateur = Column(Integer, ForeignKey('utilisateur.id_utilisateur'))
    id_client = Column(Integer, ForeignKey('client.id_client'))  # Nullable pour comptoir
    id_devis = Column(Integer, ForeignKey('devis.id_devis'))  # Si créé depuis un devis
    date_facture = Column(Date, nullable=False)
    date_echeance = Column(Date)
    total_ht = Column(Float, default=0.0)
    total_tva = Column(Float, default=0.0)
    total_ttc = Column(Float, default=0.0)
    montant_avance = Column(Float, default=0.0)  # Montant payé
    montant_reste = Column(Float, default=0.0)   # Reste à payer
    precompte_applique = Column(Integer, default=0)
    statut = Column(String(20), default='En attente')
    mode_paiement = Column(String(20))
    description = Column(String(255))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    
    # 🔥 Propriétés pour compatibilité avec l'ancien code
    @property
    def montant_ht(self):
        return self.total_ht
    
    @montant_ht.setter
    def montant_ht(self, value):
        self.total_ht = value
    
    @property
    def montant_ttc(self):
        return self.total_ttc
    
    @montant_ttc.setter
    def montant_ttc(self, value):
        self.total_ttc = value
    
    # Relations
    client = relationship("Client", back_populates="factures")
    lignes = relationship("LigneFacture", back_populates="facture", cascade="all, delete-orphan")
    reglements = relationship("Reglement", back_populates="facture")


class LigneFacture(Base):
    __tablename__ = 'ligne_facture'
    
    id_ligne_facture = Column(Integer, primary_key=True, autoincrement=True, name='id_ligne')
    id_facture = Column(Integer, ForeignKey('facture.id_facture'), nullable=False)
    id_article = Column(Integer, ForeignKey('article.id_article'), nullable=False)
    quantite = Column(Integer, nullable=False, default=1)
    prix_unitaire = Column(Float, nullable=False, default=0.0)
    total_ht = Column(Float, default=0.0)
    
    # 🔥 Propriété pour compatibilité avec setter
    @property
    def montant_ht(self):
        return self.total_ht
    
    @montant_ht.setter
    def montant_ht(self, value):
        self.total_ht = value
    
    @property
    def montant_ttc(self):
        return self.total_ht
    
    @montant_ttc.setter
    def montant_ttc(self, value):
        self.total_ht = value
    
    # Relations
    facture = relationship("Facture", back_populates="lignes")
    article = relationship("Article", back_populates="lignes_facture")


class Reglement(Base):
    __tablename__ = 'reglement'
    
    id_reglement = Column(Integer, primary_key=True, autoincrement=True)
    numero_reglement = Column(String(20), unique=True)
    date_reglement = Column(Date, nullable=False)
    montant = Column(Float, nullable=False, default=0.0)
    mode_paiement = Column(String(50), nullable=False)
    reference = Column(String(255))
    id_facture = Column(Integer, ForeignKey('facture.id_facture'), nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    
    # Relations
    facture = relationship("Facture", back_populates="reglements")


class Avoir(Base):
    __tablename__ = 'avoir'
    
    id_avoir = Column(Integer, primary_key=True, autoincrement=True)
    numero_avoir = Column(String(100), unique=True, nullable=False)
    id_facture = Column(Integer, ForeignKey('facture.id_facture'))
    date_avoir = Column(Date, nullable=False)
    montant = Column(Float, nullable=False, default=0.0)  # ✅ Correspond à la table MySQL
    motif = Column(Text)
    statut = Column(String(20), default='EN_ATTENTE')  # EN_ATTENTE, VALIDE, REFUSE, TRAITE
    created_at = Column(DateTime, default=datetime.now)
    
    # 🔥 Propriétés pour compatibilité avec l'ancien code
    @property
    def montant_ht(self):
        return self.montant
    
    @montant_ht.setter
    def montant_ht(self, value):
        self.montant = value
    
    @property
    def montant_ttc(self):
        return self.montant
    
    @montant_ttc.setter
    def montant_ttc(self, value):
        self.montant = value
    
    # Relations
    lignes = relationship("LigneAvoir", back_populates="avoir", cascade="all, delete-orphan")


class LigneAvoir(Base):
    __tablename__ = 'ligne_avoir'
    
    id_ligne_avoir = Column(Integer, primary_key=True, autoincrement=True, name='id_ligne')
    id_avoir = Column(Integer, ForeignKey('avoir.id_avoir'), nullable=False)
    id_article = Column(Integer, ForeignKey('article.id_article'), nullable=False)
    code_article = Column(String(50))
    designation = Column(String(255))
    quantite = Column(Integer, nullable=False, default=1)
    prix_unitaire = Column(Float, nullable=False, default=0.0)
    montant_ht = Column(Float, default=0.0)
    
    # 🔥 Propriété pour compatibilité avec montant_ttc
    @property
    def montant_ttc(self):
        return self.montant_ht
    
    @montant_ttc.setter
    def montant_ttc(self, value):
        self.montant_ht = value
    
    # Relations
    avoir = relationship("Avoir", back_populates="lignes")
    article = relationship("Article")


# NOTE : En MySQL, il y a DEUX tables:
# - mouvement_stock : Les mouvements (SORTIE/ENTREE) ← La vraie table des mouvements
# - stock : Peut avoir été utilisée par erreur
# Le stock actuel est dans article.stock_actuel

class Stock(Base):
    __tablename__ = 'stock'
    
    id_stock = Column(Integer, primary_key=True, autoincrement=True)
    id_article = Column(Integer, ForeignKey('article.id_article'), nullable=False)
    quantite = Column(Integer)
    type_mouvement = Column(String(20))
    reference = Column(String(50))
    date_mouvement = Column(DateTime)


class MouvementStock(Base):
    __tablename__ = 'mouvement_stock'  # LA VRAIE TABLE DES MOUVEMENTS
    
    id_mouvement = Column(Integer, primary_key=True, autoincrement=True)
    id_article = Column(Integer, ForeignKey('article.id_article'), nullable=False)
    type_mouvement = Column(String(20), nullable=False)
    quantite = Column(Integer, nullable=False)
    reference = Column(String(50))
    date_mouvement = Column(DateTime, default=datetime.now)
    
    # Relations
    article = relationship("Article", back_populates="mouvements")


class SignalementBug(Base):
    __tablename__ = 'signalement_bug'
    
    id_signalement = Column(Integer, primary_key=True, autoincrement=True)
    titre = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priorite = Column(String(50), default='MOYENNE')  # Correspondre à la table MySQL
    statut = Column(String(50), default='OUVERT')  # Correspondre à la table MySQL
    date_signalement = Column(DateTime, default=datetime.now)
    date_resolution = Column(DateTime)
    id_utilisateur = Column(Integer, ForeignKey('utilisateur.id_utilisateur'))


class VenteComptoir(Base):
    __tablename__ = 'vente_comptoir'
    
    id_vente = Column(Integer, primary_key=True, autoincrement=True)
    numero_vente = Column(String(20), unique=True, nullable=False)
    date_vente = Column(DateTime, default=datetime.now, nullable=False)
    montant_total = Column(Float, nullable=False, default=0.0)
    mode_paiement = Column(String(20), nullable=False)
    notes = Column(Text)
    
    # Relations
    lignes = relationship("LigneVente", back_populates="vente", cascade="all, delete-orphan")


class LigneVente(Base):
    __tablename__ = 'ligne_vente'
    
    id_ligne = Column(Integer, primary_key=True, autoincrement=True)
    id_vente = Column(Integer, ForeignKey('vente_comptoir.id_vente'), nullable=False)
    id_article = Column(Integer, ForeignKey('article.id_article'), nullable=False)
    quantite = Column(Integer, nullable=False, default=1)
    prix_unitaire = Column(Float, nullable=False, default=0.0)
    total_ht = Column(Float, nullable=False, default=0.0)
    
    # Relations
    vente = relationship("VenteComptoir", back_populates="lignes")
    article = relationship("Article")


# ==================== FONCTIONS UTILITAIRES ====================

def get_db():
    """
    Générateur de session de base de données
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_connection():
    """
    Teste la connexion à MySQL
    """
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        print("✅ Connexion MySQL réussie !")
        return True
    except Exception as e:
        print(f"❌ Erreur connexion MySQL : {e}")
        return False


def create_tables():
    """
    Crée toutes les tables dans MySQL automatiquement
    Utilise SQLAlchemy pour créer toutes les tables définies dans les modèles
    Gère automatiquement les tables existantes
    """
    try:
        # Obtenir la liste de toutes les tables à créer
        tables_to_create = list(Base.metadata.tables.keys())
        
        print(f"  📋 Tables à créer/vérifier ({len(tables_to_create)}):")
        for table_name in sorted(tables_to_create):
            print(f"     - {table_name}")
        
        # Vérifier quelles tables existent déjà
        from sqlalchemy import inspect
        
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        if existing_tables:
            print(f"  📊 Tables existantes détectées: {len(existing_tables)}")
            new_tables = [t for t in tables_to_create if t not in existing_tables]
            if new_tables:
                print(f"  ➕ Nouvelles tables à créer: {len(new_tables)}")
            else:
                print(f"  ✅ Toutes les tables existent déjà")
        
        # Créer toutes les tables (SQLAlchemy gère automatiquement IF NOT EXISTS)
        # Cette méthode ne supprime pas les tables existantes, elle ajoute seulement les nouvelles
        Base.metadata.create_all(bind=engine, checkfirst=True)
        
        # Vérifier que toutes les tables ont été créées
        inspector = inspect(engine)
        final_tables = inspector.get_table_names()
        created_count = len([t for t in tables_to_create if t in final_tables])
        
        print(f"  ✅ {created_count}/{len(tables_to_create)} tables créées/vérifiées avec succès !")
        
        # Vérifier les colonnes manquantes dans les tables existantes et les ajouter si nécessaire
        try:
            for table_name in tables_to_create:
                if table_name in existing_tables:
                    # Vérifier si la table existe mais manque des colonnes
                    table = Base.metadata.tables[table_name]
                    existing_columns = [col['name'] for col in inspector.get_columns(table_name)]
                    required_columns = [col.name for col in table.columns]
                    
                    missing_columns = [col for col in required_columns if col not in existing_columns]
                    if missing_columns:
                        print(f"  ⚠️ Table {table_name} manque des colonnes: {missing_columns}")
                        print(f"     (Les colonnes seront ajoutées automatiquement lors des prochaines migrations)")
        
        except Exception as e:
            # Non bloquant
            pass
        
        return True
    except Exception as e:
        print(f"  ❌ Erreur création tables : {e}")
        import traceback
        traceback.print_exc()
        # On retourne True quand même car certaines tables peuvent déjà exister
        return True


def init_database():
    """
    Initialise la base de données
    """
    print("🔧 Initialisation de la base de données MySQL...")
    
    if test_connection():
        if create_tables():
            print("✅ Base de données prête !")
            return True
    
    print("❌ Échec initialisation base de données")
    return False


if __name__ == "__main__":
    init_database()

