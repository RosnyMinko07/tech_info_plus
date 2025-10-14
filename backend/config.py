#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TECH INFO PLUS - CONFIGURATION
Configuration pour développement et production
"""

import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Environment (development ou production)
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')

# Configuration MySQL
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_PORT = os.getenv('MYSQL_PORT', '3306')
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'tech_info_plus')

# URL de la base de données
DATABASE_URL = os.getenv(
    'DATABASE_URL',
    f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}?charset=utf8mb4"
)

# Frontend URL (pour CORS)
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

# Secret Key pour JWT
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

# Configuration selon l'environnement
if ENVIRONMENT == 'production':
    DEBUG = False
    ALLOWED_ORIGINS = [
        FRONTEND_URL,
        "https://*.vercel.app",
        "https://*.up.railway.app",
    ]
else:
    DEBUG = True
    ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
    ]

# Configuration de l'application
APP_NAME = "Tech Info Plus"
APP_VERSION = "2.0.0"
API_PREFIX = "/api"

print(f"🔧 Configuration chargée:")
print(f"   Environment: {ENVIRONMENT}")
print(f"   Database: {MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}")
print(f"   Frontend: {FRONTEND_URL}")
print(f"   Debug: {DEBUG}")



