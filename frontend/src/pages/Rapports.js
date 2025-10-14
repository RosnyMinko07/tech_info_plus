import React, { useState, useEffect } from 'react';
import { FaChartLine, FaUsers, FaBoxOpen, FaMoneyBillWave, FaExclamationTriangle, FaUniversity, FaUndo, FaFileExport, FaFilePdf } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { dashboardService, formatMontant, formatDate } from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import '../styles/Rapports.css';

// Enregistrer les composants Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

function Rapports() {
    const [rapportActif, setRapportActif] = useState('ventes');
    const [periode, setPeriode] = useState('ce_mois');
    const [loading, setLoading] = useState(false);
    const [rapportData, setRapportData] = useState(null);

    useEffect(() => {
        if (rapportActif) {
            genererRapport();
        }
    }, [rapportActif, periode]);

    const genererRapport = async () => {
        try {
            setLoading(true);
            const data = await dashboardService.getRapport(rapportActif, periode);
            setRapportData(data || {});
        } catch (error) {
            console.error('Erreur génération rapport:', error);
            toast.error('Erreur lors de la génération du rapport');
            setRapportData(null);
        } finally {
            setLoading(false);
        }
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

    const exportPDF = () => {
        toast.info('Export PDF - Fonctionnalité à venir');
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
        { id: 'tresorerie', label: 'Trésorerie', icon: FaUniversity, color: '#06B6D4' },
        { id: 'avoirs', label: 'Avoirs', icon: FaUndo, color: '#EC4899' }
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
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-label">Chiffre d'affaires</div>
                                        <div className="stat-value">{formatMontant(rapportData.ca_total || 0)}</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-label">Ticket moyen</div>
                                        <div className="stat-value">{formatMontant(rapportData.ticket_moyen || 0)}</div>
                                    </div>
                                </div>
                                
                                {/* Graphique d'évolution des ventes */}
                                {rapportData.evolution_labels && rapportData.evolution_data && (
                                    <div className="chart-container">
                                        <h3 style={{ color: 'var(--texte-principal)', marginBottom: '20px' }}>
                                            📈 Évolution des Ventes
                                        </h3>
                                        <Bar
                                            data={{
                                                labels: rapportData.evolution_labels,
                                                datasets: [{
                                                    label: 'Chiffre d\'affaires (FCFA)',
                                                    data: rapportData.evolution_data,
                                                    backgroundColor: '#3B82F6',
                                                    borderColor: '#2563EB',
                                                    borderWidth: 2
                                                }]
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: { 
                                                        display: true,
                                                        labels: { color: '#FFFFFF' }
                                                    },
                                                    title: { 
                                                        display: true, 
                                                        text: 'Évolution des ventes',
                                                        color: '#FFFFFF',
                                                        font: { size: 16 }
                                                    }
                                                },
                                                scales: {
                                                    y: {
                                                        beginAtZero: true,
                                                        ticks: { color: '#94A3B8' },
                                                        grid: { color: '#334155' }
                                                    },
                                                    x: {
                                                        ticks: { color: '#94A3B8' },
                                                        grid: { color: '#334155' }
                                                    }
                                                }
                                            }}
                                        />
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

                        {rapportActif === 'avoirs' && (
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
                        )}
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