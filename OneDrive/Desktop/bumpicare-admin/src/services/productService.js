import api from './api';

export const productService = {
  // Get all products (admin view)
  getAll: async (params) => {
    const res = await api.get('/admin/products', { params });
    return res.data;
  },

  // Get single product
  getById: async (id) => {
    const res = await api.get(`admin/product/${id}`);
    return res.data;
  },

  // Add product
  add: async (data) => {
    const res = await api.post('admin/product/add', data);
    return res.data;
  },

  // Update product
  update: async (id, data) => {
    const res = await api.put(`admin/product/${id}`, data);
    return res.data;
  },

  // Delete product
  delete: async (id) => {
    const res = await api.delete(`admin/product/${id}`);
    return res.data;
  },

  // Toggle product status
  toggleStatus: async (id) => {
    const res = await api.patch(`/admin/products/${id}/toggle-status`);
    return res.data;
  },

  // Bulk update stock
  bulkUpdateStock: async (updates) => {
    const res = await api.post('/admin/products/bulk-update-stock', { updates });
    return res.data;
  },

  // Upload images to Cloudinary
  uploadImages: async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const res = await api.post('/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getStockSummary: async () => {
    return await api.get("admin/products/stocks/stock-summary");
  },

  getStockProducts: async (filters) => {
    const params = new URLSearchParams();
  
  if (filters.stock) params.append('stock', filters.stock);
  if (filters.category) params.append('category', filters.category);
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  
  const response = await api.get(`/admin/products/stocks/stock-products?${params.toString()}`);
  return response.data; 
  },

};