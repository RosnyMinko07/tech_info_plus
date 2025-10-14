import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaSync, FaEdit, FaTrash, FaFileImport, FaFileExport } from 'react-icons/fa';
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

  if (loading) {
    return <div className="page-loading"><div className="spinner"></div></div>;
  }

  const stats = {
    total: articles.length,
    produits: articles.filter(a => a.type_article === 'PRODUIT').length,
    services: articles.filter(a => a.type_article === 'SERVICE').length,
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
                      <span style={{ fontSize: '20px' }}>
                        {article.type_article === 'SERVICE' ? '🔧' : '📦'}
                      </span>
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
    </div>
  );
}

export default Articles;