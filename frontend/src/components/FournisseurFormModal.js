import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { fournisseurService } from '../services/api';
import { toast } from 'react-toastify';

function FournisseurFormModal({ fournisseur, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nom_fournisseur: '',
    adresse: '',
    telephone: '',
    email: '',
    ville: '',
    pays: 'Gabon',
    nif: '',
    numero_fournisseur: ''
  });

  useEffect(() => {
    if (fournisseur) {
      setFormData({
        nom_fournisseur: fournisseur.nom_fournisseur || '',
        adresse: fournisseur.adresse || '',
        telephone: fournisseur.telephone || '',
        email: fournisseur.email || '',
        ville: fournisseur.ville || '',
        pays: fournisseur.pays || 'Gabon',
        nif: fournisseur.nif || '',
        numero_fournisseur: fournisseur.numero_fournisseur || ''
      });
    }
  }, [fournisseur]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nom_fournisseur.trim()) {
      toast.error('Le nom du fournisseur est obligatoire');
      return;
    }

    try {
      if (fournisseur) {
        await fournisseurService.update(fournisseur.id_fournisseur, formData);
        toast.success('Fournisseur modifié avec succès');
      } else {
        await fournisseurService.create(formData);
        toast.success('Fournisseur créé avec succès');
      }
      onSuccess();
    } catch (error) {
      console.error('Erreur sauvegarde fournisseur:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {fournisseur ? 'Modifier Fournisseur' : 'Nouveau Fournisseur'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="input-group">
              <label className="input-label">Nom du fournisseur *</label>
              <input
                type="text"
                name="nom_fournisseur"
                value={formData.nom_fournisseur}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Ville</label>
              <input
                type="text"
                name="ville"
                value={formData.ville}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Téléphone</label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                className="input-field"
                placeholder="+241 6XX XX XX XX"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Pays</label>
              <input
                type="text"
                name="pays"
                value={formData.pays}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label className="input-label">NIF</label>
              <input
                type="text"
                name="nif"
                value={formData.nif}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div className="input-group full-width">
              <label className="input-label">Adresse</label>
              <textarea
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                className="input-field"
                rows="3"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-success">
              ✓ Enregistrer
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              ✕ Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FournisseurFormModal;
