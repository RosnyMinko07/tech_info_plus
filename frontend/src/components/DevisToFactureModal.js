import React, { useState, useEffect } from 'react';
import { FaTimes, FaFileInvoice } from 'react-icons/fa';
import { devisService, formatMontant, formatDate } from '../services/api';
import { toast } from 'react-toastify';

function DevisToFactureModal({ onClose, onSelect }) {
  const [devisList, setDevisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDevis();
  }, []);

  const loadDevis = async () => {
    try {
      const data = await devisService.getAll();
      // Filtrer uniquement les devis acceptés non facturés
      const devisAcceptes = (data || []).filter(d => 
        d.statut === 'Accepté' || d.statut === 'accepté'
      );
      setDevisList(devisAcceptes);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement devis:', error);
      toast.error('Erreur lors du chargement des devis');
      setLoading(false);
    }
  };

  const handleSelect = (devis) => {
    onSelect(devis);
    onClose();
  };

  const filteredDevis = devisList.filter(d =>
    d.numero_devis?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <FaFileInvoice /> Sélectionner un Devis pour créer une Facture
          </h2>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Recherche */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Rechercher un devis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
          />
        </div>

        {/* Liste des devis */}
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="spinner"></div>
            </div>
          ) : filteredDevis.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              Aucun devis accepté disponible
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>N° DEVIS</th>
                  <th>DATE</th>
                  <th>CLIENT</th>
                  <th>MONTANT HT</th>
                  <th>MONTANT TTC</th>
                  <th>STATUT</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevis.map(devis => (
                  <tr key={devis.id_devis}>
                    <td><strong>{devis.numero_devis}</strong></td>
                    <td>{formatDate(devis.date_devis)}</td>
                    <td>Client #{devis.id_client}</td>
                    <td>{formatMontant(devis.montant_ht || 0)}</td>
                    <td>{formatMontant(devis.montant_ttc || 0)}</td>
                    <td>
                      <span className="badge badge-success">{devis.statut}</span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSelect(devis)}
                      >
                        Créer Facture
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="form-actions" style={{ marginTop: '20px', borderTop: '1px solid #444', paddingTop: '15px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            <FaTimes /> Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

export default DevisToFactureModal;
