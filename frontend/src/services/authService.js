import api from './api';

export const authService = {
  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user_role', data.user_role);
    return data;
  },

  async register(payload) {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },

  async logout() {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.clear();
  },

  async changePassword(current_password, new_password) {
    const { data } = await api.post('/auth/change-password', { current_password, new_password });
    return data;
  },

  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  },

  getRole() {
    return localStorage.getItem('user_role');
  },
};
