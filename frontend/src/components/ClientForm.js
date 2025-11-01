import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { clientService } from '../services/api';
import { toast } from 'react-toastify';

function ClientForm({ client, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    telephone: '',
    email: '',
    nif: '',
    type_client: 'Particulier',
    ville: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        nom: client.nom || '',
        adresse: client.adresse || '',
        telephone: client.telephone || '',
        email: client.email || '',
        nif: client.nif || '',
        type_client: client.type_client || 'Particulier',
        ville: client.ville || '',
      });
    }
  }, [client]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nom.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }

    setLoading(true);

    try {
      if (client) {
        await clientService.update(client.id_client, formData);
        toast.success('Client modifié avec succès');
        onSuccess(client);
      } else {
        const nouveauClient = await clientService.create(formData);
        toast.success('Client créé avec succès');
        onSuccess(nouveauClient);
      }
    } catch (error) {
      console.error('Erreur sauvegarde client:', error);
      toast.error('Erreur lors de la sauvegarde du client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {client ? 'Modifier Client' : 'Nouveau Client'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="input-group">
              <label className="input-label">Type *</label>
              <select
                name="type_client"
                value={formData.type_client}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Particulier">Particulier</option>
                <option value="Entreprise">Entreprise</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">
                {formData.type_client === 'Entreprise' ? 'Raison sociale *' : 'Nom *'}
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className="input-field"
                placeholder={formData.type_client === 'Entreprise' ? 'Raison sociale' : 'Nom du client'}
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
                placeholder="Libreville"
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
                placeholder="client@example.com"
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
                placeholder="GXXXXXXXXX"
              />
            </div>

            <div className="input-group full-width">
              <label className="input-label">Adresse</label>
              <textarea
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                className="input-field"
                placeholder="Adresse complète"
                rows="3"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? 'Enregistrement...' : '✓ Enregistrer'}
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

export default ClientForm;
