import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      const isAdminLoggedIn = !!localStorage.getItem('admin');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('admin');
      localStorage.removeItem('adminToken');
      window.location.href = (isAdminRoute || isAdminLoggedIn) ? '/admin/login' : '/login';
    }
    return Promise.reject(error);
  }
);

// User Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
};

// Public Subjects (no auth needed)
export const subjectsApi = {
  list: (departmentId) => api.get('/subjects', { params: departmentId ? { department_id: departmentId } : {} }),
};

// Public Departments (no auth needed)
export const departmentsApi = {
  list: () => api.get('/departments'),
};

// Public Classes (no auth needed)
export const classesApi = {
  list: (departmentId) => api.get('/classes', { params: departmentId ? { department_id: departmentId } : {} }),
};

// Quiz
export const quizApi = {
  start: (subjectId = null) => api.post('/quiz/start', { subject_id: subjectId }),
  resume: (attemptCode) => api.get(`/quiz/${attemptCode}`),
  answer: (attemptCode, data) => api.post(`/quiz/${attemptCode}/answer`, data),
  finish: (attemptCode) => api.post(`/quiz/${attemptCode}/finish`),
  result: (attemptCode) => api.get(`/quiz/${attemptCode}/result`),
  history: (page = 1) => api.get('/quiz/history', { params: { page } }),
  stats: () => api.get('/quiz/stats'),
  downloadPdf: (attemptCode) => api.get(`/quiz/${attemptCode}/report/pdf`, { responseType: 'blob' }),
  downloadExcel: (attemptCode) => api.get(`/quiz/${attemptCode}/report/excel`, { responseType: 'blob' }),
};

// Admin Auth
export const adminAuthApi = {
  login: (data) => api.post('/admin/login', data),
  logout: () => api.post('/admin/logout'),
  me: () => api.get('/admin/me'),
};

// Admin Questions
export const adminQuestionsApi = {
  list: (params) => api.get('/admin/questions', { params }),
  create: (data) => api.post('/admin/questions', data),
  update: (id, data) => api.put(`/admin/questions/${id}`, data),
  delete: (id) => api.delete(`/admin/questions/${id}`),
  deleteAll: (params) => api.delete('/admin/questions', { params }),
  importJson: (data) => api.post('/admin/questions/import-json', data),
};

// Admin Users
export const adminUsersApi = {
  list: (params) => api.get('/admin/users', { params }),
  create: (data) => api.post('/admin/users', data),
  update: (id, data) => api.put(`/admin/users/${id}`, data),
  delete: (id) => api.delete(`/admin/users/${id}`),
  show: (id) => api.get(`/admin/users/${id}`),
  toggleActive: (id) => api.put(`/admin/users/${id}/toggle-active`),
  attempts: (id, page = 1) => api.get(`/admin/users/${id}/attempts`, { params: { page } }),
};

// Admin Reports
export const adminReportsApi = {
  summary: (params) => api.get('/admin/reports/summary', { params }),
  attempts: (params) => api.get('/admin/reports/attempts', { params }),
  questionAnalysis: (params) => api.get('/admin/reports/questions/analysis', { params }),
  byClass: () => api.get('/admin/reports/by-class'),
  byGeneration: () => api.get('/admin/reports/by-generation'),
  exportExcel: (params) => api.get('/admin/reports/export/excel', { params, responseType: 'blob' }),
  exportPdf: (params) => api.get('/admin/reports/export/pdf', { params, responseType: 'blob' }),
};

// Admin Subjects
export const adminSubjectsApi = {
  list: (departmentId) => api.get('/admin/subjects', { params: departmentId ? { department_id: departmentId } : {} }),
  create: (data) => api.post('/admin/subjects', data),
  update: (id, data) => api.put(`/admin/subjects/${id}`, data),
  delete: (id) => api.delete(`/admin/subjects/${id}`),
  toggleActive: (id) => api.put(`/admin/subjects/${id}/toggle-active`),
};

// Admin Departments
export const adminDepartmentsApi = {
  list: () => api.get('/admin/departments'),
  create: (data) => api.post('/admin/departments', data),
  update: (id, data) => api.put(`/admin/departments/${id}`, data),
  delete: (id) => api.delete(`/admin/departments/${id}`),
  toggleActive: (id) => api.put(`/admin/departments/${id}/toggle-active`),
};

// Admin Classes
export const adminClassesApi = {
  list: (departmentId) => api.get('/admin/classes', { params: departmentId ? { department_id: departmentId } : {} }),
  create: (data) => api.post('/admin/classes', data),
  update: (id, data) => api.put(`/admin/classes/${id}`, data),
  delete: (id) => api.delete(`/admin/classes/${id}`),
  toggleActive: (id) => api.put(`/admin/classes/${id}/toggle-active`),
};

export default api;
