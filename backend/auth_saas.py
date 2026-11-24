#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Authentification SaaS : token JWT signé + session filtrée par entreprise.

- creer_token(user)       -> JWT signé (id utilisateur, id entreprise, rôle)
- get_db                  -> session authentifiée ET filtrée sur l'entreprise
                             de l'utilisateur (401 sans token valide)
- get_db_public           -> session sans filtre (login, inscription)
- get_current_user_id()   -> id de l'utilisateur connecté
- require_admin           -> dépendance qui exige le rôle ADMIN
"""

import os
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request, status
from jose import JWTError, jwt

from database_mysql import SessionLocal, Utilisateur, Entreprise

SECRET_KEY = os.getenv("SECRET_KEY", "")
ALGORITHM = "HS256"
DUREE_TOKEN_HEURES = int(os.getenv("TOKEN_HEURES", "12"))

if not SECRET_KEY:
    if os.getenv("ENVIRONMENT") == "production":
        raise RuntimeError("SECRET_KEY doit être définie en production (variable d'environnement).")
    SECRET_KEY = "dev-secret-key-uniquement-en-local"
    print("⚠️  SECRET_KEY absente : clé de développement utilisée (NE PAS utiliser en production)")

STATUTS_ENTREPRISE_AUTORISES = {"ACTIF", "ESSAI"}

_non_authentifie = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Session expirée ou invalide. Veuillez vous reconnecter.",
    headers={"WWW-Authenticate": "Bearer"},
)


def creer_token(user: Utilisateur) -> str:
    maintenant = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id_utilisateur),
        "ent": user.id_entreprise,
        "role": user.role,
        "iat": maintenant,
        "exp": maintenant + timedelta(hours=DUREE_TOKEN_HEURES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _lire_token(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise _non_authentifie
    try:
        payload = jwt.decode(auth[7:], SECRET_KEY, algorithms=[ALGORITHM])
        return {"id_utilisateur": int(payload["sub"]), "id_entreprise": int(payload["ent"])}
    except (JWTError, KeyError, ValueError, TypeError):
        raise _non_authentifie


def get_db_public():
    """Session NON filtrée : uniquement pour login / inscription."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db(request: Request):
    """Session authentifiée, limitée à l'entreprise de l'utilisateur connecté."""
    infos = _lire_token(request)
    db = SessionLocal()
    try:
        db.info["id_entreprise"] = infos["id_entreprise"]

        # L'utilisateur doit toujours exister, être actif et appartenir à cette entreprise
        # (la session est déjà filtrée : un utilisateur d'une autre entreprise est introuvable)
        user = db.query(Utilisateur).filter(Utilisateur.id_utilisateur == infos["id_utilisateur"]).first()
        if not user or not user.actif:
            raise _non_authentifie

        entreprise = db.query(Entreprise).first()
        if not entreprise:
            raise _non_authentifie
        if (entreprise.statut or "ACTIF").upper() not in STATUTS_ENTREPRISE_AUTORISES:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail="Le compte de votre entreprise est suspendu. Contactez le support.")

        db.info["user"] = user
        request.state.id_utilisateur = user.id_utilisateur
        request.state.id_entreprise = infos["id_entreprise"]
        request.state.role = (user.role or "").upper()
        yield db
    finally:
        db.close()


def get_current_user_id(request: Request) -> int:
    """ID de l'utilisateur connecté (après passage par get_db)."""
    uid = getattr(request.state, "id_utilisateur", None)
    if uid is None:
        raise _non_authentifie
    return uid


def require_admin(request: Request, db=Depends(get_db)):
    """À ajouter en dépendance des routes réservées aux administrateurs."""
    if getattr(request.state, "role", "") != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Réservé aux administrateurs")
    return db
