import { create } from 'zustand';
import { api, getApiErrorMessage } from '../lib/api';

export const useAdminStatsStore = create((set) => ({
  stats: null,

  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  reset: () => set({ stats: null, error: null, loading: false }),

  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/admin/stats');
      set({ stats: res.data || null, loading: false });
      return res.data;
    } catch (err) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },
}));
