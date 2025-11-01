import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaBug, FaPaperPlane, FaEraser } from 'react-icons/fa';
import api from '../services/api';
import '../styles/SignalerBug.css';

// Utiliser l'instance API (URL dynamique)

function SignalerBug() {
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    priorite: 'MOYENNE'
  });
  const [loading, setLoading] = useState(false);
  const [entreprise, setEntreprise] = useState(null);

  // Charger les infos de l'entreprise au montage
  useEffect(() => {
    loadEntrepriseConfig();
  }, []);

  const loadEntrepriseConfig = async () => {
    try {
      const response = await api.get('/api/entreprise/config');
      setEntreprise(response.data);
    } catch (error) {
      console.error('Erreur chargement config:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.titre.trim()) {
      toast.error('Veuillez saisir un titre pour le problème');
      return;
    }

    if (!formData.description.trim() || formData.description.length < 20) {
      toast.error('Veuillez fournir une description détaillée (au moins 20 caractères)');
      return;
    }

    try {
      setLoading(true);
      console.log('🐛 Envoi du signalement...');
      console.log('Données:', formData);
      const response = await api.post('/api/bugs', formData);

      console.log('✅ Réponse reçue:', response.data);

      // Notification de succès avec ID
      toast.success(
        `✅ Signalement Envoyé ! ID: #${response.data.id_signalement}`,
        { autoClose: 4000 }
      );

      // Réinitialiser le formulaire
      handleReset();
    } catch (error) {
      console.error('❌ Erreur envoi signalement:', error);
      console.error('Détails erreur:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      // Message d'erreur plus détaillé
      const errorMessage = error.response?.data?.detail 
        || error.response?.data?.message 
        || error.message 
        || 'Erreur inconnue';
      
      toast.error(
        `❌ Erreur : ${errorMessage}`,
        { autoClose: 6000 }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      titre: '',
      description: '',
      priorite: 'MOYENNE'
    });
  };

  return (
    <div className="signaler-bug-container">
      {/* Header */}
      <div className="signaler-header">
        <div className="header-icon">
          <FaBug size={48} />
        </div>
        <h1 className="signaler-title">🐛 Signaler un Bug</h1>
        <p className="signaler-subtitle">
          Décrivez le problème rencontré pour que nous puissions le résoudre rapidement
        </p>
      </div>

      {/* Formulaire */}
      <div className="signaler-form-container">
        <form onSubmit={handleSubmit} className="signaler-form">
          {/* Titre */}
          <div className="form-group">
            <label className="form-label">
              Titre du problème <span className="required">*</span>
            </label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              placeholder="Ex: Erreur lors de l'impression des factures"
              className="form-input"
              maxLength={255}
            />
          </div>

          {/* Priorité */}
          <div className="form-group">
            <label className="form-label">
              Priorité <span className="required">*</span>
            </label>
            <select
              value={formData.priorite}
              onChange={(e) => setFormData({ ...formData, priorite: e.target.value })}
              className="form-select"
            >
              <option value="FAIBLE">🟢 FAIBLE - Le problème n'affecte pas le travail</option>
              <option value="MOYENNE">🟡 MOYENNE - Gêne mineure dans le travail</option>
              <option value="ELEVEE">🟠 ÉLEVÉE - Problème important mais contournable</option>
              <option value="CRITIQUE">🔴 CRITIQUE - Bloque complètement le travail</option>
            </select>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">
              Description détaillée <span className="required">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={`Décrivez le problème en détail :
• Que faisiez-vous quand le problème est survenu ?
• Quel message d'erreur avez-vous vu ?
• Le problème se reproduit-il ?
• Y a-t-il des étapes pour le reproduire ?`}
              className="form-textarea"
              rows="10"
            />
            <div className="character-count">
              {formData.description.length} caractères
              {formData.description.length < 20 && formData.description.length > 0 && (
                <span className="count-warning"> - Au moins 20 caractères requis</span>
              )}
            </div>
          </div>

          {/* Conseils */}
          <div className="info-box">
            <div className="info-icon">💡</div>
            <div className="info-content">
              <strong>Conseils pour un signalement efficace :</strong>
              <ul>
                <li>Soyez précis dans la description</li>
                <li>Indiquez les étapes pour reproduire le problème</li>
                <li>Mentionnez le navigateur/système utilisé</li>
                <li>Joignez des captures d'écran si possible</li>
              </ul>
            </div>
          </div>

          {/* Boutons */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>⏳ Envoi en cours...</>
              ) : (
                <>
                  <FaPaperPlane /> Envoyer le Signalement
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={loading}
            >
              <FaEraser /> Effacer
            </button>
          </div>
        </form>
      </div>

      {/* Section d'aide */}
      <div className="help-section">
        <h3>❓ Besoin d'aide ?</h3>
        <p>
          Si vous avez des questions ou besoin d'assistance immédiate, 
          n'hésitez pas à contacter l'équipe technique.
        </p>
        {entreprise ? (
          <div className="help-contact">
            {entreprise.email && (
              <div className="help-item">
                <strong>📧 Email :</strong> {entreprise.email}
              </div>
            )}
            {entreprise.telephone && (
              <div className="help-item">
                <strong>📞 Téléphone :</strong> {entreprise.telephone}
              </div>
            )}
            {entreprise.nom && (
              <div className="help-item">
                <strong>🏢 Entreprise :</strong> {entreprise.nom}
              </div>
            )}
            {entreprise.adresse && (
              <div className="help-item">
                <strong>📍 Adresse :</strong> {entreprise.adresse}
              </div>
            )}
          </div>
        ) : (
          <div className="help-contact">
            <div className="help-item">
              <strong>📧 Email :</strong> support@techinfo.cm
            </div>
            <div className="help-item">
              <strong>📞 Téléphone :</strong> +237 6XX XX XX XX
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SignalerBug;

