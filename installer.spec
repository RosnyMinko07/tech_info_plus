# -*- mode: python ; coding: utf-8 -*-
"""
Fichier de spécification PyInstaller pour TECH INFO PLUS Installer
Ce fichier garantit l'inclusion de TOUS les packages nécessaires
"""

from PyInstaller.utils.hooks import collect_all, collect_submodules, collect_data_files

# Collecter tous les modules et données nécessaires
datas = []
binaries = []
hiddenimports = []

# Ajouter les dossiers backend et frontend
datas += [('backend', 'backend'), ('frontend', 'frontend')]

# Collecter tous les packages critiques
packages_to_collect = [
    'mysql.connector',
    'pymysql',
    'tkinter',
    'dotenv',
    'certifi',
    'charset_normalizer',
    'urllib3',
    'ssl',
]

for package in packages_to_collect:
    try:
        tmp_ret = collect_all(package)
        datas += tmp_ret[0]
        binaries += tmp_ret[1]
        hiddenimports += tmp_ret[2]
    except Exception as e:
        print(f"Warning: Could not collect {package}: {e}")

# Ajouter les imports cachés manuellement
hiddenimports += [
    'mysql.connector',
    'mysql.connector.pooling',
    'mysql.connector.cursor',
    'mysql.connector.errors',
    'mysql.connector.connection',
    'mysql.connector.conversion',
    'pymysql',
    'pymysql.cursors',
    'pymysql.converters',
    'pymysql.connections',
    'pymysql.constants',
    'pymysql.err',
    'tkinter',
    'tkinter.ttk',
    'tkinter.scrolledtext',
    'tkinter.messagebox',
    'tkinter.filedialog',
    'socket',
    'urllib.request',
    'urllib.parse',
    'urllib.error',
    'zipfile',
    'shutil',
    'threading',
    'subprocess',
    'time',
    'json',
    'os',
    'sys',
    'pathlib',
    'dotenv',
    'ssl',
    'certifi',
    'charset_normalizer',
    '_ssl',
    '_socket',
]

# Collecter les sous-modules de mysql.connector
try:
    hiddenimports += collect_submodules('mysql.connector')
except:
    pass

# Collecter les sous-modules de pymysql
try:
    hiddenimports += collect_submodules('pymysql')
except:
    pass

# Configuration de l'analyse
a = Analysis(
    ['installer.py'],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'pytest',
        'matplotlib',
        'numpy',
        'pandas',
        'scipy',
        'IPython',
    ],
    noarchive=False,
    optimize=0,
)

# Retirer les duplications
pyz = PYZ(a.pure)

# Créer l'exécutable
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='TECH_INFO_PLUS_Installer',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,  # Désactiver UPX pour éviter les faux positifs antivirus
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # Mode fenêtré (pas de console)
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)







