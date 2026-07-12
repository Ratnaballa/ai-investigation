import api from './api';

export const chatService = {
  async sendMessage(message, sessionId = null, language = 'en', useRag = false) {
    const { data } = await api.post('/chat', {
      message,
      session_id: sessionId,
      language,
      use_rag: useRag,
    });
    return data;
  },

  async getSessions(page = 1, pageSize = 20) {
    const { data } = await api.get('/chat/sessions', { params: { page, page_size: pageSize } });
    return data;
  },

  async getSessionHistory(sessionId) {
    const { data } = await api.get(`/chat/sessions/${sessionId}`);
    return data;
  },

  async deleteSession(sessionId) {
    const { data } = await api.delete(`/chat/sessions/${sessionId}`);
    return data;
  },

  async createSession() {
    const { data } = await api.post('/chat/sessions');
    return data;
  },
};
