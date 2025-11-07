import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

export default api;