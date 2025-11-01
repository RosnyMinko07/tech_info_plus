import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Facturation.css';
import { confirmDelete, showError, showSuccess } from '../utils/sweetAlertHelper';

const Fournisseurs = () => {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [fournisseurSelectionne, setFournisseurSelectionne] = useState(null);

  const [formData, setFormData] = useState({
    nom_fournisseur: '',
    adresse: '',
    ville: '',
    pays: 'Gabon',
    telephone: '',
    email: '',
    nif: ''
  });

  useEffect(() => {
    chargerFournisseurs();
  }, []);

  const chargerFournisseurs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/fournisseurs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('🔍 FOURNISSEURS REÇUS:', response.data);
      console.log('🔍 Premier fournisseur:', response.data[0]);
      setFournisseurs(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const ouvrirFormulaireNouveau = () => {
    setFournisseurSelectionne(null);
    setFormData({
      nom_fournisseur: '',
      adresse: '',
      ville: '',
      pays: 'Gabon',
      telephone: '',
      email: '',
      nif: ''
    });
    setFormulaireOuvert(true);
  };

  const ouvrirFormulaireModification = (fournisseur) => {
    setFournisseurSelectionne(fournisseur);
    setFormData({
      nom_fournisseur: fournisseur.nom_fournisseur || '',
      adresse: fournisseur.adresse || '',
      ville: fournisseur.ville || '',
      pays: fournisseur.pays || 'Gabon',
      telephone: fournisseur.telephone || '',
      email: fournisseur.email || '',
      nif: fournisseur.nif || ''
    });
    setFormulaireOuvert(true);
  };

  const fermerFormulaire = () => {
    setFormulaireOuvert(false);
    setFournisseurSelectionne(null);
  };

  const enregistrerFournisseur = async () => {
    if (!formData.nom_fournisseur) {
      showError('Le nom du fournisseur est obligatoire');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (fournisseurSelectionne) {
        await axios.put(
          `http://localhost:8000/api/fournisseurs/${fournisseurSelectionne.id_fournisseur}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showSuccess('Fournisseur modifié avec succès');
      } else {
        await axios.post(
          'http://localhost:8000/api/fournisseurs',
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showSuccess('Fournisseur créé avec succès');
      }

      fermerFormulaire();
      chargerFournisseurs();
    } catch (error) {
      console.error('Erreur:', error);
      showError('Erreur lors de l\'enregistrement');
    }
  };

  const supprimerFournisseur = async (idFournisseur) => {
    const confirmed = await confirmDelete('ce fournisseur');
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/fournisseurs/${idFournisseur}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSuccess('Fournisseur supprimé');
      chargerFournisseurs();
    } catch (error) {
      console.error('Erreur:', error);
      showError('Erreur lors de la suppression');
    }
  };

  const fournisseursFiltres = fournisseurs.filter(f =>
    f.nom_fournisseur?.toLowerCase().includes(searchText.toLowerCase()) ||
    f.telephone?.includes(searchText) ||
    f.email?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="facturation-container">
      <h1 className="page-title">🏭 Gestion des Fournisseurs</h1>

      <div className="control-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Rechercher un fournisseur..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <button className="btn-icon" onClick={chargerFournisseurs}>🔍</button>
        <button className="btn-success" onClick={ouvrirFormulaireNouveau}>
          + Nouveau Fournisseur
        </button>
        <button className="btn-primary" onClick={chargerFournisseurs}>
          🔄 Actualiser
        </button>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-label">🏭 Total Fournisseurs</div>
          <div className="stat-value">{fournisseurs.length}</div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>NOM</th>
              <th>TÉLÉPHONE</th>
              <th>EMAIL</th>
              <th>VILLE</th>
              <th>PAYS</th>
              <th>NIF</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{textAlign: 'center'}}>Chargement...</td></tr>
            ) : fournisseursFiltres.length === 0 ? (
              <tr><td colSpan="7" style={{textAlign: 'center'}}>Aucun fournisseur trouvé</td></tr>
            ) : (
              fournisseursFiltres.map(f => {
                console.log('📋 Affichage fournisseur:', f.id_fournisseur, 'nom_fournisseur:', f.nom_fournisseur, 'ville:', f.ville, 'adresse:', f.adresse);
                return (
                <tr key={f.id_fournisseur}>
                  <td>
                    <strong style={{display: 'block', marginBottom: '4px'}}>
                      {f.nom_fournisseur || '⚠️ NOM VIDE'}
                    </strong>
                    {f.adresse && (
                      <div style={{fontSize: '12px', color: '#666'}}>
                        📍 {f.adresse}
                      </div>
                    )}
                  </td>
                  <td>{f.telephone || '-'}</td>
                  <td>{f.email || '-'}</td>
                  <td>{f.ville || '-'}</td>
                  <td>{f.pays || '-'}</td>
                  <td>{f.nif || '-'}</td>
                  <td>
                    <button 
                      className="btn-icon"
                      onClick={() => ouvrirFormulaireModification(f)}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-icon"
                      onClick={() => supprimerFournisseur(f.id_fournisseur)}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {formulaireOuvert && (
        <div className="modal-overlay" onClick={fermerFormulaire}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '600px'}}>
            <div className="modal-header">
              <h2>{fournisseurSelectionne ? 'Modifier le Fournisseur' : 'Nouveau Fournisseur'}</h2>
              <button className="btn-close" onClick={fermerFormulaire}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Nom du Fournisseur *</label>
                <input
                  type="text"
                  value={formData.nom_fournisseur}
                  onChange={(e) => setFormData({...formData, nom_fournisseur: e.target.value})}
                  placeholder="Nom du fournisseur..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                    placeholder="+241 XX XX XX XX"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@exemple.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Adresse</label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                  placeholder="Adresse complète..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ville</label>
                  <input
                    type="text"
                    value={formData.ville}
                    onChange={(e) => setFormData({...formData, ville: e.target.value})}
                    placeholder="Ville..."
                  />
                </div>
                <div className="form-group">
                  <label>Pays</label>
                  <input
                    type="text"
                    value={formData.pays}
                    onChange={(e) => setFormData({...formData, pays: e.target.value})}
                    placeholder="Pays..."
                  />
                </div>
              </div>

              <div className="form-group">
                <label>NIF</label>
                <input
                  type="text"
                  value={formData.nif}
                  onChange={(e) => setFormData({...formData, nif: e.target.value})}
                  placeholder="Numéro d'identification fiscale..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-success" onClick={enregistrerFournisseur}>
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

export default Fournisseurs;