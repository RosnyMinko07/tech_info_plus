import api from './authService';

export const clientService = {
  async getClients() {
    const response = await api.get('/api/clients');
    return response.data;
  },

  async getClient(id) {
    const response = await api.get(`/api/clients/${id}`);
    return response.data;
  },

  async createClient(data) {
    const response = await api.post('/api/clients', data);
    return response.data;
  },

  async updateClient(id, data) {
    const response = await api.put(`/api/clients/${id}`, data);
    return response.data;
  },

  async deleteClient(id) {
    const response = await api.delete(`/api/clients/${id}`);
    return response.data;
  },

  async searchClients(query) {
    const response = await api.get(`/api/search/clients?q=${query}`);
    return response.data;
  },
};

