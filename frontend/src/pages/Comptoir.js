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
    
    // 🔥 VENTES DU JOUR POUR MODE RETOUR
    const [ventesDuJour, setVentesDuJour] = useState([]);
    const [loadingVentesJour, setLoadingVentesJour] = useState(false);
    const [afficherRetours, setAfficherRetours] = useState(false);
    
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

    // 🔥 Charger les ventes du jour quand on active le mode retour
    useEffect(() => {
        if (modeRetour) {
            loadVentesDuJour();
        }
    }, [modeRetour]);

    useEffect(() => {
        filterArticles();
    }, [searchTerm, articles, modeRetour]);

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
            const response = await fetch(`/api/entreprise/config`);
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

    // 🔥 Charger les ventes du jour pour le mode retour
    const loadVentesDuJour = async () => {
        setLoadingVentesJour(true);
        try {
            const response = await comptoirService.getVentesAujourdhui();
            setVentesDuJour(response.ventes || []);
        } catch (error) {
            console.error('Erreur chargement ventes du jour:', error);
            toast.error('Erreur lors du chargement des ventes du jour');
        } finally {
            setLoadingVentesJour(false);
        }
    };

    // 🔥 Retourner directement une vente (mode simplifié)
    const handleRetournerVente = async (vente) => {
        console.log('🔥 Vente à retourner:', vente);
        
        if (!await confirmAction('Confirmer le retour', 
            `Voulez-vous vraiment retourner la vente ${vente.numero_facture} (${formatMontant(vente.montant_total)})?`)) {
            return;
        }

        try {
            // Vérifier que les lignes existent
            if (!vente.lignes || vente.lignes.length === 0) {
                console.error('❌ Pas de lignes dans la vente:', vente);
                toast.error('Impossible de retourner: pas de détails disponibles');
                return;
            }

            // Préparer les données de retour en utilisant les lignes de la vente
            const articles = vente.lignes.map(ligne => ({
                id_article: ligne.id_article,
                quantite: ligne.quantite,
                prix_unitaire: ligne.prix_unitaire
            }));

            console.log('📦 Articles à retourner:', articles);

            const venteData = {
                articles: articles,
                montant_recu: 0, // Pas besoin en mode retour
                type_vente: 'RETOUR',
                notes: `Retour de la vente ${vente.numero_facture}`
            };

            console.log('📤 Envoi de la requête:', venteData);
            await comptoirService.creerVente(venteData);
            toast.success(`Retour effectué ! Remboursement: ${formatMontant(vente.montant_total)}`);
            
            // Recharger les données avec un petit délai pour s'assurer que le backend a tout sauvegardé
            setTimeout(() => {
                loadVentesDuJour();
                loadVenteJour();
                loadArticles();  // 🔥 Recharger les articles pour mettre à jour le stock
            }, 500);
        } catch (error) {
            console.error('❌ Erreur retour:', error);
            console.error('❌ Détails:', error.response?.data);
            toast.error(error.response?.data?.detail || error.message || 'Erreur lors du retour');
        }
    };

    const filterArticles = async () => {
        let filtered = articles;
        
        // 🔥 EN MODE RETOUR : Filtrer uniquement les articles vendus aujourd'hui
        if (modeRetour) {
            try {
                const data = await comptoirService.verifierVentesAujourdhui();
                if (data.articles_vendus) {
                    const idsArticlesVendus = data.articles_vendus.map(a => a.id_article);
                    filtered = articles.filter(a => idsArticlesVendus.includes(a.id_article));
                } else {
                    // Pas d'articles vendus aujourd'hui, liste vide
                    filtered = [];
                }
            } catch (error) {
                console.error('Erreur chargement articles vendus:', error);
                filtered = articles; // Fallback: afficher tous
            }
        }
        
        // Appliquer le filtre de recherche
        if (searchTerm) {
            filtered = filtered.filter(article => 
                article.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                article.code_article?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                article.categorie?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        setFilteredArticles(filtered);
    };

    const handleAddToPanier = (article) => {
        // 🔥 VÉRIFICATION DE STOCK pour les produits
        if (article.type_article === 'PRODUIT') {
            if (article.stock_actuel <= 0) {
                toast.error(`Stock épuisé pour "${article.designation}". Impossible d'ajouter au panier.`);
                return;
            }
        }
        
        const existant = panier.find(item => item.id_article === article.id_article);
        
        if (existant) {
            // Vérifier que le stock est suffisant
            if (existant.quantite + 1 > existant.stock_disponible) {
                toast.warning(`Stock insuffisant (${existant.stock_disponible} disponibles)`);
                return;
            }
            
            setPanier(panier.map(item => 
                item.id_article === article.id_article
                    ? { ...item, quantite: item.quantite + 1, total: (item.quantite + 1) * item.prix * (1 - item.remise / 100) }
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
                const data = await comptoirService.verifierVentesAujourdhui();
                
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
        const total = panier.reduce((sum, item) => {
            console.log(`📊 Article: ${item.designation}, Quantité: ${item.quantite}, Prix: ${item.prix}, Total: ${item.total}`);
            return sum + item.total;
        }, 0);
        console.log(`💰 Total calculé: ${total}`);
        return total;
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
                    prix_unitaire: item.prix_unitaire || item.prix,  // Nom correct
                    designation: item.designation || 'Article'
                })),
                montant_total: total,  // 🔥 Ajouter le montant total
                montant_recu: especes,
                monnaie: !modeRetour ? (especes - total) : 0,  // 🔥 Calculer la monnaie
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

            // Imprimer le ticket directement avec les bonnes données
            imprimerTicketSimple({
                ...venteData,
                montant_total: total,
                montant_recu: especes,
                monnaie: !modeRetour ? (especes - total) : 0
            });

        } catch (error) {
            console.error('Erreur validation vente:', error);
            toast.error('Erreur lors de l\'enregistrement de la vente');
        }
    };

    const handleImprimerTicket = async (venteData) => {
        // Récupérer les détails complets de la vente depuis le backend
        try {
            // Attendre un peu pour que la vente soit bien enregistrée
            setTimeout(async () => {
                try {
                    const response = await comptoirService.getHistorique(1);
                    if (response && response.length > 0) {
                        const derniereVente = response[0];
                        // Utiliser la même fonction que l'historique
                        await imprimerTicketFromData(derniereVente);
                    } else {
                        // Fallback si pas de données
                        imprimerTicketSimple(venteData);
                    }
                } catch (error) {
                    console.error('Erreur récupération vente:', error);
                    imprimerTicketSimple(venteData);
                }
            }, 1000);
        } catch (error) {
            console.error('Erreur:', error);
            imprimerTicketSimple(venteData);
        }
    };

    const imprimerTicketSimple = (vente) => {
        // Debug: Afficher les données de vente
        console.log('📋 Données de vente pour ticket:', vente);
        console.log('💵 Montant total:', vente.montant_total);
        console.log('💰 Montant reçu:', vente.montant_recu);
        console.log('🪙 Monnaie:', vente.monnaie);
        console.log('🧮 Calcul monnaie:', ((vente.montant_recu || 0) - (vente.montant_total || 0)));
        
        // Test avec exemple concret
        console.log('🧪 TEST EXEMPLE:');
        console.log('Article: 5000 FCFA');
        console.log('Montant reçu: 10000 FCFA');
        console.log('Monnaie attendue: 5000 FCFA');
        console.log('Monnaie calculée:', (10000 - 5000));
        
        // Créer un ticket à imprimer (version simple)
        const ticketWindow = window.open('', '', 'width=800,height=900,scrollbars=yes,resizable=yes');
        const ticketHTML = `
            <html>
            <head>
                <title>Ticket - ${vente.type_vente}</title>
                <style>
                    @media print {
                        body { margin: 0; padding: 15px; }
                        @page { size: 80mm auto; margin: 0; }
                    }
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Courier New', monospace;
                        width: 80mm;
                        max-width: 100%;
                        margin: 0 auto;
                        padding: 10px;
                        background: white;
                        color: black;
                        line-height: 1.4;
                    }
                    @media screen {
                        body {
                            width: 400px;
                            margin: 20px auto;
                            padding: 20px;
                            border: 1px solid #ddd;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        }
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 15px;
                        border-bottom: 3px double #000;
                        padding-bottom: 10px;
                    }
                    .header h2 {
                        margin: 5px 0;
                        font-size: 22px;
                        font-weight: bold;
                        letter-spacing: 1px;
                    }
                    .header p {
                        margin: 3px 0;
                        font-size: 11px;
                        line-height: 1.3;
                    }
                    .type-vente {
                        text-align: center;
                        font-weight: bold;
                        margin: 10px 0;
                        font-size: 16px;
                        padding: 5px;
                        background: #f0f0f0;
                    }
                    .info {
                        margin: 12px 0;
                        font-size: 11px;
                        border-top: 1px dashed #ccc;
                        border-bottom: 1px dashed #ccc;
                        padding: 8px 0;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        margin: 4px 0;
                    }
                    .articles {
                        margin: 12px 0;
                        border-top: 2px solid #000;
                        border-bottom: 2px solid #000;
                        padding: 8px 0;
                    }
                    .article-ligne {
                        margin: 5px 0;
                        font-size: 11px;
                    }
                    .article-nom {
                        font-weight: bold;
                        font-size: 12px;
                        margin-bottom: 2px;
                    }
                    .article-details {
                        display: flex;
                        justify-content: space-between;
                        margin-left: 10px;
                        font-size: 10px;
                        color: #555;
                    }
                    .article-quantity {
                        font-weight: bold;
                    }
                    .total {
                        text-align: right;
                        font-size: 18px;
                        font-weight: bold;
                        margin: 12px 0;
                        padding: 8px 0;
                        border-top: 2px solid #000;
                        border-bottom: 2px solid #000;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 15px;
                        border-top: 2px dashed #000;
                        padding-top: 10px;
                        font-size: 10px;
                        line-height: 1.4;
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
                <div class="type-vente">
                    ${vente.type_vente === 'RETOUR' ? '↩️ RETOUR DE VENTE' : '🛒 POINT DE VENTE'}
                </div>
                
                <!-- Informations vente -->
                <div class="info">
                    <div class="info-row">
                        <span>Date:</span>
                        <span>${new Date().toLocaleString('fr-FR')}</span>
                    </div>
                    <div class="info-row">
                        <span>Vendeur:</span>
                        <span>${user.nom_utilisateur || 'Système'}</span>
                    </div>
                </div>
                
                <!-- Articles -->
                <div class="articles">
                    ${vente.articles.map(item => {
                        const prixUnitaire = item.prix_unitaire || item.prix || 0;
                        const quantite = item.quantite || 0;
                        const total = prixUnitaire * quantite;
                        const designation = item.designation || panier.find(p => p.id_article === item.id_article)?.designation || 'Article';
                        return `
                            <div class="article-ligne">
                                <div class="article-nom">${designation}</div>
                                <div class="article-details">
                                    <span class="article-quantity">${quantite} × ${prixUnitaire.toLocaleString()} FCFA</span>
                                    <span style="font-weight: bold;">${total.toLocaleString()} FCFA</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <!-- Total -->
                <div class="total" style="color: ${vente.type_vente === 'RETOUR' ? 'red' : 'green'};">
                    ${vente.type_vente === 'RETOUR' ? 'RETOUR: ' : 'TOTAL: '}
                    ${vente.type_vente === 'RETOUR' ? '-' : ''}${Math.abs(vente.montant_total || 0).toLocaleString()} FCFA
                </div>
                
                <!-- Montant versé et monnaie -->
                ${vente.type_vente === 'RETOUR' ? `
                    <div class="info">
                        <div class="info-row">
                            <span>Remboursement:</span>
                            <strong style="color: red;">${Math.abs(vente.montant_total || 0).toLocaleString()} FCFA</strong>
                        </div>
                    </div>
                ` : `
                    <div class="info">
                        <div class="info-row">
                            <span>Montant:</span>
                            <strong>${(vente.montant_total || 0).toLocaleString()} FCFA</strong>
                        </div>
                        <div class="info-row">
                            <span>Payé par:</span>
                            <strong>ESPÈCES</strong>
                        </div>
                        <div class="info-row">
                            <span>Reçu:</span>
                            <strong>${(vente.montant_recu || 0).toLocaleString()} FCFA</strong>
                        </div>
                        <div class="info-row">
                            <span>Monnaie:</span>
                            <strong>${Math.max(0, vente.monnaie || 0).toLocaleString()} FCFA</strong>
                        </div>
                    </div>
                `}
                
                <!-- Pied de page -->
                <div class="footer">
                    <p style="margin: 5px 0; font-weight: bold;">${vente.type_vente === 'RETOUR' ? '↩️ Retour effectué avec succès !' : '✓ Merci pour votre achat !'}</p>
                    <p>www.techinfoplus.com</p>
                </div>
            </body>
            </html>
        `;
        
        ticketWindow.document.write(ticketHTML);
        ticketWindow.document.close();
        
        // Attendre le chargement puis imprimer
        ticketWindow.onload = () => {
            ticketWindow.print();
            toast.success('Impression lancée');
        };
    };

    const imprimerTicketFromData = async (venteDetails) => {
        // Utiliser la même logique que l'historique
        const ticketHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Ticket ${venteDetails.numero_facture}</title>
                <style>
                    @media print {
                        body { margin: 0; padding: 15px; }
                        @page { size: 80mm auto; margin: 0; }
                    }
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Courier New', monospace;
                        width: 80mm;
                        max-width: 100%;
                        margin: 0 auto;
                        padding: 10px;
                        background: white;
                        color: black;
                        line-height: 1.4;
                    }
                    @media screen {
                        body {
                            width: 400px;
                            margin: 20px auto;
                            padding: 20px;
                            border: 1px solid #ddd;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        }
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 15px;
                        border-bottom: 3px double #000;
                        padding-bottom: 10px;
                    }
                    .header h2 {
                        margin: 5px 0;
                        font-size: 22px;
                        font-weight: bold;
                        letter-spacing: 1px;
                    }
                    .header p {
                        margin: 3px 0;
                        font-size: 11px;
                        line-height: 1.3;
                    }
                    .type-vente {
                        text-align: center;
                        font-weight: bold;
                        margin: 10px 0;
                        font-size: 16px;
                        padding: 5px;
                        background: #f0f0f0;
                    }
                    .info {
                        margin: 12px 0;
                        font-size: 11px;
                        border-top: 1px dashed #ccc;
                        border-bottom: 1px dashed #ccc;
                        padding: 8px 0;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        margin: 4px 0;
                    }
                    .articles {
                        margin: 12px 0;
                        border-top: 2px solid #000;
                        border-bottom: 2px solid #000;
                        padding: 8px 0;
                    }
                    .article-ligne {
                        margin: 5px 0;
                        font-size: 11px;
                    }
                    .article-nom {
                        font-weight: bold;
                        font-size: 12px;
                        margin-bottom: 2px;
                    }
                    .article-details {
                        display: flex;
                        justify-content: space-between;
                        margin-left: 10px;
                        font-size: 10px;
                        color: #555;
                    }
                    .article-quantity {
                        font-weight: bold;
                    }
                    .total {
                        text-align: right;
                        font-size: 18px;
                        font-weight: bold;
                        margin: 12px 0;
                        padding: 8px 0;
                        border-top: 2px solid #000;
                        border-bottom: 2px solid #000;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 15px;
                        border-top: 2px dashed #000;
                        padding-top: 10px;
                        font-size: 10px;
                        line-height: 1.4;
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
                <div class="type-vente">
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
                            <div class="article-nom">${ligne.article_nom}</div>
                            <div class="article-details">
                                <span class="article-quantity">${ligne.quantite} × ${(ligne.prix_unitaire || 0).toLocaleString()} FCFA</span>
                                <span style="font-weight: bold;">${(ligne.total_ht || 0).toLocaleString()} FCFA</span>
                            </div>
                        </div>
                    `).join('') || ''}
                </div>
                
                <!-- Total -->
                <div class="total" style="color: ${venteDetails.type_facture === 'RETOUR' ? 'red' : 'green'};">
                    ${venteDetails.type_facture === 'RETOUR' ? 'RETOUR: ' : 'TOTAL: '}
                    ${venteDetails.type_facture === 'RETOUR' ? '-' : ''}${Math.abs(venteDetails.montant_total || 0).toLocaleString()} FCFA
                </div>
                
                <!-- Montant versé et monnaie -->
                ${venteDetails.type_facture === 'RETOUR' ? `
                    <div class="info">
                        <div class="info-row">
                            <span>Remboursement:</span>
                            <strong style="color: red;">${Math.abs(venteDetails.montant_total || 0).toLocaleString()} FCFA</strong>
                        </div>
                    </div>
                ` : `
                    <div class="info">
                        <div class="info-row">
                            <span>Montant:</span>
                            <strong>${(venteDetails.montant_total || 0).toLocaleString()} FCFA</strong>
                        </div>
                        <div class="info-row">
                            <span>Payé par:</span>
                            <strong>ESPÈCES</strong>
                        </div>
                        <div class="info-row">
                            <span>Reçu:</span>
                            <strong>${(venteDetails.montant_avance || venteDetails.montant_total || 0).toLocaleString()} FCFA</strong>
                        </div>
                        <div class="info-row">
                            <span>Monnaie:</span>
                            <strong>${Math.max(0, ((venteDetails.montant_avance || venteDetails.montant_total || 0) - (venteDetails.montant_total || 0))).toLocaleString()} FCFA</strong>
                        </div>
                    </div>
                `}
                
                <!-- Pied de page -->
                <div class="footer">
                    <p style="margin: 5px 0; font-weight: bold;">${venteDetails.type_facture === 'RETOUR' ? '↩️ Retour effectué avec succès !' : '✓ Merci pour votre achat !'}</p>
                    <p>www.techinfoplus.com</p>
                </div>
            </body>
            </html>
        `;
        
        // Ouvrir une nouvelle fenêtre pour l'impression (plus grande)
        const printWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes,resizable=yes');
        printWindow.document.write(ticketHTML);
        printWindow.document.close();
        
        // Attendre le chargement puis imprimer
        printWindow.onload = () => {
            printWindow.print();
            toast.success('Impression lancée');
        };
    };

    // 🔥 CHARGER L'HISTORIQUE DES VENTES (depuis FACTURE comme Python)
    const chargerHistoriqueVentes = async () => {
        setLoadingHistorique(true);
        try {
            const data = await comptoirService.getHistorique(50);
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
        // 🔥 Vérifier les droits: SEUL L'ADMIN peut supprimer
        if (user.role !== 'ADMIN') {
            toast.error('❌ Accès refusé: Seul l\'administrateur peut supprimer des ventes');
            return;
        }
        
        const confirmed = await confirmDelete(`la vente "${numeroFacture}"`);
        if (!confirmed) return;

        try {
            await comptoirService.deleteVente(idFacture);
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
            const data = await comptoirService.getVenteDetails(idFacture);
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
                        body { margin: 0; padding: 15px; }
                        @page { size: 80mm auto; margin: 0; }
                    }
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Courier New', monospace;
                        width: 80mm;
                        max-width: 100%;
                        margin: 0 auto;
                        padding: 10px;
                        background: white;
                        color: black;
                        line-height: 1.4;
                    }
                    @media screen {
                        body {
                            width: 400px;
                            margin: 20px auto;
                            padding: 20px;
                            border: 1px solid #ddd;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        }
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 15px;
                        border-bottom: 3px double #000;
                        padding-bottom: 10px;
                    }
                    .header h2 {
                        margin: 5px 0;
                        font-size: 22px;
                        font-weight: bold;
                        letter-spacing: 1px;
                    }
                    .header p {
                        margin: 3px 0;
                        font-size: 11px;
                        line-height: 1.3;
                    }
                    .type-vente {
                        text-align: center;
                        font-weight: bold;
                        margin: 10px 0;
                        font-size: 16px;
                        padding: 5px;
                        background: #f0f0f0;
                    }
                    .info {
                        margin: 12px 0;
                        font-size: 11px;
                        border-top: 1px dashed #ccc;
                        border-bottom: 1px dashed #ccc;
                        padding: 8px 0;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        margin: 4px 0;
                    }
                    .articles {
                        margin: 12px 0;
                        border-top: 2px solid #000;
                        border-bottom: 2px solid #000;
                        padding: 8px 0;
                    }
                    .article-ligne {
                        margin: 5px 0;
                        font-size: 11px;
                    }
                    .article-nom {
                        font-weight: bold;
                        font-size: 12px;
                        margin-bottom: 2px;
                    }
                    .article-details {
                        display: flex;
                        justify-content: space-between;
                        margin-left: 10px;
                        font-size: 10px;
                        color: #555;
                    }
                    .article-quantity {
                        font-weight: bold;
                    }
                    .total {
                        text-align: right;
                        font-size: 18px;
                        font-weight: bold;
                        margin: 12px 0;
                        padding: 8px 0;
                        border-top: 2px solid #000;
                        border-bottom: 2px solid #000;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 15px;
                        border-top: 2px dashed #000;
                        padding-top: 10px;
                        font-size: 10px;
                        line-height: 1.4;
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
                <div class="type-vente">
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
                            <div class="article-nom">${ligne.article_nom}</div>
                            <div class="article-details">
                                <span class="article-quantity">${ligne.quantite} × ${(ligne.prix_unitaire || 0).toLocaleString()} FCFA</span>
                                <span style="font-weight: bold;">${(ligne.total_ht || 0).toLocaleString()} FCFA</span>
                            </div>
                        </div>
                    `).join('') || ''}
                </div>
                
                <!-- Total -->
                <div class="total" style="color: ${venteDetails.type_facture === 'RETOUR' ? 'red' : 'green'};">
                    ${venteDetails.type_facture === 'RETOUR' ? 'RETOUR: ' : 'TOTAL: '}
                    ${venteDetails.type_facture === 'RETOUR' ? '-' : ''}${Math.abs(venteDetails.montant_total || 0).toLocaleString()} FCFA
                </div>
                
                <!-- Montant versé et monnaie (comme Python ligne 1175-1181) -->
                ${venteDetails.type_facture === 'RETOUR' ? `
                    <div class="info">
                        <div class="info-row">
                            <span>Remboursement:</span>
                            <strong style="color: red;">${Math.abs(venteDetails.montant_total || 0).toLocaleString()} FCFA</strong>
                        </div>
                    </div>
                ` : `
                    <div class="info">
                        <div class="info-row">
                            <span>Montant:</span>
                            <strong>${(venteDetails.montant_total || 0).toLocaleString()} FCFA</strong>
                        </div>
                        <div class="info-row">
                            <span>Payé par:</span>
                            <strong>ESPÈCES</strong>
                        </div>
                        <div class="info-row">
                            <span>Reçu:</span>
                            <strong>${(venteDetails.montant_avance || venteDetails.montant_total || 0).toLocaleString()} FCFA</strong>
                        </div>
                        <div class="info-row">
                            <span>Monnaie:</span>
                            <strong>${Math.max(0, ((venteDetails.montant_avance || venteDetails.montant_total || 0) - (venteDetails.montant_total || 0))).toLocaleString()} FCFA</strong>
                        </div>
                    </div>
                `}
                
                <!-- Pied de page -->
                <div class="footer">
                    <p style="margin: 5px 0; font-weight: bold;">${venteDetails.type_facture === 'RETOUR' ? '↩️ Retour effectué avec succès !' : '✓ Merci pour votre achat !'}</p>
                    <p>www.techinfoplus.com</p>
                </div>
            </body>
            </html>
        `;
        
        // Ouvrir une nouvelle fenêtre pour l'impression (plus grande)
        const printWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes,resizable=yes');
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
                {/* 🔥 MODE RETOUR : Afficher les ventes du jour */}
                {modeRetour ? (
                    <div style={{ width: '100%', padding: '20px' }}>
                        <h2 style={{ marginBottom: '20px', color: '#E74C3C' }}>↩️ Retourner une vente du jour</h2>
                        
                        {loadingVentesJour ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>Chargement...</div>
                        ) : ventesDuJour.filter(v => v.type_facture === 'COMPTOIR').length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                <p>Aucune vente effectuée aujourd'hui</p>
                                <p>Impossible de faire un retour</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '15px' }}>
                                <div style={{ marginBottom: '15px', textAlign: 'right' }}>
                                    <button
                                        className={`btn ${afficherRetours ? 'btn-secondary' : 'btn-info'}`}
                                        onClick={() => setAfficherRetours(!afficherRetours)}
                                        style={{ padding: '10px 20px' }}
                                    >
                                        {afficherRetours ? '👁️ Cacher les retours' : '👁️ Voir les retours effectués'}
                                    </button>
                                </div>
                                
                                {ventesDuJour.filter(v => v.type_facture === 'COMPTOIR').map(vente => {
                                    // Vérifier si cette vente a déjà été retournée
                                    const estDejaRetournee = ventesDuJour.some(retour => 
                                        retour.type_facture === 'RETOUR' && 
                                        retour.notes && 
                                        retour.notes.includes(vente.numero_facture)
                                    );
                                    
                                    // Cacher les ventes déjà retournées si on n'affiche pas les retours
                                    if (estDejaRetournee && !afficherRetours) {
                                        return null;
                                    }
                                    
                                    return (
                                    <div key={vente.id_facture} style={{
                                        border: estDejaRetournee ? '2px solid #999' : '2px solid #E74C3C',
                                        borderRadius: '10px',
                                        padding: '20px',
                                        backgroundColor: estDejaRetournee ? '#f5f5f5' : '#fff',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        opacity: estDejaRetournee ? 0.6 : 1
                                    }}>
                                        {estDejaRetournee && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '10px',
                                                right: '10px',
                                                background: '#999',
                                                color: 'white',
                                                padding: '5px 10px',
                                                borderRadius: '5px',
                                                fontSize: '12px'
                                            }}>
                                                ✓ Déjà retourné
                                            </div>
                                        )}
                                        <div>
                                            <strong style={{ fontSize: '18px' }}>{vente.numero_facture}</strong>
                                            <div style={{ color: '#666', marginTop: '5px' }}>
                                                Heure: {vente.heure}
                                            </div>
                                            <div style={{ color: '#666' }}>
                                                Articles: {vente.lignes.length}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10B981' }}>
                                                {formatMontant(vente.montant_total)}
                                            </div>
                                            {estDejaRetournee ? (
                                                <div style={{ 
                                                    marginTop: '10px', 
                                                    padding: '8px 15px',
                                                    background: '#999',
                                                    color: 'white',
                                                    borderRadius: '5px',
                                                    textAlign: 'center'
                                                }}>
                                                    Déjà retourné
                                                </div>
                                            ) : (
                                                <button
                                                    className="btn btn-danger"
                                                    onClick={() => handleRetournerVente(vente)}
                                                    style={{ marginTop: '10px' }}
                                                >
                                                    ↩️ Retourner
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
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
                        {filteredArticles.map(article => {
                            const stockEpuise = article.type_article === 'PRODUIT' && article.stock_actuel <= 0;
                            return (
                            <div
                                key={article.id_article}
                                className="article-card"
                                onClick={() => handleAddToPanier(article)}
                                    style={{
                                        opacity: stockEpuise ? 0.5 : 1,
                                        cursor: stockEpuise ? 'not-allowed' : 'pointer',
                                        border: stockEpuise ? '2px solid #dc3545' : 'none'
                                    }}
                                    title={stockEpuise ? '⚠️ Stock épuisé' : 'Cliquer pour ajouter au panier'}
                            >
                                {/* 🔥 Image pour les produits */}
                                {article.type_article === 'PRODUIT' && article.image_path && (
                                    <img 
                                        src={article.image_path} 
                                        alt={article.designation}
                                        style={{ 
                                            width: '100%', 
                                            height: '120px', 
                                            objectFit: 'cover',
                                            borderRadius: '8px 8px 0 0',
                                            marginBottom: '10px'
                                        }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                )}
                                
                                <div className="article-name">{article.designation}</div>
                                <div className="article-price">{formatMontant(article.prix_vente)}</div>
                                    <div className="article-stock" style={{
                                        color: stockEpuise ? '#dc3545' : '#666',
                                        fontWeight: stockEpuise ? 'bold' : 'normal'
                                    }}>
                                        {stockEpuise ? '⚠️ STOCK ÉPUISÉ' : `Stock: ${article.stock_actuel}`}
                                    </div>
                                {article.categorie && (
                                    <div className="article-categorie">{article.categorie}</div>
                                )}
                            </div>
                            );
                        })}
                    </div>
                </div>
                    </>
                )}
            </div>

            {/* Zone de paiement (Bas) - Uniquement en mode vente */}
            {!modeRetour && (
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
            )}

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
                                                                {user.role === 'ADMIN' && (
                                                                    <button 
                                                                        className="btn-action-historique btn-supprimer"
                                                                        title="Supprimer (Admin seulement)"
                                                                        onClick={() => supprimerVente(vente.id_facture, vente.numero_facture)}
                                                                    >
                                                                        🗑️
                                                                    </button>
                                                                )}
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