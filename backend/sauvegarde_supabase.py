#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sauvegarde complète des données Supabase (PostgreSQL) sans pg_dump.

Pour chaque table du schéma public, crée :
  - <table>.csv        : les données (lisibles dans Excel)
  - restauration.sql   : des INSERT pour tout remettre si besoin

Utilisation (PowerShell) :
    pip install psycopg2-binary
    $env:DATABASE_URL = "postgresql://postgres.xxxx:MOT_DE_PASSE@aws-0-xxx.pooler.supabase.com:5432/postgres"
    python sauvegarde_supabase.py

Le dossier créé : backend/sauvegardes/AAAA-MM-JJ_HHMMSS/
"""

import csv
import os
import sys
from datetime import datetime

try:
    import psycopg2
except ImportError:
    sys.exit("psycopg2 manquant : lance  pip install psycopg2-binary")

url = os.getenv("DATABASE_URL", "")
if not url.startswith(("postgresql://", "postgres://", "postgresql+psycopg2://")):
    sys.exit("DATABASE_URL absente ou pas PostgreSQL. Définis-la d'abord (voir en haut du fichier).")
url = url.replace("postgresql+psycopg2://", "postgresql://")

dossier = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                       "sauvegardes", datetime.now().strftime("%Y-%m-%d_%H%M%S"))
os.makedirs(dossier, exist_ok=True)

conn = psycopg2.connect(url)
conn.set_session(readonly=True)
cur = conn.cursor()

cur.execute("""
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
""")
tables = [r[0] for r in cur.fetchall()]
if not tables:
    sys.exit("Aucune table trouvée dans le schéma public.")

total = 0
with open(os.path.join(dossier, "restauration.sql"), "w", encoding="utf-8") as sql:
    sql.write(f"-- Sauvegarde du {datetime.now():%d/%m/%Y %H:%M}\n")
    sql.write("-- Restauration : vider les tables concernées puis exécuter ce fichier.\n")
    sql.write("BEGIN;\nSET session_replication_role = replica; -- ignore les clés étrangères pendant l'import\n\n")

    for table in tables:
        cur.execute(f'SELECT * FROM public."{table}"')
        colonnes = [d[0] for d in cur.description]
        lignes = cur.fetchall()
        total += len(lignes)

        with open(os.path.join(dossier, f"{table}.csv"), "w", newline="", encoding="utf-8-sig") as f:
            w = csv.writer(f, delimiter=";")
            w.writerow(colonnes)
            w.writerows(lignes)

        sql.write(f"-- {table} ({len(lignes)} lignes)\n")
        cols = ", ".join(f'"{c}"' for c in colonnes)
        placeholders = ", ".join(["%s"] * len(colonnes))
        for ligne in lignes:
            sql.write(cur.mogrify(f'INSERT INTO public."{table}" ({cols}) VALUES ({placeholders});',
                                  ligne).decode("utf-8") + "\n")

        # Remettre les compteurs SERIAL au bon niveau
        cur.execute("""
            SELECT a.attname, pg_get_serial_sequence(%s, a.attname)
            FROM pg_attribute a
            WHERE a.attrelid = %s::regclass AND a.attnum > 0 AND NOT a.attisdropped
              AND pg_get_serial_sequence(%s, a.attname) IS NOT NULL
        """, (f"public.{table}", f"public.{table}", f"public.{table}"))
        for col, seq in cur.fetchall():
            sql.write(f"SELECT setval('{seq}', COALESCE((SELECT MAX(\"{col}\") FROM public.\"{table}\"), 1));\n")
        sql.write("\n")

        print(f"  {table:<20} {len(lignes):>6} lignes")

    sql.write("SET session_replication_role = DEFAULT;\nCOMMIT;\n")

conn.close()
print(f"\nOK : {len(tables)} tables, {total} lignes sauvegardées dans :\n  {dossier}")
