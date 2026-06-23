import { create } from 'zustand';
import { api, getApiErrorMessage } from '../lib/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,

  setToken: (token) => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    set({ token });
  },

  clearError: () => set({ error: null }),

  register: async ({ name, email, password }) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/register', { name, email, password });
      const token = res.data?.access_token || null;
      const user = res.data?.data || null;

      get().setToken(token);
      set({ user, loading: false });
      return res.data;
    } catch (err) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },

  login: async ({ email, password }) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/login', { email, password });
      const token = res.data?.access_token || null;

      get().setToken(token);

      await get().fetchMe();

      set({ loading: false });
      return res.data;
    } catch (err) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },

  fetchMe: async () => {
    if (!get().token) {
      set({ user: null });
      return null;
    }

    set({ loading: true, error: null });
    try {
      const res = await api.get('/me');
      const user = res.data?.data || null;
      set({ user, loading: false });
      return user;
    } catch (err) {
      get().setToken(null);
      set({ user: null, error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await api.post('/logout');
    } catch (err) {
    } finally {
      get().setToken(null);
      set({ user: null, loading: false });
    }
  },
}));
