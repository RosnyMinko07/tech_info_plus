import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './Facturation.css';
import { showError, showSuccess } from '../utils/sweetAlertHelper';

const Reglements = () => {
  const [reglements, setReglements] = useState([]);
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);

  const [formData, setFormData] = useState({
    id_facture: '',
    date_reglement: new Date().toISOString().split('T')[0],
    montant: '',
    mode_paiement: 'Espèces',
    reference: '',
    statut: 'Validé'
  });

  const [stats, setStats] = useState({
    total_reglements: 0,
    montant_total: 0,
    especes: 0,
    cheques: 0,
    virements: 0
  });

  useEffect(() => {
    chargerReglements();
    chargerFactures();
  }, []);

  const chargerReglements = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/reglements');
      setReglements(response.data);
      calculerStatistiques(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const chargerFactures = async () => {
    try {
      const response = await api.get('/api/factures');
      // Filtrer les factures non payées
      setFactures(response.data.filter(f => f.statut !== 'Payée'));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const calculerStatistiques = (reglementsData) => {
    const stats = {
      total_reglements: reglementsData.length,
      montant_total: reglementsData.reduce((sum, r) => sum + parseFloat(r.montant || 0), 0),
      especes: reglementsData.filter(r => r.mode_paiement === 'Espèces').length,
      cheques: reglementsData.filter(r => r.mode_paiement === 'Chèque').length,
      virements: reglementsData.filter(r => r.mode_paiement === 'Virement').length
    };
    setStats(stats);
  };

  const ouvrirFormulaire = () => {
    setFormData({
      id_facture: '',
      date_reglement: new Date().toISOString().split('T')[0],
      montant: '',
      mode_paiement: 'Espèces',
      reference: '',
      statut: 'Validé'
    });
    setFormulaireOuvert(true);
  };

  const fermerFormulaire = () => {
    setFormulaireOuvert(false);
  };

  const enregistrerReglement = async () => {
    if (!formData.id_facture || !formData.montant) {
      showError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await api.post('/api/reglements', { ...formData, montant: parseFloat(formData.montant) });
      showSuccess('Règlement enregistré avec succès');
      fermerFormulaire();
      chargerReglements();
      chargerFactures();
    } catch (error) {
      console.error('Erreur:', error);
      showError('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="facturation-container">
      <h1 className="page-title">💳 Gestion des Règlements</h1>

      <div className="control-bar">
        <button className="btn-success" onClick={ouvrirFormulaire}>
          + Nouveau Règlement
        </button>
        <button className="btn-primary" onClick={chargerReglements}>
          🔄 Actualiser
        </button>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-label">💳 Total Règlements</div>
          <div className="stat-value">{stats.total_reglements}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">💰 Montant Total</div>
          <div className="stat-value green">{stats.montant_total.toLocaleString()} FCFA</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">💵 Espèces</div>
          <div className="stat-value">{stats.especes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🏦 Chèques</div>
          <div className="stat-value">{stats.cheques}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📱 Virements</div>
          <div className="stat-value">{stats.virements}</div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>DATE</th>
              <th>FACTURE</th>
              <th>MODE PAIEMENT</th>
              <th>MONTANT</th>
              <th>RÉFÉRENCE</th>
              <th>STATUT</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>Chargement...</td></tr>
            ) : reglements.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>Aucun règlement trouvé</td></tr>
            ) : (
              reglements.map((r, index) => (
                <tr key={index}>
                  <td>{new Date(r.date_reglement).toLocaleDateString('fr-FR')}</td>
                  <td>{r.facture?.numero_facture || `Facture #${r.id_facture}`}</td>
                  <td>
                    <span className="status-badge green">{r.mode_paiement}</span>
                  </td>
                  <td><strong>{parseFloat(r.montant).toLocaleString()} FCFA</strong></td>
                  <td>{r.reference || '-'}</td>
                  <td>
                    <span className="status-badge green">{r.statut}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {formulaireOuvert && (
        <div className="modal-overlay" onClick={fermerFormulaire}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '600px'}}>
            <div className="modal-header">
              <h2>Nouveau Règlement</h2>
              <button className="btn-close" onClick={fermerFormulaire}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Facture *</label>
                <select
                  value={formData.id_facture}
                  onChange={(e) => setFormData({...formData, id_facture: e.target.value})}
                >
                  <option value="">Sélectionner une facture</option>
                  {factures.map(facture => (
                    <option key={facture.id_facture} value={facture.id_facture}>
                      {facture.numero_facture} - {facture.client?.nom} - {parseFloat(facture.total_ttc || 0).toLocaleString()} FCFA
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={formData.date_reglement}
                    onChange={(e) => setFormData({...formData, date_reglement: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Montant *</label>
                  <input
                    type="number"
                    value={formData.montant}
                    onChange={(e) => setFormData({...formData, montant: e.target.value})}
                    placeholder="Montant..."
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mode de Paiement</label>
                <select
                  value={formData.mode_paiement}
                  onChange={(e) => setFormData({...formData, mode_paiement: e.target.value})}
                >
                  <option value="Espèces">Espèces</option>
                  <option value="Chèque">Chèque</option>
                  <option value="Virement">Virement</option>
                  <option value="Carte">Carte Bancaire</option>
                  <option value="Mobile">Mobile Money</option>
                </select>
              </div>

              <div className="form-group">
                <label>Référence</label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({...formData, reference: e.target.value})}
                  placeholder="Numéro de chèque, référence..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-success" onClick={enregistrerReglement}>
                💾 Enregistrer
              </button>
              <button className="btn-primary" onClick={fermerFormulaire}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reglements;