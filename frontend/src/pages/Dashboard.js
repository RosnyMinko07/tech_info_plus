import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { dashboardService, formatMontant } from '../services/api';
import { toast } from 'react-toastify';
import '../styles/Dashboard.css';

// Enregistrer les composants Chart.js (comme matplotlib Python)
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [ventesMois, setVentesMois] = useState(null);
  const [activites, setActivites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Dashboard chargé
  console.log('📊 Dashboard chargé');

  useEffect(() => {
    loadAllData();
    
    // Rafraîchissement automatique toutes les 30 secondes (comme Python ligne 32-33)
    const interval = setInterval(() => {
      loadAllData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    try {
      // Charger toutes les données en parallèle (comme Python ligne 306-322)
      const [statsData, ventesMoisData, activitesData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getVentesMois(),
        dashboardService.getActiviteRecente()
      ]);
      
      setStats(statsData || {});
      setVentesMois(ventesMoisData || { mois: [], totaux: [] });
      setActivites(activitesData || []);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement données dashboard:', error);
      setLoading(false);
    }
  };

  const rafraichirManuel = () => {
    // Rafraîchissement manuel (comme Python ligne 799-810)
    toast.info('Actualisation en cours...');
    loadAllData();
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Chargement des données...</p>
      </div>
    );
  }

  // Données pour les 3 graphiques séparés
  const chartDataComptoir = {
    labels: ventesMois?.mois || [],
    datasets: [
      {
        label: 'Ventes Comptoir',
        data: ventesMois?.totaux_comptoir || [],
        backgroundColor: '#3498DB',
        borderColor: '#2980B9',
        borderWidth: 1.5,
      },
    ],
  };

  const chartDataNormales = {
    labels: ventesMois?.mois || [],
    datasets: [
      {
        label: 'Factures Normales',
        data: ventesMois?.totaux_normales || [],
        backgroundColor: '#2ECC71',
        borderColor: '#27AE60',
        borderWidth: 1.5,
      },
    ],
  };

  const chartDataTotal = {
    labels: ventesMois?.mois || [],
    datasets: [
      {
        label: 'Chiffre d\'Affaires Total',
        data: ventesMois?.totaux_total || [],
        backgroundColor: '#E74C3C',
        borderColor: '#C0392B',
        borderWidth: 1.5,
      },
    ],
  };

  // Options pour graphique Comptoir (Bleu)
  const chartOptionsComptoir = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true,
        labels: {
          color: '#ffffff',
          font: { size: 14 }
        }
      },
      title: {
        display: true,
        text: '🛒 Ventes Comptoir (2025)',
        color: '#3498DB',
        font: { size: 18, weight: 'bold' },
        padding: 20,
      },
      datalabels: {
        color: '#ffffff',
        font: { size: 10, weight: 'bold' },
        anchor: 'end',
        align: 'top',
        formatter: (value) => {
          if (value > 0) {
            return new Intl.NumberFormat('fr-FR').format(Math.round(value)) + ' FCFA';
          }
          return '';
        },
        backgroundColor: 'rgba(52, 152, 219, 0.8)',
        borderColor: '#2980B9',
        borderWidth: 2,
        borderRadius: 6,
        padding: 6,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#3498DB',
        bodyColor: '#ffffff',
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context) => {
            return ' ' + new Intl.NumberFormat('fr-FR').format(context.parsed.y) + ' FCFA';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { 
          color: 'rgba(255, 255, 255, 0.1)',
          lineWidth: 1
        },
        ticks: { 
          color: '#ffffff',
          font: { size: 12 },
          callback: (value) => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(value)
        },
      },
      x: {
        grid: { display: false },
        ticks: { 
          color: '#ffffff',
          font: { size: 12 }
        },
      },
    },
  };

  // Options pour graphique Normales (Vert)
  const chartOptionsNormales = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true,
        labels: {
          color: '#ffffff',
          font: { size: 14 }
        }
      },
      title: {
        display: true,
        text: '📄 Factures Normales (2025)',
        color: '#2ECC71',
        font: { size: 18, weight: 'bold' },
        padding: 20,
      },
      datalabels: {
        color: '#ffffff',
        font: { size: 10, weight: 'bold' },
        anchor: 'end',
        align: 'top',
        formatter: (value) => {
          if (value > 0) {
            return new Intl.NumberFormat('fr-FR').format(Math.round(value)) + ' FCFA';
          }
          return '';
        },
        backgroundColor: 'rgba(46, 204, 113, 0.8)',
        borderColor: '#27AE60',
        borderWidth: 2,
        borderRadius: 6,
        padding: 6,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#2ECC71',
        bodyColor: '#ffffff',
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context) => {
            return ' ' + new Intl.NumberFormat('fr-FR').format(context.parsed.y) + ' FCFA';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { 
          color: 'rgba(255, 255, 255, 0.1)',
          lineWidth: 1
        },
        ticks: { 
          color: '#ffffff',
          font: { size: 12 },
          callback: (value) => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(value)
        },
      },
      x: {
        grid: { display: false },
        ticks: { 
          color: '#ffffff',
          font: { size: 12 }
        },
      },
    },
  };

  // Options pour graphique Total (Rouge)
  const chartOptionsTotal = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true,
        labels: {
          color: '#ffffff',
          font: { size: 14 }
        }
      },
      title: {
        display: true,
        text: '💰 Chiffre d\'Affaires Total (2025)',
        color: '#E74C3C',
        font: { size: 18, weight: 'bold' },
        padding: 20,
      },
      datalabels: {
        color: '#ffffff',
        font: { size: 10, weight: 'bold' },
        anchor: 'end',
        align: 'top',
        formatter: (value) => {
          if (value > 0) {
            return new Intl.NumberFormat('fr-FR').format(Math.round(value)) + ' FCFA';
          }
          return '';
        },
        backgroundColor: 'rgba(231, 76, 60, 0.8)',
        borderColor: '#C0392B',
        borderWidth: 2,
        borderRadius: 6,
        padding: 6,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#E74C3C',
        bodyColor: '#ffffff',
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context) => {
            return ' ' + new Intl.NumberFormat('fr-FR').format(context.parsed.y) + ' FCFA';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { 
          color: 'rgba(255, 255, 255, 0.1)',
          lineWidth: 1
        },
        ticks: { 
          color: '#ffffff',
          font: { size: 12 },
          callback: (value) => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(value)
        },
      },
      x: {
        grid: { display: false },
        ticks: { 
          color: '#ffffff',
          font: { size: 12 }
        },
      },
    },
  };

  // Définir les statistiques comme Python (ligne 328-338)
  const statistiques = [
    { icone: '📊', titre: 'Clients', valeur: stats?.nb_clients || 0 },
    { icone: '📊', titre: 'Articles', valeur: stats?.nb_articles || 0 },
    { icone: '📊', titre: 'Factures Normales', valeur: stats?.nb_factures_normales || 0 },
    { icone: '📊', titre: 'Ventes Comptoir', valeur: stats?.nb_ventes_comptoir || 0 },
    { icone: '📊', titre: 'Devis', valeur: stats?.nb_devis || 0 },
    { icone: '📊', titre: 'Règlements', valeur: stats?.nb_reglements || 0 },
    // { icone: '📊', titre: 'Avoirs', valeur: stats?.nb_avoirs || 0 }, // 🔒 Module désactivé
    { icone: '💰', titre: 'Chiffre d\'Affaires', valeur: formatMontant(stats?.ca_total || 0) },
    { icone: '💳', titre: 'Créances (Impayés)', valeur: formatMontant(stats?.creances || 0) },
  ];

  // Actions rapides avec droits (comme Python ligne 257-262)
  const actionsRapides = [
    { icone: '📄', texte: 'Nouvelle Facture', action: () => navigate('/facturation') },
    { icone: '📋', texte: 'Nouveau Devis', action: () => navigate('/devis') },
    { icone: '🛒', texte: 'Vente Comptoir', action: () => navigate('/comptoir') },
    { icone: '📊', texte: 'Rapports', action: () => navigate('/rapports') },
  ];

  return (
    <div className="dashboard-container">
      {/* Titre avec date et rafraîchissement (comme Python ligne 62-111) */}
      <div className="dashboard-header card">
        <div className="header-content">
          <h1 className="dashboard-title">📊 Tableau de Bord</h1>
          <div className="header-date-refresh">
            <span className="last-update">
              Dernière mise à jour: {lastUpdate.toLocaleString('fr-FR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
            <button className="btn btn-secondary btn-refresh" onClick={rafraichirManuel}>
              🔄 Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Actions Rapides (comme Python ligne 214-301) */}
      <div className="dashboard-section card">
        <h2 className="section-title">⚡ Actions Rapides</h2>
        <div className="actions-grid">
          {actionsRapides.map((action, index) => (
            <div key={index} className="action-card" onClick={action.action}>
              <div className="action-icon">{action.icone}</div>
              <div className="action-text">{action.texte}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Statistiques Principales (comme Python ligne 113-417) */}
      <div className="dashboard-section card">
        <h2 className="section-title">📈 Statistiques Principales</h2>
        <div className="stats-grid">
          {statistiques.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon">{stat.icone}</div>
              <div className="stat-value">{stat.valeur}</div>
              <div className="stat-title">{stat.titre}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3 Graphiques Séparés: Comptoir, Normales, Total */}
      <div className="dashboard-section card">
        <h2 className="section-title">📊 Graphiques de Performance</h2>
        <div className="charts-row">
          <div className="chart-box">
            <Bar data={chartDataComptoir} options={chartOptionsComptoir} />
          </div>
          <div className="chart-box">
            <Bar data={chartDataNormales} options={chartOptionsNormales} />
          </div>
          <div className="chart-box">
            <Bar data={chartDataTotal} options={chartOptionsTotal} />
          </div>
        </div>
      </div>

      {/* Activité Récente (comme Python ligne 182-711) */}
      <div className="dashboard-section card">
        <h2 className="section-title">🕒 Activité Récente</h2>
        <div className="activite-container">
          {activites.length === 0 ? (
            <div className="no-activite">
              <p>Aucune activité récente</p>
            </div>
          ) : (
            activites.map((activite, index) => {
              // Icône selon le type (comme Python ligne 652)
              const icone = activite.type_activite === 'facture' ? '📄' : 
                           activite.type_activite === 'devis' ? '📋' : '🛒';
              
              // Formater la date (comme Python ligne 684)
              const dateFormatee = activite.date_activite 
                ? new Date(activite.date_activite).toLocaleDateString('fr-FR')
                : '';
              
              return (
                <div key={index} className="activite-item">
                  <div className="activite-icone">{icone}</div>
                  <div className="activite-details">
                    <div className="activite-numero">{activite.numero}</div>
                    <div className="activite-client">{activite.client_nom}</div>
                  </div>
                  <div className="activite-montant">{formatMontant(activite.montant)}</div>
                  <div className="activite-date">{dateFormatee}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
