import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Facturation.css'; // Réutilise le même CSS

const Devis = () => {
  // ==================== ÉTATS ====================
  const [devis, setDevis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [devisSelectionne, setDevisSelectionne] = useState(null);
  
  // Statistiques
  const [stats, setStats] = useState({
    total_devis: 0,
    en_attente: 0,
    acceptes: 0,
    refuses: 0,
    montant_total: 0
  });

  // Formulaire
  const [formData, setFormData] = useState({
    numero_devis: '',
    id_client: '',
    date_devis: new Date().toISOString().split('T')[0],
    date_validite: '',
    statut: 'Brouillon',
    notes: ''
  });

  // Données
  const [clients, setClients] = useState([]);
  const [articles, setArticles] = useState([]);
  const [lignesDevis, setLignesDevis] = useState([]);
  const [articleSelectionne, setArticleSelectionne] = useState('');
  const [quantite, setQuantite] = useState(1);
  
  // Calculs
  const [totaux, setTotaux] = useState({
    total_ht: 0,
    total_tva: 0,
    total_ttc: 0
  });

  const TAUX_TVA = 9.5;

  // ==================== CHARGEMENT ====================
  useEffect(() => {
    chargerDevis();
    chargerClients();
    chargerArticles();
  }, []);

  useEffect(() => {
    calculerTotaux();
  }, [lignesDevis]);

  const chargerDevis = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/devis', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDevis(response.data);
      calculerStatistiques(response.data);
    } catch (error) {
      console.error('Erreur chargement devis:', error);
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
      console.error('Erreur:', error);
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
      console.error('Erreur:', error);
    }
  };

  const genererNumeroDevis = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/devis/generer-numero', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData(prev => ({ ...prev, numero_devis: response.data.numero }));
    } catch (error) {
      const annee = new Date().getFullYear();
      const numero = `DEV-${annee}-${String(devis.length + 1).padStart(3, '0')}`;
      setFormData(prev => ({ ...prev, numero_devis: numero }));
    }
  };

  // ==================== CALCULS ====================
  const calculerStatistiques = (devisData) => {
    const stats = {
      total_devis: devisData.length,
      en_attente: devisData.filter(d => d.statut === 'En attente' || d.statut === 'Brouillon').length,
      acceptes: devisData.filter(d => d.statut === 'Accepté').length,
      refuses: devisData.filter(d => d.statut === 'Refusé').length,
      montant_total: devisData.reduce((sum, d) => sum + parseFloat(d.total_ttc || 0), 0)
    };
    setStats(stats);
  };

  const calculerTotaux = () => {
    const total_ht = lignesDevis.reduce((sum, ligne) => 
      sum + (ligne.prix_unitaire * ligne.quantite), 0
    );
    const total_tva = total_ht * (TAUX_TVA / 100);
    const total_ttc = total_ht + total_tva;

    setTotaux({
      total_ht: total_ht.toFixed(2),
      total_tva: total_tva.toFixed(2),
      total_ttc: total_ttc.toFixed(2)
    });
  };

  // ==================== GESTION ARTICLES ====================
  const ajouterArticle = () => {
    if (!articleSelectionne || quantite <= 0) {
      alert('Veuillez sélectionner un article et une quantité valide');
      return;
    }

    const article = articles.find(a => a.id_article === parseInt(articleSelectionne));
    if (!article) return;

    setLignesDevis([...lignesDevis, {
      id_article: article.id_article,
      designation: article.designation,
      quantite: parseInt(quantite),
      prix_unitaire: parseFloat(article.prix_vente),
      montant_total: parseFloat(article.prix_vente) * parseInt(quantite)
    }]);
    
    setArticleSelectionne('');
    setQuantite(1);
  };

  const supprimerArticle = (index) => {
    setLignesDevis(lignesDevis.filter((_, i) => i !== index));
  };

  const modifierQuantite = (index, nouvelleQuantite) => {
    if (nouvelleQuantite <= 0) return;
    const nouvellesLignes = [...lignesDevis];
    nouvellesLignes[index].quantite = parseInt(nouvelleQuantite);
    nouvellesLignes[index].montant_total = nouvellesLignes[index].prix_unitaire * parseInt(nouvelleQuantite);
    setLignesDevis(nouvellesLignes);
  };

  // ==================== FORMULAIRE ====================
  const ouvrirFormulaireNouveau = () => {
    setDevisSelectionne(null);
    setFormData({
      numero_devis: '',
      id_client: '',
      date_devis: new Date().toISOString().split('T')[0],
      date_validite: '',
      statut: 'Brouillon',
      notes: ''
    });
    setLignesDevis([]);
    genererNumeroDevis();
    setFormulaireOuvert(true);
  };

  const fermerFormulaire = () => {
    setFormulaireOuvert(false);
    setDevisSelectionne(null);
    setLignesDevis([]);
  };

  const enregistrerDevis = async () => {
    if (!formData.id_client || lignesDevis.length === 0) {
      alert('Veuillez sélectionner un client et ajouter au moins un article');
      return;
    }

    const devisData = {
      ...formData,
      total_ht: parseFloat(totaux.total_ht),
      total_tva: parseFloat(totaux.total_tva),
      total_ttc: parseFloat(totaux.total_ttc),
      lignes: lignesDevis
    };

    try {
      const token = localStorage.getItem('token');
      
      if (devisSelectionne) {
        await axios.put(
          `http://localhost:8000/api/devis/${devisSelectionne.id_devis}`,
          devisData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Devis modifié avec succès');
      } else {
        await axios.post(
          'http://localhost:8000/api/devis',
          devisData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Devis créé avec succès');
      }

      fermerFormulaire();
      chargerDevis();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement du devis');
    }
  };

  const supprimerDevis = async (idDevis) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/devis/${idDevis}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Devis supprimé');
      chargerDevis();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const transformerEnFacture = async (idDevis) => {
    if (!window.confirm('Transformer ce devis en facture ?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:8000/api/devis/${idDevis}/transformer-facture`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Devis transformé en facture avec succès !');
      chargerDevis();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la transformation');
    }
  };

  // ==================== RECHERCHE ====================
  const devisFiltres = devis.filter(d =>
    d.numero_devis?.toLowerCase().includes(searchText.toLowerCase()) ||
    d.client?.nom?.toLowerCase().includes(searchText.toLowerCase())
  );

  // ==================== RENDU ====================
  return (
    <div className="facturation-container">
      <h1 className="page-title">📋 Gestion des Devis</h1>

      {/* Barre de contrôle */}
      <div className="control-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Rechercher un devis..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <button className="btn-icon" onClick={chargerDevis}>🔍</button>
        <button className="btn-success" onClick={ouvrirFormulaireNouveau}>
          + Nouveau Devis
        </button>
        <button className="btn-primary" onClick={chargerDevis}>
          🔄 Actualiser
        </button>
      </div>

      {/* Statistiques */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-label">📄 Total Devis</div>
          <div className="stat-value">{stats.total_devis}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">⏳ En Attente</div>
          <div className="stat-value orange">{stats.en_attente}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✅ Acceptés</div>
          <div className="stat-value green">{stats.acceptes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">❌ Refusés</div>
          <div className="stat-value red">{stats.refuses}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">💰 Montant Total</div>
          <div className="stat-value">{stats.montant_total.toLocaleString()} FCFA</div>
        </div>
      </div>

      {/* Tableau */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>DEVIS</th>
              <th>CLIENT</th>
              <th>DATE</th>
              <th>VALIDITÉ</th>
              <th>STATUT</th>
              <th>MONTANT</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{textAlign: 'center'}}>Chargement...</td></tr>
            ) : devisFiltres.length === 0 ? (
              <tr><td colSpan="7" style={{textAlign: 'center'}}>Aucun devis trouvé</td></tr>
            ) : (
              devisFiltres.map(d => {
                let statutClass = 'orange';
                if (d.statut === 'Accepté') statutClass = 'green';
                if (d.statut === 'Refusé') statutClass = 'red';

                return (
                  <tr key={d.id_devis}>
                    <td><strong>{d.numero_devis}</strong></td>
                    <td>{d.client?.nom || 'N/A'}</td>
                    <td>{new Date(d.date_devis).toLocaleDateString('fr-FR')}</td>
                    <td>{d.date_validite ? new Date(d.date_validite).toLocaleDateString('fr-FR') : 'N/A'}</td>
                    <td><span className={`status-badge ${statutClass}`}>{d.statut}</span></td>
                    <td><strong>{parseFloat(d.total_ttc || 0).toLocaleString()} FCFA</strong></td>
                    <td>
                      <button className="btn-icon" onClick={() => transformerEnFacture(d.id_devis)} title="Transformer en facture">
                        🔄
                      </button>
                      <button className="btn-icon" onClick={() => supprimerDevis(d.id_devis)} title="Supprimer">
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{devisSelectionne ? 'Modifier le Devis' : 'Nouveau Devis'}</h2>
              <button className="btn-close" onClick={fermerFormulaire}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Numéro de Devis *</label>
                  <input
                    type="text"
                    value={formData.numero_devis}
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={formData.date_devis}
                    onChange={(e) => setFormData({...formData, date_devis: e.target.value})}
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
                    <option value="Brouillon">Brouillon</option>
                    <option value="En attente">En attente</option>
                    <option value="Accepté">Accepté</option>
                    <option value="Refusé">Refusé</option>
                  </select>
                </div>
              </div>

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

              {lignesDevis.length > 0 && (
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
                      {lignesDevis.map((ligne, index) => (
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
                            <button className="btn-icon" onClick={() => supprimerArticle(index)}>
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="totaux-section">
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
              <button className="btn-success" onClick={enregistrerDevis}>
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

export default Devis;