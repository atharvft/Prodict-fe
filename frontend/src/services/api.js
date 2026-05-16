import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const api = axios.create({ baseURL: `${API_URL}/api`, withCredentials: true });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const url = error.config?.url || '';
    const isAuthRoute = url.includes('/auth/me') || url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/register');
    if (error.response?.status === 401 && !error.config._retry && !isAuthRoute) {
      error.config._retry = true;
      try {
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
        if (data.access_token) localStorage.setItem('access_token', data.access_token);
        return api(error.config);
      } catch {
        localStorage.removeItem('access_token');
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  create: (data) => api.post('/tasks', data),
  brainDump: (text) => api.post('/tasks/brain-dump', { text }),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  prioritize: () => api.post('/tasks/prioritize'),
};

export const chatAPI = {
  send: (message) => api.post('/chat', { message }),
  history: (limit = 50) => api.get('/chat/history', { params: { limit } }),
  clear: () => api.delete('/chat/history'),
};

export const plannerAPI = {
  generate: () => api.post('/planner/generate'),
  today: () => api.get('/planner/today'),
};

export const focusAPI = {
  start: (data) => api.post('/focus/start', data),
  end: (id, data) => api.put(`/focus/${id}/end`, data),
  history: () => api.get('/focus/history'),
};

export const analyticsAPI = {
  weekly: () => api.get('/analytics/weekly'),
  weeklyReport: () => api.get('/analytics/weekly-report'),
  procrastination: () => api.get('/analytics/procrastination'),
  burnout: () => api.get('/analytics/burnout'),
};

export const goalAPI = {
  create: (data) => api.post('/goals', data),
  getAll: () => api.get('/goals'),
  updateProgress: (id, progress) => api.put(`/goals/${id}/progress`, { progress }),
  breakdown: (id) => api.post(`/goals/${id}/breakdown`),
  createTasks: (id) => api.post(`/goals/${id}/create-tasks`),
};

export const overwhelmAPI = {
  trigger: () => api.post('/overwhelm'),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

export const nudgeAPI = {
  pending: () => api.get('/nudges/pending'),
  markDelivered: (id) => api.put(`/nudges/${id}/delivered`),
};

export default api;
