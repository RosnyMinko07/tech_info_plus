import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { factureService } from '../services/api';
import '../styles/Modal.css';

function ArticleSelectionModal({ facture_id, onClose, onSelectArticles }) {
    const [articles, setArticles] = useState([]);
    const [selectedArticles, setSelectedArticles] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadArticlesFacture();
    }, [facture_id]);

    const loadArticlesFacture = async () => {
        try {
            setLoading(true);
            const data = await factureService.getArticlesDisponibles(facture_id);
            setArticles(data || []);
            
            // Initialiser la sélection avec toutes les quantités à 0
            const initialSelection = {};
            data.forEach(article => {
                initialSelection[article.id_article] = {
                    selected: false,
                    quantite: article.quantite_facture
                };
            });
            setSelectedArticles(initialSelection);
        } catch (error) {
            console.error('Erreur chargement articles:', error);
            toast.error('Erreur lors du chargement des articles');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (id_article) => {
        setSelectedArticles(prev => ({
            ...prev,
            [id_article]: {
                ...prev[id_article],
                selected: !prev[id_article]?.selected
            }
        }));
    };

    const handleQuantiteChange = (id_article, value) => {
        const article = articles.find(a => a.id_article === id_article);
        const quantite = parseInt(value) || 0;
        
        // Limiter à la quantité de la facture
        const quantiteMax = article?.quantite_facture || 0;
        const quantiteValidee = Math.min(Math.max(0, quantite), quantiteMax);
        
        setSelectedArticles(prev => ({
            ...prev,
            [id_article]: {
                ...prev[id_article],
                quantite: quantiteValidee
            }
        }));
    };

    const handleValider = () => {
        // Filtrer les articles sélectionnés avec quantité > 0
        const articlesSelectionnes = articles
            .filter(article => 
                selectedArticles[article.id_article]?.selected && 
                selectedArticles[article.id_article]?.quantite > 0
            )
            .map(article => {
                // Calculer le montant proportionnel (comme Python ligne 1320-1323)
                const quantiteRetour = selectedArticles[article.id_article].quantite;
                const quantiteMax = article.quantite_facture;
                const proportion = quantiteRetour / quantiteMax;
                
                // Utiliser les montants HT/TTC de la facture (pas prix × quantité !)
                const montant_ht = article.montant_ht * proportion;
                const montant_ttc = article.montant_ttc * proportion;
                
                return {
                    id_article: article.id_article,
                    designation: article.designation,
                    quantite: quantiteRetour,
                    prix_unitaire: article.prix_unitaire,
                    montant_ht: montant_ht,
                    montant_ttc: montant_ttc
                };
            });

        if (articlesSelectionnes.length === 0) {
            toast.warning('Veuillez sélectionner au moins un article');
            return;
        }

        onSelectArticles(articlesSelectionnes);
    };

    if (loading) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-container article-selection-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>📦 Sélection des articles</h2>
                        <button className="btn-close" onClick={onClose}>✕</button>
                    </div>
                    <div className="modal-body" style={{ textAlign: 'center', padding: '40px' }}>
                        <p>Chargement des articles...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container article-selection-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>📦 Sélection des articles à rembourser</h2>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    <div className="article-selection-list">
                        {articles.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                                Aucun article trouvé dans cette facture
                            </p>
                        ) : (
                            <table className="table-selection">
                                <thead>
                                    <tr>
                                        <th style={{ width: '50px' }}>✓</th>
                                        <th>Désignation</th>
                                        <th style={{ width: '120px' }}>Qté facture</th>
                                        <th style={{ width: '150px' }}>Qté à rembourser</th>
                                        <th style={{ width: '120px' }}>Prix Unit.</th>
                                        <th style={{ width: '120px' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {articles.map(article => {
                                        const selection = selectedArticles[article.id_article] || { selected: false, quantite: article.quantite_facture };
                                        const total = article.prix_unitaire * (selection.quantite || 0);
                                        
                                        return (
                                            <tr key={article.id_article} className={selection.selected ? 'selected-row' : ''}>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selection.selected}
                                                        onChange={() => handleCheckboxChange(article.id_article)}
                                                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                                    />
                                                </td>
                                                <td>
                                                    <strong>{article.designation}</strong>
                                                    {article.type_article === 'SERVICE' && (
                                                        <span style={{ 
                                                            marginLeft: '10px', 
                                                            padding: '2px 8px', 
                                                            background: '#3b82f6', 
                                                            color: 'white', 
                                                            borderRadius: '4px', 
                                                            fontSize: '11px' 
                                                        }}>
                                                            SERVICE
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <strong>{article.quantite_facture}</strong>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={article.quantite_facture}
                                                        value={selection.quantite}
                                                        onChange={(e) => handleQuantiteChange(article.id_article, e.target.value)}
                                                        disabled={!selection.selected}
                                                        style={{
                                                            width: '100%',
                                                            padding: '8px',
                                                            fontSize: '14px',
                                                            textAlign: 'center',
                                                            border: '1px solid #ddd',
                                                            borderRadius: '4px',
                                                            background: selection.selected ? 'white' : '#f5f5f5'
                                                        }}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    {article.prix_unitaire.toFixed(2)} FCFA
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <strong style={{ color: selection.selected ? '#10b981' : '#666' }}>
                                                        {(() => {
                                                            // Calcul proportionnel correct (Python ligne 1320-1323)
                                                            const proportion = (selection.quantite || 0) / article.quantite_facture;
                                                            const montantCorrect = article.montant_ttc * proportion;
                                                            return montantCorrect.toFixed(2);
                                                        })()} FCFA
                                                    </strong>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Résumé */}
                    <div className="selection-summary" style={{
                        marginTop: '20px',
                        padding: '15px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        borderLeft: '4px solid #10b981'
                    }}>
                        <p style={{ margin: '0', fontSize: '16px' }}>
                            <strong>Articles sélectionnés :</strong> {
                                Object.values(selectedArticles).filter(s => s.selected).length
                            } / {articles.length}
                        </p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '18px', color: '#10b981' }}>
                            <strong>Total à rembourser :</strong> {
                                articles.reduce((sum, article) => {
                                    const selection = selectedArticles[article.id_article];
                                    if (selection?.selected) {
                                        // Calcul proportionnel correct (Python ligne 1334-1335)
                                        const proportion = (selection.quantite || 0) / article.quantite_facture;
                                        const montant = article.montant_ttc * proportion;
                                        return sum + montant;
                                    }
                                    return sum;
                                }, 0).toFixed(2)
                            } FCFA
                        </p>
                    </div>
                </div>

                {/* Footer avec boutons */}
                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="btn btn-secondary">
                        ✕ Annuler
                    </button>
                    <button type="button" onClick={handleValider} className="btn btn-success">
                        ✓ Valider la sélection
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ArticleSelectionModal;


