import { create } from 'zustand';
import { api, getApiErrorMessage } from '../lib/api';

export const useEnrollmentStore = create((set, get) => ({
  enrollments: [],
  studentInfo: null,
  studentEnrollments: [],

  lastQuery: {
    per_page: 15,
    course_id: '',
    student_id: '',
    status: [],
    search: '',
  },

  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchEnrollments: async (query = {}) => {
    const q = { ...get().lastQuery, ...query };
    set({ loading: true, error: null, lastQuery: q });

    try {
      const res = await api.get('/enrollments', { params: q });
      set({ enrollments: res.data?.enrollments || [], loading: false });
      return res.data?.enrollments || [];
    } catch (err) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },

  // STUDENT
  createEnrollment: async (course_id) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/enrollments', { course_id });
      const created = res.data?.enrollment;
      if (created) set({ enrollments: [created, ...get().enrollments] });
      set({ loading: false });
      return res.data;
    } catch (err) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },

  // ADMIN or TEACHER (course teacher)
  updateEnrollmentStatus: async (enrollmentId, status) => {
    set({ loading: true, error: null });
    try {
      const res = await api.put(`/enrollments/${enrollmentId}`, { status });
      const updated = res.data?.enrollment;

      if (updated) {
        set({
          enrollments: get().enrollments.map((e) =>
            e.id === updated.id ? updated : e,
          ),
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

  // ADMIN
  fetchStudentEnrollments: async (studentId) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/student/${studentId}/enrollments`);
      set({
        studentInfo: res.data?.student || null,
        studentEnrollments: res.data?.enrollments || [],
        loading: false,
      });
      return res.data;
    } catch (err) {
      set({ error: getApiErrorMessage(err), loading: false });
      throw err;
    }
  },
}));
