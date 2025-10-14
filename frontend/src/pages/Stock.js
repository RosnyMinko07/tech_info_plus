import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaSync, FaEdit, FaTrash, FaFileExport, FaBoxOpen, FaExclamationTriangle, FaExclamationCircle, FaMoneyBillWave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { articleService, stockService, formatMontant, formatDate } from '../services/api';
import '../styles/Stock.css';

function Stock() {
    const [articles, setArticles] = useState([]);
    const [filteredArticles, setFilteredArticles] = useState([]);
    const [mouvements, setMouvements] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('tous');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    
    // Statistiques
    const [stats, setStats] = useState({
        total: 0,
        faible: 0,
        critique: 0,
        valeur: 0
    });

    // Formulaire mouvement
    const [formData, setFormData] = useState({
        id_article: '',
        type_mouvement: 'ENTREE',
        quantite: '',
        motif: '',
        reference: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterArticles();
    }, [searchTerm, filterStatus, articles]);

    const loadData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadArticles(),
                loadMouvements()
            ]);
        } finally {
            setLoading(false);
        }
    };

    const loadArticles = async () => {
        try {
            const data = await articleService.getAll();
            const produits = (data || []).filter(a => a.type_article === 'PRODUIT');
            setArticles(produits);
            calculateStats(produits);
        } catch (error) {
            console.error('Erreur chargement articles:', error);
            toast.error('Erreur lors du chargement des articles');
        }
    };

    const loadMouvements = async () => {
        try {
            const data = await stockService.getMouvements();
            setMouvements(data || []);
        } catch (error) {
            console.error('Erreur chargement mouvements:', error);
        }
    };

    const calculateStats = (data) => {
        const total = data.length;
        const faible = data.filter(a => a.stock_actuel <= a.stock_alerte && a.stock_actuel > 0).length;
        const critique = data.filter(a => a.stock_actuel === 0).length;
        // Utiliser prix_vente comme dans Python (stock.py ligne 651)
        const valeur = data.reduce((sum, a) => sum + (a.stock_actuel * a.prix_vente), 0);
        
        setStats({ total, faible, critique, valeur });
    };

    const filterArticles = () => {
        let filtered = articles;
        
        // Filtre par recherche
        if (searchTerm) {
            filtered = filtered.filter(a =>
                a.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.code_article?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Filtre par statut
        if (filterStatus === 'faible') {
            filtered = filtered.filter(a => a.stock_actuel <= a.stock_alerte && a.stock_actuel > 0);
        } else if (filterStatus === 'critique') {
            filtered = filtered.filter(a => a.stock_actuel === 0);
        } else if (filterStatus === 'ok') {
            filtered = filtered.filter(a => a.stock_actuel > a.stock_alerte);
        }
        
        setFilteredArticles(filtered);
    };

    const getStockStatus = (article) => {
        if (article.stock_actuel === 0) return { label: 'Critique', color: '#EF4444', icon: '🚨' };
        if (article.stock_actuel <= article.stock_alerte) return { label: 'Faible', color: '#F59E0B', icon: '⚠️' };
        return { label: 'OK', color: '#10B981', icon: '✅' };
    };

    const handleShowForm = (article = null) => {
        if (article) {
            setFormData({
                id_article: article.id_article,
                type_mouvement: 'ENTREE',
                quantite: '',
                motif: '',
                reference: ''
            });
        } else {
            setFormData({
                id_article: '',
                type_mouvement: 'ENTREE',
                quantite: '',
                motif: '',
                reference: ''
            });
        }
        setShowForm(true);
    };

    const handleSubmitMouvement = async (e) => {
        e.preventDefault();
        
        if (!formData.id_article || !formData.quantite) {
            toast.error('Veuillez remplir tous les champs obligatoires');
            return;
        }
        
        try {
            await stockService.createMouvement({
                ...formData,
                quantite: parseInt(formData.quantite)
            });
            
            toast.success('Mouvement enregistré avec succès');
            setShowForm(false);
            loadData();
        } catch (error) {
            console.error('Erreur enregistrement mouvement:', error);
            toast.error('Erreur lors de l\'enregistrement du mouvement');
        }
    };

    const handleExport = () => {
        try {
            const csvContent = generateCSV(filteredArticles);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `stock_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            toast.success('Export réussi');
        } catch (error) {
            toast.error('Erreur lors de l\'export');
        }
    };

    const generateCSV = (data) => {
        // Utiliser prix_vente comme dans Python (stock.py ligne 651)
        const headers = ['Code', 'Désignation', 'Stock Actuel', 'Stock Alerte', 'Prix Vente', 'Valeur'];
        const rows = data.map(a => [
            a.code_article,
            a.designation,
            a.stock_actuel,
            a.stock_alerte,
            a.prix_vente,
            a.stock_actuel * a.prix_vente
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    };

    return (
        <div className="stock-container">
            {/* En-tête */}
            <div className="stock-header">
                <h1 className="stock-title">Gestion des stocks</h1>
                <p className="stock-subtitle">Surveillez et gérez vos niveaux de stock</p>
            </div>

            {/* Cartes de statistiques */}
            <div className="stock-stats-cards">
                <div className="stock-stat-card">
                    <div className="stat-icon">📦</div>
                    <div className="stat-label">Articles en stock</div>
                    <div className="stat-value" style={{ color: '#3B82F6' }}>{stats.total}</div>
                </div>
                
                <div className="stock-stat-card">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-label">Stock faible</div>
                    <div className="stat-value" style={{ color: '#F59E0B' }}>{stats.faible}</div>
                </div>
                
                <div className="stock-stat-card">
                    <div className="stat-icon">🚨</div>
                    <div className="stat-label">Stock critique</div>
                    <div className="stat-value" style={{ color: '#EF4444' }}>{stats.critique}</div>
                </div>
                
                <div className="stock-stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-label">Valeur stock</div>
                    <div className="stat-value" style={{ color: '#10B981' }}>{formatMontant(stats.valeur)}</div>
                </div>
            </div>

            {/* Barre de recherche et filtres */}
            <div className="stock-search-bar">
                <input
                    type="text"
                    placeholder="Rechercher un article..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <button className="btn-icon btn-search">
                    <FaSearch />
                </button>
                <button className="btn-icon btn-refresh" onClick={loadData}>
                    <FaSync />
                </button>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-select"
                >
                    <option value="tous">Tous les statuts</option>
                    <option value="ok">Stock OK</option>
                    <option value="faible">Stock faible</option>
                    <option value="critique">Stock critique</option>
                </select>
                <button className="btn btn-primary" onClick={() => handleShowForm()}>
                    <FaPlus /> Nouveau mouvement
                </button>
                <button className="btn btn-secondary" onClick={handleExport}>
                    <FaFileExport /> Exporter
                </button>
            </div>

            {/* Contenu principal (2 colonnes) */}
            <div className="stock-content">
                {/* Colonne Articles */}
                <div className="stock-articles-section">
                    <div className="section-header">
                        <h3>Articles en stock</h3>
                    </div>

                    <div className="articles-table-header">
                        <span>ARTICLE</span>
                        <span>STOCK</span>
                        <span>ACTIONS</span>
                    </div>

                    <div className="articles-list">
                        {loading ? (
                            <div className="loading">Chargement...</div>
                        ) : filteredArticles.length === 0 ? (
                            <div className="empty-state">Aucun article trouvé</div>
                        ) : (
                            filteredArticles.map(article => {
                                const status = getStockStatus(article);
                                return (
                                    <div key={article.id_article} className="article-item">
                                        <div className="article-info">
                                            <div className="article-name">{article.designation}</div>
                                            <div className="article-code">{article.code_article}</div>
                                        </div>
                                        <div className="article-stock">
                                            <div className="stock-badge" style={{ backgroundColor: status.color }}>
                                                {status.icon} {article.stock_actuel}
                                            </div>
                                            <div className="stock-alert">Alerte: {article.stock_alerte}</div>
                                        </div>
                                        <div className="article-actions">
                                            <button
                                                className="btn-icon btn-primary"
                                                onClick={() => handleShowForm(article)}
                                                title="Ajouter mouvement"
                                            >
                                                <FaPlus />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Colonne Mouvements */}
                <div className="stock-mouvements-section">
                    <div className="section-header">
                        <h3>Mouvements de stock</h3>
                    </div>

                    <div className="mouvements-list">
                        {mouvements.length === 0 ? (
                            <div className="empty-state">Aucun mouvement récent</div>
                        ) : (
                            mouvements.slice(0, 20).map(mouvement => (
                                <div key={mouvement.id_mouvement} className="mouvement-item">
                                    <div className="mouvement-icon" style={{ 
                                        backgroundColor: mouvement.type_mouvement === 'ENTREE' ? '#10B981' : '#EF4444' 
                                    }}>
                                        {mouvement.type_mouvement === 'ENTREE' ? '↑' : '↓'}
                                    </div>
                                    <div className="mouvement-details">
                                        <div className="mouvement-article">{mouvement.article_designation || 'Article'}</div>
                                        <div className="mouvement-info">
                                            {mouvement.type_mouvement} • {mouvement.quantite} unités
                                        </div>
                                        <div className="mouvement-date">{formatDate(mouvement.date_mouvement)}</div>
                                    </div>
                                    <div className="mouvement-motif">
                                        {mouvement.reference || 'Mouvement de stock'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Formulaire */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Nouveau mouvement de stock</h2>
                            <button className="btn-close" onClick={() => setShowForm(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSubmitMouvement} className="modal-body">
                            <div className="form-group">
                                <label>Article *</label>
                                <select
                                    value={formData.id_article}
                                    onChange={(e) => setFormData({ ...formData, id_article: e.target.value })}
                                    className="form-control"
                                    required
                                >
                                    <option value="">Sélectionner un article</option>
                                    {articles.map(article => (
                                        <option key={article.id_article} value={article.id_article}>
                                            {article.designation} (Stock: {article.stock_actuel})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Type de mouvement *</label>
                                <select
                                    value={formData.type_mouvement}
                                    onChange={(e) => setFormData({ ...formData, type_mouvement: e.target.value })}
                                    className="form-control"
                                    required
                                >
                                    <option value="ENTREE">Entrée (Ajout au stock)</option>
                                    <option value="SORTIE">Sortie (Retrait du stock)</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Quantité *</label>
                                <input
                                    type="number"
                                    value={formData.quantite}
                                    onChange={(e) => setFormData({ ...formData, quantite: e.target.value })}
                                    className="form-control"
                                    min="1"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Motif</label>
                                <input
                                    type="text"
                                    value={formData.motif}
                                    onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                                    className="form-control"
                                    placeholder="Ex: Réception commande, Vente, Casse..."
                                />
                            </div>

                            <div className="form-group">
                                <label>Référence</label>
                                <input
                                    type="text"
                                    value={formData.reference}
                                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                    className="form-control"
                                    placeholder="Ex: Bon de livraison, Facture..."
                                />
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                                    Annuler
                                </button>
                                <button type="submit" className="btn btn-success">
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Stock;