import api from './api';

export const userService = {
  async getMe() {
    const { data } = await api.get('/users/me');
    return data;
  },

  async updateMe(payload) {
    const { data } = await api.put('/users/me', payload);
    return data;
  },

  async listUsers(page = 1, pageSize = 20, role = null, isActive = null) {
    const params = { page, page_size: pageSize };
    if (role) params.role = role;
    if (isActive !== null) params.is_active = isActive;
    const { data } = await api.get('/users', { params });
    return data;
  },

  async getUserById(id) {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  async adminUpdateUser(id, payload) {
    const { data } = await api.put(`/users/${id}`, payload);
    return data;
  },

  async deleteUser(id) {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },
};
