import { create } from 'zustand';
import { api, getApiErrorMessage } from '../lib/api';

export const useLessonStore = create((set, get) => ({
  lessons: [],
  currentLesson: null,

  lastQuery: {
    search: '',
    teacher_id: '',
    course_id: '',
    sort_by: 'starts_at',
    sort_dir: 'asc',
    per_page: 10,
  },

  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchLessons: async (query = {}) => {
    const q = { ...get().lastQuery, ...query };
    set({ loading: true, error: null, lastQuery: q });

    try {
      const res = await api.get('/lessons', { params: q });
      set({ lessons: res.data?.lessons || [], loading: false });
      return res.data?.lessons || [];
    } catch (err) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },

  fetchLesson: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/lessons/${id}`);
      set({ currentLesson: res.data?.lesson || null, loading: false });
      return res.data?.lesson || null;
    } catch (err) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },

  // TEACHER
  createLesson: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/lessons', payload);
      const created = res.data?.lesson;
      if (created) set({ lessons: [created, ...get().lessons] });
      set({ loading: false });
      return res.data;
    } catch (err) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },

  updateLesson: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const res = await api.put(`/lessons/${id}`, payload);
      const updated = res.data?.lesson;

      if (updated) {
        set({
          lessons: get().lessons.map((l) =>
            l.id === updated.id ? updated : l,
          ),
          currentLesson: updated,
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

  deleteLesson: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/lessons/${id}`);
      set({
        lessons: get().lessons.filter((l) => l.id !== id),
        loading: false,
      });
      return true;
    } catch (err) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },
}));
