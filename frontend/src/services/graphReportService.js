import api from './api';

export const graphService = {
  async getGraph(caseId = null) {
    if (caseId) {
      const { data } = await api.get(`/graph/cases/${caseId}`);
      return data;
    }
    const { data } = await api.get('/graph');
    return data;
  },

  async generateAIGraph(caseId) {
    const { data } = await api.post(`/graph/cases/${caseId}/generate`);
    return data;
  },

  async uploadEvidenceFile(caseId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(`/graph/cases/${caseId}/upload-evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async addNode(payload) {
    const { data } = await api.post('/graph/nodes', payload);
    return data;
  },

  async updateNode(nodeId, payload) {
    const { data } = await api.put(`/graph/nodes/${nodeId}`, payload);
    return data;
  },

  async deleteNode(nodeId) {
    const { data } = await api.delete(`/graph/nodes/${nodeId}`);
    return data;
  },

  async addEdge(payload) {
    const { data } = await api.post('/graph/edges', payload);
    return data;
  },

  async deleteEdge(edgeId) {
    const { data } = await api.delete(`/graph/edges/${edgeId}`);
    return data;
  },
};

export const reportService = {
  async getReports(page = 1, pageSize = 20) {
    const { data } = await api.get('/reports', { params: { page, page_size: pageSize } });
    return data;
  },

  async getReportById(id) {
    const { data } = await api.get(`/reports/${id}`);
    return data;
  },

  async generateReport(payload) {
    const { data } = await api.post('/reports/generate', payload);
    return data;
  },

  async deleteReport(id) {
    const { data } = await api.delete(`/reports/${id}`);
    return data;
  },
};
