import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './Comptoir.css';
import { confirmClearCart, confirmDelete, showError, showSuccessWithDetails } from '../utils/sweetAlertHelper';

const Comptoir = () => {
  // ==================== ÉTATS ====================
  const [articles, setArticles] = useState([]);
  const [panier, setPanier] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [categories, setCategories] = useState([]);
  const [categorieSelectionnee, setCategorieSelectionnee] = useState('Toutes');
  
  // 🔥 HISTORIQUE DES VENTES
  const [afficherHistorique, setAfficherHistorique] = useState(false);
  const [ventesHistorique, setVentesHistorique] = useState([]);
  const [loadingHistorique, setLoadingHistorique] = useState(false);

  // Client et paiement
  const [nomClient, setNomClient] = useState('');
  const [modePaiement, setModePaiement] = useState('Espèces');
  const [montantRecu, setMontantRecu] = useState('');

  // Calculs
  const [totaux, setTotaux] = useState({
    total_ht: 0,
    total_tva: 0,
    total_ttc: 0,
    monnaie: 0
  });

  const TAUX_TVA = 9.5;

  // ==================== CHARGEMENT ====================
  useEffect(() => {
    chargerArticles();
  }, []);

  useEffect(() => {
    calculerTotaux();
  }, [panier, montantRecu]);

  useEffect(() => {
    extraireCategories();
  }, [articles]);

  const chargerArticles = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/articles');
      setArticles(response.data);
    } catch (error) {
      console.error('Erreur chargement articles:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 CHARGER L'HISTORIQUE DES VENTES
  const chargerHistoriqueVentes = async () => {
    setLoadingHistorique(true);
    try {
      const response = await api.get('/api/comptoir/ventes', { params: { limit: 50 } });
      setVentesHistorique(response.data);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      showError('Erreur lors du chargement de l\'historique');
    } finally {
      setLoadingHistorique(false);
    }
  };

  // Ouvrir l'historique
  const ouvrirHistorique = () => {
    setAfficherHistorique(true);
    chargerHistoriqueVentes();
  };

  // Fermer l'historique
  const fermerHistorique = () => {
    setAfficherHistorique(false);
  };

  // Supprimer une vente
  const supprimerVente = async (idVente, numeroVente) => {
    const confirmed = await confirmDelete(`la vente ${numeroVente}<br><small>Le stock sera restauré.</small>`);
    if (!confirmed) return;

    try {
      await api.delete(`/api/comptoir/ventes/${idVente}`);
      showSuccessWithDetails('Vente supprimée !', 'La vente a été supprimée et le stock a été restauré.');
      chargerHistoriqueVentes(); // Recharger l'historique
    } catch (error) {
      console.error('Erreur suppression:', error);
      showError('Erreur lors de la suppression de la vente');
    }
  };

  const extraireCategories = () => {
    const cats = ['Toutes', ...new Set(articles.map(a => a.categorie).filter(Boolean))];
    setCategories(cats);
  };

  // ==================== CALCULS ====================
  const calculerTotaux = () => {
    const total_ht = panier.reduce((sum, item) => 
      sum + (item.prix_unitaire * item.quantite), 0
    );
    const total_tva = total_ht * (TAUX_TVA / 100);
    const total_ttc = total_ht + total_tva;
    const monnaie = parseFloat(montantRecu || 0) - total_ttc;

    setTotaux({
      total_ht: total_ht.toFixed(2),
      total_tva: total_tva.toFixed(2),
      total_ttc: total_ttc.toFixed(2),
      monnaie: monnaie.toFixed(2)
    });
  };

  // ==================== GESTION PANIER ====================
  const ajouterAuPanier = (article) => {
    const existant = panier.find(p => p.id_article === article.id_article);
    
    if (existant) {
      setPanier(panier.map(p => 
        p.id_article === article.id_article
          ? { ...p, quantite: p.quantite + 1, montant_total: (p.quantite + 1) * p.prix_unitaire }
          : p
      ));
    } else {
      setPanier([...panier, {
        id_article: article.id_article,
        designation: article.designation,
        prix_unitaire: parseFloat(article.prix_vente),
        quantite: 1,
        montant_total: parseFloat(article.prix_vente)
      }]);
    }
  };

  const modifierQuantite = (idArticle, nouvelleQuantite) => {
    if (nouvelleQuantite <= 0) {
      setPanier(panier.filter(p => p.id_article !== idArticle));
      return;
    }

    setPanier(panier.map(p => 
      p.id_article === idArticle
        ? { ...p, quantite: parseInt(nouvelleQuantite), montant_total: p.prix_unitaire * parseInt(nouvelleQuantite) }
        : p
    ));
  };

  const retirerDuPanier = (idArticle) => {
    setPanier(panier.filter(p => p.id_article !== idArticle));
  };

  const viderPanier = async () => {
    const confirmed = await confirmClearCart();
    if (confirmed) {
      setPanier([]);
      setNomClient('');
      setMontantRecu('');
    }
  };

  // ==================== PAIEMENT ====================
  const validerVente = async () => {
    if (panier.length === 0) {
      showError('Le panier est vide');
      return;
    }

    if (modePaiement === 'Espèces' && parseFloat(totaux.monnaie) < 0) {
      showError('Montant reçu insuffisant');
      return;
    }

    const venteData = {
      nom_client: nomClient || 'Client Comptoir',
      mode_paiement: modePaiement,
      montant_recu: parseFloat(montantRecu || totaux.total_ttc),
      total_ht: parseFloat(totaux.total_ht),
      total_tva: parseFloat(totaux.total_tva),
      total_ttc: parseFloat(totaux.total_ttc),
      lignes: panier,
      type_vente: 'COMPTOIR'
    };

    try {
      const response = await api.post('/api/comptoir/vente', venteData);
      
      showSuccessWithDetails(
        '✅ Vente enregistrée !',
        `
          <div style="text-align: left; margin: 10px 0;">
            <strong>Total:</strong> ${parseFloat(totaux.total_ttc).toLocaleString()} FCFA<br>
            <strong>Reçu:</strong> ${parseFloat(montantRecu || totaux.total_ttc).toLocaleString()} FCFA<br>
            <strong>Monnaie:</strong> ${parseFloat(totaux.monnaie).toLocaleString()} FCFA
          </div>
        `
      );
      
      // Réinitialiser
      setPanier([]);
      setNomClient('');
      setMontantRecu('');
      setModePaiement('Espèces');
    } catch (error) {
      console.error('Erreur:', error);
      showError('Erreur lors de l\'enregistrement de la vente');
    }
  };

  // ==================== FILTRES ====================
  const articlesFiltres = articles.filter(a => {
    const matchRecherche = a.designation?.toLowerCase().includes(searchText.toLowerCase()) ||
                          a.code_article?.toLowerCase().includes(searchText.toLowerCase());
    const matchCategorie = categorieSelectionnee === 'Toutes' || a.categorie === categorieSelectionnee;
    return matchRecherche && matchCategorie;
  });

  // ==================== RENDU ====================
  return (
    <div className="comptoir-container">
      {/* Header avec bouton Historique */}
      <div className="page-header">
        <h1 className="page-title">🛒 Point de Vente (Comptoir)</h1>
        <button className="btn-historique" onClick={ouvrirHistorique}>
          📊 Historique des Ventes
        </button>
      </div>

      <div className="comptoir-layout">
        {/* GAUCHE - Liste des articles */}
        <div className="articles-section">
          <div className="section-header">
            <h2>Articles Disponibles</h2>
          </div>

          {/* Recherche et filtres */}
          <div className="control-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Rechercher un article..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          {/* Catégories */}
          <div className="categories">
            {categories.map(cat => (
              <button
                key={cat}
                className={`btn-categorie ${categorieSelectionnee === cat ? 'active' : ''}`}
                onClick={() => setCategorieSelectionnee(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grille d'articles */}
          <div className="articles-grid">
            {loading ? (
              <p>Chargement...</p>
            ) : articlesFiltres.length === 0 ? (
              <p>Aucun article trouvé</p>
            ) : (
              articlesFiltres.map(article => (
                <div 
                  key={article.id_article} 
                  className="article-card"
                  onClick={() => ajouterAuPanier(article)}
                >
                  <div className="article-icon">📦</div>
                  <div className="article-nom">{article.designation}</div>
                  <div className="article-prix">{parseFloat(article.prix_vente).toLocaleString()} FCFA</div>
                  <div className="article-stock">Stock: {article.stock_actuel || 0}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* DROITE - Panier et Paiement */}
        <div className="panier-section">
          <div className="section-header">
            <h2>🛍️ Panier</h2>
            {panier.length > 0 && (
              <button className="btn-danger-small" onClick={viderPanier}>
                🗑️ Vider
              </button>
            )}
          </div>

          {/* Client */}
          <div className="form-group">
            <label>Client (optionnel)</label>
            <input
              type="text"
              value={nomClient}
              onChange={(e) => setNomClient(e.target.value)}
              placeholder="Nom du client..."
            />
          </div>

          {/* Liste du panier */}
          <div className="panier-liste">
            {panier.length === 0 ? (
              <div className="panier-vide">
                <p>Le panier est vide</p>
                <p style={{fontSize: '12px', color: '#666'}}>Cliquez sur un article pour l'ajouter</p>
              </div>
            ) : (
              panier.map(item => (
                <div key={item.id_article} className="panier-item">
                  <div className="panier-item-nom">{item.designation}</div>
                  <div className="panier-item-prix">{item.prix_unitaire.toLocaleString()} FCFA</div>
                  <div className="panier-item-qte">
                    <button 
                      className="btn-qte"
                      onClick={() => modifierQuantite(item.id_article, item.quantite - 1)}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={item.quantite}
                      onChange={(e) => modifierQuantite(item.id_article, e.target.value)}
                      className="input-qte"
                    />
                    <button 
                      className="btn-qte"
                      onClick={() => modifierQuantite(item.id_article, item.quantite + 1)}
                    >
                      +
                    </button>
                  </div>
                  <div className="panier-item-total">
                    <strong>{item.montant_total.toLocaleString()} FCFA</strong>
                  </div>
                  <button 
                    className="btn-retirer"
                    onClick={() => retirerDuPanier(item.id_article)}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Totaux */}
          {panier.length > 0 && (
            <>
              <div className="totaux-comptoir">
                <div className="total-ligne">
                  <span>Total HT:</span>
                  <strong>{parseFloat(totaux.total_ht).toLocaleString()} FCFA</strong>
                </div>
                <div className="total-ligne">
                  <span>TVA (9.5%):</span>
                  <strong>{parseFloat(totaux.total_tva).toLocaleString()} FCFA</strong>
                </div>
                <div className="total-ligne highlight">
                  <span>Total TTC:</span>
                  <strong style={{fontSize: '20px'}}>
                    {parseFloat(totaux.total_ttc).toLocaleString()} FCFA
                  </strong>
                </div>
              </div>

              {/* Paiement */}
              <div className="paiement-section">
                <div className="form-group">
                  <label>Mode de Paiement</label>
                  <select
                    value={modePaiement}
                    onChange={(e) => setModePaiement(e.target.value)}
                  >
                    <option value="Espèces">Espèces</option>
                    <option value="Carte">Carte Bancaire</option>
                    <option value="Mobile">Mobile Money</option>
                    <option value="Chèque">Chèque</option>
                  </select>
                </div>

                {modePaiement === 'Espèces' && (
                  <>
                    <div className="form-group">
                      <label>Montant Reçu</label>
                      <input
                        type="number"
                        value={montantRecu}
                        onChange={(e) => setMontantRecu(e.target.value)}
                        placeholder="Montant reçu..."
                      />
                    </div>

                    {montantRecu && (
                      <div className="monnaie-display">
                        <span>Monnaie à rendre:</span>
                        <strong style={{
                          fontSize: '18px',
                          color: parseFloat(totaux.monnaie) < 0 ? '#dc3545' : '#28a745'
                        }}>
                          {parseFloat(totaux.monnaie).toLocaleString()} FCFA
                        </strong>
                      </div>
                    )}
                  </>
                )}

                <button 
                  className="btn-valider-vente"
                  onClick={validerVente}
                >
                  ✓ Valider la Vente
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 🔥 MODAL HISTORIQUE DES VENTES */}
      {afficherHistorique && (
        <div className="modal-overlay" onClick={fermerHistorique}>
          <div className="modal-historique" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 Historique des Ventes Comptoir</h2>
              <button className="btn-close" onClick={fermerHistorique}>✕</button>
            </div>

            <div className="modal-body">
              {loadingHistorique ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p>Chargement de l'historique...</p>
                </div>
              ) : ventesHistorique.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p>Aucune vente enregistrée</p>
                </div>
              ) : (
                <div className="historique-liste">
                  {ventesHistorique.map(vente => (
                    <div key={vente.id_vente} className="vente-card">
                      <div className="vente-header">
                        <div>
                          <strong className="vente-numero">{vente.numero_vente}</strong>
                          <span className="vente-date">
                            {new Date(vente.date_vente).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <div className="vente-montant">
                          {vente.montant_total.toLocaleString()} FCFA
                        </div>
                      </div>

                      <div className="vente-details">
                        <div className="vente-info">
                          <span>💳 {vente.mode_paiement}</span>
                          {vente.notes && <span>📝 {vente.notes}</span>}
                        </div>

                        {/* Liste des articles */}
                        <div className="vente-articles">
                          <strong>Articles :</strong>
                          {vente.lignes && vente.lignes.length > 0 ? (
                            <ul>
                              {vente.lignes.map(ligne => (
                                <li key={ligne.id_ligne}>
                                  {ligne.article_nom} × {ligne.quantite} = {ligne.total_ht.toLocaleString()} FCFA
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p style={{ fontSize: '12px', color: '#999' }}>Aucun article</p>
                          )}
                        </div>
                      </div>

                      <div className="vente-actions">
                        <button 
                          className="btn-danger-small"
                          onClick={() => supprimerVente(vente.id_vente, vente.numero_vente)}
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comptoir;