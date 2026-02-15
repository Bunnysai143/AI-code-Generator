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
      // Only redirect to login if it's an auth token issue, not GitHub connection issue
      const errorData = error.response?.data;
      const isGithubError = errorData?.github_not_connected || errorData?.error?.includes?.('GitHub');
      
      if (!isGithubError) {
        // Handle token expiration
        localStorage.removeItem('authToken');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
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
  refine: (generationId, message, conversationHistory) => 
    api.post('/generate/refine', { generation_id: generationId, message, conversation_history: conversationHistory }),
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

// Favorites API
export const favoritesAPI = {
  getFavorites: () => api.get('/favorites'),
  addFavorite: (generationId, title) => api.post('/favorites', { generation_id: generationId, title }),
  removeFavorite: (favoriteId) => api.delete(`/favorites/${favoriteId}`),
  updateFavorite: (favoriteId, data) => api.put(`/favorites/${favoriteId}`, data),
};

// Gist API
export const gistAPI = {
  createGist: (code, language, description, isPublic = false) => 
    api.post('/gist/create', { code, language, description, is_public: isPublic }),
  getGists: () => api.get('/gist'),
  connectGithub: (token) => api.post('/gist/connect', { github_token: token }),
  disconnectGithub: () => api.post('/gist/disconnect'),
};

// Code Execution API (for sandbox)
export const executeAPI = {
  execute: (code, language, input = '') => api.post('/execute', { code, language, input }),
};

export default api;
