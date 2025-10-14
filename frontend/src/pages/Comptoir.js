import React, { useState, useEffect } from 'react';
import { FaShoppingCart, FaSearch, FaTrash, FaCheck, FaPrint, FaHistory, FaUndo } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { comptoirService, articleService, formatMontant } from '../services/api';
import { confirmClearCart, confirmAction, confirmDelete } from '../utils/sweetAlertHelper';
import '../styles/Comptoir.css';

function Comptoir() {
    const [articles, setArticles] = useState([]);
    const [filteredArticles, setFilteredArticles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [panier, setPanier] = useState([]);
    const [venteJour, setVenteJour] = useState(0);
    const [modeRetour, setModeRetour] = useState(false);
    const [montantClient, setMontantClient] = useState('');
    
    // 🔥 HISTORIQUE DES VENTES
    const [afficherHistorique, setAfficherHistorique] = useState(false);
    const [ventesHistorique, setVentesHistorique] = useState([]); // TOUJOURS un tableau
    const [filteredVentesHistorique, setFilteredVentesHistorique] = useState([]); // Ventes filtrées
    const [searchHistorique, setSearchHistorique] = useState(''); // Terme de recherche
    const [loadingHistorique, setLoadingHistorique] = useState(false);
    
    // 🔥 DÉTAILS D'UNE VENTE
    const [afficherDetails, setAfficherDetails] = useState(false);
    const [venteDetails, setVenteDetails] = useState(null);
    
    // 🔥 INFORMATIONS ENTREPRISE (pour le ticket)
    const [entreprise, setEntreprise] = useState(null);
    
    // Utilisateur connecté
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        loadArticles();
        loadVenteJour();
        loadEntrepriseInfo();
    }, []);

    useEffect(() => {
        filterArticles();
    }, [searchTerm, articles]);

    const loadArticles = async () => {
        try {
            const data = await articleService.getAll();
            // Filtrer seulement les produits actifs (PAS de vérification stock comme Python)
            const produits = (data || []).filter(a => 
                a.type_article === 'PRODUIT' && 
                a.actif !== 0
                // PAS de vérification stock_actuel > 0 comme Python
            );
            setArticles(produits);
            setFilteredArticles(produits);
        } catch (error) {
            console.error('Erreur chargement articles:', error);
            toast.error('Erreur lors du chargement des articles');
        }
    };

    const loadEntrepriseInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/entreprise/config', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setEntreprise(data);
        } catch (error) {
            console.error('Erreur chargement entreprise:', error);
        }
    };

    const loadVenteJour = async () => {
        try {
            const response = await comptoirService.getVentesAujourdhui();
            setVenteJour(response.total_jour || 0);
        } catch (error) {
            console.error('Erreur chargement vente du jour:', error);
        }
    };

    const filterArticles = () => {
        if (!searchTerm) {
            setFilteredArticles(articles);
            return;
        }
        
        const filtered = articles.filter(article => 
            article.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.code_article?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.categorie?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredArticles(filtered);
    };

    const handleAddToPanier = (article) => {
        const existant = panier.find(item => item.id_article === article.id_article);
        
        if (existant) {
            // PAS DE VÉRIFICATION DE STOCK comme Python (ligne 1238-1291)
            // Le stock peut devenir négatif, c'est normal
            setPanier(panier.map(item => 
                item.id_article === article.id_article
                    ? { ...item, quantite: item.quantite + 1, total: (item.quantite + 1) * item.prix }
                    : item
            ));
        } else {
            setPanier([...panier, {
                id_article: article.id_article,
                designation: article.designation,
                quantite: 1,
                prix: article.prix_vente,
                remise: 0,
                total: article.prix_vente,
                stock_disponible: article.stock_actuel
            }]);
        }
    };

    const handleUpdateQuantite = (id_article, nouvelle_quantite) => {
        if (nouvelle_quantite < 1) return;
        
        const article = panier.find(item => item.id_article === id_article);
        if (nouvelle_quantite > article.stock_disponible) {
            toast.warning(`Stock insuffisant (${article.stock_disponible} disponibles)`);
            return;
        }
        
        setPanier(panier.map(item =>
            item.id_article === id_article
                ? { ...item, quantite: nouvelle_quantite, total: nouvelle_quantite * item.prix * (1 - item.remise / 100) }
                : item
        ));
    };

    const handleUpdateRemise = (id_article, nouvelle_remise) => {
        if (nouvelle_remise < 0 || nouvelle_remise > 100) return;
        
        setPanier(panier.map(item =>
            item.id_article === id_article
                ? { ...item, remise: nouvelle_remise, total: item.quantite * item.prix * (1 - nouvelle_remise / 100) }
                : item
        ));
    };

    const handleRemoveFromPanier = (id_article) => {
        setPanier(panier.filter(item => item.id_article !== id_article));
    };

    const handleViderPanier = async () => {
        if (panier.length === 0) return;
        const confirmed = await confirmClearCart();
        if (confirmed) {
            setPanier([]);
            setMontantClient('');
        }
    };

    const handleBasculerMode = async () => {
        // 🔥 Vérification comme Python ligne 206-216
        // Si on veut passer en mode retour, vérifier qu'il y a eu des ventes
        if (!modeRetour) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:8000/api/comptoir/verifier-ventes-aujourd-hui', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                
                if (!data.ventes_aujourd_hui) {
                    toast.warning(
                        "Retour impossible\n\nAucune vente n'a été effectuée aujourd'hui.\n" +
                        "Vous ne pouvez pas faire de retour sans avoir vendu d'articles.",
                        { autoClose: 5000 }
                    );
                    return; // Annuler le basculement
                }
            } catch (error) {
                console.error('Erreur vérification ventes:', error);
                toast.error('Erreur lors de la vérification des ventes');
                return;
            }
        }
        
        if (panier.length > 0) {
            const confirmed = await confirmAction(
                'Changer de mode ?',
                'Changer de mode va vider le panier actuel. Continuer ?',
                'Oui, continuer',
                'warning'
            );
            if (!confirmed) return;
        }
        
        setModeRetour(!modeRetour);
        setPanier([]);
        setMontantClient('');
    };

    const calculateTotal = () => {
        return panier.reduce((sum, item) => sum + item.total, 0);
    };

    const calculateMonnaie = () => {
        const total = calculateTotal();
        const especes = parseFloat(montantClient) || 0;
        return especes - total;
    };

    const handleValiderVente = async () => {
        if (panier.length === 0) {
            toast.warning('Le panier est vide');
            return;
        }

        const total = calculateTotal();
        const especes = parseFloat(montantClient) || 0;

        if (!modeRetour && especes < total) {
            toast.error('Montant insuffisant');
            return;
        }

        try {
            const venteData = {
                articles: panier.map(item => ({
                    id_article: item.id_article,
                    quantite: item.quantite,  // Toujours positif, le backend gère le signe
                    prix_unitaire: item.prix_unitaire || item.prix  // Nom correct
                })),
                montant_recu: especes,
                type_vente: modeRetour ? 'RETOUR' : 'COMPTOIR',  // 🔥 Type détermine l'opération stock
                notes: null
            };

            console.log('Envoi de la vente:', venteData); // Debug
            await comptoirService.creerVente(venteData);
            
            if (modeRetour) {
                toast.success(`Retour enregistré ! Remboursement: ${formatMontant(total)}`);
            } else {
                toast.success(`Vente enregistrée ! Monnaie: ${formatMontant(calculateMonnaie())}`);
            }

            // Réinitialiser
            setPanier([]);
            setMontantClient('');
            loadArticles();
            loadVenteJour();

            // Imprimer le ticket
            handleImprimerTicket(venteData);

        } catch (error) {
            console.error('Erreur validation vente:', error);
            toast.error('Erreur lors de l\'enregistrement de la vente');
        }
    };

    const handleImprimerTicket = (vente) => {
        // Créer un ticket à imprimer
        const ticketWindow = window.open('', '', 'width=300,height=600');
        const ticketHTML = `
            <html>
            <head>
                <title>Ticket - ${vente.type_vente}</title>
                <style>
                    body { font-family: 'Courier New', monospace; font-size: 12px; margin: 20px; }
                    .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                    .header h2 { margin: 5px 0; }
                    .item { display: flex; justify-content: space-between; margin: 5px 0; }
                    .total { border-top: 2px dashed #000; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 14px; }
                    .footer { text-align: center; border-top: 1px dashed #000; margin-top: 20px; padding-top: 10px; font-size: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>TECH INFO PLUS</h2>
                    <div>${vente.type_vente === 'RETOUR' ? 'TICKET DE RETOUR' : 'TICKET DE VENTE'}</div>
                    <div>${new Date().toLocaleString('fr-FR')}</div>
                    <div>Vendeur: ${user.nom_utilisateur || 'Système'}</div>
                </div>
                ${vente.articles.map(item => `
                    <div class="item">
                        <span>${item.quantite > 0 ? item.quantite : -item.quantite} x ${panier.find(p => p.id_article === item.id_article)?.designation}</span>
                        <span>${formatMontant(item.montant_total)}</span>
                    </div>
                `).join('')}
                <div class="total">
                    <div class="item">
                        <span>TOTAL:</span>
                        <span>${formatMontant(vente.montant_total)}</span>
                    </div>
                    ${vente.type_vente !== 'RETOUR' ? `
                        <div class="item">
                            <span>REÇU:</span>
                            <span>${formatMontant(vente.montant_recu)}</span>
                        </div>
                        <div class="item">
                            <span>MONNAIE:</span>
                            <span>${formatMontant(vente.monnaie)}</span>
                        </div>
                    ` : `
                        <div class="item">
                            <span>REMBOURSEMENT:</span>
                            <span>${formatMontant(vente.montant_total)}</span>
                        </div>
                    `}
                </div>
                <div class="footer">
                    Merci de votre visite !<br>
                    À bientôt
                </div>
            </body>
            </html>
        `;
        
        ticketWindow.document.write(ticketHTML);
        ticketWindow.document.close();
        ticketWindow.print();
    };

    // 🔥 CHARGER L'HISTORIQUE DES VENTES (depuis FACTURE comme Python)
    const chargerHistoriqueVentes = async () => {
        setLoadingHistorique(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/comptoir/ventes?limit=50', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            console.log('Ventes chargées:', data); // Pour debug
            console.log('Type:', typeof data, 'Est array:', Array.isArray(data));
            
            // S'assurer que c'est un tableau
            if (Array.isArray(data)) {
                setVentesHistorique(data);
                setFilteredVentesHistorique(data); // Initialiser les ventes filtrées
            } else {
                console.error('La réponse n\'est pas un tableau:', data);
                setVentesHistorique([]);
                setFilteredVentesHistorique([]);
                toast.error('Format de données incorrect');
            }
        } catch (error) {
            console.error('Erreur chargement historique:', error);
            toast.error('Erreur lors du chargement de l\'historique');
            setVentesHistorique([]);
            setFilteredVentesHistorique([]);
        } finally {
            setLoadingHistorique(false);
        }
    };

    // 🔥 FILTRER L'HISTORIQUE DES VENTES
    const filtrerHistoriqueVentes = () => {
        if (!searchHistorique.trim()) {
            setFilteredVentesHistorique(ventesHistorique);
            return;
        }

        const terme = searchHistorique.toLowerCase();
        const filtered = ventesHistorique.filter(vente => 
            vente.numero_facture?.toLowerCase().includes(terme) ||
            vente.client_nom?.toLowerCase().includes(terme) ||
            vente.vendeur?.toLowerCase().includes(terme) ||
            vente.montant_total?.toString().includes(terme)
        );
        setFilteredVentesHistorique(filtered);
    };

    // 🔥 EFFET POUR FILTRER QUAND LA RECHERCHE CHANGE
    useEffect(() => {
        filtrerHistoriqueVentes();
    }, [searchHistorique, ventesHistorique]);

    const handleHistorique = () => {
        setAfficherHistorique(true);
        chargerHistoriqueVentes();
    };

    const fermerHistorique = () => {
        setAfficherHistorique(false);
        setSearchHistorique(''); // Réinitialiser la recherche
    };

    const supprimerVente = async (idFacture, numeroFacture) => {
        const confirmed = await confirmDelete(`la vente "${numeroFacture}"`);
        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:8000/api/comptoir/ventes/${idFacture}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success('Vente supprimée avec succès');
            chargerHistoriqueVentes(); // Recharger l'historique
        } catch (error) {
            console.error('Erreur suppression:', error);
            toast.error('Erreur lors de la suppression de la vente');
        }
    };

    // 🔥 VOIR DÉTAILS D'UNE VENTE (comme Python ligne 1588-1629)
    const voirDetailsVente = async (idFacture) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/comptoir/ventes/${idFacture}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setVenteDetails(data);
            setAfficherDetails(true);
        } catch (error) {
            console.error('Erreur chargement détails:', error);
            toast.error('Erreur lors du chargement des détails');
        }
    };

    const fermerDetails = () => {
        setAfficherDetails(false);
        setVenteDetails(null);
    };

    // 🔥 IMPRIMER LE TICKET (comme Python ligne 1748-1835)
    const imprimerTicket = () => {
        if (!venteDetails) return;
        
        // Créer le contenu HTML du ticket
        const ticketHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Ticket ${venteDetails.numero_facture}</title>
                <style>
                    @media print {
                        body { margin: 0; padding: 20px; }
                    }
                    body {
                        font-family: 'Courier New', monospace;
                        width: 300px;
                        margin: 0 auto;
                        padding: 20px;
                        background: white;
                        color: black;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 2px dashed #000;
                        padding-bottom: 15px;
                    }
                    .header h2 {
                        margin: 5px 0;
                        font-size: 18px;
                    }
                    .header p {
                        margin: 3px 0;
                        font-size: 11px;
                    }
                    .info {
                        margin: 15px 0;
                        font-size: 12px;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        margin: 3px 0;
                    }
                    .articles {
                        border-top: 1px dashed #000;
                        border-bottom: 1px dashed #000;
                        padding: 10px 0;
                        margin: 15px 0;
                    }
                    .article-ligne {
                        display: flex;
                        justify-content: space-between;
                        margin: 5px 0;
                        font-size: 11px;
                    }
                    .total {
                        text-align: right;
                        font-size: 16px;
                        font-weight: bold;
                        margin: 15px 0;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        border-top: 2px dashed #000;
                        padding-top: 15px;
                        font-size: 11px;
                    }
                </style>
            </head>
            <body>
                <!-- En-tête entreprise -->
                <div class="header">
                    <h2>🏪 ${entreprise?.nom || 'TECH INFO PLUS'}</h2>
                    <p>${entreprise?.adresse || 'Adresse entreprise'}</p>
                    <p>Tél: ${entreprise?.telephone || '00 00 00 00'}</p>
                    <p>Email: ${entreprise?.email || 'contact@techinfoplus.com'}</p>
                    ${entreprise?.nif ? `<p>NIF: ${entreprise.nif}</p>` : ''}
                </div>
                
                <!-- Type de vente -->
                <div style="text-align: center; font-weight: bold; margin: 15px 0;">
                    ${venteDetails.type_facture === 'RETOUR' ? '↩️ RETOUR DE VENTE' : '🛒 POINT DE VENTE'}
                </div>
                
                <!-- Informations vente -->
                <div class="info">
                    <div class="info-row">
                        <span>N° Facture:</span>
                        <strong>${venteDetails.numero_facture}</strong>
                    </div>
                    <div class="info-row">
                        <span>Date:</span>
                        <span>${venteDetails.date_vente ? new Date(venteDetails.date_vente).toLocaleString('fr-FR') : ''}</span>
                    </div>
                    <div class="info-row">
                        <span>Vendeur:</span>
                        <span>${venteDetails.vendeur || 'Système'}</span>
                    </div>
                </div>
                
                <!-- Articles -->
                <div class="articles">
                    ${venteDetails.lignes?.map(ligne => `
                        <div class="article-ligne">
                            <span>${ligne.article_nom}</span>
                        </div>
                        <div class="article-ligne" style="margin-left: 20px; font-size: 10px;">
                            <span>${ligne.quantite} x ${ligne.prix_unitaire.toLocaleString()}</span>
                            <span>${ligne.total_ht.toLocaleString()} FCFA</span>
                        </div>
                    `).join('') || ''}
                </div>
                
                <!-- Total -->
                <div class="total" style="color: ${venteDetails.type_facture === 'RETOUR' ? 'red' : 'green'};">
                    ${venteDetails.type_facture === 'RETOUR' ? 'RETOUR: ' : 'TOTAL: '}
                    ${venteDetails.type_facture === 'RETOUR' ? '-' : ''}${Math.abs(venteDetails.montant_total).toLocaleString()} FCFA
                </div>
                
                <!-- Montant versé et monnaie (comme Python ligne 1175-1181) -->
                ${venteDetails.type_facture === 'RETOUR' ? `
                    <div class="info">
                        <div class="info-row">
                            <span>Remboursement:</span>
                            <strong style="color: red;">${Math.abs(venteDetails.montant_total).toLocaleString()} FCFA</strong>
                        </div>
                    </div>
                ` : `
                    <div class="info">
                        <div class="info-row">
                            <span>Montant:</span>
                            <strong>${venteDetails.montant_total.toLocaleString()} FCFA</strong>
                        </div>
                        <div class="info-row">
                            <span>Payé par:</span>
                            <strong>ESPÈCES</strong>
                        </div>
                    </div>
                `}
                
                <!-- Pied de page -->
                    <p>${venteDetails.type_facture === 'RETOUR' ? 'Retour effectué avec succès !' : 'Merci pour votre achat !'}</p>
                    <p>www.techinfoplus.com</p>
                </div>
            </body>
            </html>
        `;
        
        // Ouvrir une nouvelle fenêtre pour l'impression
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        printWindow.document.write(ticketHTML);
        printWindow.document.close();
        
        // Attendre le chargement puis imprimer
        printWindow.onload = () => {
            printWindow.print();
            toast.success('Impression lancée');
        };
    };

    return (
        <div className="comptoir-container">
            {/* En-tête */}
            <div className="comptoir-header">
                <div className="vente-jour">
                    Vente du jour: <strong style={{
                        color: venteJour < 0 ? '#E74C3C' : venteJour === 0 ? '#b0b0b0' : '#2ecc71'
                    }}>
                        {formatMontant(venteJour)}
                        {venteJour < 0 && ' (Retours)'}
                    </strong>
                </div>
                
                <div className="info-session">
                    <span className="client-label">
                        {modeRetour ? 'RETOUR COMPTOIR' : 'CLIENT COMPTOIR'}
                    </span>
                    <span className="vendeur-label">
                        Vendeur: {user.nom_utilisateur || 'Système'} ({user.role || 'Utilisateur'})
                    </span>
                </div>
                
                <button 
                    className={`btn-mode ${modeRetour ? 'mode-retour' : 'mode-vente'}`}
                    onClick={handleBasculerMode}
                >
                    {modeRetour ? '↩️ RETOUR' : '🛒 VENTE'}
                </button>
            </div>

            <div className="comptoir-content">
                {/* Zone Panier (Gauche) */}
                <div className="panier-section">
                    <div className="section-header">
                        <FaShoppingCart /> <span>Panier</span>
                    </div>

                    <div className="panier-table-header">
                        <span>Article</span>
                        <span>Qté</span>
                        <span>Remise</span>
                        <span>Prix</span>
                        <span>Total</span>
                        <span>Actions</span>
                    </div>

                    <div className="panier-items">
                        {panier.length === 0 ? (
                            <div className="panier-vide">
                                Panier vide
                            </div>
                        ) : (
                            panier.map(item => (
                                <div key={item.id_article} className="panier-item">
                                    <span className="item-designation">{item.designation}</span>
                                    <input
                                        type="number"
                                        value={item.quantite}
                                        onChange={(e) => handleUpdateQuantite(item.id_article, parseInt(e.target.value) || 1)}
                                        className="input-quantite"
                                        min="1"
                                        max={item.stock_disponible}
                                    />
                                    <input
                                        type="number"
                                        value={item.remise}
                                        onChange={(e) => handleUpdateRemise(item.id_article, parseFloat(e.target.value) || 0)}
                                        className="input-remise"
                                        min="0"
                                        max="100"
                                        placeholder="0%"
                                    />
                                    <span className="item-prix">{formatMontant(item.prix)}</span>
                                    <span className="item-total">{formatMontant(item.total)}</span>
                                    <button
                                        className="btn-remove"
                                        onClick={() => handleRemoveFromPanier(item.id_article)}
                                        title="Retirer"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Zone Articles (Droite) */}
                <div className="articles-section">
                    <div className="search-bar">
                        <FaSearch />
                        <input
                            type="text"
                            placeholder="🔍 Rechercher par code, désignation ou catégorie..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <button className="btn-historique" onClick={handleHistorique}>
                            <FaHistory /> Historique
                        </button>
                    </div>

                    <div className="articles-grid">
                        {filteredArticles.map(article => (
                            <div
                                key={article.id_article}
                                className="article-card"
                                onClick={() => handleAddToPanier(article)}
                            >
                                <div className="article-name">{article.designation}</div>
                                <div className="article-price">{formatMontant(article.prix_vente)}</div>
                                <div className="article-stock">Stock: {article.stock_actuel}</div>
                                {article.categorie && (
                                    <div className="article-categorie">{article.categorie}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Zone de paiement (Bas) */}
            <div className="paiement-section">
                <div className="paiement-info">
                    <div className="info-row">
                        <span className="info-label">TOTAL:</span>
                        <span className="info-value total-value">{formatMontant(calculateTotal())}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">
                            {modeRetour ? 'REMBOURSEMENT:' : 'ESPÈCES CLIENT:'}
                        </span>
                        <input
                            type="number"
                            value={montantClient}
                            onChange={(e) => setMontantClient(e.target.value)}
                            className="input-montant"
                            placeholder="0"
                        />
                    </div>
                    <div className="info-row">
                        <span className="info-label">
                            {modeRetour ? 'REMBOURSEMENT:' : 'MONNAIE:'}
                        </span>
                        <span className={`info-value ${calculateMonnaie() < 0 ? 'monnaie-negative' : 'monnaie-positive'}`}>
                            {formatMontant(Math.abs(calculateMonnaie()))}
                        </span>
                    </div>
                </div>

                <div className="paiement-actions">
                    <button className="btn btn-danger" onClick={handleViderPanier}>
                        <FaTrash /> Vider
                    </button>
                    <button 
                        className={`btn ${modeRetour ? 'btn-warning' : 'btn-success'}`}
                        onClick={handleValiderVente}
                        disabled={panier.length === 0}
                    >
                        <FaCheck /> {modeRetour ? 'Valider Retour' : 'Valider Vente'}
                    </button>
                </div>
            </div>

            {/* 🔥 MODAL HISTORIQUE DES VENTES */}
            {afficherHistorique && (
                <div className="modal-overlay-historique" onClick={fermerHistorique}>
                    <div className="modal-historique-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-historique">
                            <h2>📊 Historique des Ventes Comptoir</h2>
                            <button className="btn-close-historique" onClick={fermerHistorique}>✕</button>
                        </div>

                        {/* 🔍 CHAMP DE RECHERCHE */}
                        <div className="search-historique-container">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="🔍 Rechercher par N° facture, client, vendeur ou montant..."
                                value={searchHistorique}
                                onChange={(e) => setSearchHistorique(e.target.value)}
                                className="search-historique-input"
                            />
                            {searchHistorique && (
                                <button 
                                    className="btn-clear-search"
                                    onClick={() => setSearchHistorique('')}
                                    title="Effacer la recherche"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <div className="modal-body-historique">
                            {loadingHistorique ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <p>Chargement de l'historique...</p>
                                </div>
                            ) : ventesHistorique.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <p>Aucune vente enregistrée</p>
                                    <p style={{ fontSize: '14px', color: '#999', marginTop: '10px' }}>
                                        Les ventes comptoir apparaîtront ici
                                    </p>
                                </div>
                            ) : filteredVentesHistorique.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <p>Aucun résultat pour "{searchHistorique}"</p>
                                    <p style={{ fontSize: '14px', color: '#999', marginTop: '10px' }}>
                                        Essayez avec un autre terme de recherche
                                    </p>
                                </div>
                            ) : (
                                <div className="historique-tableau-container">
                                    <div style={{ 
                                        padding: '10px', 
                                        fontSize: '14px', 
                                        color: '#666',
                                        borderBottom: '1px solid #eee'
                                    }}>
                                        {filteredVentesHistorique.length} vente(s) trouvée(s)
                                        {searchHistorique && ` pour "${searchHistorique}"`}
                                    </div>
                                    <table className="historique-tableau">
                                        <thead>
                                            <tr>
                                                <th>N° FACTURE</th>
                                                <th>DATE</th>
                                                <th>CLIENT</th>
                                                <th>VENDEUR</th>
                                                <th>MONTANT</th>
                                                <th>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredVentesHistorique.map(vente => {
                                                const montant = parseFloat(vente.montant_total || 0);
                                                const isRetour = vente.type_facture === 'RETOUR';
                                                
                                                return (
                                                    <tr key={vente.id_facture}>
                                                        <td>
                                                            <strong>{vente.numero_facture || 'N/A'}</strong>
                                                        </td>
                                                        <td>
                                                            {vente.date_vente ? new Date(vente.date_vente).toLocaleString('fr-FR', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            }) : 'N/A'}
                                                        </td>
                                                        <td>{vente.client_nom || 'Comptoir'}</td>
                                                        <td style={{color: '#3B82F6'}}>
                                                            {vente.vendeur || 'Système'}
                                                        </td>
                                                        <td style={{
                                                            color: isRetour ? '#EF4444' : '#10B981',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {isRetour && '-'}
                                                            {Math.abs(montant).toLocaleString()} FCFA
                                                        </td>
                                                        <td>
                                                            <div className="actions-btns">
                                                                <button 
                                                                    className="btn-action-historique btn-voir"
                                                                    title="Voir détails"
                                                                    onClick={() => voirDetailsVente(vente.id_facture)}
                                                                >
                                                                    👁️
                                                                </button>
                                                                <button 
                                                                    className="btn-action-historique btn-imprimer"
                                                                    title="Imprimer"
                                                                    onClick={() => {
                                                                        voirDetailsVente(vente.id_facture);
                                                                        setTimeout(() => imprimerTicket(), 500);
                                                                    }}
                                                                >
                                                                    🖨️
                                                                </button>
                                                                <button 
                                                                    className="btn-action-historique btn-supprimer"
                                                                    title="Supprimer"
                                                                    onClick={() => supprimerVente(vente.id_facture, vente.numero_facture)}
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 🔥 MODAL DÉTAILS D'UNE VENTE (comme Python ligne 1588-1836) */}
            {afficherDetails && venteDetails && (
                <div className="modal-overlay-historique" onClick={fermerDetails}>
                    <div className="modal-details-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-historique">
                            <h2>📄 Détails de la Vente</h2>
                            <button className="btn-close-historique" onClick={fermerDetails}>✕</button>
                        </div>

                        <div className="modal-body-historique">
                            {/* Informations entreprise */}
                            {entreprise && (
                                <div className="details-entreprise-section">
                                    <h3>🏪 {entreprise.nom || 'TECH INFO PLUS'}</h3>
                                    <p>{entreprise.adresse}</p>
                                    <p>📞 {entreprise.telephone} | 📧 {entreprise.email}</p>
                                    {entreprise.nif && <p>NIF: {entreprise.nif}</p>}
                                </div>
                            )}
                            
                            {/* Informations de la vente */}
                            <div className="details-info-section">
                                <div className="details-row">
                                    <span className="details-label">N° Facture:</span>
                                    <strong>{venteDetails.numero_facture}</strong>
                                </div>
                                <div className="details-row">
                                    <span className="details-label">Date:</span>
                                    <span>{venteDetails.date_vente ? new Date(venteDetails.date_vente).toLocaleString('fr-FR') : 'N/A'}</span>
                                </div>
                                <div className="details-row">
                                    <span className="details-label">Client:</span>
                                    <span>{venteDetails.client_nom || 'Comptoir'}</span>
                                </div>
                                <div className="details-row">
                                    <span className="details-label">Vendeur:</span>
                                    <span>{venteDetails.vendeur || 'Système'}</span>
                                </div>
                                <div className="details-row">
                                    <span className="details-label">Type:</span>
                                    <span className={venteDetails.type_facture === 'RETOUR' ? 'badge-retour-details' : 'badge-vente-details'}>
                                        {venteDetails.type_facture === 'RETOUR' ? '↩️ RETOUR' : '🛒 VENTE'}
                                    </span>
                                </div>
                            </div>

                            {/* Articles vendus */}
                            <div className="details-articles-section">
                                <h3>📦 Articles</h3>
                                <table className="details-articles-table">
                                    <thead>
                                        <tr>
                                            <th>Article</th>
                                            <th>Quantité</th>
                                            <th>Prix Unitaire</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {venteDetails.lignes && venteDetails.lignes.map(ligne => (
                                            <tr key={ligne.id_ligne}>
                                                <td>{ligne.article_nom}</td>
                                                <td>{ligne.quantite}</td>
                                                <td>{ligne.prix_unitaire.toLocaleString()} FCFA</td>
                                                <td>{ligne.total_ht.toLocaleString()} FCFA</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="3"><strong>TOTAL:</strong></td>
                                            <td><strong style={{
                                                fontSize: '18px',
                                                color: venteDetails.type_facture === 'RETOUR' ? '#EF4444' : '#10B981'
                                            }}>
                                                {venteDetails.type_facture === 'RETOUR' && '-'}
                                                {Math.abs(venteDetails.montant_total).toLocaleString()} FCFA
                                            </strong></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Actions */}
                            <div className="details-actions">
                                <button className="btn-imprimer-ticket" onClick={imprimerTicket}>
                                    🖨️ Imprimer le Ticket
                                </button>
                                <button className="btn-fermer-details" onClick={fermerDetails}>
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Comptoir;