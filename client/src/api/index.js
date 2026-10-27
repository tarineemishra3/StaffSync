import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://staffsync-api-p9d0.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('staffsync_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('staffsync_token');
      // Navigate to login by dispatching a custom event the AuthContext listens to
      window.dispatchEvent(new Event('staffsync:unauthorized'));
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  getMe: () => api.get('/auth/me'),
  createUser: (data) => api.post('/auth/create-user', data)
};

// ─── Profile ─────────────────────────────────────────────────────────────────
export const profileAPI = {
  getMyProfile: () => api.get('/profile/me'),
  updateMyProfile: (data) => api.put('/profile/me', data)
};

// ─── Employees ───────────────────────────────────────────────────────────────
export const employeeAPI = {
  getAll: (params = {}) => api.get('/employees', { params }),
  getTeam: () => api.get('/employees/team'),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  updateStatus: (id, status) => api.patch(`/employees/${id}/status`, { status })
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendanceAPI = {
  checkIn: (remarks = '') => api.post('/attendance/check-in', { remarks }),
  checkOut: (remarks = '') => api.post('/attendance/check-out', { remarks }),
  getToday: () => api.get('/attendance/today'),
  getMine: (params = {}) => api.get('/attendance/me', { params }),
  getTeam: (date) => api.get('/attendance/team', { params: date ? { date } : {} }),
  getAll: (params = {}) => api.get('/attendance', { params })
};

// ─── Leaves ──────────────────────────────────────────────────────────────────
export const leaveAPI = {
  apply: (data) => api.post('/leaves', data),
  getMine: () => api.get('/leaves/me'),
  getTeam: () => api.get('/leaves/team'),
  getAll: () => api.get('/leaves'),
  review: (id, status, reviewRemarks = '') => api.patch(`/leaves/${id}/review`, { status, reviewRemarks }),
  cancel: (id) => api.patch(`/leaves/${id}/cancel`)
};

// ─── Announcements ────────────────────────────────────────────────────────────
export const announcementAPI = {
  getAll: (params = {}) => api.get('/announcements', { params }),
  getById: (id) => api.get(`/announcements/${id}`),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`)
};

export default api;
