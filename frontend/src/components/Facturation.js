import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Facturation.css';

const FacturationComplete = () => {
  // ==================== ÉTATS ====================
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [factureSelectionnee, setFactureSelectionnee] = useState(null);
  
  // Statistiques
  const [stats, setStats] = useState({
    factures_jour: 0,
    montant_jour: 0,
    montant_paye: 0,
    montant_restant: 0,
    creances: 0
  });

  // Formulaire
  const [formData, setFormData] = useState({
    numero_facture: '',
    id_client: '',
    date_facture: new Date().toISOString().split('T')[0],
    date_echeance: '',
    statut: 'En attente',
    mode_paiement: 'Espèces',
    notes: '',
    montant_avance: 0
  });

  // Données pour les dropdowns
  const [clients, setClients] = useState([]);
  const [articles, setArticles] = useState([]);
  
  // Articles de la facture
  const [lignesFacture, setLignesFacture] = useState([]);
  const [articleSelectionne, setArticleSelectionne] = useState('');
  const [quantite, setQuantite] = useState(1);
  
  // Calculs
  const [totaux, setTotaux] = useState({
    total_ht: 0,
    total_tva: 0,
    total_ttc: 0,
    reste_a_payer: 0
  });

  const [precompte, setPrecompte] = useState(false);
  const TAUX_TVA = 9.5;
  const TAUX_PRECOMPTE = 9.5;

  // ==================== CHARGEMENT INITIAL ====================
  useEffect(() => {
    chargerFactures();
    chargerClients();
    chargerArticles();
  }, []);

  useEffect(() => {
    calculerTotaux();
  }, [lignesFacture, formData.montant_avance, precompte]);

  // ==================== FONCTIONS DE CHARGEMENT ====================
  const chargerFactures = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/factures', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFactures(response.data);
      calculerStatistiques(response.data);
    } catch (error) {
      console.error('Erreur chargement factures:', error);
      alert('Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
    }
  };

  const chargerClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/clients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(response.data);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  };

  const chargerArticles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/articles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setArticles(response.data);
    } catch (error) {
      console.error('Erreur chargement articles:', error);
    }
  };

  const genererNumeroFacture = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/factures/generer-numero', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData(prev => ({ ...prev, numero_facture: response.data.numero }));
    } catch (error) {
      console.error('Erreur génération numéro:', error);
      // Génération locale en cas d'erreur
      const annee = new Date().getFullYear();
      const numero = `FAC-${annee}-${String(factures.length + 1).padStart(3, '0')}`;
      setFormData(prev => ({ ...prev, numero_facture: numero }));
    }
  };

  // ==================== CALCULS ====================
  const calculerStatistiques = (facturesData) => {
    const aujourdhui = new Date().toISOString().split('T')[0];
    
    let factures_jour = 0;
    let montant_jour = 0;
    let montant_paye = 0;
    let montant_restant = 0;
    let creances = 0;

    facturesData.forEach(facture => {
      const dateFacture = facture.date_facture?.split('T')[0];
      const montantTTC = parseFloat(facture.total_ttc || 0);
      const avance = parseFloat(facture.montant_avance || 0);
      const reste = montantTTC - avance;

      if (facture.statut !== 'Annulée') {
        if (dateFacture === aujourdhui) {
          factures_jour++;
          montant_jour += avance;
        }
        
        montant_paye += avance;
        montant_restant += reste;
        
        if (reste > 0) {
          creances += reste;
        }
      }
    });

    setStats({
      factures_jour,
      montant_jour,
      montant_paye,
      montant_restant,
      creances
    });
  };

  const calculerTotaux = () => {
    let total_ht = 0;
    
    lignesFacture.forEach(ligne => {
      total_ht += ligne.prix_unitaire * ligne.quantite;
    });

    const total_tva = total_ht * (TAUX_TVA / 100);
    let total_ttc = total_ht + total_tva;

    if (precompte) {
      const montant_precompte = total_ht * (TAUX_PRECOMPTE / 100);
      total_ttc -= montant_precompte;
    }

    const reste_a_payer = total_ttc - (parseFloat(formData.montant_avance) || 0);

    setTotaux({
      total_ht: total_ht.toFixed(2),
      total_tva: total_tva.toFixed(2),
      total_ttc: total_ttc.toFixed(2),
      reste_a_payer: reste_a_payer.toFixed(2)
    });
  };

  // ==================== GESTION DES ARTICLES ====================
  const ajouterArticle = () => {
    if (!articleSelectionne || quantite <= 0) {
      alert('Veuillez sélectionner un article et une quantité valide');
      return;
    }

    const article = articles.find(a => a.id_article === parseInt(articleSelectionne));
    if (!article) return;

    const nouvelleLigne = {
      id_article: article.id_article,
      designation: article.designation,
      quantite: parseInt(quantite),
      prix_unitaire: parseFloat(article.prix_vente),
      montant_total: parseFloat(article.prix_vente) * parseInt(quantite)
    };

    setLignesFacture([...lignesFacture, nouvelleLigne]);
    setArticleSelectionne('');
    setQuantite(1);
  };

  const supprimerArticle = (index) => {
    const nouvellesLignes = lignesFacture.filter((_, i) => i !== index);
    setLignesFacture(nouvellesLignes);
  };

  const modifierQuantite = (index, nouvelleQuantite) => {
    if (nouvelleQuantite <= 0) return;
    
    const nouvellesLignes = [...lignesFacture];
    nouvellesLignes[index].quantite = parseInt(nouvelleQuantite);
    nouvellesLignes[index].montant_total = nouvellesLignes[index].prix_unitaire * parseInt(nouvelleQuantite);
    setLignesFacture(nouvellesLignes);
  };

  // ==================== GESTION DU FORMULAIRE ====================
  const ouvrirFormulaireNouvelle = () => {
    setFactureSelectionnee(null);
    setFormData({
      numero_facture: '',
      id_client: '',
      date_facture: new Date().toISOString().split('T')[0],
      date_echeance: '',
      statut: 'En attente',
      mode_paiement: 'Espèces',
      notes: '',
      montant_avance: 0
    });
    setLignesFacture([]);
    setPrecompte(false);
    genererNumeroFacture();
    setFormulaireOuvert(true);
  };

  const ouvrirFormulaireModification = (facture) => {
    setFactureSelectionnee(facture);
    setFormData({
      numero_facture: facture.numero_facture,
      id_client: facture.id_client,
      date_facture: facture.date_facture?.split('T')[0],
      date_echeance: facture.date_echeance?.split('T')[0] || '',
      statut: facture.statut,
      mode_paiement: facture.mode_paiement || 'Espèces',
      notes: facture.notes || '',
      montant_avance: facture.montant_avance || 0
    });
    // Charger les lignes de la facture
    chargerLignesFacture(facture.id_facture);
    setFormulaireOuvert(true);
  };

  const chargerLignesFacture = async (idFacture) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8000/api/factures/${idFacture}/lignes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLignesFacture(response.data);
    } catch (error) {
      console.error('Erreur chargement lignes:', error);
    }
  };

  const fermerFormulaire = () => {
    setFormulaireOuvert(false);
    setFactureSelectionnee(null);
    setLignesFacture([]);
  };

  const enregistrerFacture = async () => {
    if (!formData.id_client || lignesFacture.length === 0) {
      alert('Veuillez sélectionner un client et ajouter au moins un article');
      return;
    }

    const factureData = {
      ...formData,
      total_ht: parseFloat(totaux.total_ht),
      total_tva: parseFloat(totaux.total_tva),
      total_ttc: parseFloat(totaux.total_ttc),
      lignes: lignesFacture
    };

    try {
      const token = localStorage.getItem('token');
      
      if (factureSelectionnee) {
        // Modification
        await axios.put(
          `http://localhost:8000/api/factures/${factureSelectionnee.id_facture}`,
          factureData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Facture modifiée avec succès');
      } else {
        // Création
        await axios.post(
          'http://localhost:8000/api/factures',
          factureData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Facture créée avec succès');
      }

      fermerFormulaire();
      chargerFactures();
    } catch (error) {
      console.error('Erreur enregistrement:', error);
      alert('Erreur lors de l\'enregistrement de la facture');
    }
  };

  const supprimerFacture = async (idFacture) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/factures/${idFacture}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Facture supprimée avec succès');
      chargerFactures();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression de la facture');
    }
  };

  // ==================== RECHERCHE ET FILTRAGE ====================
  // 🔥 SYSTÈME SÉPARÉ : Affiche SEULEMENT les factures clients (pas les ventes comptoir)
  const facturesFiltrees = factures.filter(f => {
    // Exclure les ventes comptoir et retours (ils ont leur propre système)
    const estFactureClient = !f.type_facture || f.type_facture === 'NORMALE';
    
    // Filtre par texte de recherche
    const matchSearch = f.numero_facture?.toLowerCase().includes(searchText.toLowerCase()) ||
                       f.client?.nom?.toLowerCase().includes(searchText.toLowerCase());
    
    return estFactureClient && matchSearch;
  });

  // ==================== RENDU ====================
  return (
    <div className="facturation-container">
      <h1 className="page-title">📄 Gestion de la Facturation</h1>

      {/* Barre de contrôle */}
      <div className="control-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Rechercher une facture..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <button className="btn-icon" onClick={chargerFactures}>🔍</button>
        <button className="btn-success" onClick={ouvrirFormulaireNouvelle}>
          + Nouvelle Facture
        </button>
        <button className="btn-primary" onClick={chargerFactures}>
          🔄 Actualiser
        </button>
      </div>

      {/* Cartes de statistiques */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-label">📅 Factures du Jour</div>
          <div className="stat-value">{stats.factures_jour}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">💰 CA du Jour</div>
          <div className="stat-value">{stats.montant_jour.toLocaleString()} FCFA</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✅ Déjà Payé</div>
          <div className="stat-value green">{stats.montant_paye.toLocaleString()} FCFA</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">⏳ Reste à Payer</div>
          <div className="stat-value orange">{stats.montant_restant.toLocaleString()} FCFA</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">💳 Créances</div>
          <div className="stat-value red">{stats.creances.toLocaleString()} FCFA</div>
        </div>
      </div>

      {/* Tableau des factures CLIENTS uniquement */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>FACTURE</th>
              <th>CLIENT</th>
              <th>DATE</th>
              <th>STATUT</th>
              <th>MONTANT</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>Chargement...</td></tr>
            ) : facturesFiltrees.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>Aucune facture trouvée</td></tr>
            ) : (
              facturesFiltrees.map(facture => {
                const montantTTC = parseFloat(facture.total_ttc || 0);
                const avance = parseFloat(facture.montant_avance || 0);
                const reste = montantTTC - avance;
                
                let statut = '';
                let couleurStatut = '';
                
                if (facture.statut === 'Annulée') {
                  statut = '❌ Annulée';
                  couleurStatut = 'red';
                } else if (avance === 0) {
                  statut = '⏳ En attente';
                  couleurStatut = 'orange';
                } else if (reste > 0) {
                  statut = '⚠️ Partielle';
                  couleurStatut = 'orange';
                } else {
                  statut = '✅ Payée';
                  couleurStatut = 'green';
                }

                return (
                  <tr key={facture.id_facture}>
                    <td>
                      <strong>{facture.numero_facture}</strong>
                    </td>
                    <td>{facture.client?.nom || 'N/A'}</td>
                    <td>{new Date(facture.date_facture).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <span className={`status-badge ${couleurStatut}`}>{statut}</span>
                    </td>
                    <td>
                      <div><strong>{montantTTC.toLocaleString()} FCFA</strong></div>
                      <div style={{fontSize: '12px', color: '#666'}}>
                        Payé: {avance.toLocaleString()} | Reste: {reste.toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <button 
                        className="btn-icon"
                        onClick={() => ouvrirFormulaireModification(facture)}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-icon"
                        onClick={() => supprimerFacture(facture.id_facture)}
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

      {/* Formulaire Modal */}
      {formulaireOuvert && (
        <div className="modal-overlay" onClick={fermerFormulaire}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{factureSelectionnee ? 'Modifier la Facture' : 'Nouvelle Facture'}</h2>
              <button className="btn-close" onClick={fermerFormulaire}>✕</button>
            </div>

            <div className="modal-body">
              {/* Informations générales */}
              <div className="form-row">
                <div className="form-group">
                  <label>Numéro de Facture *</label>
                  <input
                    type="text"
                    value={formData.numero_facture}
                    onChange={(e) => setFormData({...formData, numero_facture: e.target.value})}
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={formData.date_facture}
                    onChange={(e) => setFormData({...formData, date_facture: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Client *</label>
                  <select
                    value={formData.id_client}
                    onChange={(e) => setFormData({...formData, id_client: e.target.value})}
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map(client => (
                      <option key={client.id_client} value={client.id_client}>
                        {client.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Statut</label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({...formData, statut: e.target.value})}
                  >
                    <option value="En attente">En attente</option>
                    <option value="Payée">Payée</option>
                    <option value="Annulée">Annulée</option>
                  </select>
                </div>
              </div>

              {/* Ajout d'articles */}
              <div className="section-title">Articles</div>
              <div className="form-row">
                <div className="form-group" style={{flex: 2}}>
                  <label>Article</label>
                  <select
                    value={articleSelectionne}
                    onChange={(e) => setArticleSelectionne(e.target.value)}
                  >
                    <option value="">Sélectionner un article</option>
                    {articles.map(article => (
                      <option key={article.id_article} value={article.id_article}>
                        {article.designation} - {article.prix_vente} FCFA
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantité</label>
                  <input
                    type="number"
                    min="1"
                    value={quantite}
                    onChange={(e) => setQuantite(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>&nbsp;</label>
                  <button className="btn-success" onClick={ajouterArticle}>
                    + Ajouter
                  </button>
                </div>
              </div>

              {/* Liste des articles */}
              {lignesFacture.length > 0 && (
                <div className="articles-list">
                  <table className="mini-table">
                    <thead>
                      <tr>
                        <th>Article</th>
                        <th>Prix U.</th>
                        <th>Qté</th>
                        <th>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lignesFacture.map((ligne, index) => (
                        <tr key={index}>
                          <td>{ligne.designation}</td>
                          <td>{ligne.prix_unitaire.toLocaleString()} FCFA</td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              value={ligne.quantite}
                              onChange={(e) => modifierQuantite(index, e.target.value)}
                              style={{width: '60px'}}
                            />
                          </td>
                          <td><strong>{ligne.montant_total.toLocaleString()} FCFA</strong></td>
                          <td>
                            <button 
                              className="btn-icon"
                              onClick={() => supprimerArticle(index)}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totaux */}
              <div className="totaux-section">
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={precompte}
                        onChange={(e) => setPrecompte(e.target.checked)}
                      />
                      {' '}Appliquer le précompte (9.5%)
                    </label>
                  </div>
                </div>

                <div className="totaux-grid">
                  <div className="totaux-item">
                    <span>Total HT:</span>
                    <strong>{parseFloat(totaux.total_ht).toLocaleString()} FCFA</strong>
                  </div>
                  <div className="totaux-item">
                    <span>TVA (9.5%):</span>
                    <strong>{parseFloat(totaux.total_tva).toLocaleString()} FCFA</strong>
                  </div>
                  <div className="totaux-item highlight">
                    <span>Total TTC:</span>
                    <strong>{parseFloat(totaux.total_ttc).toLocaleString()} FCFA</strong>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Montant Payé (Avance)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.montant_avance}
                      onChange={(e) => setFormData({...formData, montant_avance: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Reste à Payer</label>
                    <input
                      type="text"
                      value={`${parseFloat(totaux.reste_a_payer).toLocaleString()} FCFA`}
                      readOnly
                      style={{fontWeight: 'bold', color: '#ff6b35'}}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="3"
                    placeholder="Notes ou commentaires..."
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-success" onClick={enregistrerFacture}>
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

export default FacturationComplete;
