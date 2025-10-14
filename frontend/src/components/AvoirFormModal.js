import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { avoirService, clientService, factureService, formatMontant } from '../services/api';
import { FaTimes, FaPlus, FaMinus, FaBox } from 'react-icons/fa';
import '../styles/Modal.css';

function AvoirFormModal({ avoir, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        numero_avoir: '',
        date_avoir: new Date().toISOString().split('T')[0],
        id_client: '',  // Nécessaire pour charger les factures
        id_facture: '',
        motif: '',
        montant_ht: 0,
        montant_ttc: 0,
        statut: 'EN_ATTENTE',
        lignes: []  // Articles sélectionnés avec quantités
    });

    const [clients, setClients] = useState([]);
    const [factures, setFactures] = useState([]);
    const [facturesClient, setFacturesClient] = useState([]);
    const [articlesDisponibles, setArticlesDisponibles] = useState([]);
    const [showArticlesModal, setShowArticlesModal] = useState(false);
    const [selectedArticles, setSelectedArticles] = useState([]);  // Articles avec leurs quantités
    const [precompteActive, setPrecompteActive] = useState(false);  // Si précompte 9.5% appliqué
    const [montantPaye, setMontantPaye] = useState(0);  // Montant déjà payé de la facture (limite pour l'avoir)

    useEffect(() => {
        loadClients();
        
        if (avoir) {
            // Mode édition
            setFormData({
                numero_avoir: avoir.numero_avoir || '',
                date_avoir: avoir.date_avoir || new Date().toISOString().split('T')[0],
                // id_client: avoir.id_client || '',  // Temporaire: retiré
                id_facture: avoir.id_facture || '',
                motif: avoir.motif || '',
                montant_ht: avoir.montant_ht || 0,
                montant_ttc: avoir.montant_ttc || 0,
                statut: avoir.statut || 'EN_ATTENTE'
            });
            
            if (avoir.id_client) {
                loadFacturesClient(avoir.id_client);
            }
        } else {
            // Mode création : générer le numéro
            generateNumeroAvoir();
        }
    }, [avoir]);

    const loadClients = async () => {
        try {
            const data = await clientService.getAll();
            setClients(data || []);
        } catch (error) {
            toast.error('Erreur lors du chargement des clients');
        }
    };

    const loadFacturesClient = async (clientId) => {
        try {
            // Charger TOUTES les factures du client (comme Python ligne 954-959)
            // Python ne filtre PAS par type_facture, il prend TOUT !
            const data = await factureService.getAll({ 
                id_client: clientId
                // PAS de filtre type_facture ! On prend tout comme Python
            });
            
            console.log('📦 Factures chargées pour client', clientId, ':', data?.length || 0);
            
            if (data && data.length > 0) {
                setFacturesClient(data);
                
                // COMME PYTHON ligne 972-975 : Sélectionner automatiquement la PREMIÈRE facture
                const premiereFacture = data[0];
                await selectionnerFacture(premiereFacture.id_facture, premiereFacture);
            } else {
                setFacturesClient([]);
                toast.info('Ce client n\'a aucune facture');
            }
        } catch (error) {
            console.error('Erreur chargement factures:', error);
            setFacturesClient([]);
            toast.error('Erreur lors du chargement des factures');
        }
    };
    
    // EXACTEMENT comme Python ligne 984-1027 (charger_details_facture)
    const selectionnerFacture = async (factureId, factureData = null) => {
        // Utiliser la facture passée en paramètre ou chercher dans le state
        const facture = factureData || facturesClient.find(f => f.id_facture === parseInt(factureId));
        if (!facture) {
            console.error('❌ Facture non trouvée:', factureId);
            return;
        }
        
        console.log('✅ Facture sélectionnée:', facture.numero_facture);
        
        try {
            // SIMPLE comme Python ligne 1007-1024 :
            // Pré-remplir les montants avec ceux de la FACTURE (montant total)
            // L'utilisateur ajustera manuellement si besoin
            
            const montant_ht = facture.montant_ht || facture.total_ht || 0;
            const montant_ttc = facture.montant_ttc || facture.total_ttc || 0;
            const montant_avance = facture.montant_avance || 0;
            
            console.log('📄 Détails facture:', {
                numero: facture.numero_facture,
                montant_total: montant_ttc,
                montant_avance: montant_avance,
                montant_reste: facture.montant_reste
            });
            
            // Détecter le précompte (ligne 1017-1021)
            const precompte = facture.precompte_applique === 1 || facture.precompte_applique === true;
            setPrecompteActive(precompte);
            
            // Stocker le montant payé pour validation (montant_avance = tout ce qui a été payé)
            setMontantPaye(montant_avance);
            
            // Pré-remplir avec le montant TOTAL de la facture (ligne 1009-1014)
            setFormData(prev => ({
                ...prev,
                id_facture: factureId,
                montant_ht: montant_ht,
                montant_ttc: montant_ttc  // Montant total, pas limité ! Utilisateur ajuste
            }));
            
            // Charger les articles de la facture
            await loadArticlesFacture(factureId);
            
        } catch (error) {
            console.error('Erreur sélection facture:', error);
        }
    };

    const generateNumeroAvoir = async () => {
        try {
            const response = await avoirService.generateNumero();
            // Le backend retourne maintenant un objet JSON: { numero_avoir: "AVO-2025-001" }
            const numero = response.numero_avoir || response;
            setFormData(prev => ({ ...prev, numero_avoir: numero }));
        } catch (error) {
            console.error('Erreur génération numéro avoir:', error);
            // Génération locale en cas d'erreur
            const year = new Date().getFullYear();
            const numero = `AVO-${year}-001`;
            setFormData(prev => ({ ...prev, numero_avoir: numero }));
        }
    };

    const handleClientChange = (clientId) => {
        setFormData({ ...formData, id_client: clientId, id_facture: '' });
        if (clientId) {
            loadFacturesClient(clientId);
        } else {
            setFacturesClient([]);
        }
    };

    const handleFactureChange = async (factureId) => {
        // Utiliser la fonction selectionnerFacture qui calcule le vrai montant payé
        if (factureId) {
            // Passer null comme 2e param car facturesClient est déjà à jour quand on change manuellement
            await selectionnerFacture(factureId, null);
        }
    };
    
    const loadArticlesFacture = async (factureId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/factures/${factureId}/articles-disponibles`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setArticlesDisponibles(data || []);
            } else {
                setArticlesDisponibles([]);
            }
        } catch (error) {
            console.error('Erreur chargement articles facture:', error);
            setArticlesDisponibles([]);
        }
    };
    
    // Calcul automatique HT -> TTC avec précompte 9.5% (comme Python ligne 1029-1056)
    const calculerTTCFromHT = (montantHT) => {
        const ht = parseFloat(montantHT) || 0;
        if (ht <= 0) return 0;
        
        if (precompteActive) {
            // Appliquer précompte 9.5%: TTC = HT - (HT * 0.095)
            const precompte = ht * 0.095;
            return ht - precompte;
        }
        
        // Pas de précompte: TTC = HT
        return ht;
    };
    
    // Calcul automatique TTC -> HT avec précompte 9.5% (comme Python ligne 1058-1085)
    const calculerHTFromTTC = (montantTTC) => {
        const ttc = parseFloat(montantTTC) || 0;
        if (ttc <= 0) return 0;
        
        if (precompteActive) {
            // Calculer HT depuis TTC: HT = TTC / 0.905
            return ttc / 0.905;
        }
        
        // Pas de précompte: HT = TTC
        return ttc;
    };
    
    const handleMontantHTChange = (value) => {
        const ht = parseFloat(value) || 0;
        const ttc = calculerTTCFromHT(ht);
        setFormData(prev => ({
            ...prev,
            montant_ht: ht,
            montant_ttc: ttc
        }));
    };
    
    const handleMontantTTCChange = (value) => {
        const ttc = parseFloat(value) || 0;
        const ht = calculerHTFromTTC(ttc);
        setFormData(prev => ({
            ...prev,
            montant_ht: ht,
            montant_ttc: ttc
        }));
    };
    
    // Ouvrir le modal de sélection d'articles (comme Python ligne 1113-1166)
    const handleOpenArticlesSelection = () => {
        if (!formData.id_facture) {
            toast.warning('Veuillez d\'abord sélectionner une facture');
            return;
        }
        
        if (articlesDisponibles.length === 0) {
            toast.warning('Aucun article disponible dans cette facture');
            return;
        }
        
        setShowArticlesModal(true);
    };
    
    // Valider la sélection d'articles (comme Python ligne 1308-1357)
    const handleValidateArticlesSelection = () => {
        const articlesSelectes = selectedArticles.filter(a => a.selected && a.quantite_retour > 0);
        
        if (articlesSelectes.length === 0) {
            toast.warning('Veuillez sélectionner au moins un article');
            return;
        }
        
        // Calculer les montants totaux
        let totalHT = 0;
        let totalTTC = 0;
        
        const lignes = articlesSelectes.map(article => {
            const proportion = article.quantite_retour / article.quantite_max;
            const montantHT = article.montant_ht * proportion;
            const montantTTC = article.montant_ttc * proportion;
            
            totalHT += montantHT;
            totalTTC += montantTTC;
            
            return {
                id_article: article.id_article,
                quantite: article.quantite_retour,
                prix_unitaire: article.prix_unitaire,
                montant_ht: montantHT,
                montant_ttc: montantTTC
            };
        });
        
        // VALIDATION CRITIQUE : Les articles sélectionnés ne doivent pas dépasser le montant PAYÉ
        if (totalTTC > montantPaye && montantPaye > 0) {
            toast.error(
                `❌ IMPOSSIBLE : Les articles sélectionnés totalisent ${formatMontant(totalTTC)} ` +
                `mais le client n'a payé que ${formatMontant(montantPaye)}.\n\n` +
                `Vous ne pouvez retourner que des articles correspondant au montant payé.\n` +
                `Réduisez les quantités ou désélectionnez des articles.`,
                { autoClose: 10000 }
            );
            return;
        }
        
        // Mettre à jour le formulaire avec les montants CALCULÉS depuis les articles
        setFormData(prev => ({
            ...prev,
            lignes: lignes,
            montant_ht: totalHT,
            montant_ttc: totalTTC  // Ces montants sont VERROUILLÉS (basés sur les articles)
        }));
        
        setShowArticlesModal(false);
        toast.success(
            `✅ ${articlesSelectes.length} article(s) sélectionné(s)\n` +
            `Montant total: ${formatMontant(totalTTC)}\n` +
            `Les montants sont maintenant verrouillés (basés sur les articles retournés)`,
            { autoClose: 5000 }
        );
    };
    
    const toggleArticleSelection = (articleId) => {
        setSelectedArticles(prev => prev.map(article => 
            article.id_article === articleId 
                ? { ...article, selected: !article.selected }
                : article
        ));
    };
    
    const updateQuantiteRetour = (articleId, quantite) => {
        setSelectedArticles(prev => prev.map(article => 
            article.id_article === articleId 
                ? { ...article, quantite_retour: Math.min(Math.max(0, parseInt(quantite) || 0), article.quantite_max) }
                : article
        ));
    };
    
    useEffect(() => {
        // Initialiser selectedArticles quand articlesDisponibles change
        if (articlesDisponibles.length > 0) {
            setSelectedArticles(articlesDisponibles.map(article => ({
                ...article,
                selected: false,
                quantite_max: article.quantite_facture || article.quantite_max || 0,  // Backend retourne quantite_facture
                quantite_retour: article.quantite_facture || article.quantite_max || 0
            })));
        }
    }, [articlesDisponibles]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation (comme Python ligne 1413-1428)
        if (!formData.numero_avoir) {
            toast.error('Le numéro d\'avoir est obligatoire');
            return;
        }

        if (!formData.id_facture) {
            toast.error('Veuillez sélectionner une facture de référence');
            return;
        }

        if (!formData.motif) {
            toast.error('Veuillez saisir un motif');
            return;
        }
        
        if (formData.lignes.length === 0) {
            toast.error('Veuillez sélectionner au moins un article à rembourser');
            return;
        }
        
        // VALIDATION CRITIQUE : L'avoir ne peut pas dépasser le montant PAYÉ
        // (Correction de l'incohérence du code Python)
        const montantAvoirTTC = parseFloat(formData.montant_ttc) || 0;
        
        if (montantAvoirTTC <= 0) {
            toast.error('Le montant doit être supérieur à 0');
            return;
        }
        
        console.log('🔍 VALIDATION AVOIR:', {
            montantAvoir: montantAvoirTTC,
            montantPaye: montantPaye,
            depasse: montantAvoirTTC > montantPaye
        });
        
        if (montantPaye === 0) {
            toast.error('Cette facture n\'a pas encore été payée. Impossible de créer un avoir.');
            return;
        }
        
        if (montantAvoirTTC > montantPaye) {
            toast.error(`L'avoir ne peut pas dépasser le montant payé de la facture (${formatMontant(montantPaye)}). Montant actuel: ${formatMontant(montantAvoirTTC)}`);
            return;
        }

        try {
            const avoirData = {
                numero_avoir: formData.numero_avoir,
                date_avoir: formData.date_avoir,
                id_facture: parseInt(formData.id_facture),
                // NE PAS envoyer id_client car la colonne n'existe pas en base MySQL
                // Le client sera récupéré via la facture si besoin
                motif: formData.motif,
                montant: parseFloat(formData.montant_ttc),  // UN SEUL champ "montant" en MySQL (= montant TTC)
                statut: formData.statut,
                lignes: formData.lignes  // Envoyer les lignes d'articles
            };
            
            console.log('📤 Données envoyées au backend:', avoirData);

            if (avoir) {
                // Modification
                await avoirService.update(avoir.id_avoir, avoirData);
                toast.success('Avoir modifié avec succès');
            } else {
                // Création
                const response = await avoirService.create(avoirData);
                console.log('✅ Réponse backend:', response);
                toast.success('Avoir créé avec succès');
            }

            onSuccess();
        } catch (error) {
            console.error('❌ ERREUR COMPLÈTE:', error);
            console.error('❌ Détails erreur:', error.response?.data);
            toast.error(error.response?.data?.detail || 'Erreur lors de l\'enregistrement de l\'avoir');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>💰 {avoir ? 'Modifier l\'Avoir' : 'Nouvel Avoir'}</h2>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-scroll">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>N° Avoir *</label>
                                <input
                                    type="text"
                                    value={formData.numero_avoir}
                                    disabled
                                    className="form-control"
                                />
                            </div>

                            <div className="form-group">
                                <label>Date *</label>
                                <input
                                    type="date"
                                    value={formData.date_avoir}
                                    onChange={(e) => setFormData({ ...formData, date_avoir: e.target.value })}
                                    className="form-control"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Client *</label>
                            <select
                                value={formData.id_client}
                                onChange={(e) => handleClientChange(e.target.value)}
                                className="form-control"
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
                            <label>Facture *</label>
                            <select
                                value={formData.id_facture}
                                onChange={(e) => handleFactureChange(e.target.value)}
                                className="form-control"
                                disabled={!formData.id_client}
                            >
                                <option value="">Aucune facture</option>
                                {facturesClient.map(facture => (
                                    <option key={facture.id_facture} value={facture.id_facture}>
                                        {facture.numero_facture} - Total: {formatMontant(facture.montant_ttc || facture.total_ttc || 0)} | Payé: {formatMontant(facture.montant_avance || 0)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Afficher le montant payé pour info */}
                        {montantPaye > 0 && (
                            <div className="form-group" style={{ backgroundColor: '#2d2d2d', padding: '12px', borderRadius: '6px', border: '1px solid #444' }}>
                                <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '5px' }}>
                                    💰 Montant payé de cette facture :
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10B981' }}>
                                    {formatMontant(montantPaye)}
                                </div>
                                <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                                    ⚠️ L'avoir ne peut pas dépasser ce montant
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Motif *</label>
                            <textarea
                                value={formData.motif}
                                onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                                className="form-control"
                                rows="3"
                                placeholder="Raison de l'avoir (Ex: Retour produit défectueux, Remise commerciale...)"
                                required
                            />
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                            <label>Montant HT * {formData.lignes.length > 0 && <span style={{fontSize: '11px', color: '#10B981'}}>(Calculé depuis les articles)</span>}</label>
                                <input
                                    type="number"
                                    value={formData.montant_ht}
                                onChange={(e) => handleMontantHTChange(e.target.value)}
                                    className="form-control"
                                    min="0"
                                    step="0.01"
                                    required
                                disabled={formData.lignes.length > 0}
                                style={formData.lignes.length > 0 ? { backgroundColor: '#1a1a1a', cursor: 'not-allowed' } : {}}
                                />
                            </div>

                            <div className="form-group">
                            <label>Montant TTC * {precompteActive && <span style={{fontSize: '12px', color: '#F59E0B'}}>(Précompte 9.5%)</span>} {formData.lignes.length > 0 && <span style={{fontSize: '11px', color: '#10B981'}}>(Calculé depuis les articles)</span>}</label>
                                <input
                                    type="number"
                                    value={formData.montant_ttc}
                                onChange={(e) => handleMontantTTCChange(e.target.value)}
                                    className="form-control"
                                    min="0"
                                    step="0.01"
                                    required
                                disabled={formData.lignes.length > 0}
                                style={formData.lignes.length > 0 ? { backgroundColor: '#1a1a1a', cursor: 'not-allowed' } : {}}
                            />
                        </div>
                    </div>
                    
                    {/* Message explicatif si articles sélectionnés */}
                    {formData.lignes.length > 0 && (
                        <div style={{ 
                            backgroundColor: '#1a4d2e', 
                            padding: '10px', 
                            borderRadius: '6px', 
                            marginTop: '10px',
                            border: '1px solid #10B981',
                            fontSize: '13px',
                            color: '#fff'
                        }}>
                            ✅ Les montants sont calculés automatiquement depuis les articles sélectionnés. Pour les modifier, resélectionnez les articles.
                        </div>
                    )}
                    
                    {/* Bouton de sélection d'articles */}
                    <div className="form-group">
                        <button
                            type="button"
                            onClick={handleOpenArticlesSelection}
                            className="btn btn-primary"
                            disabled={!formData.id_facture}
                            style={{ width: '100%', padding: '12px', fontSize: '16px' }}
                        >
                            <FaBox /> Sélectionner les articles à rembourser
                        </button>
                    </div>
                    
                    {/* Affichage des articles sélectionnés */}
                    {formData.lignes.length > 0 && (
                        <div className="form-group">
                            <label>Articles à rembourser ({formData.lignes.length})</label>
                            <div style={{
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                padding: '12px',
                                maxHeight: '200px',
                                overflowY: 'auto'
                            }}>
                                {formData.lignes.map((ligne, index) => {
                                    const article = articlesDisponibles.find(a => a.id_article === ligne.id_article);
                                    return (
                                        <div key={index} style={{
                                            backgroundColor: '#2d2d2d',
                                            padding: '10px',
                                            marginBottom: '8px',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <strong>{article?.designation || 'Article'}</strong>
                                                <div style={{ fontSize: '12px', color: '#888' }}>
                                                    Quantité: {ligne.quantite} × {formatMontant(ligne.prix_unitaire)}
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 'bold', color: '#10B981' }}>
                                                {formatMontant(ligne.montant_ttc)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                        <div className="form-group">
                            <label>Statut</label>
                            <select
                                value={formData.statut}
                                onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                                className="form-control"
                            >
                                <option value="EN_ATTENTE">En Attente</option>
                                <option value="VALIDE">Validé</option>
                                <option value="REFUSE">Refusé</option>
                                <option value="TRAITE">Traité</option>
                            </select>
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
            
            {/* Modal de sélection d'articles (comme Python ligne 1113-1294) */}
            {showArticlesModal && (
                <div className="modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="modal-container" style={{ maxWidth: '900px', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📦 Sélection des articles à rembourser</h2>
                            <button className="btn-close" onClick={() => setShowArticlesModal(false)}>✕</button>
                        </div>
                        
                        {/* Afficher le montant payé comme limite */}
                        <div style={{ 
                            backgroundColor: '#2d2d2d', 
                            padding: '12px 20px', 
                            borderBottom: '2px solid #444',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <span style={{ color: '#aaa', fontSize: '13px' }}>Montant payé de la facture :</span>
                                <strong style={{ color: '#10B981', fontSize: '16px', marginLeft: '10px' }}>
                                    {formatMontant(montantPaye)}
                                </strong>
                            </div>
                            <div style={{ color: '#F59E0B', fontSize: '12px' }}>
                                ⚠️ L'avoir ne peut pas dépasser ce montant
                            </div>
                        </div>
                        
                        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '20px' }}>
                            {selectedArticles.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                                    Aucun article disponible
                                </div>
                            ) : (
                                selectedArticles.map(article => (
                                    <div key={article.id_article} style={{
                                        backgroundColor: '#2d2d2d',
                                        border: '1px solid #444',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                            {/* Checkbox */}
                                            <input
                                                type="checkbox"
                                                checked={article.selected}
                                                onChange={() => toggleArticleSelection(article.id_article)}
                                                style={{
                                                    marginRight: '15px',
                                                    marginTop: '5px',
                                                    width: '20px',
                                                    height: '20px',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                            
                                            {/* Informations article */}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                                                    {article.designation}
                                                </div>
                                                <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#999' }}>
                                                    <span>Quantité facturée: <strong style={{color: '#fff'}}>{article.quantite_max || article.quantite_facture || 0}</strong></span>
                                                    <span>Prix unitaire: <strong style={{color: '#fff'}}>{formatMontant(article.prix_unitaire)}</strong></span>
                                                    <span>Total: <strong style={{color: '#10B981'}}>{formatMontant(article.montant_ttc)}</strong></span>
                                                </div>
                                            </div>
                                            
                                            {/* Quantité à rembourser */}
                                            <div style={{ marginLeft: '20px' }}>
                                                <label style={{ 
                                                    display: 'block', 
                                                    fontSize: '12px', 
                                                    marginBottom: '5px',
                                                    color: '#aaa'
                                                }}>
                                                    Quantité à rembourser:
                                                </label>
                                                <input
                                                    type="number"
                                                    value={article.quantite_retour}
                                                    onChange={(e) => updateQuantiteRetour(article.id_article, e.target.value)}
                                                    disabled={!article.selected}
                                                    min="0"
                                                    max={article.quantite_max}
                                                    style={{
                                                        width: '100px',
                                                        padding: '8px',
                                                        backgroundColor: article.selected ? '#1a1a1a' : '#333',
                                                        border: '1px solid #444',
                                                        borderRadius: '6px',
                                                        color: '#fff',
                                                        fontSize: '14px',
                                                        textAlign: 'center'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <div className="modal-footer">
                            <button 
                                type="button" 
                                onClick={() => setShowArticlesModal(false)} 
                                className="btn btn-secondary"
                            >
                                ❌ Annuler
                            </button>
                            <button 
                                type="button" 
                                onClick={handleValidateArticlesSelection} 
                                className="btn btn-success"
                            >
                                ✅ Valider la sélection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AvoirFormModal;
