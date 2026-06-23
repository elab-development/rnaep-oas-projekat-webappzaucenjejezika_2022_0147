import { create } from 'zustand';
import { api, getApiErrorMessage } from '../lib/api';

export const useCourseStore = create((set, get) => ({
  courses: [],
  currentCourse: null,
  teacherCourses: [],
  teacherInfo: null,

  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchCourses: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/courses');
      set({ courses: res.data?.courses || [], loading: false });
      return res.data?.courses || [];
    } catch (err) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },

  fetchCourse: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/courses/${id}`);
      set({ currentCourse: res.data?.course || null, loading: false });
      return res.data?.course || null;
    } catch (err) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },

  // ADMIN
  fetchCoursesByTeacher: async (teacherId) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/teacher/${teacherId}/courses`);
      set({
        teacherInfo: res.data?.teacher || null,
        teacherCourses: res.data?.courses || [],
        loading: false,
      });
      return res.data;
    } catch (err) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },

  createCourse: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/courses', payload);
      const created = res.data?.course;
      if (created) set({ courses: [created, ...get().courses] });
      set({ loading: false });
      return res.data;
    } catch (err) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },

  updateCourse: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const res = await api.put(`/courses/${id}`, payload);
      const updated = res.data?.course;

      if (updated) {
        set({
          courses: get().courses.map((c) =>
            c.id === updated.id ? updated : c,
          ),
          currentCourse: updated,
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

  deleteCourse: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/courses/${id}`);
      set({
        courses: get().courses.filter((c) => c.id !== id),
        loading: false,
      });
      return true;
    } catch (err) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },
}));
