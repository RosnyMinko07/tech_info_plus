import api from './authService';

export const dashboardService = {
  async getStats() {
    const response = await api.get('/api/stats/dashboard');
    return response.data;
  },

  async getSalesData() {
    // Simuler des données de ventes pour le graphique
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const data = months.map((month, index) => ({
      mois: month,
      total: Math.floor(Math.random() * 100000) + 50000,
    }));
    return data;
  },

  async getRecentActivity() {
    // Simuler des données d'activité récente
    const activities = [
      {
        id: 1,
        type: 'facture',
        numero: 'FAC-0001',
        client: 'Client A',
        montant: 150000,
        date: '2025-01-27',
        statut: 'payée',
      },
      {
        id: 2,
        type: 'devis',
        numero: 'DEV-0001',
        client: 'Client B',
        montant: 75000,
        date: '2025-01-27',
        statut: 'en_attente',
      },
      {
        id: 3,
        type: 'comptoir',
        numero: 'COM-0001',
        client: 'Vente Comptoir',
        montant: 25000,
        date: '2025-01-27',
        statut: 'payée',
      },
    ];
    return activities;
  },
};

