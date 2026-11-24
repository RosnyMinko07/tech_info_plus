import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaBuilding, FaEnvelope, FaPhone } from 'react-icons/fa';
import { authService } from '../services/api';
import '../styles/Login.css';

function Inscription() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom_entreprise: '',
    nom_utilisateur: '',
    email: '',
    telephone: '',
    mot_de_passe: '',
    confirmation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { nom_entreprise, nom_utilisateur, email, mot_de_passe, confirmation } = formData;
    if (!nom_entreprise || !nom_utilisateur || !email || !mot_de_passe) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (mot_de_passe.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (mot_de_passe !== confirmation) {
      toast.error('Les deux mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      const { confirmation: _ignore, ...payload } = formData;
      if (!payload.telephone) delete payload.telephone;
      const response = await authService.inscription(payload);

      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.utilisateur));

      toast.success('Votre entreprise est créée ! Bienvenue 🎉');
      setTimeout(() => navigate('/configuration'), 800);
    } catch (error) {
      if (error.code === 'ERR_NETWORK') {
        toast.error('Impossible de joindre le serveur');
      } else {
        toast.error(error.response?.data?.detail || "Erreur lors de l'inscription");
      }
    } finally {
      setLoading(false);
    }
  };

  const champ = (name, Icon, placeholder, type = 'text', autoComplete = 'off') => (
    <div className="input-container">
      <Icon className="input-icon" />
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={formData[name]}
        onChange={handleChange}
        className="login-input"
        autoComplete={autoComplete}
      />
    </div>
  );

  return (
    <div className="login-container">
      <ToastContainer position="top-right" autoClose={4000} theme="colored" style={{ zIndex: 99999 }} />

      <div className="login-box">
        <h1 className="login-title">Créer mon entreprise</h1>
        <p className="login-subtitle">Essai gratuit, sans engagement</p>

        <form onSubmit={handleSubmit} className="login-form">
          {champ('nom_entreprise', FaBuilding, "Nom de l'entreprise *", 'text', 'organization')}
          {champ('nom_utilisateur', FaUser, 'Identifiant de connexion *', 'text', 'username')}
          {champ('email', FaEnvelope, 'Email *', 'email', 'email')}
          {champ('telephone', FaPhone, 'Téléphone (optionnel)', 'tel', 'tel')}

          <div className="input-container">
            <FaLock className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="mot_de_passe"
              placeholder="Mot de passe (8 caractères min.) *"
              value={formData.mot_de_passe}
              onChange={handleChange}
              className="login-input"
              autoComplete="new-password"
            />
            <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {champ('confirmation', FaLock, 'Confirmer le mot de passe *', showPassword ? 'text' : 'password', 'new-password')}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'CRÉATION...' : 'CRÉER MON COMPTE'}
          </button>
        </form>

        <p style={{ marginTop: 16, textAlign: 'center' }}>
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

export default Inscription;
