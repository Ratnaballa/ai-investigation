import api from './api';

export const caseService = {
  async getCases(page = 1, pageSize = 20, status = null) {
    const params = { page, page_size: pageSize };
    if (status) params.status = status;
    const { data } = await api.get('/cases', { params });
    return data;
  },

  async getCaseById(id) {
    const { data } = await api.get(`/cases/${id}`);
    return data;
  },

  async createCase(payload) {
    const { data } = await api.post('/cases', payload);
    return data;
  },

  async updateCase(id, payload) {
    const { data } = await api.put(`/cases/${id}`, payload);
    return data;
  },

  async deleteCase(id) {
    const { data } = await api.delete(`/cases/${id}`);
    return data;
  },

  async getCaseEvidence(caseId) {
    const { data } = await api.get(`/cases/${caseId}/evidence`);
    return data;
  },

  async addEvidence(caseId, payload) {
    const { data } = await api.post(`/cases/${caseId}/evidence`, payload);
    return data;
  },
};
