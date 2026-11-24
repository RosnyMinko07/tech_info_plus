import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { authService } from '../services/api';
import '../styles/Login.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom_utilisateur: '',
    mot_de_passe: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nom_utilisateur || !formData.mot_de_passe) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(formData);
      
      // Sauvegarder le token et les infos utilisateur
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.utilisateur));
      
      if (rememberMe) {
        localStorage.setItem('remember_email', formData.nom_utilisateur);
      }
      
      toast.success(`Bienvenue ${response.data.utilisateur.nom_utilisateur} !`);
      
      // Rediriger selon les droits de l'utilisateur
      setTimeout(() => {
        const user = response.data.utilisateur;
        
        // Parser les droits (peut être une chaîne JSON ou déjà un objet)
        let droits = {};
        if (user.droits) {
          // Cas spécial : Admin avec droits = "TOUS"
          if (user.droits === 'TOUS' || user.role === 'ADMIN') {
            droits = {
              gestion_clients: true,
              gestion_produits: true,
              gestion_devis: true,
              gestion_factures: true,
              gestion_reglements: true,
              gestion_avoirs: true,
              gestion_comptoir: true,
              gestion_stock: true,
              gestion_rapports: true,
              gestion_utilisateurs: true
            };
          } else {
            try {
              droits = typeof user.droits === 'string' ? JSON.parse(user.droits) : user.droits;
            } catch (e) {
              console.error('Erreur parsing droits:', e);
              droits = {};
            }
          }
        }
        
        console.log('🔑 Droits de l\'utilisateur:', droits);
        
        // Ordre de priorité des pages
        // Dashboard en priorité pour admin/gestionnaires, Comptoir pour vendeurs
        if (droits.gestion_rapports) {
          console.log('→ Redirection vers /dashboard (Accueil)');
          navigate('/dashboard');
        } else if (droits.gestion_comptoir) {
          console.log('→ Redirection vers /comptoir');
          navigate('/comptoir');
        } else if (droits.gestion_factures) {
          console.log('→ Redirection vers /facturation');
          navigate('/facturation');
        } else if (droits.gestion_clients) {
          console.log('→ Redirection vers /clients');
          navigate('/clients');
        } else if (droits.gestion_produits) {
          console.log('→ Redirection vers /articles');
          navigate('/articles');
        } else if (droits.gestion_stock) {
          console.log('→ Redirection vers /stock');
          navigate('/stock');
        } else {
          console.log('→ Redirection vers /signaler-bug (aucun droit)');
          navigate('/signaler-bug');
        }
      }, 500);
      
    } catch (error) {
      console.error('🔴 Erreur de connexion:', error);
      console.log('🔴 Status:', error.response?.status);
      console.log('🔴 Data:', error.response?.data);
      
      // Messages d'erreur précis selon le status HTTP
      if (error.response?.status === 401) {
        const detail = error.response?.data?.detail || 'Identifiants incorrects';
        console.log('🔴 Affichage toast erreur 401:', detail);
        
        // TEMPORAIRE : Alert pour tester
        alert('❌ ' + detail);
        
        // Afficher le toast aussi
        toast.error('❌ ' + detail, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else if (error.response?.status === 500) {
        console.log('🔴 Affichage toast erreur 500');
        toast.error('❌ Erreur serveur. Contactez l\'administrateur');
      } else if (error.code === 'ERR_NETWORK') {
        console.log('🔴 Affichage toast erreur réseau');
        toast.error('❌ Impossible de se connecter au serveur');
      } else {
        console.log('🔴 Affichage toast erreur générique');
        toast.error(error.response?.data?.detail || '❌ Identifiants incorrects');
      }
    } finally {
      setLoading(false);
    }
  };

  // Charger l'email mémorisé seulement
  React.useEffect(() => {
    // Charger l'email mémorisé
    const savedEmail = localStorage.getItem('remember_email');
    if (savedEmail) {
      setFormData({ ...formData, nom_utilisateur: savedEmail });
      setRememberMe(true);
    }
  }, []); // eslint-disable-line

  return (
    <div className="login-container">
      {/* ToastContainer pour afficher les notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
        style={{ zIndex: 99999 }}
      />
      
      <div className="login-box">
        {/* Logo de l'entreprise */}
        <div className="login-icon">
          <img 
            src="/logo.png" 
            alt="Tech Info Plus" 
            className="logo-icon"
            onError={(e) => {
              // Si le logo n'est pas trouvé, afficher l'icône utilisateur par défaut
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <FaUser className="user-icon" style={{ display: 'none' }} />
        </div>

        {/* Titre */}
        <h1 className="login-title">Tech Info Plus</h1>
        <p className="login-subtitle">Système de Facturation</p>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Champ email */}
          <div className="input-container">
            <FaUser className="input-icon" />
            <input
              type="text"
              name="nom_utilisateur"
              placeholder="Identifiant email"
              value={formData.nom_utilisateur}
              onChange={handleChange}
              className="login-input"
              autoComplete="username"
            />
          </div>

          {/* Champ mot de passe */}
          <div className="input-container">
            <FaLock className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="mot_de_passe"
              placeholder="Mot de passe"
              value={formData.mot_de_passe}
              onChange={handleChange}
              className="login-input"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Options */}
          <div className="login-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Se souvenir de moi</span>
            </label>
            
            <button
              type="button"
              className="forgot-password"
              onClick={() => toast.info('Contactez votre administrateur')}
            >
              Mot de passe oublié ?
            </button>
          </div>

          {/* Bouton de connexion */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'CONNEXION...' : 'CONNEXION'}
          </button>
        </form>

        <p style={{ marginTop: 16, textAlign: 'center' }}>
          Pas encore de compte ? <Link to="/inscription">Créer mon entreprise</Link>
        </p>
      </div>

      {/* Footer */}
      <footer className="login-footer">
        <p>&copy; {new Date().getFullYear()} Tech Info Plus. Tous droits réservés.</p>
        <p className="footer-version">Version 1.0.0</p>
      </footer>
    </div>
  );
}

export default Login;
