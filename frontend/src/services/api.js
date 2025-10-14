/**
 * Service API pour Tech Info Plus
 * Identique aux appels Python vers la base de données
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Configuration axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs globalement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Déconnexion automatique si non autorisé
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTHENTIFICATION ====================

export const authService = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  me: () => api.get('/api/auth/me'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// ==================== CLIENTS ====================

export const clientService = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/clients', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/api/clients/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/api/clients', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/api/clients/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/clients/${id}`);
    return response.data;
  },
  search: async (query) => {
    const response = await api.get('/api/search/clients', { params: { q: query } });
    return response.data;
  },
};

// ==================== ARTICLES ====================

export const articleService = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/articles', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/api/articles/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/api/articles', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/api/articles/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/articles/${id}`);
    return response.data;
  },
  search: async (query) => {
    const response = await api.get('/api/search/articles', { params: { q: query } });
    return response.data;
  },
  generateCode: async () => {
    const response = await api.get('/api/articles/generate-code');
    return response.data;
  },
};

// ==================== FOURNISSEURS ====================

export const fournisseurService = {
  getAll: async () => {
    const response = await api.get('/api/fournisseurs');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/api/fournisseurs/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/api/fournisseurs', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/api/fournisseurs/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/fournisseurs/${id}`);
    return response.data;
  },
};

// ==================== FACTURES ====================

export const factureService = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/factures', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/api/factures/${id}`);
    return response.data;
  },
  getLignes: async (id) => {
    const response = await api.get(`/api/factures/${id}/lignes`);
    return response.data;
  },
  getArticlesDisponibles: async (id) => {
    const response = await api.get(`/api/factures/${id}/articles-disponibles`);
    return response.data;
  },
  create: (data) => api.post('/api/factures', data),
  update: (id, data) => api.put(`/api/factures/${id}`, data),
  delete: (id) => api.delete(`/api/factures/${id}`),
  generatePDF: (id, applyPrecompte = true) => 
    api.post(`/api/pdf/facture/${id}`, null, {
      params: { apply_precompte: applyPrecompte },
      responseType: 'blob'
    }),
};

// ==================== DEVIS ====================

export const devisService = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/devis', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/api/devis/${id}`);
    return response.data;
  },
  getDetails: async (id) => {
    const response = await api.get(`/api/devis/${id}/details`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/api/devis', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/api/devis/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/devis/${id}`);
    return response.data;
  },
  valider: async (id) => {
    const response = await api.put(`/api/devis/${id}/valider`);
    return response.data;
  },
  generateNumero: async () => {
    const response = await api.get('/api/devis/generate-numero');
    return response.data;
  },
  generatePDF: (id, applyPrecompte = false) =>
    api.post(`/api/pdf/devis/${id}`, null, {
      params: { apply_precompte: applyPrecompte },
      responseType: 'blob'
    }),
};

// ==================== COMPTOIR ====================

export const comptoirService = {
  searchArticles: async (query, limit = 20) => {
    const response = await api.get('/api/comptoir/articles/search', { params: { q: query, limit } });
    return response.data;
  },
  getArticlesPopulaires: async (limit = 20) => {
    const response = await api.get('/api/comptoir/articles/populaires', { params: { limit } });
    return response.data;
  },
  getVentesAujourdhui: async () => {
    const response = await api.get('/api/comptoir/ventes/aujourdhui');
    return response.data;
  },
  creerVente: async (data) => {
    const response = await api.post('/api/comptoir/vente', data);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/api/comptoir/stats');
    return response.data;
  },
};

// ==================== RÈGLEMENTS ====================

export const reglementService = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/reglements', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/api/reglements/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/api/reglements', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/api/reglements/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/reglements/${id}`);
    return response.data;
  },
};

// ==================== AVOIRS ====================

export const avoirService = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/avoirs', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/api/avoirs/${id}`);
    return response.data;
  },
  getDetails: async (id) => {
    const response = await api.get(`/api/avoirs/${id}/details`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/api/avoirs', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/api/avoirs/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/avoirs/${id}`);
    return response.data;
  },
  valider: async (id) => {
    const response = await api.put(`/api/avoirs/${id}/valider`);
    return response.data;
  },
  refuser: async (id) => {
    const response = await api.put(`/api/avoirs/${id}/refuser`);
    return response.data;
  },
  generateNumero: async () => {
    const response = await api.get('/api/avoirs/generate-numero');
    return response.data;
  },
};

// ==================== STOCK ====================

export const stockService = {
  getMouvements: async (params = {}) => {
    const response = await api.get('/api/mouvements', { params });
    return response.data;
  },
  getMouvementById: async (id) => {
    const response = await api.get(`/api/mouvements/${id}`);
    return response.data;
  },
  createMouvement: async (data) => {
    const response = await api.post('/api/mouvements', data);
    return response.data;
  },
  getStockStats: async () => {
    const response = await api.get('/api/stock/stats');
    return response.data;
  },
  getStockFaible: async () => {
    const response = await api.get('/api/stock/faible');
    return response.data;
  },
  getStockCritique: async () => {
    const response = await api.get('/api/stock/critique');
    return response.data;
  },
};

// ==================== UTILISATEURS ====================

export const utilisateurService = {
  getAll: async () => {
    const response = await api.get('/api/utilisateurs');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/api/utilisateurs/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/api/utilisateurs', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/api/utilisateurs/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/utilisateurs/${id}`);
    return response.data;
  },
  updateDroits: async (id, droits) => {
    const response = await api.put(`/api/utilisateurs/${id}/droits`, { droits });
    return response.data;
  },
};

// ==================== DASHBOARD / STATISTIQUES ====================

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/api/stats/dashboard');
    return response.data;
  },
  getVentesMois: async () => {
    const response = await api.get('/api/stats/ventes-mois');
    return response.data;
  },
  getActiviteRecente: async () => {
    const response = await api.get('/api/stats/activite-recente');
    return response.data;
  },
  getRapport: async (type, periode = 'ce_mois') => {
    const response = await api.get(`/api/rapports/${type}`, { params: { periode } });
    return response.data;
  },
};

// ==================== HELPERS ====================

/**
 * Télécharger un PDF depuis une URL ou un blob
 */
export const downloadPDF = async (urlOrBlob, filename) => {
  try {
    let blob;
    
    if (typeof urlOrBlob === 'string') {
      // C'est une URL, télécharger le fichier
      const response = await api.get(urlOrBlob, { responseType: 'blob' });
      blob = response.data;
    } else {
      // C'est déjà un blob
      blob = urlOrBlob;
    }
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erreur lors du téléchargement du PDF:', error);
    throw error;
  }
};

/**
 * Formater un montant en FCFA
 */
export const formatMontant = (montant) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant) + ' FCFA';
};

/**
 * Formater une date
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  } catch (error) {
    return dateString;
  }
};

/**
 * Obtenir le badge de statut
 */
export const getStatutBadge = (statut) => {
  const badges = {
    'Payée': 'success',
    'Partiellement payée': 'warning',
    'En attente': 'info',
    'Annulée': 'danger',
    'Brouillon': 'secondary',
  };
  return badges[statut] || 'secondary';
};

export default api;
