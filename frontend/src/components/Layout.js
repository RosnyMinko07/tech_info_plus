import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaHome, FaUsers, FaIndustry, FaBox, FaFileInvoice, FaFileAlt,
  FaDollarSign, FaUndo, FaShoppingCart, FaCubes, FaClipboardList,
  FaUserCog, FaBug, FaChartBar, FaCog, FaSignOutAlt, FaBars, FaTimes, FaMoon, FaSun
} from 'react-icons/fa';
import '../styles/Layout.css';
import { useTheme } from '../context/ThemeContext';
import { confirmLogout } from '../utils/sweetAlertHelper';
import api from '../services/api';

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [bugsOuverts, setBugsOuverts] = useState(0);
  const { theme, toggleTheme, isDark } = useTheme();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  // Charger le nombre de bugs ouverts pour l'admin
  useEffect(() => {
    const loadBugsOuverts = async () => {
      if (!user || user.role !== 'ADMIN') return;
      
      try {
        const { data } = await api.get('/api/bugs/stats');
        setBugsOuverts(data.ouverts || 0);
      } catch (error) {
        console.error('Erreur chargement stats bugs:', error);
      }
    };

    loadBugsOuverts();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadBugsOuverts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    const confirmed = await confirmLogout();
    if (confirmed) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success('✅ Déconnexion réussie');
      navigate('/login');
    }
  };

  // Menu items avec droits d'accès
  const menuItems = [
    { path: '/dashboard', icon: <FaHome />, label: 'Accueil', right: 'gestion_rapports' },
    { path: '/clients', icon: <FaUsers />, label: 'Clients', right: 'gestion_clients' },
    { path: '/fournisseurs', icon: <FaIndustry />, label: 'Fournisseurs', right: 'gestion_produits' },
    { path: '/articles', icon: <FaBox />, label: 'Articles', right: 'gestion_produits' },
    { path: '/devis', icon: <FaFileAlt />, label: 'Devis', right: 'gestion_devis' },
    { path: '/facturation', icon: <FaFileInvoice />, label: 'Facturation', right: 'gestion_factures' },
    { path: '/reglements', icon: <FaDollarSign />, label: 'Règlements', right: 'gestion_reglements' },
    // { path: '/avoirs', icon: <FaUndo />, label: 'Avoirs', right: 'gestion_avoirs' }, // 🔒 Désactivé temporairement
    { path: '/comptoir', icon: <FaShoppingCart />, label: 'Comptoir', right: 'gestion_comptoir' },
    { path: '/stock', icon: <FaCubes />, label: 'Stock', right: 'gestion_stock' },
    { path: '/inventaire', icon: <FaClipboardList />, label: 'Inventaire', right: 'gestion_stock' },
    { separator: true },
    { path: '/utilisateurs', icon: <FaUserCog />, label: 'Utilisateurs', right: null },
    { path: '/rapports', icon: <FaChartBar />, label: 'Rapports', right: 'gestion_rapports' },
    { path: '/signaler-bug', icon: <FaBug />, label: 'Signaler Bug', right: null },
    { path: '/bugs', icon: <FaBug />, label: 'Gestion Bugs', right: 'gestion_utilisateurs' },
    { path: '/configuration', icon: <FaCog />, label: 'Configuration', right: 'gestion_utilisateurs' },
  ];

  // Filtrer les menus selon les droits de l'utilisateur
  const verifierDroit = (droit_requis) => {
    // Si pas de droit requis (null), autoriser l'accès
    if (droit_requis === null) return true;
    
    // Si pas d'utilisateur connecté, refuser
    if (!user) return false;
    
    // Si ADMIN, autoriser tout
    if (user.role === 'ADMIN') return true;
    
    // Si droits === "TOUS" ou "tous", autoriser tout
    if (user.droits === 'TOUS' || user.droits === 'tous') return true;
    
    // Vérifier les droits spécifiques
    try {
      // Si pas de droits définis, refuser
      if (!user.droits) return false;
      
      // Essayer de parser en JSON
      const droitsObj = typeof user.droits === 'string' ? JSON.parse(user.droits) : user.droits;
      
      // Si droitsObj est null ou undefined, refuser
      if (!droitsObj) return false;
      
      // Vérifier si le droit existe et est true
      return droitsObj[droit_requis] === true;
    } catch (error) {
      // Si erreur de parsing, peut-être format texte simple
      console.warn('Erreur parsing droits:', error, 'Droits:', user.droits);
      return false;
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (item.separator) return true;
    return verifierDroit(item.right);
  });

  const isActive = (path) => location.pathname === path;

  // Fermer le menu au clic en dehors sur mobile
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (window.innerWidth <= 768 && !collapsed) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && !sidebar.contains(e.target)) {
          setCollapsed(true);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [collapsed]);

  return (
    <div className="layout">
      {/* Overlay pour mobile */}
      {window.innerWidth <= 768 && !collapsed && (
        <div 
          className="sidebar-overlay"
          onClick={() => setCollapsed(true)}
        />
      )}
      
      {/* Menu latéral */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        {/* Boutons de contrôle */}
        <div className="sidebar-controls">
          <button 
            className="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Agrandir le menu" : "Réduire le menu"}
          >
            {collapsed ? <FaBars /> : <FaTimes />}
          </button>
          
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            title={isDark ? "Passer au thème clair" : "Passer au thème sombre"}
          >
            {isDark ? <FaSun /> : <FaMoon />}
          </button>
        </div>

        {/* Header du menu */}
        <div className="sidebar-header">
          <div className="logo">
            <h1>Tech Info Plus</h1>
            <p>Système de Facturation</p>
          </div>
          
          {/* Info utilisateur */}
          {user && (
            <div className="user-info">
              <div className="user-avatar">
                <FaUserCog />
              </div>
              <div className="user-details">
                <span className="user-name">{user.nom_utilisateur}</span>
                <span className="user-role">{user.role}</span>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                <FaSignOutAlt />
              </button>
            </div>
          )}
          
          <div className="separator"></div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {filteredMenuItems.map((item, index) => {
            if (item.separator) {
              return <div key={`sep-${index}`} className="menu-separator"></div>;
            }

            return (
              <button
                key={item.path}
                className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>
                {/* Badge de notification pour Gestion Bugs */}
                {item.path === '/bugs' && bugsOuverts > 0 && (
                  <span className="notification-badge">{bugsOuverts}</span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Zone de contenu */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;