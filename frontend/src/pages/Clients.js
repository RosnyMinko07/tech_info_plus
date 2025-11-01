import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaSync, FaEdit, FaTrash, FaEye, FaFileExport, FaFileImport } from 'react-icons/fa';
import { clientService } from '../services/api';
import { toast } from 'react-toastify';
import ClientForm from '../components/ClientForm';
import '../styles/CommonPages.css';
import { confirmDelete, confirmDeleteClientWithDocuments } from '../utils/sweetAlertHelper';

function Clients() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [clientDetails, setClientDetails] = useState(null);
  const [stats, setStats] = useState({ total: 0, particuliers: 0, entreprises: 0 });

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [searchTerm, clients]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await clientService.getAll();
      setClients(data || []);
      calculateStats(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
      toast.error('Erreur lors du chargement des clients');
      setClients([]);
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    setStats({
      total: data.length,
      particuliers: data.filter(c => c.type_client === 'Particulier').length,
      entreprises: data.filter(c => c.type_client === 'Entreprise').length,
    });
  };

  const filterClients = () => {
    if (!searchTerm) {
      setFilteredClients(clients);
      return;
    }
    const filtered = clients.filter(client =>
      client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telephone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.ville?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  };

  const handleAdd = () => {
    setSelectedClient(null);
    setShowForm(true);
  };

  const handleEdit = (client) => {
    setSelectedClient(client);
    setShowForm(true);
  };

  const handleDelete = async (client) => {
    try {
      // D'abord, récupérer les détails du client pour voir s'il a des documents
      const details = await clientService.getById(client.id_client);
      const hasDocuments = details.statistiques.nb_factures > 0 || details.statistiques.nb_devis > 0;
      
      let confirmed;
      if (hasDocuments) {
        // Si le client a des documents, proposer directement la suppression forcée
        confirmed = await confirmDeleteClientWithDocuments(
          client.nom,
          details.statistiques.nb_factures,
          details.statistiques.nb_devis
        );
        
        if (confirmed) {
          await clientService.delete(client.id_client, { force: true });
          toast.success('✅ Client et documents supprimés définitivement');
          loadClients();
        }
      } else {
        // Si pas de documents, suppression normale
        confirmed = await confirmDelete(`le client "${client.nom}"`);
        
        if (confirmed) {
          await clientService.delete(client.id_client);
          toast.success('✅ Client supprimé avec succès');
          loadClients();
        }
      }
    } catch (error) {
      console.error('Erreur suppression client:', error);
      toast.error('❌ Erreur lors de la suppression du client');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedClient(null);
    loadClients();
  };

  const handleViewDetails = async (client) => {
    try {
      const details = await clientService.getById(client.id_client);
      setClientDetails(details);
      setShowDetails(true);
    } catch (error) {
      console.error('Erreur chargement détails:', error);
      toast.error('❌ Erreur lors du chargement des détails');
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Chargement des clients...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* En-tête */}
      <div className="page-header card">
        <div>
          <h1>👥 Gestion des Clients</h1>
          <p className="page-subtitle">Gérez vos clients et partenaires</p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          <FaPlus /> Nouveau client
        </button>
      </div>

      {/* Statistiques */}
      <div className="stats-cards">
        <div className="stat-card-small">
          <div className="stat-icon">👥</div>
          <div>
            <p className="stat-label">Total clients</p>
            <p className="stat-value">{stats.total}</p>
          </div>
        </div>
        <div className="stat-card-small">
          <div className="stat-icon">👤</div>
          <div>
            <p className="stat-label">Particuliers</p>
            <p className="stat-value">{stats.particuliers}</p>
          </div>
        </div>
        <div className="stat-card-small">
          <div className="stat-icon">🏢</div>
          <div>
            <p className="stat-label">Entreprises</p>
            <p className="stat-value">{stats.entreprises}</p>
          </div>
        </div>
      </div>

      {/* Barre de contrôle */}
      <div className="control-bar card">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={loadClients}>
            <FaSync /> Actualiser
          </button>
          <button className="btn btn-secondary">
            <FaFileImport /> Importer
          </button>
          <button className="btn btn-secondary">
            <FaFileExport /> Exporter
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="table-container card">
        <table className="table">
          <thead>
            <tr>
              <th>CLIENT</th>
              <th>CONTACT</th>
              <th>TYPE</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                  Aucun client trouvé
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id_client}>
                  <td>
                    <div className="client-info">
                      <span className="client-icon">
                        {client.type_client === 'Entreprise' ? '🏢' : '👤'}
                      </span>
                      <div>
                        <strong>{client.numero_client}</strong>
                        <br />
                        {client.nom}
                      </div>
                    </div>
                  </td>
                  <td>
                    {client.ville && <div>📍 {client.ville}</div>}
                    {client.telephone && <div>📞 {client.telephone}</div>}
                    {client.email && <div>✉️ {client.email}</div>}
                  </td>
                  <td>
                    <span className={`badge badge-${client.type_client === 'Entreprise' ? 'info' : 'success'}`}>
                      {client.type_client}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon btn-info" onClick={() => handleViewDetails(client)} title="Voir">
                        <FaEye />
                      </button>
                      <button className="btn-icon btn-primary" onClick={() => handleEdit(client)} title="Modifier">
                        <FaEdit />
                      </button>
                      <button className="btn-icon btn-danger" onClick={() => handleDelete(client)} title="Supprimer">
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

      {/* Formulaire modal */}
      {showForm && (
        <ClientForm
          client={selectedClient}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Modal Détails Client */}
      {showDetails && clientDetails && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '700px'}}>
            <div className="modal-header">
              <h2>📋 Détails du Client</h2>
              <button className="btn-close" onClick={() => setShowDetails(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="client-details">
                <div className="details-section">
                  <h3>👤 Informations Personnelles</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Nom:</label>
                      <span>{clientDetails.nom}</span>
                    </div>
                    <div className="detail-item">
                      <label>Type:</label>
                      <span>{clientDetails.type_client}</span>
                    </div>
                    <div className="detail-item">
                      <label>Téléphone:</label>
                      <span>{clientDetails.telephone || 'Non renseigné'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Email:</label>
                      <span>{clientDetails.email || 'Non renseigné'}</span>
                    </div>
                    <div className="detail-item">
                      <label>NIF:</label>
                      <span>{clientDetails.nif || 'Non renseigné'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Date création:</label>
                      <span>{new Date(clientDetails.date_creation).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>

                <div className="details-section">
                  <h3>📍 Adresse</h3>
                  <div className="detail-item">
                    <label>Adresse complète:</label>
                    <span>{clientDetails.adresse || 'Non renseignée'}</span>
                  </div>
                </div>

                <div className="details-section">
                  <h3>📊 Statistiques</h3>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-label">Factures</div>
                      <div className="stat-value">{clientDetails.statistiques.nb_factures}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Devis</div>
                      <div className="stat-value">{clientDetails.statistiques.nb_devis}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">CA Total</div>
                      <div className="stat-value">{clientDetails.statistiques.ca_total.toLocaleString()} FCFA</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Dernière facture</div>
                      <div className="stat-value">
                        {clientDetails.statistiques.derniere_facture 
                          ? new Date(clientDetails.statistiques.derniere_facture).toLocaleDateString('fr-FR')
                          : 'Aucune'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowDetails(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clients;
