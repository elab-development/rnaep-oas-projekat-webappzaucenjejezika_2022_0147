import { create } from 'zustand';
import { api, getApiErrorMessage } from '../lib/api';

export const useTranslateStore = create((set) => ({
  result: null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  translate: async ({ q, source, target }) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/translate', {
        params: { q, source, target },
      });

      set({ result: res.data || null, loading: false });
      return res.data;
    } catch (err) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },

  reset: () => set({ result: null, error: null }),
}));
