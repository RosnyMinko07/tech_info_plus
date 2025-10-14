import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { factureService, clientService, articleService, formatMontant } from '../services/api';
import '../styles/Modal.css';

function FacturationFormModal({ facture, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        numero_facture: '',
        date_facture: new Date().toISOString().split('T')[0],
        id_client: '',
        statut: 'En attente',
        montant_ht: 0,
        montant_ttc: 0,
        montant_avance: 0,
        montant_reste: 0,
        description: '',
        precompte_actif: false,
        type_facture: 'NORMALE'
    });

    const [clients, setClients] = useState([]);
    const [articles, setArticles] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState('');
    const [quantite, setQuantite] = useState(1);
    const [lignesFacture, setLignesFacture] = useState([]);
    
    // Totaux
    const [totalHT, setTotalHT] = useState(0);
    const [totalTTC, setTotalTTC] = useState(0);

    useEffect(() => {
        loadClients();
        loadArticles();
        
        if (facture) {
            // Mode édition - Remplir les données de base (comme Python ligne 1926-1955)
            setFormData({
                numero_facture: facture.numero_facture || '',
                date_facture: facture.date_facture ? facture.date_facture.split('T')[0] : new Date().toISOString().split('T')[0],
                id_client: facture.id_client || '',
                statut: facture.statut || 'En attente',
                montant_ht: parseFloat(facture.montant_ht || 0),
                montant_ttc: parseFloat(facture.montant_ttc || 0),
                montant_avance: parseFloat(facture.montant_avance || 0),
                montant_reste: parseFloat(facture.montant_reste || 0),
                description: facture.description || '',
                precompte_actif: facture.precompte_applique === 1,
                type_facture: facture.type_facture || 'NORMALE'
            });
            
            // Charger les articles séparément (comme Python ligne 1958)
            loadLignesFacture(facture.id_facture);
        } else {
            // Mode création : générer le numéro
            generateNumeroFacture();
        }
    }, [facture]);
    
    const loadLignesFacture = async (id_facture) => {
        try {
            // Charger les lignes exactement comme Python charger_articles_facture_existante (ligne 1165-1196)
            const lignes = await factureService.getLignes(id_facture);
            
            if (lignes && lignes.length > 0) {
                setLignesFacture(lignes.map(ligne => ({
                    id_article: ligne.id_article,
                    designation: ligne.designation,
                    quantite: ligne.quantite,
                    prix_unitaire: parseFloat(ligne.prix_unitaire || 0),
                    montant_ht: parseFloat(ligne.montant_ht || 0)
                })));
            }
        } catch (error) {
            console.error('Erreur chargement lignes facture:', error);
            toast.error('Erreur lors du chargement des articles de la facture');
        }
    };

    useEffect(() => {
        calculateTotals();
    }, [lignesFacture, formData.precompte_actif]);

    const loadClients = async () => {
        try {
            const data = await clientService.getAll();
            setClients(data);
        } catch (error) {
            toast.error('Erreur lors du chargement des clients');
        }
    };

    const loadArticles = async () => {
        try {
            const data = await articleService.getAll();
            setArticles(data.filter(a => a.actif !== 0)); // Seulement les articles actifs
        } catch (error) {
            toast.error('Erreur lors du chargement des articles');
        }
    };

    const generateNumeroFacture = async () => {
        try {
            const numero = await factureService.generateNumero();
            setFormData(prev => ({ ...prev, numero_facture: numero }));
        } catch (error) {
            // Génération locale en cas d'erreur
            const year = new Date().getFullYear();
            const numero = `FAC-${year}-001`;
            setFormData(prev => ({ ...prev, numero_facture: numero }));
        }
    };

    const calculateTotals = () => {
        let totalHT = 0;
        let totalTTC = 0;
        let totalPrecompte = 0;
        
        // Calculer comme dans le Python
        lignesFacture.forEach(ligne => {
            const montantHT = ligne.quantite * ligne.prix_unitaire;
            totalHT += montantHT;
            
            // Le précompte s'applique UNIQUEMENT aux SERVICES
            if (formData.precompte_actif && ligne.type_article === 'SERVICE') {
                // Appliquer le précompte si la case est cochée ET que c'est un SERVICE
                const precomptePercent = 9.5;
                const precompte = montantHT * (precomptePercent / 100);
                totalPrecompte += precompte;
                const montantTTC = montantHT - precompte;
                totalTTC += montantTTC;
            } else {
                // Pas de précompte pour les PRODUITS ou si précompte désactivé
                totalTTC += montantHT;
            }
        });
        
        setTotalHT(totalHT);
        setTotalTTC(totalTTC);
    };

    const calculateResteAPayer = () => {
        const montantTTC = totalTTC || 0;
        const montantPaye = formData.montant_avance || 0;
        const reste = montantTTC - montantPaye;
        return reste;
    };

    const handleMontantAvanceChange = (value) => {
        const montantAvance = parseFloat(value) || 0;
        setFormData({ ...formData, montant_avance: montantAvance });
    };

    const addArticle = () => {
        if (!selectedArticle || !quantite || quantite <= 0) {
            toast.error('Veuillez sélectionner un article et une quantité valide');
            return;
        }

        const article = articles.find(a => a.id_article.toString() === selectedArticle);
        if (!article) {
            toast.error('Article non trouvé');
            return;
        }

        // Vérifier si l'article existe déjà dans la liste
        const existingIndex = lignesFacture.findIndex(ligne => ligne.id_article === article.id_article);

        if (existingIndex !== -1) {
            // L'article existe déjà : augmenter la quantité
            const updatedLignes = [...lignesFacture];
            updatedLignes[existingIndex].quantite += quantite;
            updatedLignes[existingIndex].montant_ht = updatedLignes[existingIndex].quantite * updatedLignes[existingIndex].prix_unitaire;
            setLignesFacture(updatedLignes);
            toast.success(`Quantité de "${article.designation}" augmentée !`);
        } else {
            // Nouvel article : ajouter une nouvelle ligne
            const montantHT = quantite * article.prix_vente;
            const newLigne = {
                id_article: article.id_article,
                designation: article.designation,
                quantite: quantite,
                prix_unitaire: article.prix_vente,
                montant_ht: montantHT,
                type_article: article.type_article // Ajouter le type (PRODUIT ou SERVICE)
            };
            setLignesFacture([...lignesFacture, newLigne]);
            toast.success(`Article "${article.designation}" ajouté !`);
        }

        setSelectedArticle('');
        setQuantite(1);
    };

    const removeLigne = (index) => {
        setLignesFacture(lignesFacture.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.id_client) {
            toast.error('Veuillez sélectionner un client');
            return;
        }

        if (!formData.description) {
            toast.error('Veuillez saisir une description pour la facture');
            return;
        }

        if (lignesFacture.length === 0) {
            toast.error('Veuillez ajouter au moins un article');
            return;
        }

        try {
            const factureData = {
                ...formData,
                montant_ht: totalHT,
                montant_ttc: totalTTC,
                montant_reste: calculateResteAPayer(),
                lignes: lignesFacture
            };

            console.log('DEBUG - Données à envoyer:', factureData);
            console.log('DEBUG - Lignes:', lignesFacture);

            if (facture) {
                // Modification
                await factureService.update(facture.id_facture, factureData);
                toast.success('Facture modifiée avec succès');
            } else {
                // Création
                console.log('DEBUG - Appel API create...');
                const response = await factureService.create(factureData);
                console.log('DEBUG - Réponse API:', response);
                toast.success('Facture créée avec succès');
            }

            onSuccess();
        } catch (error) {
            console.error('DEBUG - Erreur complète:', error);
            console.error('DEBUG - Réponse erreur:', error.response);
            console.error('DEBUG - Data erreur:', error.response?.data);
            toast.error('Erreur lors de l\'enregistrement de la facture');
        }
    };

    return (
        <div className="facturation-modal-overlay" onClick={onClose}>
            <div className="facturation-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Header comme Python */}
                <div className="facturation-modal-header">
                    <h2 className="facturation-modal-title">
                        {facture ? 'Modifier la Facture' : 'Nouvelle Facture'}
                    </h2>
                    <button className="facturation-modal-close" onClick={onClose}>
                        ✕ Fermer
                    </button>
                </div>

                {/* Contenu scrollable comme Python */}
                <div className="facturation-modal-content">
                    <form onSubmit={handleSubmit}>
                        {/* GRID EXACT comme Python - 4 colonnes */}
                        <div className="form-grid-python">
                            {/* Row 0: Numéro | Date */}
                            <div className="form-group">
                                <label>Numéro</label>
                            </div>
                            <div className="form-group">
                                <input
                                    type="text"
                                    value={formData.numero_facture}
                                    disabled
                                    placeholder="FAC-2025-001"
                                />
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                            </div>
                            <div className="form-group">
                                <input
                                    type="date"
                                    value={formData.date_facture}
                                    onChange={(e) => setFormData({ ...formData, date_facture: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Row 1: Client | Statut */}
                            <div className="form-group">
                                <label>Client</label>
                            </div>
                            <div className="form-group">
                                <select
                                    value={formData.id_client}
                                    onChange={(e) => setFormData({ ...formData, id_client: e.target.value })}
                                    required
                                >
                                    <option value="">Sélectionner un client</option>
                                    {clients.map(client => (
                                        <option key={client.id_client} value={client.id_client}>
                                            {client.nom} - {client.telephone || 'N/A'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Statut</label>
                            </div>
                            <div className="form-group">
                                <select
                                    value={formData.statut}
                                    onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                                >
                                    <option value="En attente">En attente</option>
                                    <option value="Payée">Payée</option>
                                    <option value="Annulée">Annulée</option>
                                </select>
                            </div>

                            {/* Row 2: Montant HT | Montant TTC */}
                            <div className="form-group">
                                <label>Montant HT</label>
                            </div>
                            <div className="form-group">
                                <input
                                    type="number"
                                    value={totalHT}
                                    disabled
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="form-group">
                                <label>Montant TTC</label>
                            </div>
                            <div className="form-group">
                                <input
                                    type="number"
                                    value={totalTTC}
                                    disabled
                                    placeholder="0.00"
                                />
                            </div>

                            {/* Row 3: Montant payé | Reste à payer */}
                            <div className="form-group">
                                <label>Montant payé</label>
                            </div>
                            <div className="form-group">
                                <input
                                    type="number"
                                    value={formData.montant_avance || 0}
                                    onChange={(e) => handleMontantAvanceChange(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="form-group">
                                <label>Reste à payer</label>
                            </div>
                            <div className="form-group">
                                <input
                                    type="number"
                                    value={calculateResteAPayer()}
                                    disabled
                                    placeholder="0.00"
                                />
                            </div>

                            {/* Row 4: Précompte checkbox (colspan 2) */}
                            <div className="form-group checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.precompte_actif || false}
                                        onChange={(e) => setFormData({ ...formData, precompte_actif: e.target.checked })}
                                    />
                                    {" "}Appliquer le précompte (9.5%)
                                </label>
                            </div>

                            {/* Row 5: Description (colspan 4) */}
                            <div className="form-group">
                                <label>Description</label>
                            </div>
                            <div className="form-group description-group">
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Ex: ACHAT STORES SUPPLEMENTAIRES, MAINTENANCE, etc."
                                    required
                                />
                            </div>
                        </div>

                        {/* Section Articles - EXACTEMENT comme Python */}
                        <div className="articles-section-python">
                            <label className="articles-label">Articles</label>
                            
                            {/* Frame sélection articles comme Python */}
                            <div className="frame-selection-articles">
                                <div className="selection-row">
                                    <div className="form-group">
                                        <label>Article</label>
                                        <select
                                            value={selectedArticle}
                                            onChange={(e) => setSelectedArticle(e.target.value)}
                                            className="form-control"
                                        >
                                            <option value="">Sélectionner un article</option>
                                            {articles.map(article => (
                                                <option key={article.id_article} value={article.id_article}>
                                                    {article.designation} - {formatMontant(article.prix_vente)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Quantité</label>
                                        <input
                                            type="number"
                                            value={quantite}
                                            onChange={(e) => setQuantite(parseInt(e.target.value) || 1)}
                                            className="form-control"
                                            min="1"
                                            placeholder="1"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <button
                                            type="button"
                                            onClick={addArticle}
                                            className="btn btn-success btn-add"
                                        >
                                            + Ajouter
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Frame liste articles comme Python */}
                            <div className="frame-articles">
                                <div className="frame-liste-articles">
                                    {lignesFacture.length === 0 ? (
                                        <div className="no-articles">
                                            <p>Aucun article ajouté</p>
                                        </div>
                                    ) : (
                                        <div className="articles-list-python">
                                            {lignesFacture.map((ligne, index) => (
                                                <div key={index} className="article-item">
                                                    <div className="article-info">
                                                        <span className="article-designation">{ligne.designation}</span>
                                                        <span className="article-quantity">Qté: {ligne.quantite}</span>
                                                        <span className="article-price">{formatMontant(ligne.prix_unitaire)}</span>
                                                        <span className="article-total">{formatMontant(ligne.montant_ht)}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeLigne(index)}
                                                        className="btn btn-danger btn-sm btn-remove"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Boutons d'action - EXACTEMENT comme Python */}
                <div className="facturation-modal-buttons">
                    <button type="submit" className="btn btn-success btn-enregistrer" onClick={handleSubmit}>
                        Enregistrer
                    </button>
                    <button type="button" onClick={onClose} className="btn btn-secondary btn-annuler">
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FacturationFormModal;
