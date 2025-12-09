import { create } from 'zustand';
import api from '../services/api';

function safeJSONParse(value) {
  try {
    if (!value || value === "undefined") return null;
    return JSON.parse(value);
  } catch {
    return null;
  }
}

const useAuthStore = create((set) => ({
  user: safeJSONParse(localStorage.getItem('adminUser')),
  token: localStorage.getItem('adminToken') || null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data.success && response.data.data.user.role === 'admin') {
        const { token, user } = response.data.data;

        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminUser', JSON.stringify(user));

        set({ user, token, isLoading: false });
        return { success: true };
      }

      set({ isLoading: false, error: "Not authorized. Admin access only." });
      return { success: false };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    set({ user: null, token: null });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
