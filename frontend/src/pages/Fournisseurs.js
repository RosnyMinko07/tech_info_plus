import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaSync, FaEdit, FaTrash } from 'react-icons/fa';
import { fournisseurService } from '../services/api';
import { toast } from 'react-toastify';
import FournisseurFormModal from '../components/FournisseurFormModal';
import '../styles/CommonPages.css';
import { confirmDelete } from '../utils/sweetAlertHelper';

function Fournisseurs() {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [filteredFournisseurs, setFilteredFournisseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);

  useEffect(() => {
    loadFournisseurs();
  }, []);

  useEffect(() => {
    filterFournisseurs();
  }, [searchTerm, fournisseurs]);

  const loadFournisseurs = async () => {
    try {
      setLoading(true);
      const data = await fournisseurService.getAll();
      setFournisseurs(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement fournisseurs:', error);
      toast.error('Erreur lors du chargement des fournisseurs');
      setFournisseurs([]);
      setLoading(false);
    }
  };

  const filterFournisseurs = () => {
    if (!searchTerm) {
      setFilteredFournisseurs(fournisseurs);
      return;
    }
    const filtered = fournisseurs.filter(f =>
      f.nom_fournisseur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.telephone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.ville?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFournisseurs(filtered);
  };

  const handleDelete = async (fournisseur) => {
    const confirmed = await confirmDelete(`le fournisseur "${fournisseur.nom_fournisseur}"`);
    if (!confirmed) return;
    
    try {
      await fournisseurService.delete(fournisseur.id_fournisseur);
      toast.success('✅ Fournisseur supprimé avec succès');
      loadFournisseurs();
    } catch (error) {
      toast.error('❌ Erreur lors de la suppression');
    }
  };

  if (loading) {
    return <div className="page-loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header card">
        <div>
          <h1>🏭 Gestion des Fournisseurs</h1>
          <p className="page-subtitle">Gérez vos fournisseurs et partenaires</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setSelectedFournisseur(null); setShowForm(true); }}>
          <FaPlus /> Nouveau fournisseur
        </button>
      </div>

      {/* Formulaire modal */}
      {showForm && (
        <FournisseurFormModal
          fournisseur={selectedFournisseur}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); loadFournisseurs(); }}
        />
      )}

      <div className="stats-cards">
        <div className="stat-card-small">
          <div className="stat-icon">🏭</div>
          <div>
            <p className="stat-label">Total fournisseurs</p>
            <p className="stat-value">{fournisseurs.length}</p>
          </div>
        </div>
      </div>

      <div className="control-bar card">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher un fournisseur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={loadFournisseurs}>
            <FaSync /> Actualiser
          </button>
        </div>
      </div>

      <div className="table-container card">
        <table className="table">
          <thead>
            <tr>
              <th>FOURNISSEUR</th>
              <th>CONTACT</th>
              <th>LOCALISATION</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredFournisseurs.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>Aucun fournisseur trouvé</td></tr>
            ) : (
              filteredFournisseurs.map((fournisseur) => (
                <tr key={fournisseur.id_fournisseur}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>🏭</span>
                      <div>
                        <strong>{fournisseur.numero_fournisseur || 'N/A'}</strong><br />
                        {fournisseur.nom_fournisseur}
                      </div>
                    </div>
                  </td>
                  <td>
                    {fournisseur.telephone && <div>📞 {fournisseur.telephone}</div>}
                    {fournisseur.email && <div>✉️ {fournisseur.email}</div>}
                  </td>
                  <td>
                    {fournisseur.ville && <div>📍 {fournisseur.ville}</div>}
                    {fournisseur.pays && <div>🌍 {fournisseur.pays}</div>}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon btn-primary" onClick={() => { setSelectedFournisseur(fournisseur); setShowForm(true); }} title="Modifier">
                        <FaEdit />
                      </button>
                      <button className="btn-icon btn-danger" onClick={() => handleDelete(fournisseur)} title="Supprimer">
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Fournisseurs;