import api from './api';

export const sellerService = {
  // list sellers (admin)
  list: async (params) => {
    const res = await api.get('/admin/seller/get', { params });
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/admin/seller/${id}`);
    return res.data;
  },

  add: async (payload) => {
    const res = await api.post('/admin/seller', payload);
    return res.data;
  },

  update: async (id, payload) => {
    const res = await api.put(`/admin/seller/${id}`, payload);
    return res.data;
  },

  updateStatus: async (id, status) => {
    const res = await api.patch(`/admin/seller/${id}/status`, { status });
    return res.data;
  },

  assignProducts: async (id, productIds) => {
    const res = await api.post(`/admin/seller/${id}/assign-products`, { products: productIds });
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/admin/seller/${id}`);
    return res.data;
  },
};
