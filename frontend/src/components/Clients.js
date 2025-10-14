import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Facturation.css'; // Réutilise le CSS

const Clients = () => {
  // ==================== ÉTATS ====================
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [clientSelectionne, setClientSelectionne] = useState(null);
  const [typeFiltre, setTypeFiltre] = useState('Tous');

  // Statistiques
  const [stats, setStats] = useState({
    total_clients: 0,
    particuliers: 0,
    entreprises: 0
  });

  // Formulaire
  const [formData, setFormData] = useState({
    nom: '',
    type_client: 'Particulier',
    adresse: '',
    ville: '',
    telephone: '',
    email: '',
    nif: ''
  });

  // ==================== CHARGEMENT ====================
  useEffect(() => {
    chargerClients();
  }, []);

  const chargerClients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/clients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('🔍 CLIENTS REÇUS:', response.data);
      console.log('🔍 Premier client:', response.data[0]);
      
      // ⚠️ TEST RADICAL - ALERTE
      if (response.data.length > 0) {
        const premier = response.data[0];
        alert(`TEST DEBUG:\nnom: ${premier.nom}\nville: ${premier.ville}\nadresse: ${premier.adresse}`);
      }
      
      setClients(response.data);
      calculerStatistiques(response.data);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculerStatistiques = (clientsData) => {
    setStats({
      total_clients: clientsData.length,
      particuliers: clientsData.filter(c => c.type_client === 'Particulier').length,
      entreprises: clientsData.filter(c => c.type_client === 'Entreprise').length
    });
  };

  // ==================== FORMULAIRE ====================
  const ouvrirFormulaireNouveau = () => {
    setClientSelectionne(null);
    setFormData({
      nom: '',
      type_client: 'Particulier',
      adresse: '',
      ville: '',
      telephone: '',
      email: '',
      nif: ''
    });
    setFormulaireOuvert(true);
  };

  const ouvrirFormulaireModification = (client) => {
    setClientSelectionne(client);
    setFormData({
      nom: client.nom || '',
      type_client: client.type_client || 'Particulier',
      adresse: client.adresse || '',
      ville: client.ville || '',
      telephone: client.telephone || '',
      email: client.email || '',
      nif: client.nif || ''
    });
    setFormulaireOuvert(true);
  };

  const fermerFormulaire = () => {
    setFormulaireOuvert(false);
    setClientSelectionne(null);
  };

  const enregistrerClient = async () => {
    if (!formData.nom) {
      alert('Le nom est obligatoire');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (clientSelectionne) {
        await axios.put(
          `http://localhost:8000/api/clients/${clientSelectionne.id_client}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Client modifié avec succès');
      } else {
        await axios.post(
          'http://localhost:8000/api/clients',
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Client créé avec succès');
      }

      fermerFormulaire();
      chargerClients();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement du client');
    }
  };

  const supprimerClient = async (idClient) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/clients/${idClient}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Client supprimé');
      chargerClients();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // ==================== FILTRES ====================
  const clientsFiltres = clients.filter(c => {
    const matchRecherche = c.nom?.toLowerCase().includes(searchText.toLowerCase()) ||
                          c.telephone?.includes(searchText) ||
                          c.email?.toLowerCase().includes(searchText.toLowerCase());
    const matchType = typeFiltre === 'Tous' || c.type_client === typeFiltre;
    return matchRecherche && matchType;
  });

  // ==================== RENDU ====================
  return (
    <div className="facturation-container">
      <h1 className="page-title">👥 Gestion des Clients</h1>

      {/* Barre de contrôle */}
      <div className="control-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Rechercher un client..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <button className="btn-icon" onClick={chargerClients}>🔍</button>
        
        <select 
          value={typeFiltre}
          onChange={(e) => setTypeFiltre(e.target.value)}
          style={{padding: '10px', borderRadius: '8px', border: '1px solid #ddd'}}
        >
          <option value="Tous">Tous</option>
          <option value="Particulier">Particuliers</option>
          <option value="Entreprise">Entreprises</option>
        </select>

        <button className="btn-success" onClick={ouvrirFormulaireNouveau}>
          + Nouveau Client
        </button>
        <button className="btn-primary" onClick={chargerClients}>
          🔄 Actualiser
        </button>
      </div>

      {/* Statistiques */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-label">👥 Total Clients</div>
          <div className="stat-value">{stats.total_clients}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">👤 Particuliers</div>
          <div className="stat-value">{stats.particuliers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🏢 Entreprises</div>
          <div className="stat-value">{stats.entreprises}</div>
        </div>
      </div>

      {/* Tableau */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>NOM</th>
              <th>TYPE</th>
              <th>TÉLÉPHONE</th>
              <th>EMAIL</th>
              <th>VILLE</th>
              <th>NIF</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{textAlign: 'center'}}>Chargement...</td></tr>
            ) : clientsFiltres.length === 0 ? (
              <tr><td colSpan="7" style={{textAlign: 'center'}}>Aucun client trouvé</td></tr>
            ) : (
              clientsFiltres.map(client => {
                console.log('📋 Affichage client:', client.id_client, 'nom:', client.nom, 'ville:', client.ville, 'adresse:', client.adresse);
                return (
                <tr key={client.id_client}>
                  <td>
                    <strong style={{display: 'block', marginBottom: '4px'}}>
                      {client.nom || '⚠️ NOM VIDE'}
                    </strong>
                    {client.adresse && (
                      <div style={{fontSize: '12px', color: '#666'}}>
                        📍 {client.adresse}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${client.type_client === 'Entreprise' ? 'green' : 'orange'}`}>
                      {client.type_client === 'Entreprise' ? '🏢' : '👤'} {client.type_client}
                    </span>
                  </td>
                  <td>{client.telephone || '-'}</td>
                  <td>{client.email || '-'}</td>
                  <td>{client.ville || '-'}</td>
                  <td>{client.nif || '-'}</td>
                  <td>
                    <button 
                      className="btn-icon"
                      onClick={() => ouvrirFormulaireModification(client)}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-icon"
                      onClick={() => supprimerClient(client.id_client)}
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

      {/* Modal Formulaire */}
      {formulaireOuvert && (
        <div className="modal-overlay" onClick={fermerFormulaire}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '600px'}}>
            <div className="modal-header">
              <h2>{clientSelectionne ? 'Modifier le Client' : 'Nouveau Client'}</h2>
              <button className="btn-close" onClick={fermerFormulaire}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  placeholder="Nom du client..."
                />
              </div>

              <div className="form-group">
                <label>Type de Client</label>
                <select
                  value={formData.type_client}
                  onChange={(e) => setFormData({...formData, type_client: e.target.value})}
                >
                  <option value="Particulier">Particulier</option>
                  <option value="Entreprise">Entreprise</option>
                </select>
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
                  <label>NIF</label>
                  <input
                    type="text"
                    value={formData.nif}
                    onChange={(e) => setFormData({...formData, nif: e.target.value})}
                    placeholder="Numéro d'identification fiscale..."
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-success" onClick={enregistrerClient}>
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

export default Clients;