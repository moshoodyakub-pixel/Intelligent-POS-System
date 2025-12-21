import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    // Use a separate axios call since login needs form-urlencoded content type
    // and shouldn't have Authorization header
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw { response: { data: error } };
    }
    return { data: await response.json() };
  },
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  getUsers: () => api.get('/auth/users'),
  getUserById: (id) => api.get(`/auth/users/${id}`),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
};

// Products API
export const productsAPI = {
  getAll: () => api.get('/products/'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products/', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Vendors API
export const vendorsAPI = {
  getAll: () => api.get('/vendors/'),
  getById: (id) => api.get(`/vendors/${id}`),
  create: (data) => api.post('/vendors/', data),
  update: (id, data) => api.put(`/vendors/${id}`, data),
  delete: (id) => api.delete(`/vendors/${id}`),
};

// Transactions API
export const transactionsAPI = {
  getAll: () => api.get('/transactions/'),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions/', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
};

// Forecasting API
export const forecastingAPI = {
  getAll: () => api.get('/forecasting/sales'),
  getById: (id) => api.get(`/forecasting/sales/${id}`),
  create: (data) => api.post('/forecasting/sales', data),
  update: (id, data) => api.put(`/forecasting/sales/${id}`, data),
  delete: (id) => api.delete(`/forecasting/sales/${id}`),
};

export default api;