import { create } from 'zustand';
import { authApi, adminAuthApi } from '../lib/api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  loading: false,
  error: null,

  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await authApi.register(data);
      const { user, token } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, loading: false });
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.message || 'Registration failed';
      set({ loading: false, error });
      return { success: false, error, errors: err.response?.data?.errors };
    }
  },

  login: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await authApi.login(data);
      const { user, token } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, loading: false });
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.message || 'Login failed';
      set({ loading: false, error });
      return { success: false, error };
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  updateProfile: async (data) => {
    set({ loading: true });
    try {
      const res = await authApi.updateProfile(data);
      const user = res.data;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, loading: false });
      return { success: true };
    } catch (err) {
      set({ loading: false });
      return { success: false, errors: err.response?.data?.errors };
    }
  },

  changePassword: async (data) => {
    set({ loading: true });
    try {
      await authApi.changePassword(data);
      set({ loading: false });
      return { success: true };
    } catch (err) {
      set({ loading: false });
      return { success: false, message: err.response?.data?.message, errors: err.response?.data?.errors };
    }
  },

  isAuthenticated: () => !!get().token && !!get().user,
}));

export const useAdminStore = create((set, get) => ({
  admin: JSON.parse(localStorage.getItem('admin') || 'null'),
  token: localStorage.getItem('adminToken'),
  loading: false,

  login: async (data) => {
    set({ loading: true });
    try {
      const res = await adminAuthApi.login(data);
      const { admin, token } = res.data;
      localStorage.setItem('adminToken', token);
      localStorage.setItem('admin', JSON.stringify(admin));
      // Update axios to use admin token for subsequent requests
      localStorage.setItem('token', token);
      set({ admin, token, loading: false });
      return { success: true };
    } catch (err) {
      set({ loading: false });
      return { success: false, error: err.response?.data?.message || 'Login failed' };
    }
  },

  logout: async () => {
    try {
      await adminAuthApi.logout();
    } catch {}
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    localStorage.removeItem('token');
    set({ admin: null, token: null });
  },

  isAuthenticated: () => !!get().token && !!get().admin,
}));
