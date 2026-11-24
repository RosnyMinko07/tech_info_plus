/**
 * Configuration globale d'axios (SaaS)
 * - Ajoute automatiquement le token de connexion à TOUS les appels axios,
 *   y compris ceux qui n'utilisent pas services/api.js.
 * - Si le serveur répond 401 (session expirée / token invalide),
 *   déconnecte l'utilisateur et renvoie vers la page de connexion.
 */
import axios from 'axios';

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.includes('/api/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
