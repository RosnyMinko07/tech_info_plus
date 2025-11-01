import React, { useState, useEffect } from 'react';
import { FaChartLine, FaUsers, FaBoxOpen, FaMoneyBillWave, FaExclamationTriangle, FaUniversity, FaUndo, FaFileExport, FaFilePdf } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { dashboardService, formatMontant, formatDate } from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../styles/Rapports.css';

// Enregistrer les composants Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

// Formater montant pour PDF (avec points comme séparateurs)
const formatMontantPDF = (value) => {
    const num = Math.round(value);
    return num.toLocaleString('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).replace(/\s/g, '.') + ' FCFA';
};

function Rapports() {
    const [rapportActif, setRapportActif] = useState('ventes');
    const [periode, setPeriode] = useState('ce_mois');
    const [periodeComparaison, setPeriodeComparaison] = useState('mois_precedent');
    const [loading, setLoading] = useState(false);
    const [rapportData, setRapportData] = useState(null);
    const [rapportComparaison, setRapportComparaison] = useState(null);

    useEffect(() => {
        if (rapportActif) {
            genererRapport();
        }
    }, [rapportActif, periode, periodeComparaison]);

    const genererRapport = async () => {
        try {
            setLoading(true);
            
            // Générer le rapport principal
            const data = await dashboardService.getRapport(rapportActif, periode);
            setRapportData(data || {});
            
            // Générer le rapport de comparaison
            if (periodeComparaison && periodeComparaison !== 'aucun') {
                const dataComparaison = await dashboardService.getRapport(rapportActif, periodeComparaison);
                setRapportComparaison(dataComparaison || {});
            } else {
                setRapportComparaison(null);
            }
        } catch (error) {
            console.error('Erreur génération rapport:', error);
            toast.error('Erreur lors de la génération du rapport');
            setRapportData(null);
            setRapportComparaison(null);
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour calculer les comparaisons et tendances
    const calculerComparaison = (valeurActuelle, valeurComparaison) => {
        if (!valeurComparaison || valeurComparaison === 0) {
            return { pourcentage: 0, evolution: 'stable', couleur: '#6c757d' };
        }
        
        const pourcentage = ((valeurActuelle - valeurComparaison) / valeurComparaison) * 100;
        const evolution = pourcentage > 0 ? 'hausse' : pourcentage < 0 ? 'baisse' : 'stable';
        const couleur = pourcentage > 0 ? '#28a745' : pourcentage < 0 ? '#dc3545' : '#6c757d';
        
        return {
            pourcentage: Math.abs(pourcentage),
            evolution,
            couleur,
            valeur: valeurActuelle - valeurComparaison
        };
    };

    const handleExport = (format) => {
        if (format === 'csv') {
            exportCSV();
        } else if (format === 'pdf') {
            exportPDF();
        }
    };

    const exportCSV = () => {
        try {
            const csvContent = generateCSV(rapportData);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `rapport_${rapportActif}_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            toast.success('Export CSV réussi');
        } catch (error) {
            toast.error('Erreur lors de l\'export CSV');
        }
    };

    const exportPDF = async () => {
        if (!rapportData) {
            toast.error('Aucun rapport à exporter');
            return;
        }

        try {
            const doc = new jsPDF();
            
            // ========== EN-TÊTE DU RAPPORT ==========
            doc.setFontSize(18);
            doc.text('Rapport ' + rapportTypes.find(t => t.id === rapportActif)?.label, 14, 20);
            
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text(`Période: ${periode}`, 14, 30);
            doc.text(`Date d'édition: ${new Date().toLocaleDateString('fr-FR')}`, 14, 36);
            
            let currentY = 45;

            // ========== GÉNÉRER CONTENU SELON TYPE ==========
            if (rapportActif === 'ventes') {
                // Stats principales
                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.text('Statistiques', 14, currentY);
                currentY += 10;

                const statsData = [
                    ['Nombre de ventes', rapportData.nb_ventes || 0],
                    ['Chiffre d\'affaires', formatMontantPDF(rapportData.ca_total || 0)],
                    ['Ticket moyen', formatMontantPDF(rapportData.ticket_moyen || 0)]
                ];

                autoTable(doc, {
                    startY: currentY,
                    head: [['Statistique', 'Valeur']],
                    body: statsData,
                    theme: 'striped',
                    styles: { fontSize: 10 }
                });
                currentY = doc.lastAutoTable.finalY + 15;
            }

            if (rapportActif === 'clients') {
                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.text('Statistiques Clients', 14, currentY);
                currentY += 10;

                const statsData = [
                    ['Total clients', rapportData.nb_clients || 0],
                    ['Nouveaux ce mois', rapportData.nouveaux_mois || 0],
                    ['Clients actifs', rapportData.actifs || 0]
                ];

                autoTable(doc, {
                    startY: currentY,
                    head: [['Statistique', 'Valeur']],
                    body: statsData,
                    theme: 'striped',
                    styles: { fontSize: 10 }
                });
                currentY = doc.lastAutoTable.finalY + 15;
            }

            if (rapportActif === 'produits') {
                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.text('Statistiques Produits', 14, currentY);
                currentY += 10;

                const statsData = [
                    ['Articles en stock', rapportData.nb_articles || 0],
                    ['Valeur du stock', formatMontantPDF(rapportData.valeur_stock || 0)],
                    ['Stock faible', rapportData.stock_faible || 0]
                ];

                autoTable(doc, {
                    startY: currentY,
                    head: [['Statistique', 'Valeur']],
                    body: statsData,
                    theme: 'striped',
                    styles: { fontSize: 10 }
                });
                currentY = doc.lastAutoTable.finalY + 15;

                // Tableau produits les plus vendus
                if (rapportData.produits && rapportData.produits.length > 0) {
                    doc.setFontSize(14);
                    doc.text('Produits les Plus Vendus', 14, currentY);
                    currentY += 10;

                    const produitsData = rapportData.produits.slice(0, 10).map(p => [
                        p.designation.substring(0, 30),
                        formatMontantPDF(p.prix_vente),
                        p.stock_actuel,
                        p.quantite_vendue,
                        formatMontantPDF(p.montant_total)
                    ]);

                    autoTable(doc, {
                        startY: currentY,
                        head: [['Produit', 'Prix', 'Stock', 'Qté Vendue', 'Montant Total']],
                        body: produitsData,
                        theme: 'striped',
                        styles: { fontSize: 8 }
                    });
                }
            }

            if (rapportActif === 'reglements') {
                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.text('Statistiques Règlements', 14, currentY);
                currentY += 10;

                const statsData = [
                    ['Nombre de règlements', rapportData.nb_reglements || 0],
                    ['Montant total', formatMontantPDF(rapportData.montant_total || 0)]
                ];

                autoTable(doc, {
                    startY: currentY,
                    head: [['Statistique', 'Valeur']],
                    body: statsData,
                    theme: 'striped',
                    styles: { fontSize: 10 }
                });
                currentY = doc.lastAutoTable.finalY + 15;
            }

            if (rapportActif === 'impayes') {
                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.text('Factures Impayées', 14, currentY);
                currentY += 10;

                const statsData = [
                    ['Nombre de factures', rapportData.nb_factures || 0],
                    ['Montant total impayé', formatMontantPDF(rapportData.montant_impayes || 0)]
                ];

                autoTable(doc, {
                    startY: currentY,
                    head: [['Statistique', 'Valeur']],
                    body: statsData,
                    theme: 'striped',
                    styles: { fontSize: 10 }
                });
                currentY = doc.lastAutoTable.finalY + 15;
            }

            if (rapportActif === 'tresorerie') {
                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.text('Trésorerie', 14, currentY);
                currentY += 10;

                const statsData = [
                    ['Encaissé', formatMontantPDF(rapportData.encaisse || 0)],
                    ['Créances', formatMontantPDF(rapportData.creances || 0)],
                    ['Ventes Comptoir', formatMontantPDF(rapportData.ventes_comptoir || 0)],
                    ['Total Actif', formatMontantPDF(rapportData.total_actif || 0)]
                ];

                autoTable(doc, {
                    startY: currentY,
                    head: [['Élément', 'Montant']],
                    body: statsData,
                    theme: 'striped',
                    styles: { fontSize: 10 }
                });
                currentY = doc.lastAutoTable.finalY + 15;

                // Tableau modes de paiement
                if (rapportData.modes_paiement && rapportData.modes_paiement.length > 0) {
                    doc.setFontSize(14);
                    doc.text('Règlements par Mode de Paiement', 14, currentY);
                    currentY += 10;

                    const modesData = rapportData.modes_paiement.map(m => [
                        m.mode,
                        m.nb,
                        formatMontantPDF(m.total)
                    ]);

                    autoTable(doc, {
                        startY: currentY,
                        head: [['Mode de Paiement', 'Nombre', 'Montant']],
                        body: modesData,
                        theme: 'striped',
                        styles: { fontSize: 9 }
                    });
                }
            }

            // ========== PIED DE PAGE ==========
            const totalPages = doc.internal.pages.length - 1;
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text(
                    `Page ${i} / ${totalPages}`,
                    doc.internal.pageSize.getWidth() / 2,
                    doc.internal.pageSize.getHeight() - 10,
                    { align: 'center' }
                );
            }

            // ========== TÉLÉCHARGER LE PDF ==========
            const fileName = `rapport_${rapportActif}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
            toast.success('Rapport PDF généré avec succès');

        } catch (error) {
            console.error('Erreur génération PDF:', error);
            toast.error('Erreur lors de la génération du PDF');
        }
    };

    const generateCSV = (data) => {
        if (!data) return '';
        // Logique de génération CSV selon le type de rapport
        return 'En-tête1,En-tête2\nValeur1,Valeur2';
    };

    const rapportTypes = [
        { id: 'ventes', label: 'Ventes', icon: FaChartLine, color: '#3B82F6' },
        { id: 'clients', label: 'Clients', icon: FaUsers, color: '#10B981' },
        { id: 'produits', label: 'Produits', icon: FaBoxOpen, color: '#F59E0B' },
        { id: 'reglements', label: 'Règlements', icon: FaMoneyBillWave, color: '#8B5CF6' },
        { id: 'impayes', label: 'Impayés', icon: FaExclamationTriangle, color: '#EF4444' },
        { id: 'tresorerie', label: 'Trésorerie', icon: FaUniversity, color: '#06B6D4' }
        // { id: 'avoirs', label: 'Avoirs', icon: FaUndo, color: '#EC4899' } // 🔒 Module désactivé
    ];

    return (
        <div className="rapports-container">
            {/* En-tête */}
            <div className="rapports-header">
                <h1 className="rapports-title">Rapports et Analyses</h1>
            </div>

            {/* Barre de contrôle */}
            <div className="rapports-control-bar">
                <div className="periode-group">
                    <label>Période:</label>
                    <select
                        value={periode}
                        onChange={(e) => setPeriode(e.target.value)}
                        className="periode-select"
                    >
                        <option value="aujourdhui">Aujourd'hui</option>
                        <option value="cette_semaine">Cette semaine</option>
                        <option value="ce_mois">Ce mois</option>
                        <option value="cette_annee">Cette année</option>
                        <option value="personnalise">Personnalisé</option>
                    </select>
                </div>

                <div className="periode-group">
                    <label>Comparer avec:</label>
                    <select
                        value={periodeComparaison}
                        onChange={(e) => setPeriodeComparaison(e.target.value)}
                        className="periode-select"
                    >
                        <option value="aucun">Aucune comparaison</option>
                        <option value="mois_precedent">Mois précédent</option>
                        <option value="annee_precedente">Année précédente</option>
                        <option value="meme_mois_annee_precedente">Même mois année précédente</option>
                    </select>
                </div>

                <div className="action-buttons">
                    <button className="btn btn-primary" onClick={genererRapport}>
                        📊 Générer Rapport
                    </button>
                    <button className="btn btn-success" onClick={() => handleExport('csv')}>
                        <FaFileExport /> CSV
                    </button>
                    <button className="btn btn-danger" onClick={() => handleExport('pdf')}>
                        <FaFilePdf /> PDF
                    </button>
                </div>
            </div>

            {/* Boutons de sélection des rapports */}
            <div className="rapports-selection">
                <h3>📊 Sélectionner un rapport:</h3>
                <div className="rapports-buttons">
                    {rapportTypes.map(type => {
                        const Icon = type.icon;
                        return (
                            <button
                                key={type.id}
                                className={`rapport-btn ${rapportActif === type.id ? 'active' : ''}`}
                                onClick={() => setRapportActif(type.id)}
                                style={{
                                    borderColor: rapportActif === type.id ? type.color : 'transparent',
                                    backgroundColor: rapportActif === type.id ? `${type.color}22` : ''
                                }}
                            >
                                <Icon style={{ color: type.color }} />
                                {type.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Zone de résultats */}
            <div className="rapports-results">
                {loading ? (
                    <div className="loading">Génération du rapport en cours...</div>
                ) : rapportData ? (
                    <div className="rapport-content">
                        <h2 className="rapport-titre">
                            Rapport {rapportTypes.find(t => t.id === rapportActif)?.label} - {periode}
                        </h2>

                        {/* Affichage selon le type de rapport */}
                        {rapportActif === 'ventes' && (
                            <div className="rapport-ventes">
                                <div className="stats-grid">
                                    <div className="stat-box">
                                        <div className="stat-label">Nombre de ventes</div>
                                        <div className="stat-value">{rapportData.nb_ventes || 0}</div>
                                        {rapportComparaison && (
                                            <div className="stat-comparison">
                                                {(() => {
                                                    const comp = calculerComparaison(rapportData.nb_ventes || 0, rapportComparaison.nb_ventes || 0);
                                                    return (
                                                        <span style={{ color: comp.couleur }}>
                                                            {comp.evolution === 'hausse' ? '↗' : comp.evolution === 'baisse' ? '↘' : '→'} 
                                                            {comp.pourcentage.toFixed(1)}%
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-label">Chiffre d'affaires</div>
                                        <div className="stat-value">{formatMontant(rapportData.ca_total || 0)}</div>
                                        {rapportComparaison && (
                                            <div className="stat-comparison">
                                                {(() => {
                                                    const comp = calculerComparaison(rapportData.ca_total || 0, rapportComparaison.ca_total || 0);
                                                    return (
                                                        <span style={{ color: comp.couleur }}>
                                                            {comp.evolution === 'hausse' ? '↗' : comp.evolution === 'baisse' ? '↘' : '→'} 
                                                            {comp.pourcentage.toFixed(1)}%
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-label">Ticket moyen</div>
                                        <div className="stat-value">{formatMontant(rapportData.ticket_moyen || 0)}</div>
                                        {rapportComparaison && (
                                            <div className="stat-comparison">
                                                {(() => {
                                                    const comp = calculerComparaison(rapportData.ticket_moyen || 0, rapportComparaison.ticket_moyen || 0);
                                                    return (
                                                        <span style={{ color: comp.couleur }}>
                                                            {comp.evolution === 'hausse' ? '↗' : comp.evolution === 'baisse' ? '↘' : '→'} 
                                                            {comp.pourcentage.toFixed(1)}%
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Résumé des comparaisons */}
                                {rapportComparaison && (
                                    <div className="comparison-summary">
                                        <h3 style={{ color: 'var(--texte-principal)', marginBottom: '20px' }}>
                                            📊 Analyse Comparative
                                        </h3>
                                        <div className="comparison-grid">
                                            <div className="comparison-item">
                                                <div className="comparison-label">Évolution CA</div>
                                                <div className="comparison-value">
                                                    {(() => {
                                                        const comp = calculerComparaison(rapportData.ca_total || 0, rapportComparaison.ca_total || 0);
                                                        return (
                                                            <span style={{ color: comp.couleur }}>
                                                                {comp.evolution === 'hausse' ? '↗' : comp.evolution === 'baisse' ? '↘' : '→'} 
                                                                {comp.pourcentage.toFixed(1)}% ({formatMontant(comp.valeur)})
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                            <div className="comparison-item">
                                                <div className="comparison-label">Évolution Ventes</div>
                                                <div className="comparison-value">
                                                    {(() => {
                                                        const comp = calculerComparaison(rapportData.nb_ventes || 0, rapportComparaison.nb_ventes || 0);
                                                        return (
                                                            <span style={{ color: comp.couleur }}>
                                                                {comp.evolution === 'hausse' ? '↗' : comp.evolution === 'baisse' ? '↘' : '→'} 
                                                                {comp.pourcentage.toFixed(1)}% ({comp.valeur} ventes)
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                            <div className="comparison-item">
                                                <div className="comparison-label">Évolution Ticket Moyen</div>
                                                <div className="comparison-value">
                                                    {(() => {
                                                        const comp = calculerComparaison(rapportData.ticket_moyen || 0, rapportComparaison.ticket_moyen || 0);
                                                        return (
                                                            <span style={{ color: comp.couleur }}>
                                                                {comp.evolution === 'hausse' ? '↗' : comp.evolution === 'baisse' ? '↘' : '→'} 
                                                                {comp.pourcentage.toFixed(1)}% ({formatMontant(comp.valeur)})
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Graphique d'évolution des ventes */}
                                {rapportData.evolution_labels && rapportData.evolution_data && (
                                    <div className="chart-container">
                                        <h3 style={{ color: 'var(--texte-principal)', marginBottom: '20px' }}>
                                            📈 Évolution des Ventes
                                        </h3>
                                        {(() => {
                                            const values = Array.isArray(rapportData.evolution_data) ? rapportData.evolution_data : [0];
                                            const clamped = values.map(v => (v && v > 0 ? v : 0));
                                            const minVal = Math.min(0, ...clamped);
                                            const maxVal = Math.max(0, ...clamped);
                                            const padding = Math.max(1, Math.round((maxVal - minVal) * 0.05));
                                            return (
                                                <Bar
                                                    data={{
                                                        labels: rapportData.evolution_labels,
                                                        datasets: [{
                                                            label: 'Chiffre d\'affaires (FCFA)',
                                                            data: clamped,
                                                            backgroundColor: (ctx) => {
                                                                return 'var(--accent-bleu)';
                                                            },
                                                            borderColor: (ctx) => {
                                                                return 'var(--accent-bleu-hover)';
                                                            },
                                                            borderWidth: 1,
                                                            borderRadius: 6,
                                                            maxBarThickness: 36
                                                        }]
                                                    }}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: {
                                                            legend: { 
                                                                display: true,
                                                                labels: { color: 'var(--texte-principal)' }
                                                            },
                                                            title: { 
                                                                display: true, 
                                                                text: 'Évolution des ventes',
                                                                color: 'var(--texte-principal)',
                                                                font: { size: 16 }
                                                            },
                                                            tooltip: {
                                                                callbacks: {
                                                                    label: (context) => {
                                                                        const val = context.parsed.y || 0;
                                                                        const formatted = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(val));
                                                                        return `CA: ${formatted} FCFA`;
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        scales: {
                                                            y: {
                                                                beginAtZero: true,
                                                                suggestedMin: minVal - padding,
                                                                suggestedMax: maxVal + padding,
                                                                ticks: { 
                                                                    color: 'var(--texte-principal)',
                                                                    callback: (value) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)
                                                                },
                                                                grid: { color: 'var(--separateur)' },
                                                                border: { color: 'var(--texte-principal)' }
                                                            },
                                                            x: {
                                                                ticks: { color: 'var(--texte-principal)' },
                                                                grid: { color: 'transparent' },
                                                                border: { color: 'var(--texte-principal)' }
                                                            }
                                                        },
                                                        interaction: { mode: 'index', intersect: false }
                                                    }}
                                                />
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        )}

                        {rapportActif === 'clients' && (
                            <div className="rapport-clients">
                                <div className="stats-grid">
                                    <div className="stat-box">
                                        <div className="stat-label">Total clients</div>
                                        <div className="stat-value">{rapportData.nb_clients || 0}</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-label">Nouveaux ce mois</div>
                                        <div className="stat-value">{rapportData.nouveaux_mois || 0}</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-label">Clients actifs</div>
                                        <div className="stat-value">{rapportData.actifs || 0}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {rapportActif === 'produits' && (
                            <div className="rapport-produits">
                                <div className="stats-grid">
                                    <div className="stat-box">
                                        <div className="stat-label">📦 Articles en stock</div>
                                        <div className="stat-value">{rapportData.nb_articles || 0}</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-label">💰 Valeur stock</div>
                                        <div className="stat-value">{formatMontant(rapportData.valeur_stock || 0)}</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-label">⚠️ Stock faible</div>
                                        <div className="stat-value" style={{ color: '#F59E0B' }}>
                                            {rapportData.stock_faible || 0}
                                        </div>
                                    </div>
                                </div>

                                {/* Liste des produits triés par ventes */}
                                {rapportData.produits && rapportData.produits.length > 0 && (
                                    <div style={{ marginTop: '30px' }}>
                                        <h3 style={{ color: '#F59E0B', marginBottom: '15px' }}>
                                            🏆 Produits les Plus Vendus
                                        </h3>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderBottom: '2px solid #F59E0B' }}>
                                                        <th style={{ padding: '12px', textAlign: 'left' }}>Produit</th>
                                                        <th style={{ padding: '12px', textAlign: 'center' }}>Type</th>
                                                        <th style={{ padding: '12px', textAlign: 'right' }}>Prix</th>
                                                        <th style={{ padding: '12px', textAlign: 'center' }}>Stock</th>
                                                        <th style={{ padding: '12px', textAlign: 'center' }}>Ventes</th>
                                                        <th style={{ padding: '12px', textAlign: 'right' }}>Montant Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {rapportData.produits.slice(0, 20).map((produit, index) => (
                                                        <tr 
                                                            key={index} 
                                                            style={{ 
                                                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                                                backgroundColor: index === 0 ? 'rgba(245, 158, 11, 0.05)' : 'transparent'
                                                            }}
                                                        >
                                                            <td style={{ padding: '12px' }}>
                                                                {index === 0 && '🏆 '}
                                                                {produit.type_article === 'PRODUIT' ? '📦 ' : '🔧 '}
                                                                {produit.designation}
                                                            </td>
                                                            <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#888' }}>
                                                                {produit.type_article}
                                                            </td>
                                                            <td style={{ padding: '12px', textAlign: 'right' }}>
                                                                {formatMontant(produit.prix_vente)}
                                                            </td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                {produit.stock_actuel}
                                                            </td>
                                                            <td style={{ padding: '12px', textAlign: 'center', color: '#3B82F6', fontWeight: 'bold' }}>
                                                                {produit.quantite_vendue} ({produit.nb_ventes})
                                                            </td>
                                                            <td style={{ padding: '12px', textAlign: 'right', color: '#10B981', fontWeight: 'bold' }}>
                                                                {formatMontant(produit.montant_total)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <p style={{ marginTop: '15px', fontSize: '12px', color: '#888', textAlign: 'center' }}>
                                            * Le produit en tête (🏆) est le plus vendu en termes de chiffre d'affaires
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {rapportActif === 'reglements' && (
                            <div className="rapport-reglements">
                                <div className="stats-grid">
                                    <div className="stat-box">
                                        <div className="stat-label">Nombre de règlements</div>
                                        <div className="stat-value">{rapportData.nb_reglements || 0}</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-label">Montant total</div>
                                        <div className="stat-value" style={{ color: '#10B981' }}>
                                            {formatMontant(rapportData.montant_total || 0)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {rapportActif === 'impayes' && (
                            <div className="rapport-impayes">
                                <div className="stats-grid">
                                    <div className="stat-box">
                                        <div className="stat-label">Factures impayées</div>
                                        <div className="stat-value" style={{ color: '#EF4444' }}>
                                            {rapportData.nb_factures || 0}
                                        </div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-label">Montant total impayé</div>
                                        <div className="stat-value" style={{ color: '#EF4444' }}>
                                            {formatMontant(rapportData.montant_impayes || 0)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {rapportActif === 'tresorerie' && (
                            <div className="rapport-tresorerie">
                                <div className="stats-grid">
                                    <div className="stat-box">
                                        <div className="stat-label">💰 Encaissé</div>
                                        <div className="stat-value" style={{ color: '#10B981' }}>
                                            {formatMontant(rapportData.encaisse || 0)}
                                        </div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-label">📋 Créances</div>
                                        <div className="stat-value" style={{ color: '#EF4444' }}>
                                            {formatMontant(rapportData.creances || 0)}
                                        </div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-label">🛒 Ventes Comptoir</div>
                                        <div className="stat-value" style={{ color: '#3B82F6' }}>
                                            {formatMontant(rapportData.ventes_comptoir || 0)}
                                        </div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-label">💎 Total Actif</div>
                                        <div className="stat-value" style={{ color: '#F59E0B' }}>
                                            {formatMontant(rapportData.total_actif || 0)}
                                        </div>
                                    </div>
                                </div>
                                
                                {rapportData.modes_paiement && rapportData.modes_paiement.length > 0 && (
                                    <div style={{ marginTop: '30px' }}>
                                        <h3 style={{ color: '#3B82F6', marginBottom: '15px' }}>💳 Règlements par Mode de Paiement</h3>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderBottom: '2px solid #3B82F6' }}>
                                                    <th style={{ padding: '12px', textAlign: 'left' }}>Mode de Paiement</th>
                                                    <th style={{ padding: '12px', textAlign: 'center' }}>Nombre</th>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>Montant</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rapportData.modes_paiement.map((mode, index) => (
                                                    <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                                        <td style={{ padding: '10px' }}>{mode.mode}</td>
                                                        <td style={{ padding: '10px', textAlign: 'center' }}>{mode.nb}</td>
                                                        <td style={{ padding: '10px', textAlign: 'right', color: '#10B981', fontWeight: 'bold' }}>
                                                            {formatMontant(mode.total)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 🔒 MODULE AVOIRS DÉSACTIVÉ */}
                        {/* {rapportActif === 'avoirs' && (
                            <div className="rapport-avoirs">
                                <div className="stats-grid">
                                    <div className="stat-box">
                                        <div className="stat-label">🔄 Nombre d'avoirs</div>
                                        <div className="stat-value">{rapportData.nb_avoirs || 0}</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-label">💰 Montant total</div>
                                        <div className="stat-value" style={{ color: '#EC4899' }}>
                                            {formatMontant(rapportData.montant_total || 0)}
                                        </div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-label">✅ Avoirs validés</div>
                                        <div className="stat-value" style={{ color: '#10B981' }}>
                                            {rapportData.valides || 0}
                                        </div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-label">⏳ En attente</div>
                                        <div className="stat-value" style={{ color: '#F59E0B' }}>
                                            {rapportData.en_attente || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )} */}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>Sélectionnez un type de rapport et cliquez sur "Générer Rapport"</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Rapports;