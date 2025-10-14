import React, { useState } from 'react';
import { FaTimes, FaSave } from 'react-icons/fa';
import { reglementService, formatMontant } from '../services/api';
import { toast } from 'react-toastify';

function ReglementModal({ facture, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    date_reglement: new Date().toISOString().split('T')[0],
    montant: 0,
    mode_paiement: 'ESPECES',
    reference: ''
  });

  const montant_total = parseFloat(facture.montant_ttc || 0);
  const montant_avance = parseFloat(facture.montant_avance || 0);
  const montant_reste = parseFloat(facture.montant_reste || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.montant || formData.montant <= 0) {
      toast.error('Le montant doit être positif');
      return;
    }

    if (formData.montant > montant_reste) {
      toast.error('Le montant ne peut pas dépasser le reste à payer');
      return;
    }

    try {
      await reglementService.create({
        id_facture: facture.id_facture,
        ...formData
      });
      toast.success('Règlement enregistré avec succès');
      onSuccess();
    } catch (error) {
      console.error('Erreur règlement:', error);
      toast.error('Erreur lors de l\'enregistrement du règlement');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">💰 Règlement - Facture {facture.numero_facture}</h2>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Informations facture */}
        <div style={{ 
          padding: '20px', 
          background: '#2196f3', 
          borderRadius: '10px', 
          marginBottom: '20px',
          color: 'white'
        }}>
          <h3 style={{ marginBottom: '10px' }}>📋 Informations de la Facture</h3>
          <div style={{ fontSize: '14px', marginBottom: '5px' }}>
            <strong>Montant Total:</strong> {formatMontant(montant_total)}
          </div>
          <div style={{ fontSize: '14px', marginBottom: '5px', color: '#90EE90' }}>
            <strong>Montant Payé:</strong> {formatMontant(montant_avance)}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: montant_reste > 0 ? '#FFD700' : '#90EE90' }}>
            <strong>Reste à Payer:</strong> {formatMontant(montant_reste)}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="input-group">
              <label className="input-label">Date de Règlement *</label>
              <input
                type="date"
                value={formData.date_reglement}
                onChange={(e) => setFormData({ ...formData, date_reglement: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Montant à Ajouter *</label>
              <input
                type="number"
                value={formData.montant}
                onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })}
                className="input-field"
                min="0"
                max={montant_reste}
                step="any"
                required
              />
              <small style={{ color: '#888', fontSize: '11px' }}>
                Maximum: {formatMontant(montant_reste)}
              </small>
            </div>

            <div className="input-group">
              <label className="input-label">Mode de Paiement</label>
              <select
                value={formData.mode_paiement}
                onChange={(e) => setFormData({ ...formData, mode_paiement: e.target.value })}
                className="input-field"
              >
                <option value="ESPECES">Espèces</option>
                <option value="CHEQUE">Chèque</option>
                <option value="VIREMENT">Virement</option>
                <option value="CARTE">Carte bancaire</option>
                <option value="MOBILE">Mobile Money</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Référence</label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="input-field"
                placeholder="N° chèque, référence..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-success">
              <FaSave /> Enregistrer le règlement
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              <FaTimes /> Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReglementModal;
