import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaSync, FaEdit, FaTrash, FaFilePdf, FaDollarSign, FaFileExport, FaPrint, FaFileInvoice } from 'react-icons/fa';
import { factureService, formatMontant, formatDate, downloadPDF } from '../services/api';
import api from '../services/api';
import { toast } from 'react-toastify';
import ReglementModal from '../components/ReglementModal';
import DevisToFactureModal from '../components/DevisToFactureModal';
import FacturationFormModal from '../components/FacturationFormModal';
import { generateFacturePDF } from '../services/pdfGenerator';
import { confirmDelete, confirmAction } from '../utils/sweetAlertHelper';
import '../styles/CommonPages.css';
import '../styles/Facturation.css';

function Facturation() {
  const [factures, setFactures] = useState([]);
  const [filteredFactures, setFilteredFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [showReglementModal, setShowReglementModal] = useState(false);
  const [factureForReglement, setFactureForReglement] = useState(null);
  const [showDevisModal, setShowDevisModal] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState(null);
  
  // Utilisateur connecté
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Statistiques
  const [stats, setStats] = useState({
    factures_jour: 0,
    ca_jour: 0,
    montant_paye: 0,
    montant_restant: 0,
    creances: 0
  });

  useEffect(() => {
    loadFactures();
  }, []);

  useEffect(() => {
    filterFactures();
  }, [searchTerm, factures]);

  const loadFactures = async () => {
    try {
      setLoading(true);
      const data = await factureService.getAll();
      const facturesClients = data || [];
      setFactures(facturesClients);
      calculateStats(facturesClients);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement factures:', error);
      setFactures([]);
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    // Filtrer uniquement les factures clients ET exclure les annulées (comme Python ligne 579-590)
    const facturesClients = data.filter(f => {
      const typeOk = !f.type_facture || f.type_facture === 'NORMALE' || f.type_facture === 'CLIENT';
      const nonAnnulee = f.statut && !['ANNULÉE', 'ANNULEE', 'CANCELLED', 'Annulée'].includes(f.statut.toUpperCase());
      return typeOk && nonAnnulee;
    });
    
    const today = new Date().toISOString().split('T')[0];
    let factures_jour = 0;
    let ca_jour = 0;
    let montant_paye = 0;
    let montant_restant = 0;
    let creances = 0;

    facturesClients.forEach(facture => {
      const factureDate = facture.date_facture ? facture.date_facture.split('T')[0] : '';
      // Utiliser montant_avance comme Python ligne 585-586
      const montantAvance = facture.montant_avance || 0;
      const montantReste = facture.montant_reste || 0;
      
      // Factures du jour : utiliser SEULEMENT montant_avance (comme Python ligne 608-609)
      if (factureDate === today) {
        factures_jour++;
        ca_jour += montantAvance;
      }
      
      // Montant déjà payé : utiliser montant_avance (comme Python ligne 613)
      montant_paye += montantAvance;
      
      // Montant restant (comme Python ligne 614)
      montant_restant += montantReste;
      
      // Compter les créances si montant_reste > 0
      if (montantReste > 0) {
        creances++;
      }
    });

    setStats({
      factures_jour,
      ca_jour,
      montant_paye,
      montant_restant,
      creances
    });
  };

  const filterFactures = () => {
    // Filtrer d'abord pour exclure les factures comptoir et retours
    let facturesClients = factures.filter(f => 
      !f.type_facture || f.type_facture === 'NORMALE' || f.type_facture === 'CLIENT'
    );
    
    if (searchTerm) {
      facturesClients = facturesClients.filter(facture => 
        facture.numero_facture?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facture.client_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facture.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredFactures(facturesClients);
  };

  const handleDevisSelected = (devis) => {
    setSelectedDevis(devis);
    setShowDevisModal(false);
    setShowForm(true);
  };

  const handleAdd = () => {
    setSelectedFacture(null);
    setShowForm(true);
  };

  const handleEdit = (facture) => {
    setSelectedFacture(facture);
    setShowForm(true);
  };

  const handleAnnuler = async (facture) => {
    const confirmed = await confirmAction(
      'Annuler cette facture ?',
      `Voulez-vous annuler la facture ${facture.numero_facture} ? Les stocks seront restaurés.`,
      'Oui, annuler',
      'warning'
    );
    if (!confirmed) return;
    
    try {
      await factureService.annuler(facture.id_facture);
      toast.success('✅ Facture annulée avec succès');
      loadFactures();
    } catch (error) {
      toast.error('❌ Erreur lors de l\'annulation');
      console.error(error);
    }
  };

  const handleDelete = async (facture) => {
    const confirmed = await confirmDelete(`la facture "${facture.numero_facture}"`);
    if (!confirmed) return;
    
    try {
      await factureService.delete(facture.id_facture);
      toast.success('✅ Facture supprimée avec succès');
        loadFactures();
      } catch (error) {
      toast.error('❌ Erreur lors de la suppression');
        console.error(error);
    }
  };

  const handleReglement = (facture) => {
    setFactureForReglement(facture);
    setShowReglementModal(true);
  };

  const handleDevisToFacture = () => {
    setShowDevisModal(true);
  };

  const handlePrintPDF = async (facture) => {
    try {
      // 🔥 Générer le PDF côté React (jsPDF) au lieu du backend Python
      toast.info('📄 Génération du PDF...');
      
      // Récupérer les détails complets de la facture
      const factureDetails = await factureService.getById(facture.id_facture);
      const lignes = await factureService.getLignes(facture.id_facture);
      
      // Informations client
      const client = {
        nom: facture.client_nom || 'Client',
        adresse: factureDetails.client_adresse || '',
        telephone: factureDetails.client_telephone || '',
        email: factureDetails.client_email || '',
        nif: factureDetails.client_nif || ''
      };
      
      // Informations entreprise (chargées depuis la configuration)
      let entreprise = {
        nom: 'TECH INFO PLUS',
        adresse: 'Douala, Cameroun',
        telephone: '+237 XXX XX XX XX',
        email: 'contact@techinfoplus.com',
        nif: 'NIF123456789',
        logo_path: null
      };
      
      try {
        const { data: configData } = await api.get('/api/entreprise/config');
        if (configData) {
          entreprise = {
            nom: configData.nom || entreprise.nom,
            adresse: configData.adresse || entreprise.adresse,
            telephone: configData.telephone || entreprise.telephone,
            email: configData.email || entreprise.email,
            nif: configData.nif || entreprise.nif,
            logo_path: configData.logo_path || null
          };
        }
      } catch (error) {
        console.warn('⚠️ Impossible de charger la config entreprise:', error);
      }
      
      // Normaliser le logo: convertir en Data URL si c'est un chemin/URL serveur
      if (entreprise.logo_path && !entreprise.logo_path.startsWith('data:image')) {
        try {
          // Construire l'URL absolue si nécessaire
          let logoUrl = entreprise.logo_path;
          const hostname = window.location.hostname;
          const baseURL = (hostname === 'localhost' || hostname === '127.0.0.1')
            ? 'http://localhost:8000'
            : `http://${hostname}:8000`;
          if (!logoUrl.startsWith('http')) {
            logoUrl = logoUrl.startsWith('/') ? `${baseURL}${logoUrl}` : `${baseURL}/${logoUrl}`;
          }
          // Télécharger et convertir en base64
          const response = await fetch(logoUrl);
          const blob = await response.blob();
          const toDataURL = (b) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(b);
          });
          const dataUrl = await toDataURL(blob);
          entreprise.logo_path = dataUrl;
        } catch (e) {
          console.warn('⚠️ Impossible de charger le logo, on continue sans:', e);
        }
      }
      
      // Générer le PDF
      await generateFacturePDF(factureDetails, lignes, client, entreprise);
      toast.success('✅ PDF généré avec succès !');
      
    } catch (error) {
      toast.error('❌ Erreur lors de la génération du PDF');
      console.error('Erreur PDF:', error);
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'Payée': return '#28a745';
      case 'Partiellement payée': return '#ffc107';
      case 'IMPAYÉE': return '#dc3545';
      case 'En attente': return '#ffc107';
      case 'Annulée': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (statut) => {
    switch (statut) {
      case 'Payée': return '✅';
      case 'Partiellement payée': return '💰';
      case 'IMPAYÉE': return '⚠️';
      case 'En attente': return '⏳';
      case 'Annulée': return '❌';
      default: return '📄';
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des factures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="facturation-container">
      {/* Titre comme Python */}
      <h1 className="facturation-title">Gestion de la Facturation</h1>
      
      {/* Barre de contrôle comme Python */}
      <div className="facturation-control-bar">
        {/* Recherche à gauche */}
        <div className="search-section">
          <input
            type="text"
            placeholder="Rechercher une facture..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="btn btn-search" onClick={() => filterFactures()}>
            🔍
          </button>
        </div>
        
        {/* Boutons au centre */}
        <div className="control-buttons">
          <button className="btn btn-success btn-new" onClick={handleAdd}>
            + Nouvelle Facture
          </button>
          <button className="btn btn-secondary btn-refresh" onClick={loadFactures}>
            🔄 Actualiser
          </button>
        </div>
        
      </div>

      {/* Cartes de statistiques comme Python */}
      <div className="facturation-stats">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-label">Factures du Jour</div>
            <div className="stat-value">{stats.factures_jour}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Chiffre d'Affaires</div>
            <div className="stat-value">{formatMontant(stats.ca_jour)}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">Montant Déjà Payé</div>
            <div className="stat-value">{formatMontant(stats.montant_paye)}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-label">Montant Restant</div>
            <div className="stat-value">{formatMontant(stats.montant_restant)}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💳</div>
          <div className="stat-content">
            <div className="stat-label">Créances (Impayés)</div>
            <div className="stat-value">{stats.creances}</div>
          </div>
        </div>
      </div>

      {/* Tableau des factures comme Python */}
      <div className="facturation-table">
        {/* En-têtes */}
        <div className="table-headers">
          <div className="header-cell">FACTURE</div>
          <div className="header-cell">CLIENT</div>
          <div className="header-cell">DATE</div>
          <div className="header-cell">STATUT</div>
          <div className="header-cell">CRÉÉ PAR</div>
          <div className="header-cell">MONTANT</div>
          <div className="header-cell">ACTIONS</div>
        </div>
        
        {/* Contenu */}
        <div className="table-content">
          {filteredFactures.length === 0 ? (
            <div className="no-data">
              <FaFileInvoice className="no-data-icon" />
              <p>Aucune facture trouvée</p>
            </div>
          ) : (
            filteredFactures.map((facture) => (
              <div key={facture.id_facture} className="table-row">
                <div className="table-cell">
                  <strong>{facture.numero_facture}</strong>
                </div>
                <div className="table-cell">
                  <div className="client-info">
                    <div className="client-name">{facture.client_nom || 'N/A'}</div>
                    <div className="client-phone">{facture.client_telephone || ''}</div>
                  </div>
                </div>
                <div className="table-cell">
                  {formatDate(facture.date_facture)}
                </div>
                <div className="table-cell">
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(facture.statut) }}
                  >
                    {getStatusIcon(facture.statut)} {facture.statut}
                  </span>
                </div>
                <div className="table-cell" style={{ color: '#3B82F6', fontWeight: 'bold' }}>
                  {facture.cree_par || 'Système'}
                </div>
                <div className="table-cell">
                  <div className="montant-details">
                    {/* Montant Total TTC (comme Python ligne 869) */}
                    <div className="montant-total">
                      {formatMontant(facture.montant_ttc || 0)}
                    </div>
                    
                    {/* Montant Payé/Avance (comme Python lignes 878-902) */}
                    {(() => {
                      const montantPaye = facture.montant_avance || 0;
                      const montantReste = facture.montant_reste || 0;
                      let textePaiement = '';
                      let couleurPaiement = 'gray';
                      
                      if (montantPaye > 0 && montantReste > 0) {
                        // Avance partiel
                        textePaiement = `Avance: ${formatMontant(montantPaye)}`;
                        couleurPaiement = 'orange';
                      } else if (montantPaye > 0 && montantReste === 0) {
                        // Paiement complet
                        textePaiement = `Payé: ${formatMontant(montantPaye)}`;
                        couleurPaiement = 'green';
                      } else {
                        // Aucun paiement
                        textePaiement = `Payé: 0 FCFA`;
                        couleurPaiement = 'gray';
                      }
                      
                      return (
                        <div style={{ fontSize: '9px', color: couleurPaiement }}>
                          {textePaiement}
                        </div>
                      );
                    })()}
                    
                    {/* Reste à Payer (comme Python lignes 904-915) */}
                    <div style={{ 
                      fontSize: '9px', 
                      color: (facture.montant_reste || 0) > 0 ? 'red' : 'green'
                    }}>
                      Reste: {formatMontant(facture.montant_reste || 0)}
                    </div>
                  </div>
                </div>
                <div className="table-cell">
                  <div className="action-buttons">
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => handleEdit(facture)}
                      title="Modifier"
                      disabled={facture.statut === 'Annulée'}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-sm btn-warning"
                      onClick={() => handleReglement(facture)}
                      title="Règlement"
                      disabled={facture.statut === 'Annulée'}
                    >
                      💵
                    </button>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handlePrintPDF(facture)}
                      title="Voir PDF (puis imprimer si besoin)"
                    >
                      👁️
                    </button>
                    {facture.statut !== 'Annulée' && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleAnnuler(facture)}
                        title="Annuler"
                        style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}
                      >
                        ❌
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(facture)}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      {showForm && (
        <FacturationFormModal
          facture={selectedFacture}
          devis={selectedDevis}
          onClose={() => {
            setShowForm(false);
            setSelectedFacture(null);
            setSelectedDevis(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setSelectedFacture(null);
            setSelectedDevis(null);
            loadFactures();
          }}
        />
      )}

      {showReglementModal && factureForReglement && (
        <ReglementModal
          facture={factureForReglement}
          onClose={() => {
            setShowReglementModal(false);
            setFactureForReglement(null);
          }}
          onSuccess={() => {
            setShowReglementModal(false);
            setFactureForReglement(null);
            loadFactures();
          }}
        />
      )}

      {showDevisModal && (
        <DevisToFactureModal
          onClose={() => setShowDevisModal(false)}
          onSuccess={handleDevisSelected}
        />
      )}
    </div>
  );
}

export default Facturation;
