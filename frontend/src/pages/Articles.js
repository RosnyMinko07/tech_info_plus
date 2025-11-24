import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaSync, FaEdit, FaTrash, FaFileImport, FaFileExport, FaEye } from 'react-icons/fa';
import { articleService, formatMontant } from '../services/api';
import { toast } from 'react-toastify';
import ArticleFormModal from '../components/ArticleFormModal';
import '../styles/CommonPages.css';
import { confirmDelete } from '../utils/sweetAlertHelper';

function Articles() {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [articleDetails, setArticleDetails] = useState(null);

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [searchTerm, articles]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await articleService.getAll();
      setArticles(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement articles:', error);
      toast.error('Erreur lors du chargement des articles');
      setArticles([]);
      setLoading(false);
    }
  };

  const filterArticles = () => {
    if (!searchTerm) {
      setFilteredArticles(articles);
      return;
    }
    const filtered = articles.filter(article =>
      article.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.code_article?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredArticles(filtered);
  };

  const handleAdd = () => {
    setSelectedArticle(null);
    setShowForm(true);
  };

  const handleEdit = (article) => {
    setSelectedArticle(article);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedArticle(null);
    loadArticles();
  };

  const handleDelete = async (article) => {
    const confirmed = await confirmDelete(`l'article "${article.designation}"`);
    if (!confirmed) return;
    
    try {
      await articleService.delete(article.id_article);
      toast.success('✅ Article supprimé avec succès');
      loadArticles();
    } catch (error) {
      toast.error('❌ Erreur lors de la suppression');
    }
  };

  const handleViewDetails = async (article) => {
    try {
      const details = await articleService.getById(article.id_article);
      setArticleDetails(details);
      setShowDetails(true);
    } catch (error) {
      console.error('Erreur chargement détails:', error);
      toast.error('❌ Erreur lors du chargement des détails');
    }
  };

  if (loading) {
    return <div className="page-loading"><div className="spinner"></div></div>;
  }

  const stats = {
    total: articles.length,
    produits: articles.filter(a => a.type_article === 'PRODUIT').length,
    services: articles.filter(a => a.type_article === 'SERVICE').length,
    stockBas: articles.filter(a => a.type_article === 'PRODUIT' && a.stock_actuel <= a.stock_alerte).length,
  };

  return (
    <div className="page-container">
      <div className="page-header card">
        <div>
          <h1>📦 Gestion des Articles</h1>
          <p className="page-subtitle">Gérez vos produits et services</p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          <FaPlus /> Nouvel article
        </button>
      </div>

      {/* Formulaire modal */}
      {showForm && (
        <ArticleFormModal
          article={selectedArticle}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      <div className="stats-cards">
        <div className="stat-card-small">
          <div className="stat-icon">📦</div>
          <div>
            <p className="stat-label">Total articles</p>
            <p className="stat-value">{stats.total}</p>
          </div>
        </div>
        <div className="stat-card-small">
          <div className="stat-icon">🛒</div>
          <div>
            <p className="stat-label">Produits</p>
            <p className="stat-value">{stats.produits}</p>
          </div>
        </div>
        <div className="stat-card-small">
          <div className="stat-icon">🔧</div>
          <div>
            <p className="stat-label">Services</p>
            <p className="stat-value">{stats.services}</p>
          </div>
        </div>
        <div className="stat-card-small" style={{
          backgroundColor: stats.stockBas > 0 ? '#fff3cd' : '#f8f9fa',
          borderLeft: stats.stockBas > 0 ? '4px solid #ffc107' : 'none'
        }}>
          <div className="stat-icon" style={{color: stats.stockBas > 0 ? '#ffc107' : '#666'}}>
            {stats.stockBas > 0 ? '⚠️' : '📊'}
          </div>
          <div>
            <p className="stat-label">Stock faible</p>
            <p className="stat-value" style={{color: stats.stockBas > 0 ? '#ffc107' : '#666'}}>
              {stats.stockBas}
            </p>
          </div>
        </div>
      </div>

      <div className="control-bar card">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher un article..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={loadArticles}>
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

      <div className="table-container card">
        <table className="table">
          <thead>
            <tr>
              <th>ARTICLE</th>
              <th>PRIX</th>
              <th>STOCK</th>
              <th>TYPE</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredArticles.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Aucun article trouvé</td></tr>
            ) : (
              filteredArticles.map((article) => (
                <tr key={article.id_article}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {article.type_article === 'PRODUIT' && article.image_path ? (
                        <img 
                          src={article.image_path} 
                          alt={article.designation}
                          style={{ 
                            width: '50px', 
                            height: '50px', 
                            objectFit: 'cover', 
                            borderRadius: '5px',
                            border: '1px solid #ddd'
                          }}
                          onError={(e) => {
                            e.target.src = '';
                            e.target.outerHTML = '<span style="font-size:20px">📦</span>';
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '20px' }}>
                          {article.type_article === 'SERVICE' ? '🔧' : '📦'}
                        </span>
                      )}
                      <div>
                        <strong>{article.code_article}</strong><br />
                        {article.designation}
                      </div>
                    </div>
                  </td>
                  <td>{formatMontant(article.prix_vente || 0)}</td>
                  <td>
                    <span style={{ color: article.stock_actuel < article.stock_alerte ? '#dc3545' : '#28a745' }}>
                      {article.type_article === 'PRODUIT' ? `${article.stock_actuel} ${article.unite}` : 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${article.type_article === 'PRODUIT' ? 'info' : 'warning'}`}>
                      {article.type_article}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon btn-info" onClick={() => handleViewDetails(article)} title="Voir">
                        <FaEye />
                      </button>
                      <button className="btn-icon btn-primary" onClick={() => handleEdit(article)} title="Modifier">
                        <FaEdit />
                      </button>
                      <button className="btn-icon btn-danger" onClick={() => handleDelete(article)} title="Supprimer">
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
        <ArticleFormModal
          article={selectedArticle}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Modal Détails Article */}
      {showDetails && articleDetails && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '800px'}}>
            <div className="modal-header">
              <h2>📦 Détails de l'Article</h2>
              <button className="btn-close" onClick={() => setShowDetails(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="client-details">
                {/* Image de l'article */}
                {articleDetails.image_url && (
                  <div className="details-section">
                    <h3>🖼️ Image</h3>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <img 
                        src={articleDetails.image_url} 
                        alt={articleDetails.designation}
                        style={{
                          maxWidth: '300px',
                          maxHeight: '300px',
                          borderRadius: '8px',
                          border: '1px solid #ddd',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div style={{ display: 'none', fontSize: '48px', color: '#666' }}>
                        📦
                      </div>
                    </div>
                  </div>
                )}

                <div className="details-section">
                  <h3>📋 Informations Générales</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Code:</label>
                      <span>{articleDetails.code_article}</span>
                    </div>
                    <div className="detail-item">
                      <label>Désignation:</label>
                      <span>{articleDetails.designation}</span>
                    </div>
                    <div className="detail-item">
                      <label>Type:</label>
                      <span>{articleDetails.type_article}</span>
                    </div>
                    <div className="detail-item">
                      <label>Description:</label>
                      <span>{articleDetails.description || 'Non renseignée'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Date création:</label>
                      <span>{new Date(articleDetails.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {articleDetails.actif === false && articleDetails.supprime_par_nom && (
                      <>
                        <div className="detail-item">
                          <label>Supprimé par:</label>
                          <span style={{ color: '#EF4444', fontWeight: 'bold' }}>
                            {articleDetails.supprime_par_nom}
                          </span>
                        </div>
                        <div className="detail-item">
                          <label>Date suppression:</label>
                          <span style={{ color: '#EF4444' }}>
                            {articleDetails.date_suppression ? new Date(articleDetails.date_suppression).toLocaleDateString('fr-FR') : 'N/A'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="details-section">
                  <h3>💰 Prix et Stock</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Prix d'achat:</label>
                      <span>{formatMontant(articleDetails.prix_achat)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Prix de vente:</label>
                      <span>{formatMontant(articleDetails.prix_vente)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Stock actuel:</label>
                      <span style={{ 
                        color: articleDetails.stock_actuel < articleDetails.stock_minimum ? '#dc3545' : '#28a745',
                        fontWeight: 'bold'
                      }}>
                        {articleDetails.type_article === 'PRODUIT' ? articleDetails.stock_actuel : 'N/A'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Stock minimum:</label>
                      <span>{articleDetails.type_article === 'PRODUIT' ? articleDetails.stock_minimum : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="details-section">
                  <h3>📊 Statistiques de Vente</h3>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-label">Nombre de ventes</div>
                      <div className="stat-value">{articleDetails.statistiques.nb_ventes}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Quantité vendue</div>
                      <div className="stat-value">{articleDetails.statistiques.quantite_vendue}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">CA généré</div>
                      <div className="stat-value">{formatMontant(articleDetails.statistiques.ca_genere)}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Dernière vente</div>
                      <div className="stat-value">
                        {articleDetails.statistiques.derniere_vente 
                          ? new Date(articleDetails.statistiques.derniere_vente).toLocaleDateString('fr-FR')
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

export default Articles;