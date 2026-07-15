import api from './api';

export const legalHistoryService = {
  async saveHistory(query, result, title, summary) {
    const { data } = await api.post('/legal/history', { query, result, title, summary });
    return data;
  },

  async getHistory() {
    const { data } = await api.get('/legal/history');
    return data;
  },

  async getHistoryItem(id) {
    const { data } = await api.get(`/legal/history/${id}`);
    return data;
  },

  async deleteHistoryItem(id) {
    const { data } = await api.delete(`/legal/history/${id}`);
    return data;
  },
};
