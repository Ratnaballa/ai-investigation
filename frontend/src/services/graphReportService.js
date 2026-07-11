import api from './api';

export const graphService = {
  async getGraph(caseId = null) {
    const params = caseId ? { case_id: caseId } : {};
    const { data } = await api.get('/graph', { params });
    return data;
  },

  async addNode(payload) {
    const { data } = await api.post('/graph/nodes', payload);
    return data;
  },

  async addEdge(payload) {
    const { data } = await api.post('/graph/edges', payload);
    return data;
  },

  async deleteNode(nodeId) {
    const { data } = await api.delete(`/graph/nodes/${nodeId}`);
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
