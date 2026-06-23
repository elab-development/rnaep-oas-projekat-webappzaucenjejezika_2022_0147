import { create } from 'zustand';
import { api, getApiErrorMessage } from '../lib/api';

export const useLanguageStore = create((set, get) => ({
  languages: [],
  currentLanguage: null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchLanguages: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/languages');
      set({ languages: res.data?.languages || [], loading: false });
      return res.data?.languages || [];
    } catch (err) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },

  fetchLanguage: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/languages/${id}`);
      set({ currentLanguage: res.data?.language || null, loading: false });
      return res.data?.language || null;
    } catch (err) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },

  // ADMIN
  createLanguage: async ({ name, imgUrl }) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/languages', { name, imgUrl });
      const created = res.data?.language;
      if (created) set({ languages: [created, ...get().languages] });
      set({ loading: false });
      return res.data;
    } catch (err) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },

  updateLanguage: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const res = await api.put(`/languages/${id}`, payload);
      const updated = res.data?.language;

      if (updated) {
        set({
          languages: get().languages.map((l) =>
            l.id === updated.id ? updated : l,
          ),
          currentLanguage: updated,
          loading: false,
        });
      } else {
        set({ loading: false });
      }

      return res.data;
    } catch (err) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },

  deleteLanguage: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/languages/${id}`);
      set({
        languages: get().languages.filter((l) => l.id !== id),
        loading: false,
      });
      return true;
    } catch (err) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },
}));
