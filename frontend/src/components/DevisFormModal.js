import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { devisService, clientService, articleService, formatMontant } from '../services/api';
import ClientForm from './ClientForm';
import '../styles/Modal.css';

function DevisFormModal({ devis, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        numero_devis: '',
        date_devis: new Date().toISOString().split('T')[0],
        validite: 30,
        id_client: '',
        description: '',
        precompte_applique: false
    });

    const [clients, setClients] = useState([]);
    const [articles, setArticles] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState('');
    const [quantite, setQuantite] = useState(1);
    const [lignesDevis, setLignesDevis] = useState([]);
    
    // Modal nouveau client
    const [showClientModal, setShowClientModal] = useState(false);
    
    // Totaux
    const [totalHT, setTotalHT] = useState(0);
    const [montantPrecompte, setMontantPrecompte] = useState(0);
    const [totalTTC, setTotalTTC] = useState(0);

    useEffect(() => {
        loadClients();
        loadArticles();
        
        if (devis) {
            // Mode édition
            setFormData({
                numero_devis: devis.numero_devis || '',
                date_devis: devis.date_devis || new Date().toISOString().split('T')[0],
                validite: devis.validite || 30,
                id_client: devis.id_client || '',
                description: devis.description || '',
                precompte_applique: devis.precompte_applique === 1
            });
            
            if (devis.lignes && devis.lignes.length > 0) {
                setLignesDevis(devis.lignes.map(ligne => ({
                    id_article: ligne.id_article,
                    designation: ligne.designation || ligne.article_designation,
                    quantite: ligne.quantite,
                    prix_unitaire: ligne.prix_unitaire,
                    montant_ht: ligne.montant_ht
                })));
            }
        } else {
            // Mode création : générer le numéro
            generateNumeroDevis();
        }
    }, [devis]);

    useEffect(() => {
        calculateTotals();
    }, [lignesDevis, formData.precompte_applique]);

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

    const handleNouveauClient = () => {
        setShowClientModal(true);
    };

    const handleClientCreated = (nouveauClient) => {
        if (!nouveauClient || !nouveauClient.id_client) {
            console.error('Client créé invalide:', nouveauClient);
            toast.error('Erreur lors de la création du client');
            return;
        }
        
        setClients([...clients, nouveauClient]);
        setFormData({ ...formData, id_client: nouveauClient.id_client });
        setShowClientModal(false);
        toast.success('Client créé avec succès');
    };

    const generateNumeroDevis = async () => {
        try {
            const numero = await devisService.generateNumero();
            setFormData(prev => ({ ...prev, numero_devis: numero }));
        } catch (error) {
            // Génération locale en cas d'erreur
            const year = new Date().getFullYear();
            const numero = `DEV-${year}-001`;
            setFormData(prev => ({ ...prev, numero_devis: numero }));
        }
    };

    const calculateTotals = () => {
        let totalHT = 0;
        let totalPrecompte = 0;
        
        // Calculer avec précompte uniquement sur les SERVICES
        lignesDevis.forEach(ligne => {
            const montantHT = ligne.montant_ht;
            totalHT += montantHT;
            
            // Précompte uniquement sur les SERVICES
            if (formData.precompte_applique && ligne.type_article === 'SERVICE') {
                const precompte = montantHT * 0.095; // 9.5%
                totalPrecompte += precompte;
            }
        });
        
        setTotalHT(totalHT);
        setMontantPrecompte(totalPrecompte);
        setTotalTTC(totalHT - totalPrecompte);
    };

    const handleAddArticle = () => {
        if (!selectedArticle) {
            toast.warning('Veuillez sélectionner un article');
            return;
        }

        if (!quantite || quantite <= 0) {
            toast.warning('Veuillez saisir une quantité valide');
            return;
        }

        const article = articles.find(a => a.id_article === parseInt(selectedArticle));
        if (!article) return;

        // Vérifier si l'article existe déjà dans les lignes
        const ligneExiste = lignesDevis.findIndex(l => l.id_article === article.id_article);
        
        if (ligneExiste !== -1) {
            // Article existe déjà: augmenter la quantité
            const nouvellesLignes = [...lignesDevis];
            nouvellesLignes[ligneExiste].quantite += quantite;
            nouvellesLignes[ligneExiste].montant_ht = nouvellesLignes[ligneExiste].prix_unitaire * nouvellesLignes[ligneExiste].quantite;
            setLignesDevis(nouvellesLignes);
        } else {
            // Article n'existe pas: ajouter une nouvelle ligne
            const montantHT = article.prix_vente * quantite;
            
            const nouvelleLigne = {
                id_article: article.id_article,
                designation: article.designation,
                quantite: quantite,
                prix_unitaire: article.prix_vente,
                montant_ht: montantHT,
                type_article: article.type_article // Ajouter le type (PRODUIT ou SERVICE)
            };
            setLignesDevis([...lignesDevis, nouvelleLigne]);
        }
        setSelectedArticle('');
        setQuantite(1);
    };

    const handleRemoveArticle = (index) => {
        const newLignes = lignesDevis.filter((_, i) => i !== index);
        setLignesDevis(newLignes);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.numero_devis) {
            toast.error('Le numéro de devis est obligatoire');
            return;
        }

        if (!formData.id_client) {
            toast.error('Veuillez sélectionner un client');
            return;
        }

        if (!formData.description) {
            toast.error('Veuillez saisir une description/titre pour le devis');
            return;
        }

        if (lignesDevis.length === 0) {
            toast.error('Veuillez ajouter au moins un article');
            return;
        }

        try {
            const devisData = {
                ...formData,
                montant_ht: totalHT,
                montant_ttc: totalTTC,
                precompte_applique: formData.precompte_applique ? 1 : 0,
                lignes: lignesDevis
            };

            if (devis) {
                // Modification
                await devisService.update(devis.id_devis, devisData);
                toast.success('Devis modifié avec succès');
            } else {
                // Création
                await devisService.create(devisData);
                toast.success('Devis créé avec succès');
            }

            onSuccess();
        } catch (error) {
            toast.error('Erreur lors de l\'enregistrement du devis');
            console.error(error);
        }
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-container modal-large" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>{devis ? 'Modifier le Devis' : 'Nouveau Devis'}</h2>
                        <button className="btn-close" onClick={onClose}>✕</button>
                    </div>

                    <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-scroll">
                        {/* Informations de base */}
                        <div className="form-grid">
                            <div className="form-group">
                                <label>N° Devis</label>
                                <input
                                    type="text"
                                    value={formData.numero_devis}
                                    disabled
                                    className="form-control"
                                />
                            </div>

                            <div className="form-group">
                                <label>Date *</label>
                                <input
                                    type="date"
                                    value={formData.date_devis}
                                    onChange={(e) => setFormData({ ...formData, date_devis: e.target.value })}
                                    className="form-control"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Client *</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <select
                                        value={formData.id_client}
                                        onChange={(e) => setFormData({ ...formData, id_client: e.target.value })}
                                        className="form-control"
                                        required
                                        style={{ flex: 1 }}
                                    >
                                        <option value="">Sélectionner un client</option>
                                        {clients.map(client => (
                                            <option key={client.id_client} value={client.id_client}>
                                                {client.nom} - {client.telephone || 'N/A'}
                                            </option>
                                        ))}
                                    </select>
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary"
                                        onClick={handleNouveauClient}
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        + Nouveau
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Validité (jours)</label>
                                <input
                                    type="number"
                                    value={formData.validite}
                                    onChange={(e) => setFormData({ ...formData, validite: parseInt(e.target.value) })}
                                    className="form-control"
                                    min="1"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="form-group">
                            <label>Description/Titre *</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="form-control"
                                placeholder="Ex: Achat Store, Installation système..."
                                required
                            />
                        </div>

                        {/* Précompte */}
                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.precompte_applique}
                                    onChange={(e) => setFormData({ ...formData, precompte_applique: e.target.checked })}
                                />
                                <span>Appliquer Précompte 9.5%</span>
                            </label>
                        </div>

                        {/* Section Articles */}
                        <div className="section-divider">
                            <h3>Articles</h3>
                        </div>

                        <div className="article-selection">
                            <div className="form-group" style={{ flex: 2 }}>
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
                                <input
                                    type="number"
                                    value={quantite}
                                    onChange={(e) => setQuantite(parseInt(e.target.value) || 1)}
                                    className="form-control"
                                    placeholder="Qté"
                                    min="1"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleAddArticle}
                                className="btn btn-success btn-sm"
                            >
                                + Ajouter
                            </button>
                        </div>

                        {/* Liste des articles */}
                        <div className="articles-list">
                            {lignesDevis.length === 0 ? (
                                <div className="empty-state">Aucun article ajouté</div>
                            ) : (
                                lignesDevis.map((ligne, index) => (
                                    <div key={index} className="article-item">
                                        <div className="article-info">
                                            <strong>{ligne.designation}</strong>
                                            <span>x{ligne.quantite} = {formatMontant(ligne.montant_ht)}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveArticle(index)}
                                            className="btn-icon btn-danger btn-sm"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Récapitulatif */}
                        <div className="totaux-container">
                            <h3>RÉCAPITULATIF</h3>
                            <div className="totaux-details">
                                <div className="totaux-row">
                                    <span>Total des articles (HT):</span>
                                    <strong>{formatMontant(totalHT)}</strong>
                                </div>
                                {formData.precompte_applique && (
                                    <div className="totaux-row">
                                        <span>Précompte (9.5%):</span>
                                        <strong style={{ color: 'orange' }}>-{formatMontant(montantPrecompte)}</strong>
                                    </div>
                                )}
                                <div className="totaux-divider"></div>
                                <div className="totaux-row totaux-final">
                                    <span>NET À PAYER (TTC):</span>
                                    <strong style={{ color: '#E53E3E' }}>{formatMontant(totalTTC)}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer avec boutons */}
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">
                            ✕ Annuler
                        </button>
                        <button type="submit" className="btn btn-success">
                            ✓ Enregistrer
                        </button>
                    </div>
                    </form>
                </div>
            </div>

            {/* Modal nouveau client */}
            {showClientModal && (
                <ClientForm
                    onClose={() => setShowClientModal(false)}
                    onSuccess={handleClientCreated}
                />
            )}
        </>
    );
}

export default DevisFormModal;
