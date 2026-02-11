import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle token expiration
      localStorage.removeItem('authToken');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// Code Generation API
export const codeAPI = {
  generate: (prompt, language) => api.post('/generate', { prompt, language }),
  getLanguages: () => api.get('/languages'),
};

// Explanation API
export const explainAPI = {
  explainCode: (code, language) => api.post('/explain', { code, language }),
};

// History API
export const historyAPI = {
  getHistory: (limit = 20, skip = 0) => api.get(`/history?limit=${limit}&skip=${skip}`),
  getGeneration: (id) => api.get(`/history/${id}`),
  deleteGeneration: (id) => api.delete(`/history/${id}`),
  getStats: () => api.get('/stats'),
};

export default api;
