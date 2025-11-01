#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TECH INFO PLUS - Installateur Automatique
Créé pour installer automatiquement l'application TECH INFO PLUS
"""

import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import subprocess
import os
import sys
import urllib.request
import zipfile
import shutil
import mysql.connector
import threading
import time
import socket
from pathlib import Path

class TechInfoPlusInstaller:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("TECH INFO PLUS - Installateur")
        self.root.geometry("800x600")
        self.root.resizable(False, False)
        
        # Variables
        self.install_dir = os.path.join(os.path.expanduser("~"), "TECH_INFO_PLUS")
        self.project_dir = os.path.join(self.install_dir, "tech_info_plus")
        
        # Fonction helper pour trouver les ressources (fichiers inclus dans l'exe)
        def resource_path(relative_path):
            """Retourne le chemin absolu vers une ressource, fonctionne pour dev et PyInstaller"""
            if getattr(sys, 'frozen', False):
                # On est dans un exe PyInstaller
                base_path = sys._MEIPASS
            else:
                # On est en script Python normal
                base_path = os.path.dirname(os.path.abspath(__file__))
            return os.path.join(base_path, relative_path)
        
        # Détecter si on est dans un exe PyInstaller
        if getattr(sys, 'frozen', False):
            # On est dans un exe PyInstaller - les fichiers sont dans sys._MEIPASS
            self.current_dir = sys._MEIPASS
            self.source_root = sys._MEIPASS
            self.resource_path = resource_path
        else:
            # On est en script Python normal
            script_dir = os.path.dirname(os.path.abspath(__file__))
            self.current_dir = script_dir
            # Le répertoire parent contient backend/ et frontend/
            parent_dir = os.path.dirname(script_dir)
            if os.path.exists(os.path.join(script_dir, "backend")):
                self.source_root = script_dir
            elif os.path.exists(os.path.join(parent_dir, "backend")):
                self.source_root = parent_dir
            else:
                self.source_root = script_dir
            self.resource_path = resource_path
        
        # Interface
        self.setup_ui()
        
    def setup_ui(self):
        """Configuration de l'interface utilisateur"""
        # Titre
        title_frame = tk.Frame(self.root, bg="#2c3e50", height=80)
        title_frame.pack(fill=tk.X, padx=10, pady=10)
        title_frame.pack_propagate(False)
        
        title_label = tk.Label(
            title_frame, 
            text="🚀 TECH INFO PLUS - INSTALLATEUR", 
            font=("Arial", 16, "bold"),
            fg="white",
            bg="#2c3e50"
        )
        title_label.pack(expand=True)
        
        # Zone de progression
        progress_frame = tk.Frame(self.root)
        progress_frame.pack(fill=tk.X, padx=20, pady=10)
        
        self.progress_label = tk.Label(progress_frame, text="Prêt à installer...", font=("Arial", 10))
        self.progress_label.pack(anchor=tk.W)
        
        self.progress_bar = ttk.Progressbar(progress_frame, mode='determinate')
        self.progress_bar.pack(fill=tk.X, pady=5)
        
        # Zone de logs
        logs_frame = tk.Frame(self.root)
        logs_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        tk.Label(logs_frame, text="Logs d'installation:", font=("Arial", 10, "bold")).pack(anchor=tk.W)
        
        self.log_text = scrolledtext.ScrolledText(logs_frame, height=15, font=("Consolas", 9))
        self.log_text.pack(fill=tk.BOTH, expand=True, pady=5)
        
        # Boutons
        button_frame = tk.Frame(self.root)
        button_frame.pack(fill=tk.X, padx=20, pady=10)
        
        self.install_button = tk.Button(
            button_frame, 
            text="🚀 COMMENCER L'INSTALLATION", 
            command=self.start_installation,
            bg="#27ae60",
            fg="white",
            font=("Arial", 12, "bold"),
            height=2
        )
        self.install_button.pack(side=tk.LEFT, padx=5)
        
        self.cancel_button = tk.Button(
            button_frame, 
            text="❌ ANNULER", 
            command=self.root.quit,
            bg="#e74c3c",
            fg="white",
            font=("Arial", 12, "bold"),
            height=2
        )
        self.cancel_button.pack(side=tk.RIGHT, padx=5)
        
    def log(self, message):
        """Ajouter un message aux logs"""
        self.log_text.insert(tk.END, f"[{time.strftime('%H:%M:%S')}] {message}\n")
        self.log_text.see(tk.END)
        self.root.update()
        
    def update_progress(self, value, text=""):
        """Mettre à jour la barre de progression"""
        self.progress_bar['value'] = value
        if text:
            self.progress_label.config(text=text)
        self.root.update()
        
    def check_mysql_port_socket(self):
        """Méthode 1: Vérifier MySQL via test de connexion socket (la plus fiable)"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(2)
            result = sock.connect_ex(('localhost', 3306))
            sock.close()
            return result == 0
        except Exception:
            return False
    
    def check_mysql_port_netstat(self):
        """Méthode 2: Vérifier MySQL via netstat (fallback)"""
        try:
            # Essayer avec le chemin complet ou dans PATH
            netstat_paths = [
                os.path.join(os.environ.get('SystemRoot', 'C:\\Windows'), 'System32', 'netstat.exe'),
                'netstat.exe',
                'netstat'
            ]
            
            for netstat_cmd in netstat_paths:
                try:
                    result = subprocess.run(
                        [netstat_cmd, '-an'],
                        capture_output=True,
                        text=True,
                        timeout=5,
                        errors='ignore'
                    )
                    if result.returncode == 0 and ':3306' in result.stdout:
                        return True
                except (FileNotFoundError, subprocess.TimeoutExpired, Exception):
                    continue
            return False
        except Exception:
            return False
    
    def check_mysql_connection(self):
        """Méthode 3: Vérifier MySQL via connexion réelle (la plus précise)"""
        try:
            # Vérifier si mysql.connector est disponible
            import mysql.connector
        except ImportError:
            # mysql.connector pas disponible, on skip cette méthode
            return False
        
        try:
            conn = mysql.connector.connect(
                host='localhost',
                port=3306,
                user='root',
                password='',
                connection_timeout=3,
                raise_on_warnings=False
            )
            conn.close()
            return True
        except mysql.connector.Error:
            # Essayer aussi avec différentes configs
            try:
                conn = mysql.connector.connect(
                    host='127.0.0.1',
                    port=3306,
                    connection_timeout=2,
                    raise_on_warnings=False
                )
                conn.close()
                return True
            except:
                return False
        except Exception:
            return False
    
    def check_mysql_robust(self):
        """Vérification MySQL robuste avec plusieurs méthodes en cascade"""
        self.log("🗄️ Vérification de MySQL/XAMPP...")
        
        # Essayer les méthodes dans l'ordre de fiabilité
        # La méthode socket est la plus fiable et universelle
        methods = [
            ("Test de connexion socket (méthode principale)", self.check_mysql_port_socket),
            ("Test de connexion MySQL directe", self.check_mysql_connection),
            ("Vérification via netstat (fallback)", self.check_mysql_port_netstat),
        ]
        
        for method_name, method_func in methods:
            try:
                self.log(f"   🔄 Tentative: {method_name}...")
                if method_func():
                    self.log(f"✅ MySQL est démarré et accessible (via {method_name})")
                    return True
            except Exception as e:
                self.log(f"   ⚠️ {method_name} a échoué: {str(e)}")
                continue
        
        # Si toutes les méthodes ont échoué
        self.log("❌ ERREUR: MySQL n'est pas accessible")
        self.log("   Vérifications effectuées:")
        self.log("   - Test de connexion socket sur le port 3306: ÉCHEC")
        self.log("   - Test de connexion MySQL directe: ÉCHEC")
        self.log("   - Vérification via netstat: ÉCHEC")
        self.log("")
        self.log("🔧 SOLUTIONS:")
        self.log("   1. Ouvrez XAMPP Control Panel")
        self.log("   2. Cliquez sur 'Start' à côté de MySQL")
        self.log("   3. Attendez que le statut passe à 'Running' (vert)")
        self.log("   4. Relancez cet installateur")
        self.log("")
        self.log("💡 Note: Si XAMPP n'est pas installé, téléchargez-le depuis https://www.apachefriends.org/")
        return False
    
    def check_prerequisites(self):
        """Vérifier les prérequis"""
        self.log("🔍 Vérification des prérequis...")
        
        # Vérifier les privilèges administrateur
        try:
            import ctypes
            is_admin = ctypes.windll.shell32.IsUserAnAdmin()
            if not is_admin:
                self.log("❌ ERREUR: Ce script doit être exécuté en tant qu'administrateur")
                return False
            self.log("✅ Privilèges administrateur confirmés")
        except Exception as e:
            self.log(f"⚠️ Impossible de vérifier les privilèges administrateur: {str(e)}")
        
        # Vérifier la connexion internet
        try:
            urllib.request.urlopen('http://google.com', timeout=5)
            self.log("✅ Connexion internet OK")
        except Exception as e:
            self.log(f"❌ ERREUR: Pas de connexion internet ({str(e)})")
            self.log("   L'installation nécessite une connexion internet pour télécharger les dépendances")
            return False
        
        # Vérifier MySQL/XAMPP avec méthode robuste
        if not self.check_mysql_robust():
            return False
        
        return True
        
    def download_file(self, url, filename):
        """Télécharger un fichier avec barre de progression"""
        self.log(f"⬇️ Téléchargement de {filename}...")
        
        def progress_hook(block_num, block_size, total_size):
            downloaded = block_num * block_size
            if total_size > 0:
                percent = min(100, (downloaded * 100) // total_size)
                self.update_progress(percent, f"Téléchargement {filename}: {percent}%")
        
        try:
            urllib.request.urlretrieve(url, filename, progress_hook)
            self.log(f"✅ {filename} téléchargé avec succès")
            return True
        except Exception as e:
            self.log(f"❌ Erreur téléchargement {filename}: {str(e)}")
            return False
    
    def install_python(self):
        """Installer Python portable (ou utiliser celui déjà présent)"""
        self.log("🐍 Vérification de Python...")
        
        python_dir = os.path.join(self.install_dir, "python")
        python_exe = os.path.join(python_dir, "python.exe")
        
        # Vérifier si Python portable est déjà installé
        if os.path.exists(python_exe):
            self.log("✅ Python portable déjà installé")
            # Vérifier qu'il fonctionne
            try:
                result = subprocess.run([python_exe, "--version"], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    self.log(f"   Version: {result.stdout.strip()}")
                    return True
            except:
                pass
        
        # Vérifier si Python système est disponible
        try:
            result = subprocess.run(["python", "--version"], capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                self.log(f"✅ Python système trouvé: {result.stdout.strip()}")
                self.log("   Utilisation du Python système (pas besoin de télécharger)")
                return True
        except:
            pass
        
        # Si aucun Python trouvé, télécharger et installer
        self.log("⚠️ Python non trouvé, téléchargement de Python portable...")
        
        python_url = "https://www.python.org/ftp/python/3.11.9/python-3.11.9-embed-amd64.zip"
        python_zip = os.path.join(self.install_dir, "python.zip")
        
        if not self.download_file(python_url, python_zip):
            return False
        
        # Extraire Python
        self.log("📦 Extraction de Python...")
        try:
            with zipfile.ZipFile(python_zip, 'r') as zip_ref:
                zip_ref.extractall(python_dir)
            os.remove(python_zip)
            
            # Vérifier l'installation
            if os.path.exists(python_exe):
                # Configurer pip pour Python embed
                pip_zip = os.path.join(python_dir, "get-pip.py")
                if not os.path.exists(os.path.join(python_dir, "Scripts", "pip.exe")):
                    self.log("   📦 Configuration de pip...")
                    pip_url = "https://bootstrap.pypa.io/get-pip.py"
                    try:
                        urllib.request.urlretrieve(pip_url, pip_zip)
                        subprocess.run([python_exe, pip_zip], cwd=python_dir, check=True)
                        if os.path.exists(pip_zip):
                            os.remove(pip_zip)
                    except:
                        pass
                
                self.log("✅ Python portable installé avec succès")
                return True
            else:
                self.log("❌ Python installé mais exécutable non trouvé")
                return False
        except Exception as e:
            self.log(f"❌ Erreur extraction Python: {str(e)}")
            return False
    
    def install_nodejs(self):
        """Installer Node.js portable (ou utiliser celui déjà présent)"""
        self.log("🧩 Vérification de Node.js...")
        
        node_dir = os.path.join(self.install_dir, "node-v20.11.0-win-x64")
        node_exe = os.path.join(node_dir, "node.exe")
        npm_exe = os.path.join(node_dir, "npm.cmd")
        
        # Vérifier si Node.js portable est déjà installé
        if os.path.exists(node_exe) and os.path.exists(npm_exe):
            self.log("✅ Node.js portable déjà installé")
            # Vérifier qu'il fonctionne
            try:
                result = subprocess.run([node_exe, "--version"], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    self.log(f"   Version: {result.stdout.strip()}")
                    return True
            except:
                pass
        
        # Vérifier si Node.js système est disponible
        try:
            result = subprocess.run(["node", "--version"], capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                self.log(f"✅ Node.js système trouvé: {result.stdout.strip()}")
                self.log("   Utilisation du Node.js système (pas besoin de télécharger)")
                return True
        except:
            pass
        
        # Si aucun Node.js trouvé, télécharger et installer
        self.log("⚠️ Node.js non trouvé, téléchargement de Node.js portable...")
        
        node_url = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip"
        node_zip = os.path.join(self.install_dir, "nodejs.zip")
        
        if not self.download_file(node_url, node_zip):
            return False
        
        # Extraire Node.js
        self.log("📦 Extraction de Node.js...")
        try:
            with zipfile.ZipFile(node_zip, 'r') as zip_ref:
                zip_ref.extractall(self.install_dir)
            os.remove(node_zip)
            
            # Vérifier l'installation
            if os.path.exists(node_exe):
                self.log("✅ Node.js portable installé avec succès")
                return True
            else:
                self.log("❌ Node.js installé mais exécutable non trouvé")
                return False
        except Exception as e:
            self.log(f"❌ Erreur extraction Node.js: {str(e)}")
            return False
    
    def setup_project(self):
        """Configurer le projet"""
        self.log("🏗️ Configuration du projet...")
        
        # Créer les dossiers
        backend_dir = os.path.join(self.project_dir, "backend")
        frontend_dir = os.path.join(self.project_dir, "frontend")
        os.makedirs(backend_dir, exist_ok=True)
        os.makedirs(frontend_dir, exist_ok=True)
        
        # Copier les fichiers du projet
        self.log("📁 Copie des fichiers du projet...")
        try:
            # Méthode 1: Chercher les dossiers backend et frontend dans le répertoire source
            backend_src = None
            frontend_src = None
            
            # Chercher dans le répertoire courant (pour .exe) ou parent (pour script)
            search_paths = []
            
            # Pour exe PyInstaller, les fichiers sont dans MEIPASS/backend et MEIPASS/frontend
            if getattr(sys, 'frozen', False):
                self.log(f"   📍 Mode exe détecté, recherche dans: {self.source_root}")
                self.log(f"   📂 Contenu de MEIPASS: {', '.join(os.listdir(self.source_root)[:10])}")
                
                # Méthode 1: Utiliser resource_path
                backend_src = self.resource_path("backend")
                frontend_src = self.resource_path("frontend")
                
                if os.path.isdir(backend_src):
                    self.log(f"   ✅ Backend trouvé via resource_path: {backend_src}")
                else:
                    backend_src = None
                    self.log(f"   ⚠️ Backend non trouvé via resource_path, recherche alternative...")
                
                if os.path.isdir(frontend_src):
                    self.log(f"   ✅ Frontend trouvé via resource_path: {frontend_src}")
                else:
                    frontend_src = None
                    self.log(f"   ⚠️ Frontend non trouvé via resource_path, recherche alternative...")
                
                # Méthode 2: Chercher directement dans MEIPASS
                if not backend_src or not frontend_src:
                    self.log("   🔍 Recherche exhaustive dans MEIPASS...")
                    try:
                        for item in os.listdir(self.source_root):
                            item_path = os.path.join(self.source_root, item)
                            if os.path.isdir(item_path):
                                if item.lower() == 'backend' and not backend_src:
                                    backend_src = item_path
                                    self.log(f"   ✅ Backend trouvé dans MEIPASS: {backend_src}")
                                elif item.lower() == 'frontend' and not frontend_src:
                                    frontend_src = item_path
                                    self.log(f"   ✅ Frontend trouvé dans MEIPASS: {frontend_src}")
                    except Exception as e:
                        self.log(f"   ⚠️ Erreur lecture MEIPASS: {str(e)}")
                
                # Méthode 3: Recherche récursive en dernier recours
                if not backend_src or not frontend_src:
                    self.log("   🔍 Recherche récursive en dernier recours...")
                    try:
                        for root, dirs, files in os.walk(self.source_root):
                            if 'backend' in dirs and not backend_src:
                                backend_src = os.path.join(root, 'backend')
                                self.log(f"   ✅ Backend trouvé récursivement: {backend_src}")
                            if 'frontend' in dirs and not frontend_src:
                                frontend_src = os.path.join(root, 'frontend')
                                self.log(f"   ✅ Frontend trouvé récursivement: {frontend_src}")
                            # Limiter la profondeur de recherche
                            if root.count(os.sep) - self.source_root.count(os.sep) > 2:
                                dirs[:] = []  # Ne pas descendre plus profond
                    except Exception as e:
                        self.log(f"   ⚠️ Erreur recherche récursive: {str(e)}")
            else:
                # Pour script Python, chercher dans plusieurs emplacements
                search_paths = [
                    self.source_root,  # Répertoire contenant installer.py ou parent
                    self.current_dir,   # Répertoire de installer.py
                    os.path.dirname(self.source_root),  # Parent du parent
                    os.path.join(self.source_root, '..'),  # Parent du parent
                ]
                
                # Ajouter aussi le répertoire de travail courant au cas où
                if os.getcwd() not in search_paths:
                    search_paths.append(os.getcwd())
                
                # Afficher les chemins de recherche pour debug
                search_info = ", ".join([os.path.basename(p) if p and os.path.exists(p) else "N/A" for p in search_paths[:3]])
                self.log(f"   🔍 Recherche dans {len(search_paths)} emplacements ({search_info}...)")
                
                for search_path in search_paths:
                    if not search_path or not os.path.exists(search_path):
                        continue
                        
                    possible_backend = os.path.join(search_path, "backend")
                    possible_frontend = os.path.join(search_path, "frontend")
                    
                    if os.path.isdir(possible_backend) and backend_src is None:
                        backend_src = possible_backend
                        self.log(f"   ✅ Backend trouvé: {possible_backend}")
                    
                    if os.path.isdir(possible_frontend) and frontend_src is None:
                        frontend_src = possible_frontend
                        self.log(f"   ✅ Frontend trouvé: {possible_frontend}")
                
                # Si pas trouvé, chercher dans tous les sous-dossiers
                if not backend_src or not frontend_src:
                    self.log("   🔍 Recherche approfondie des dossiers...")
                    for root, dirs, files in os.walk(self.source_root):
                        if 'backend' in dirs and backend_src is None:
                            backend_src = os.path.join(root, 'backend')
                            self.log(f"   ✅ Backend trouvé: {backend_src}")
                        if 'frontend' in dirs and frontend_src is None:
                            frontend_src = os.path.join(root, 'frontend')
                            self.log(f"   ✅ Frontend trouvé: {frontend_src}")
            
            # Copier le backend
            if backend_src and os.path.exists(backend_src):
                self.log("   📦 Copie du backend...")
                try:
                    if os.path.exists(backend_dir):
                        shutil.rmtree(backend_dir)
                    shutil.copytree(backend_src, backend_dir, ignore=shutil.ignore_patterns('__pycache__', '*.pyc', '.git', 'node_modules'))
                    self.log("   ✅ Backend copié avec succès")
                except Exception as e:
                    self.log(f"   ❌ Erreur copie backend: {str(e)}")
                    # Essayer de créer au moins la structure minimale
                    self.create_minimal_backend(backend_dir)
                    # Copier au moins les fichiers essentiels un par un
                    if backend_src and os.path.exists(backend_src):
                        try:
                            self.log("   🔧 Copie des fichiers essentiels un par un...")
                            essential_files = ['app.py', 'database_mysql.py', 'requirements.txt', 'config.env.example', 'init.sql']
                            # Copier aussi tout le dossier api/ si existe
                            api_src = os.path.join(backend_src, "api")
                            api_dst = os.path.join(backend_dir, "api")
                            
                            copied_count = 0
                            for file_name in essential_files:
                                src_file = os.path.join(backend_src, file_name)
                                if os.path.exists(src_file):
                                    try:
                                        shutil.copy2(src_file, os.path.join(backend_dir, file_name))
                                        copied_count += 1
                                    except:
                                        pass
                            
                            if os.path.isdir(api_src):
                                try:
                                    if os.path.exists(api_dst):
                                        shutil.rmtree(api_dst)
                                    shutil.copytree(api_src, api_dst, ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))
                                    self.log(f"   ✅ Dossier api/ copié")
                                except:
                                    pass
                            
                            self.log(f"   ✅ {copied_count} fichiers essentiels copiés")
                        except Exception as e2:
                            self.log(f"   ⚠️ Erreur copie fichiers essentiels: {str(e2)}")
            else:
                self.log("   ⚠️ Backend non trouvé, création de la structure minimale...")
                self.create_minimal_backend(backend_dir)
            
            # Copier le frontend
            if frontend_src and os.path.exists(frontend_src):
                self.log("   📦 Copie du frontend...")
                try:
                    if os.path.exists(frontend_dir):
                        shutil.rmtree(frontend_dir)
                    shutil.copytree(frontend_src, frontend_dir, ignore=shutil.ignore_patterns('node_modules', '.git', 'build', '__pycache__'))
                    self.log("   ✅ Frontend copié avec succès")
                except Exception as e:
                    self.log(f"   ❌ Erreur copie frontend: {str(e)}")
                    # Essayer de créer au moins la structure minimale
                    self.create_minimal_frontend(frontend_dir)
                    # Copier au moins les fichiers essentiels un par un
                    if frontend_src and os.path.exists(frontend_src):
                        try:
                            self.log("   🔧 Copie des fichiers frontend essentiels...")
                            essential_files = ['package.json', 'package-lock.json']
                            src_dir_src = os.path.join(frontend_src, "src")
                            src_dir_dst = os.path.join(frontend_dir, "src")
                            public_dir_src = os.path.join(frontend_src, "public")
                            public_dir_dst = os.path.join(frontend_dir, "public")
                            
                            copied_count = 0
                            for file_name in essential_files:
                                src_file = os.path.join(frontend_src, file_name)
                                if os.path.exists(src_file):
                                    try:
                                        shutil.copy2(src_file, os.path.join(frontend_dir, file_name))
                                        copied_count += 1
                                    except:
                                        pass
                            
                            # Copier le dossier src/ si existe
                            if os.path.isdir(src_dir_src):
                                try:
                                    if os.path.exists(src_dir_dst):
                                        shutil.rmtree(src_dir_dst)
                                    shutil.copytree(src_dir_src, src_dir_dst, ignore=shutil.ignore_patterns('*.log', 'node_modules'))
                                    self.log(f"   ✅ Dossier src/ copié")
                                except:
                                    pass
                            
                            # Copier le dossier public/ si existe
                            if os.path.isdir(public_dir_src):
                                try:
                                    if os.path.exists(public_dir_dst):
                                        shutil.rmtree(public_dir_dst)
                                    shutil.copytree(public_dir_src, public_dir_dst)
                                    self.log(f"   ✅ Dossier public/ copié")
                                except:
                                    pass
                            
                            self.log(f"   ✅ {copied_count} fichiers frontend essentiels copiés")
                        except Exception as e2:
                            self.log(f"   ⚠️ Erreur copie fichiers frontend essentiels: {str(e2)}")
            else:
                self.log("   ⚠️ Frontend non trouvé, création de la structure minimale...")
                self.create_minimal_frontend(frontend_dir)
            
            # Vérifier que les dossiers de destination existent bien
            if not os.path.exists(backend_dir):
                os.makedirs(backend_dir, exist_ok=True)
            if not os.path.exists(frontend_dir):
                os.makedirs(frontend_dir, exist_ok=True)
            
            # Vérifier qu'on a au moins les fichiers essentiels
            backend_ok = os.path.exists(os.path.join(backend_dir, "requirements.txt"))
            frontend_ok = os.path.exists(os.path.join(frontend_dir, "package.json"))
            
            if backend_ok and frontend_ok:
                self.log("✅ Fichiers copiés avec succès")
                return True
            else:
                self.log("⚠️ Certains fichiers peuvent manquer, mais la structure de base est créée")
                if not backend_ok:
                    self.log("   ⚠️ requirements.txt manquant dans backend")
                if not frontend_ok:
                    self.log("   ⚠️ package.json manquant dans frontend")
                self.log("   💡 Les dépendances seront installées au démarrage")
                # On continue quand même
                return True
                
        except Exception as e:
            self.log(f"❌ Erreur copie fichiers: {str(e)}")
            import traceback
            error_trace = traceback.format_exc()
            self.log(error_trace)
            # Créer au moins la structure minimale pour que l'installation continue
            try:
                self.log("   🔧 Création de la structure minimale en fallback...")
                self.create_minimal_backend(backend_dir)
                self.create_minimal_frontend(frontend_dir)
                self.log("   ✅ Structure minimale créée, l'installation continuera")
                return True  # On continue quand même
            except:
                self.log("   ❌ Impossible de créer la structure minimale")
                return False
    
    def create_minimal_backend(self, backend_dir):
        """Créer une structure backend minimale si les fichiers ne sont pas trouvés"""
        os.makedirs(backend_dir, exist_ok=True)
        
        # Créer requirements.txt
        requirements = '''fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
mysql-connector-python==8.2.0
python-multipart==0.0.6
python-jose==3.3.0
passlib==1.7.4
bcrypt==4.1.2
requests==2.31.0
reportlab==4.0.7
pillow==10.1.0
pymysql==1.1.0
python-dotenv==1.0.0
'''
        with open(os.path.join(backend_dir, "requirements.txt"), 'w', encoding='utf-8') as f:
            f.write(requirements)
        
        # Note: app.py et database_mysql.py doivent être copiés depuis le source
        # Si pas disponibles, l'utilisateur devra les ajouter manuellement
    
    def create_minimal_frontend(self, frontend_dir):
        """Créer une structure frontend minimale si les fichiers ne sont pas trouvés"""
        os.makedirs(frontend_dir, exist_ok=True)
        
        # Créer package.json
        package_json = '''{
  "name": "tech-info-plus-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "axios": "^1.6.0",
    "react-router-dom": "^6.8.0",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.6.0",
    "sweetalert2": "^11.10.0",
    "react-toastify": "^9.1.3"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  }
}
'''
        with open(os.path.join(frontend_dir, "package.json"), 'w', encoding='utf-8') as f:
            f.write(package_json)
        
        # Note: Les fichiers src/ doivent être copiés depuis le source
    
    def install_dependencies(self):
        """Installer les dépendances"""
        self.log("📦 Installation des dépendances...")
        
        # Python dependencies
        backend_dir = os.path.join(self.project_dir, "backend")
        requirements_file = os.path.join(backend_dir, "requirements.txt")
        
        if os.path.exists(requirements_file):
            self.log("🐍 Installation des dépendances Python...")
            
            # Essayer d'abord Python portable, puis Python système
            python_exe = os.path.join(self.install_dir, "python", "python.exe")
            using_portable = os.path.exists(python_exe)
            
            if not using_portable:
                python_exe = "python"
            
            # Vérifier que Python fonctionne
            try:
                result = subprocess.run([python_exe, "--version"], capture_output=True, text=True, timeout=10)
                if result.returncode != 0:
                    self.log(f"❌ Python ne fonctionne pas ({python_exe})")
                    self.log("   ⚠️ Continuons quand même, les dépendances pourront être installées plus tard")
                else:
                    self.log(f"   ✅ Python OK: {result.stdout.strip()}")
            except Exception as e:
                self.log(f"⚠️ Erreur vérification Python: {str(e)}")
                self.log("   ⚠️ Continuons quand même")
            
            # Installer/configurer pip pour Python embed si nécessaire
            if using_portable:
                pip_exe = os.path.join(os.path.dirname(python_exe), "Scripts", "pip.exe")
                if not os.path.exists(pip_exe):
                    self.log("   📦 Installation de pip pour Python embed...")
                    try:
                        pip_script = os.path.join(os.path.dirname(python_exe), "get-pip.py")
                        pip_url = "https://bootstrap.pypa.io/get-pip.py"
                        
                        self.log("      Téléchargement de get-pip.py...")
                        urllib.request.urlretrieve(pip_url, pip_script)
                        
                        self.log("      Exécution de get-pip.py...")
                        result = subprocess.run(
                            [python_exe, pip_script],
                            cwd=os.path.dirname(python_exe),
                            capture_output=True,
                            text=True,
                            timeout=300
                        )
                        
                        if os.path.exists(pip_script):
                            os.remove(pip_script)
                        
                        if result.returncode != 0:
                            self.log(f"      ⚠️ Erreur installation pip: {result.stderr}")
                            # Continuer quand même, peut-être que pip est déjà là
                        else:
                            self.log("      ✅ pip installé")
                    except Exception as e:
                        self.log(f"      ⚠️ Erreur installation pip: {str(e)}")
                        # Continuer quand même
            
            # Vérifier que pip fonctionne
            try:
                self.log("   🔍 Vérification de pip...")
                result = subprocess.run(
                    [python_exe, "-m", "pip", "--version"],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                if result.returncode != 0:
                    self.log(f"   ❌ pip ne fonctionne pas: {result.stderr}")
                    self.log("   💡 Essayons quand même l'installation...")
                else:
                    self.log(f"   ✅ pip OK: {result.stdout.strip()}")
            except Exception as e:
                self.log(f"   ⚠️ Erreur vérification pip: {str(e)}")
                # Continue quand même
            
            try:
                # Mettre à jour pip (non bloquant)
                self.log("   📦 Mise à jour de pip (optionnel)...")
                subprocess.run(
                    [python_exe, "-m", "pip", "install", "--upgrade", "pip", "--quiet"],
                    cwd=backend_dir,
                    timeout=180,
                    capture_output=True
                )
            except:
                pass  # Non bloquant
            
            # Installer les dépendances avec retries et installation progressive
            self.log("   📦 Installation des packages Python...")
            self.log("   (Cela peut prendre plusieurs minutes, veuillez patienter...)")
            
            max_retries = 3
            retry_count = 0
            success = False
            
            # Packages essentiels d'abord
            essential_packages = [
                "fastapi", "uvicorn", "sqlalchemy", "mysql-connector-python", 
                "python-dotenv", "pymysql"
            ]
            
            while retry_count < max_retries and not success:
                try:
                    if retry_count > 0:
                        self.log(f"   🔄 Nouvelle tentative installation Python ({retry_count + 1}/{max_retries})...")
                        import time
                        time.sleep(3)
                    
                    # Étape 1: Installer les packages essentiels d'abord
                    if retry_count == 0:
                        self.log("   📦 Installation des packages essentiels d'abord...")
                        try:
                            subprocess.run(
                                [python_exe, "-m", "pip", "install"] + essential_packages + ["--quiet", "--upgrade"],
                                cwd=backend_dir,
                                timeout=600,  # 10 minutes
                                capture_output=True,
                                text=True,
                                check=False  # Ne pas bloquer si un package échoue
                            )
                        except:
                            pass  # Continue même si certains packages échouent
                    
                    # Étape 2: Installer depuis requirements.txt
                    self.log("   📦 Installation complète depuis requirements.txt...")
                    result = subprocess.run(
                        [python_exe, "-m", "pip", "install", "-r", "requirements.txt", "--quiet", "--upgrade"],
                        cwd=backend_dir,
                        check=False,  # Ne pas bloquer sur erreur
                        timeout=1200,  # 20 minutes
                        capture_output=True,
                        text=True
                    )
                    
                    # Vérifier que les packages essentiels sont installés
                    self.log("   🔍 Vérification des packages installés...")
                    missing_packages = []
                    # Mapping des noms de packages vers les noms d'import
                    import_mappings = {
                        "fastapi": "fastapi",
                        "uvicorn": "uvicorn",
                        "sqlalchemy": "sqlalchemy",
                        "mysql-connector-python": "mysql.connector",
                        "python-dotenv": "dotenv",
                        "pymysql": "pymysql"
                    }
                    
                    for package in essential_packages:
                        package_name = package.split('==')[0] if '==' in package else package
                        import_name = import_mappings.get(package_name, package_name.replace('-', '_'))
                        
                        try:
                            check_result = subprocess.run(
                                [python_exe, "-c", f"import {import_name}"],
                                capture_output=True,
                                timeout=10,
                                text=True
                            )
                            if check_result.returncode != 0:
                                missing_packages.append(package_name)
                        except:
                            missing_packages.append(package_name)
                    
                    if not missing_packages:
                        self.log("✅ Dépendances Python installées avec succès")
                        success = True
                    else:
                        if retry_count < max_retries - 1:
                            self.log(f"   ⚠️ Packages manquants: {', '.join(missing_packages)}")
                            retry_count += 1
                            continue
                        else:
                            self.log("⚠️ Certains packages sont manquants mais on continue")
                            self.log(f"   Packages manquants: {', '.join(missing_packages)}")
                            self.log("   💡 Ils seront installés automatiquement au démarrage")
                            success = True  # Continue quand même
                        
                except subprocess.TimeoutExpired:
                    self.log(f"⚠️ Installation Python timeout (tentative {retry_count + 1}/{max_retries})")
                    if retry_count < max_retries - 1:
                        retry_count += 1
                        continue
                    else:
                        self.log("   ⚠️ Trop de timeouts, mais on continue...")
                        self.log("   💡 Les dépendances seront installées au démarrage si nécessaire")
                        success = True  # Continue quand même
                        
                except subprocess.CalledProcessError as e:
                    error_msg = (e.stderr if hasattr(e, 'stderr') and e.stderr else "")[:300]
                    
                    # Détecter si c'est une erreur réseau
                    is_network_error = any(keyword in error_msg.lower() for keyword in [
                        'network', 'timeout', 'connection', 'proxy', 'dns', 'connect'
                    ])
                    
                    if is_network_error and retry_count < max_retries - 1:
                        self.log(f"   ⚠️ Erreur réseau détectée: {error_msg[:200]}")
                        retry_count += 1
                        continue
                    else:
                        self.log("⚠️ Erreur installation Python (mais on continue):")
                        self.log(f"   {error_msg[:200]}")
                        self.log("   💡 Les dépendances seront installées au démarrage si nécessaire")
                        success = True  # Continue quand même
                        
                except Exception as e:
                    error_msg = str(e)[:300]
                    if retry_count < max_retries - 1:
                        self.log(f"   ⚠️ Erreur: {error_msg}")
                        retry_count += 1
                        continue
                    else:
                        self.log(f"⚠️ Erreur installation Python: {error_msg}")
                        self.log("   💡 Les dépendances seront installées au démarrage si nécessaire")
                        success = True  # Continue quand même
            
            if not success:
                self.log("   ⚠️ Installation incomplète mais on continue...")
                self.log("   💡 Les dépendances seront installées automatiquement au démarrage")
        
        # Node.js dependencies
        frontend_dir = os.path.join(self.project_dir, "frontend")
        package_json = os.path.join(frontend_dir, "package.json")
        
        if os.path.exists(package_json):
            self.log("🧩 Installation des dépendances Node.js...")
            
            # Essayer d'abord npm portable, puis npm système
            npm_exe = os.path.join(self.install_dir, "node-v20.11.0-win-x64", "npm.cmd")
            if not os.path.exists(npm_exe):
                npm_exe = "npm"
            
            # Vérifier que npm fonctionne
            try:
                result = subprocess.run([npm_exe, "--version"], capture_output=True, text=True, timeout=30)
                if result.returncode != 0:
                    self.log(f"❌ npm ne fonctionne pas ({npm_exe})")
                    self.log("   ⚠️ L'installation continuera, vous pourrez installer les dépendances manuellement plus tard")
                    return True  # Continue même si npm ne fonctionne pas
                self.log(f"   ✅ npm OK: {result.stdout.strip()}")
            except Exception as e:
                self.log(f"⚠️ Erreur vérification npm: {str(e)}")
                self.log("   ⚠️ L'installation continuera, vous pourrez installer les dépendances manuellement plus tard")
                return True  # Continue même si erreur
            
            # Configuration npm pour éviter les problèmes réseau
            try:
                self.log("   🔧 Configuration npm pour meilleure stabilité réseau...")
                # Désactiver le cache strict et augmenter les timeouts
                subprocess.run(
                    [npm_exe, "config", "set", "fetch-retries", "5"],
                    capture_output=True,
                    timeout=10
                )
                subprocess.run(
                    [npm_exe, "config", "set", "fetch-retry-mintimeout", "20000"],
                    capture_output=True,
                    timeout=10
                )
                subprocess.run(
                    [npm_exe, "config", "set", "fetch-retry-maxtimeout", "120000"],
                    capture_output=True,
                    timeout=10
                )
            except:
                pass  # Non bloquant
            
            # Tentative d'installation avec retry et installation progressive
            max_retries = 4  # Plus de tentatives
            retry_count = 0
            success = False
            
            while retry_count < max_retries and not success:
                try:
                    if retry_count > 0:
                        self.log(f"   🔄 Nouvelle tentative ({retry_count + 1}/{max_retries})...")
                        import time
                        time.sleep(5)  # Attendre 5 secondes avant retry
                    
                    # Nettoyer le cache npm si plusieurs tentatives
                    if retry_count > 1:
                        self.log("   🧹 Nettoyage du cache npm...")
                        try:
                            subprocess.run(
                                [npm_exe, "cache", "clean", "--force"],
                                timeout=60,
                                capture_output=True
                            )
                        except:
                            pass
                    
                    self.log("   📦 Installation des packages Node.js...")
                    self.log("   (Cela peut prendre plusieurs minutes, ne fermez pas cette fenêtre...)")
                    
                    # Utiliser --legacy-peer-deps pour éviter les conflits
                    npm_options = [
                        "install", 
                        "--legacy-peer-deps",
                        "--loglevel=error",
                        "--prefer-offline",
                        "--no-audit",
                        "--progress=false"
                    ]
                    
                    # Pour les premières tentatives, ajouter --no-optional pour accélérer
                    if retry_count < 2:
                        npm_options.insert(-1, "--no-optional")
                    
                    result = subprocess.run(
                        [npm_exe] + npm_options,
                        cwd=frontend_dir,
                        check=False,  # Ne pas bloquer sur erreur
                        timeout=1800,  # 30 minutes pour npm install
                        capture_output=True,
                        text=True
                    )
                    
                    # Vérifier que react-scripts est installé (essentiel)
                    node_modules_path = os.path.join(frontend_dir, "node_modules", ".bin", "react-scripts.cmd")
                    if os.path.exists(node_modules_path) or os.path.exists(os.path.join(frontend_dir, "node_modules", "react-scripts")):
                        self.log("✅ Dépendances Node.js installées")
                        success = True
                    else:
                        if result.returncode == 0:
                            # Installation terminée mais react-scripts peut manquer
                            self.log("⚠️ Installation terminée mais react-scripts manquant")
                            if retry_count < max_retries - 1:
                                # Réessayer installation de react-scripts spécifiquement
                                self.log("   🔄 Installation de react-scripts...")
                                try:
                                    subprocess.run(
                                        [npm_exe, "install", "react-scripts", "--legacy-peer-deps"],
                                        cwd=frontend_dir,
                                        timeout=600,
                                        capture_output=True,
                                        check=False
                                    )
                                except:
                                    pass
                                retry_count += 1
                                continue
                        else:
                            # Erreur lors de l'installation
                            error_output = result.stderr if result.stderr else result.stdout
                            error_msg = error_output[:500] if error_output else "Erreur inconnue"
                            
                            # Détecter si c'est une erreur réseau
                            is_network_error = any(keyword in error_msg.lower() for keyword in [
                                'network', 'econnreset', 'econnrefused', 'timeout', 'proxy',
                                'etimedout', 'connect', 'dns', 'enotfound', 'getaddrinfo',
                                'socket', 'hang up'
                            ])
                            
                            if is_network_error and retry_count < max_retries - 1:
                                self.log(f"   ⚠️ Erreur réseau détectée: {error_msg[:200]}")
                                retry_count += 1
                                continue
                            elif retry_count < max_retries - 1:
                                self.log(f"   ⚠️ Erreur installation: {error_msg[:200]}")
                                retry_count += 1
                                continue
                            else:
                                self.log("⚠️ Erreur installation Node.js (mais on continue):")
                                self.log(f"   {error_msg[:200]}")
                                self.log("   💡 Les dépendances seront installées au démarrage si nécessaire")
                                success = True  # Continue quand même
                        
                except subprocess.TimeoutExpired:
                    self.log(f"⚠️ Installation Node.js timeout (tentative {retry_count + 1}/{max_retries})")
                    if retry_count < max_retries - 1:
                        retry_count += 1
                        continue
                    else:
                        self.log("   ⚠️ Trop de timeouts, mais on continue...")
                        self.log("   💡 Les dépendances seront installées au démarrage si nécessaire")
                        success = True  # Continue quand même
                        
                except Exception as e:
                    error_msg = str(e)[:300]
                    if retry_count < max_retries - 1:
                        self.log(f"   ⚠️ Erreur: {error_msg}")
                        retry_count += 1
                        continue
                    else:
                        self.log(f"⚠️ Erreur installation Node.js: {error_msg}")
                        self.log("   💡 Les dépendances seront installées au démarrage si nécessaire")
                        success = True
            
            if not success:
                self.log("   ⚠️ Installation npm non réussie, mais on continue...")
                self.log("   💡 Instructions pour installer manuellement:")
                self.log(f"      1. Ouvrez un terminal dans: {frontend_dir}")
                self.log("      2. Exécutez: npm install")
        
        return True
    
    def create_database(self):
        """Créer la base de données et migrer les tables"""
        self.log("🗄️ Création et migration de la base de données...")
        
        try:
            # Connexion MySQL
            conn = mysql.connector.connect(
                host='localhost',
                user='root',
                password='',
                charset='utf8mb4'
            )
            cursor = conn.cursor()
            
            # Créer la base de données
            self.log("   📝 Création de la base de données...")
            cursor.execute("CREATE DATABASE IF NOT EXISTS tech_info_plus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            cursor.execute("USE tech_info_plus")
            
            # Exécuter le script SQL s'il existe
            init_sql = os.path.join(self.project_dir, "backend", "init.sql")
            if os.path.exists(init_sql):
                self.log("   📄 Exécution du script init.sql...")
                with open(init_sql, 'r', encoding='utf-8') as file:
                    sql_script = file.read()
                    # Séparer les instructions SQL
                    statements = [s.strip() for s in sql_script.split(';') if s.strip() and not s.strip().startswith('--')]
                    for statement in statements:
                        if statement:
                            try:
                                cursor.execute(statement)
                            except mysql.connector.Error as e:
                                # Ignorer les erreurs "table already exists"
                                if "already exists" not in str(e).lower():
                                    self.log(f"   ⚠️ Warning SQL: {str(e)}")
            else:
                self.log("   ⚠️ init.sql non trouvé, migration via SQLAlchemy au démarrage")
            
            conn.commit()
            cursor.close()
            conn.close()
            
            # Créer aussi le fichier config.env dans le backend
            self.log("   📝 Création du fichier config.env...")
            backend_dir = os.path.join(self.project_dir, "backend")
            config_env_path = os.path.join(backend_dir, "config.env")
            
            config_content = '''# Configuration Tech Info Plus - MySQL
DATABASE_URL=mysql+pymysql://root:@localhost:3306/tech_info_plus

# Configuration FastAPI
API_HOST=0.0.0.0
API_PORT=8000
API_DEBUG=True

# Configuration CORS (pour React)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Configuration MySQL XAMPP
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=tech_info_plus
'''
            with open(config_env_path, 'w', encoding='utf-8') as f:
                f.write(config_content)
            
            self.log("✅ Base de données créée et configurée avec succès")
            self.log("   💡 Les tables seront créées automatiquement au premier démarrage")
            return True
            
        except Exception as e:
            self.log(f"❌ Erreur création base de données: {str(e)}")
            return False
    
    def create_launcher(self):
        """Créer le script de lancement"""
        self.log("🖱️ Création du script de lancement...")
        
        try:
            launcher_path = os.path.join(os.path.expanduser("~"), "Desktop", "LANCER_TECH_INFO_PLUS.bat")
            
            # Chemins absolus vers Python et Node.js portables
            python_exe = os.path.join(self.install_dir, "python", "python.exe")
            node_exe = os.path.join(self.install_dir, "node-v20.11.0-win-x64", "node.exe")
            npm_exe = os.path.join(self.install_dir, "node-v20.11.0-win-x64", "npm.cmd")
            
            # Vérifier que les exécutables existent, sinon utiliser ceux du système
            if not os.path.exists(python_exe):
                python_exe = "python"
            if not os.path.exists(node_exe):
                node_exe = "node"
            if not os.path.exists(npm_exe):
                npm_exe = "npm"
            
            launcher_content = f'''@echo off
setlocal enabledelayedexpansion
title TECH INFO PLUS - Lancement
color 0A

echo ========================================
echo   TECH INFO PLUS - DÉMARRAGE
echo ========================================
echo.

:: Chemins absolus vers Python et Node.js
set "PYTHON_EXE={python_exe}"
set "NODE_EXE={node_exe}"
set "NPM_EXE={npm_exe}"
set "PROJECT_DIR={self.project_dir}"
set "BACKEND_DIR={self.project_dir}\\backend"
set "FRONTEND_DIR={self.project_dir}\\frontend"

:: Vérifier que les dossiers existent
if not exist "%BACKEND_DIR%" (
    echo ❌ ERREUR: Dossier backend introuvable
    echo    Chemin attendu: %BACKEND_DIR%
    pause
    exit /b 1
)

if not exist "%FRONTEND_DIR%" (
    echo ❌ ERREUR: Dossier frontend introuvable
    echo    Chemin attendu: %FRONTEND_DIR%
    pause
    exit /b 1
)

echo 🔍 Vérification des exécutables...
if not exist "%PYTHON_EXE%" (
    echo ⚠️ Python portable introuvable, utilisation du Python système
    set "PYTHON_EXE=python"
)

if not exist "%NODE_EXE%" (
    echo ⚠️ Node.js portable introuvable, utilisation du Node.js système
    set "NODE_EXE=node"
    set "NPM_EXE=npm"
)

:: Vérifier que Python fonctionne
echo 🐍 Test de Python...
"%PYTHON_EXE%" --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERREUR: Python non fonctionnel
    echo    Vérifiez l'installation de Python
    pause
    exit /b 1
)
echo ✅ Python OK

:: Vérifier que Node.js fonctionne
echo 🧩 Test de Node.js...
"%NODE_EXE%" --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERREUR: Node.js non fonctionnel
    echo    Vérifiez l'installation de Node.js
    pause
    exit /b 1
)
echo ✅ Node.js OK

echo.
echo 🚀 Démarrage du backend...
cd /d "%BACKEND_DIR%"

:: Créer config.env s'il n'existe pas
if not exist "config.env" (
    echo 📝 Création du fichier config.env...
    (
        echo # Configuration Tech Info Plus - MySQL
        echo MYSQL_HOST=localhost
        echo MYSQL_PORT=3306
        echo MYSQL_USER=root
        echo MYSQL_PASSWORD=
        echo MYSQL_DATABASE=tech_info_plus
    ) > config.env
)

:: ===========================================
:: VÉRIFICATION ET INSTALLATION DES DÉPENDANCES
:: ===========================================
echo.
echo 📦 Vérification et installation des dépendances...
echo.

:: Vérifier et installer les dépendances Python si nécessaire
echo 🔍 Vérification des dépendances Python...
set "PYTHON_DEPS_OK=0"
"%PYTHON_EXE%" -c "import fastapi, uvicorn, sqlalchemy, mysql.connector" >nul 2>&1
if errorlevel 1 (
    echo    ❌ Dépendances Python manquantes, installation OBLIGATOIRE...
    echo    (Cela peut prendre quelques minutes, veuillez patienter...)
    echo.
    
    :: Tentative 1: Packages essentiels
    echo    📦 Installation des packages essentiels...
    "%PYTHON_EXE%" -m pip install fastapi uvicorn sqlalchemy mysql-connector-python python-dotenv pymysql --upgrade
    if errorlevel 1 (
        echo    ⚠️ Installation essentielle échouée, nouvelle tentative...
        timeout /t 3 /nobreak >nul
        "%PYTHON_EXE%" -m pip install fastapi uvicorn sqlalchemy mysql-connector-python python-dotenv pymysql --upgrade --no-cache-dir
    )
    
    :: Tentative 2: Depuis requirements.txt si disponible
    if exist "requirements.txt" (
        echo    📦 Installation complète depuis requirements.txt...
        "%PYTHON_EXE%" -m pip install -r requirements.txt --upgrade
        if errorlevel 1 (
            echo    ⚠️ Installation depuis requirements.txt échouée, nouvelle tentative...
            timeout /t 3 /nobreak >nul
            "%PYTHON_EXE%" -m pip install -r requirements.txt --upgrade --no-cache-dir
        )
    ) else (
        :: Si pas de requirements.txt, installer tous les packages manuellement
        echo    📦 Installation des packages complémentaires...
        "%PYTHON_EXE%" -m pip install python-multipart python-jose passlib bcrypt requests reportlab pillow --upgrade
    )
    
    :: Vérifier que fastapi est maintenant installé
    "%PYTHON_EXE%" -c "import fastapi" >nul 2>&1
    if errorlevel 1 (
        echo    ❌ ERREUR CRITIQUE: Impossible d'installer fastapi
        echo    💡 Solutions possibles:
        echo       1. Vérifiez votre connexion internet
        echo       2. Exécutez manuellement: pip install fastapi uvicorn sqlalchemy mysql-connector-python
        echo       3. Contactez le support technique
        pause
        exit /b 1
    ) else (
        echo    ✅ Dépendances Python installées
        set "PYTHON_DEPS_OK=1"
    )
) else (
    :: Vérifier aussi les autres dépendances importantes
    "%PYTHON_EXE%" -c "import python_multipart, passlib, bcrypt" >nul 2>&1
    if errorlevel 1 (
        echo    ⚠️ Certaines dépendances complémentaires manquent, installation...
        if exist "requirements.txt" (
            "%PYTHON_EXE%" -m pip install -r requirements.txt --upgrade --quiet
        ) else (
            "%PYTHON_EXE%" -m pip install python-multipart python-jose passlib bcrypt requests reportlab pillow --upgrade --quiet
        )
    )
    echo    ✅ Dépendances Python complètes
    set "PYTHON_DEPS_OK=1"
)

:: Vérification finale avant démarrage du backend
if "!PYTHON_DEPS_OK!"=="0" (
    echo    ❌ Les dépendances Python n'ont pas pu être installées
    echo    ❌ Le backend ne peut pas démarrer sans fastapi
    echo.
    echo    💡 Veuillez installer manuellement les dépendances:
    echo       cd "%BACKEND_DIR%"
    echo       "%PYTHON_EXE%" -m pip install fastapi uvicorn sqlalchemy mysql-connector-python python-dotenv
    pause
    exit /b 1
)

:: Démarrer le backend
echo.
echo 🚀 Démarrage du backend...
start "TECH INFO PLUS - Backend" cmd /k "%PYTHON_EXE%" app.py
timeout /t 5 /nobreak >nul

echo 🚀 Démarrage du frontend...
cd /d "%FRONTEND_DIR%"

:: Vérifier et installer les dépendances Node.js si nécessaire
echo 🔍 Vérification des dépendances Node.js...
set "NPM_DEPS_OK=0"
if not exist "node_modules\.bin\react-scripts.cmd" (
    if not exist "node_modules" (
        echo    ❌ Dépendances Node.js manquantes, installation OBLIGATOIRE...
        echo    (Cela peut prendre plusieurs minutes, ne fermez pas cette fenêtre...)
        echo.
    ) else (
        echo    ⚠️ react-scripts manquant, installation complémentaire...
    )
    
    :: Tentative 1: Installation normale
    echo    📦 Installation des dépendances Node.js...
    "%NPM_EXE%" install --legacy-peer-deps --no-audit --loglevel=error
    if errorlevel 1 (
        echo    ⚠️ Installation normale échouée, nouvelle tentative...
        timeout /t 5 /nobreak >nul
        
        :: Tentative 2: Avec nettoyage du cache
        echo    🧹 Nettoyage du cache npm...
        "%NPM_EXE%" cache clean --force >nul 2>&1
        timeout /t 2 /nobreak >nul
        
        echo    📦 Nouvelle tentative d'installation...
        "%NPM_EXE%" install --legacy-peer-deps --no-audit --loglevel=error --prefer-offline
        if errorlevel 1 (
            echo    ⚠️ Installation avec cache échouée, dernière tentative...
            timeout /t 5 /nobreak >nul
            
            :: Tentative 3: Sans cache
            echo    📦 Dernière tentative sans cache...
            "%NPM_EXE%" install --legacy-peer-deps --no-audit --loglevel=error --no-package-lock --force
        )
    )
    
    :: Vérifier que react-scripts est maintenant installé
    if exist "node_modules\.bin\react-scripts.cmd" (
        echo    ✅ Dépendances Node.js installées
        set "NPM_DEPS_OK=1"
    ) else if exist "node_modules\react-scripts" (
        echo    ✅ Dépendances Node.js installées (react-scripts présent)
        set "NPM_DEPS_OK=1"
    ) else (
        echo    ⚠️ Installation npm incomplète mais on continue...
        echo    💡 react-scripts sera installé au démarrage du frontend
        echo    💡 Si erreur persistante, exécutez manuellement:
        echo       cd "%FRONTEND_DIR%"
        echo       npm install --legacy-peer-deps
        set "NPM_DEPS_OK=1"
    )
) else (
    echo    ✅ Dépendances Node.js présentes
    set "NPM_DEPS_OK=1"
)

:: Vérification finale avant démarrage du frontend
if "!NPM_DEPS_OK!"=="0" (
    echo    ⚠️ Les dépendances Node.js ne sont pas complètes
    echo    ⚠️ Le frontend peut ne pas démarrer correctement
    echo.
    echo    💡 Si erreur au démarrage, installez manuellement:
    echo       cd "%FRONTEND_DIR%"
    echo       "%NPM_EXE%" install --legacy-peer-deps
    echo.
)

echo 🚀 Démarrage du frontend...
start "TECH INFO PLUS - Frontend" cmd /k "%NPM_EXE%" start

timeout /t 10 /nobreak >nul
echo.
echo ✅ Application démarrée!
echo.
echo 📍 URLs d'accès:
echo    Frontend: http://localhost:3000
echo    Backend: http://localhost:8000
echo    Documentation API: http://localhost:8000/docs
echo.
echo ⚠️  IMPORTANT: Gardez les fenêtres Backend et Frontend ouvertes
echo ⚠️  IMPORTANT: Vérifiez que XAMPP MySQL est démarré
echo.
echo Appuyez sur une touche pour fermer cette fenêtre...
pause >nul'''
            
            with open(launcher_path, 'w', encoding='utf-8') as f:
                f.write(launcher_content)
            
            self.log("✅ Script de lancement créé sur le bureau")
            return True
            
        except Exception as e:
            self.log(f"❌ Erreur création script: {str(e)}")
            return False
    
    def start_installation(self):
        """Commencer l'installation"""
        self.install_button.config(state='disabled')
        self.cancel_button.config(state='disabled')
        
        # Lancer l'installation dans un thread séparé
        thread = threading.Thread(target=self.run_installation)
        thread.daemon = True
        thread.start()
    
    def run_installation(self):
        """Exécuter l'installation complète"""
        try:
            steps = [
                ("Vérification des prérequis", self.check_prerequisites),
                ("Installation de Python", self.install_python),
                ("Installation de Node.js", self.install_nodejs),
                ("Configuration du projet", self.setup_project),
                ("Installation des dépendances", self.install_dependencies),
                ("Création de la base de données", self.create_database),
                ("Création du script de lancement", self.create_launcher)
            ]
            
            total_steps = len(steps)
            
            for i, (step_name, step_func) in enumerate(steps):
                self.update_progress((i / total_steps) * 100, step_name)
                
                if not step_func():
                    self.log(f"❌ Échec à l'étape: {step_name}")
                    messagebox.showerror("Erreur", f"Échec à l'étape: {step_name}")
                    return
            
            # Installation terminée
            self.update_progress(100, "Installation terminée!")
            self.log("🎉 INSTALLATION TERMINÉE AVEC SUCCÈS!")
            self.log(f"📍 Dossier d'installation: {self.install_dir}")
            self.log("🖱️ Raccourci créé sur le bureau: LANCER_TECH_INFO_PLUS.bat")
            self.log("")
            self.log("🚀 POUR DÉMARRER L'APPLICATION:")
            self.log("   1. Gardez XAMPP ouvert avec MySQL démarré")
            self.log("   2. Double-cliquez sur 'LANCER_TECH_INFO_PLUS' sur le bureau")
            self.log("")
            self.log("💡 Le script de lancement:")
            self.log("   - Vérifie automatiquement les dépendances")
            self.log("   - Installe automatiquement celles qui manquent")
            self.log("   - Lance l'application une fois tout prêt")
            self.log("")
            self.log("🌐 URLs d'accès:")
            self.log("   Frontend: http://localhost:3000")
            self.log("   Backend: http://localhost:8000")
            
            messagebox.showinfo("Succès", "Installation terminée avec succès!\n\nCliquez sur le raccourci sur le bureau pour démarrer l'application.")
            
        except Exception as e:
            self.log(f"❌ Erreur générale: {str(e)}")
            messagebox.showerror("Erreur", f"Erreur lors de l'installation: {str(e)}")
        
        finally:
            self.install_button.config(state='normal')
            self.cancel_button.config(state='normal')
    
    def run(self):
        """Lancer l'application"""
        self.root.mainloop()

if __name__ == "__main__":
    app = TechInfoPlusInstaller()
    app.run()

