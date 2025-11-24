import React, { useState, useEffect } from 'react';
import { FaPlus, FaSync, FaClipboardCheck, FaPlay, FaTimes } from 'react-icons/fa';
import { articleService } from '../services/api';
import { toast } from 'react-toastify';
import { confirmStartInventory, confirmCancelInventory, confirmAction } from '../utils/sweetAlertHelper';
import '../styles/CommonPages.css';

function Inventaire() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inventaireData, setInventaireData] = useState({});
  const [inventaireEnCours, setInventaireEnCours] = useState(false); // État de l'inventaire

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      console.log('📥 Chargement des articles...');
      
      // Pour l'inventaire, on veut uniquement les articles ACTIFS (pas les supprimés)
      // Par défaut, getAll() exclut les articles inactifs (inclure_inactifs: false)
      const articlesData = await articleService.getAll();
      console.log('📦 Articles reçus:', articlesData);
      
      const tousArticles = articlesData || [];
      console.log(`📊 Total articles (actifs uniquement): ${tousArticles.length}`);
      
      // Afficher les types d'articles
      const types = {};
      tousArticles.forEach(a => {
        const type = a.type_article || 'NULL';
        types[type] = (types[type] || 0) + 1;
      });
      console.log('📋 Types d\'articles:', types);
      
      // Filtrer uniquement les produits (déjà actifs car getAll() les filtre)
      const produits = tousArticles.filter(a => a.type_article === 'PRODUIT');
      console.log(`✅ Produits filtrés (actifs uniquement): ${produits.length}`, produits);
      
      setArticles(produits);
      
      // Initialiser les données d'inventaire
      const initData = {};
      produits.forEach(a => {
        initData[a.id_article] = {
          stock_theorique: a.stock_actuel,
          stock_reel: a.stock_actuel,
          ecart: 0
        };
      });
      setInventaireData(initData);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur chargement articles:', error);
      setLoading(false);
    }
  };

  const updateStockReel = (id_article, valeur) => {
    const stock_reel = parseInt(valeur) || 0;
    const stock_theorique = inventaireData[id_article]?.stock_theorique || 0;
    const ecart = stock_reel - stock_theorique;

    console.log(`📊 Mise à jour article ${id_article}: stock_reel=${stock_reel}, écart=${ecart}`);

    setInventaireData({
      ...inventaireData,
      [id_article]: {
        ...inventaireData[id_article],
        stock_reel,
        ecart
      }
    });
  };

  const demarrerInventaire = async () => {
    console.log('🎯 Démarrage inventaire, articles:', articles.length);
    
    const confirmed = await confirmStartInventory();
    if (confirmed) {
      // Initialiser les quantités réelles au stock actuel
      const initData = {};
      articles.forEach(a => {
        initData[a.id_article] = {
          stock_theorique: a.stock_actuel || 0,
          stock_reel: 0,  // Commencer à 0 pour forcer la saisie
          ecart: -(a.stock_actuel || 0)
        };
      });
      
      console.log('📝 Données initialisées:', initData);
      setInventaireData(initData);
      setInventaireEnCours(true);
      
      toast.success('✅ Inventaire démarré ! Saisissez les quantités réelles.', {
        autoClose: 3000,
        position: "top-center"
      });
    }
  };

  const annulerInventaire = async () => {
    const confirmed = await confirmCancelInventory();
    if (confirmed) {
      setInventaireEnCours(false);
      
      // Réinitialiser les données
      const initData = {};
      articles.forEach(a => {
        initData[a.id_article] = {
          stock_theorique: a.stock_actuel || 0,
          stock_reel: a.stock_actuel || 0,
          ecart: 0
        };
      });
      setInventaireData(initData);
      
      toast.info('Inventaire annulé');
    }
  };

  const validerInventaire = async () => {
    // Récupérer les articles avec écarts
    const articlesAvecEcarts = Object.entries(inventaireData)
      .filter(([id, data]) => data.ecart !== 0)
      .map(([id, data]) => ({
        id_article: parseInt(id),
        quantite_reelle: data.stock_reel,
        stock_systeme: data.stock_theorique
      }));
    
    if (articlesAvecEcarts.length === 0) {
      toast.info('Aucun écart d\'inventaire détecté');
      return;
    }

    const confirmed = await confirmAction(
      'Valider l\'inventaire ?',
      `Les écarts seront appliqués au stock et des mouvements d'ajustement seront créés.<br><strong>${articlesAvecEcarts.length} article(s) à ajuster.</strong>`,
      'Oui, valider',
      'question'
    );
    if (!confirmed) return;

    try {
      const response = await fetch('http://localhost:8000/api/inventaire/valider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ articles: articlesAvecEcarts })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || `Inventaire validé ! ${result.ajustements} ajustement(s) créé(s)`);
        
        // Réinitialiser
        setInventaireEnCours(false);
        loadArticles();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erreur lors de la validation');
      }
    } catch (error) {
      console.error('Erreur validation inventaire:', error);
      toast.error('Erreur lors de la validation de l\'inventaire');
    }
  };

  if (loading) {
    return <div className="page-loading"><div className="spinner"></div></div>;
  }

  // Calcul du résumé (comme Python ligne 405-427)
  const articlesVerifies = Object.values(inventaireData).filter(d => d.stock_reel >= 0).length;
  const excedents = Object.values(inventaireData).filter(d => d.ecart > 0).length;
  const manquants = Object.values(inventaireData).filter(d => d.ecart < 0).length;

  return (
    <div className="page-container">
      <div className="page-header card">
        <div>
          <h1>📊 Inventaire du Stock</h1>
          <p className="page-subtitle">Vérifiez et ajustez vos quantités en stock</p>
        </div>
      </div>

      {/* Barre de contrôle avec boutons (comme Python ligne 53-114) */}
      <div className="control-bar card">
        <div className="action-buttons">
          {!inventaireEnCours ? (
            <>
              <button 
                className="btn btn-success" 
                onClick={demarrerInventaire}
                style={{ fontSize: '16px', padding: '12px 24px' }}
              >
                <FaPlay /> Démarrer Inventaire
              </button>
              <button className="btn btn-secondary" onClick={loadArticles}>
                <FaSync /> Actualiser
              </button>
            </>
          ) : (
            <>
              <div style={{ 
                flex: 1, 
                backgroundColor: '#10B981', 
                padding: '12px 20px', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginRight: '15px',
                animation: 'pulse 2s infinite'
              }}>
                <FaClipboardCheck style={{ fontSize: '20px' }} />
                <strong style={{ fontSize: '16px' }}>
                  🔄 INVENTAIRE EN COURS - Saisissez les quantités réelles
                </strong>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={validerInventaire}
                style={{ fontSize: '16px', padding: '12px 24px' }}
              >
                <FaClipboardCheck /> Valider et Ajuster
              </button>
              <button 
                className="btn btn-danger" 
                onClick={annulerInventaire}
                style={{ fontSize: '16px', padding: '12px 24px' }}
              >
                <FaTimes /> Annuler
              </button>
            </>
          )}
        </div>
      </div>

      <div className="table-container card">
        {inventaireEnCours && (
          <div style={{
            backgroundColor: '#10B981',
            color: '#fff',
            padding: '10px 20px',
            marginBottom: '10px',
            borderRadius: '8px',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            ✏️ MODE ÉDITION ACTIF - Cliquez dans les champs "QUANTITÉ RÉELLE" pour saisir
          </div>
        )}
        <table className="table">
          <thead>
            <tr>
              <th>ARTICLE</th>
              <th>CODE</th>
              <th>STOCK SYSTÈME</th>
              <th style={{ backgroundColor: inventaireEnCours ? '#0a3d2c' : 'transparent' }}>
                {inventaireEnCours ? '✏️ ' : ''}QUANTITÉ RÉELLE
              </th>
              <th>ÉCART</th>
            </tr>
          </thead>
          <tbody>
            {articles.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                  <div style={{ fontSize: '18px' }}>
                    {loading ? (
                      <>⏳ Chargement des articles...</>
                    ) : (
                      <>
                        <div style={{ marginBottom: '10px', fontSize: '24px' }}>📦</div>
                        <div>Aucun article de type PRODUIT trouvé</div>
                        <div style={{ fontSize: '14px', marginTop: '10px' }}>
                          Vérifiez que vos articles ont bien le type "PRODUIT"
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              articles.map((article) => {
                const data = inventaireData[article.id_article] || {};
                const ecart = data.ecart || 0;
                
                return (
                  <tr key={article.id_article}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>📦</span>
                      <strong>{article.designation}</strong>
                    </div>
                  </td>
                  <td><span style={{color: '#888'}}>{article.code_article || 'N/A'}</span></td>
                  <td><strong style={{color: '#3B82F6', fontSize: '16px'}}>{data.stock_theorique || 0}</strong></td>
                  <td>
                    <input
                      type="number"
                      value={data.stock_reel || 0}
                      onChange={(e) => updateStockReel(article.id_article, e.target.value)}
                      className="input-field"
                      style={{ 
                        width: '120px', 
                        fontSize: '16px',
                        backgroundColor: inventaireEnCours ? '#0a3d2c' : '#333',
                        border: inventaireEnCours ? '2px solid #10B981' : '1px solid #555',
                        color: inventaireEnCours ? '#fff' : '#888',
                        cursor: inventaireEnCours ? 'text' : 'not-allowed',
                        fontWeight: inventaireEnCours ? 'bold' : 'normal'
                      }}
                      min="0"
                      disabled={!inventaireEnCours}
                      placeholder={inventaireEnCours ? "Saisir..." : ""}
                    />
                  </td>
                  <td>
                    <span style={{ 
                      color: ecart === 0 ? '#888' : ecart > 0 ? '#10B981' : '#EF4444',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}>
                      {ecart > 0 ? '+' : ''}{ecart}
                    </span>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>

      {/* Zone de résumé (comme Python ligne 158-213) */}
      <div className="card" style={{ padding: '20px', marginTop: '20px' }}>
        <h3 style={{ color: '#3B82F6', marginBottom: '15px' }}>📈 Résumé de l'inventaire</h3>
        <div style={{ display: 'flex', gap: '40px', justifyContent: 'center' }}>
          <div>
            <span style={{ color: '#888' }}>Articles vérifiés: </span>
            <strong style={{ fontSize: '18px', color: '#fff' }}>{articlesVerifies}</strong>
          </div>
          <div>
            <span style={{ color: '#888' }}>Excédents: </span>
            <strong style={{ fontSize: '18px', color: '#10B981' }}>{excedents}</strong>
          </div>
          <div>
            <span style={{ color: '#888' }}>Manquants: </span>
            <strong style={{ fontSize: '18px', color: '#EF4444' }}>{manquants}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Inventaire;