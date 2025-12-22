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
      const errorData = await response.json();
      const error = new Error(errorData.detail || 'Login failed');
      error.response = { data: errorData };
      throw error;
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

// Products API with pagination, search, filtering, and sorting
export const productsAPI = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.page_size) queryParams.append('page_size', params.page_size);
    if (params.search) queryParams.append('search', params.search);
    if (params.vendor_id) queryParams.append('vendor_id', params.vendor_id);
    if (params.min_price !== undefined) queryParams.append('min_price', params.min_price);
    if (params.max_price !== undefined) queryParams.append('max_price', params.max_price);
    if (params.min_quantity !== undefined) queryParams.append('min_quantity', params.min_quantity);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);
    return api.get(`/products/?${queryParams.toString()}`);
  },
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products/', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getLowStock: (threshold = 10) => api.get(`/products/low-stock?threshold=${threshold}`),
};

// Vendors API with pagination, search, and sorting
export const vendorsAPI = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.page_size) queryParams.append('page_size', params.page_size);
    if (params.search) queryParams.append('search', params.search);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);
    return api.get(`/vendors/?${queryParams.toString()}`);
  },
  getById: (id) => api.get(`/vendors/${id}`),
  create: (data) => api.post('/vendors/', data),
  update: (id, data) => api.put(`/vendors/${id}`, data),
  delete: (id) => api.delete(`/vendors/${id}`),
};

// Transactions API with pagination and filtering
export const transactionsAPI = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.page_size) queryParams.append('page_size', params.page_size);
    if (params.vendor_id) queryParams.append('vendor_id', params.vendor_id);
    if (params.product_id) queryParams.append('product_id', params.product_id);
    if (params.min_price !== undefined) queryParams.append('min_price', params.min_price);
    if (params.max_price !== undefined) queryParams.append('max_price', params.max_price);
    if (params.date_from) queryParams.append('date_from', params.date_from);
    if (params.date_to) queryParams.append('date_to', params.date_to);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);
    return api.get(`/transactions/?${queryParams.toString()}`);
  },
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions/', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  getRecent: (days = 7, limit = 10) => api.get(`/transactions/recent?days=${days}&limit=${limit}`),
  // Receipt generation
  getReceiptData: (id) => api.get(`/transactions/${id}/receipt-data`),
  downloadReceipt: (id) => {
    const token = localStorage.getItem('access_token');
    return fetch(`${API_BASE_URL}/transactions/${id}/receipt`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(response => response.blob());
  },
};

// Forecasting API with ARIMA support
export const forecastingAPI = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.page_size) queryParams.append('page_size', params.page_size);
    if (params.product_id) queryParams.append('product_id', params.product_id);
    return api.get(`/forecasting/sales?${queryParams.toString()}`);
  },
  getById: (id) => api.get(`/forecasting/sales/${id}`),
  create: (data) => api.post('/forecasting/sales', data),
  update: (id, data) => api.put(`/forecasting/sales/${id}`, data),
  delete: (id) => api.delete(`/forecasting/sales/${id}`),
  // ARIMA forecast generation
  generateARIMAForecast: (data) => api.post('/forecasting/arima', data),
};

// Reports API for analytics
export const reportsAPI = {
  getSalesReport: (days = 30, vendorId = null) => {
    const queryParams = new URLSearchParams();
    queryParams.append('days', days);
    if (vendorId) queryParams.append('vendor_id', vendorId);
    return api.get(`/reports/sales?${queryParams.toString()}`);
  },
  getInventoryAlerts: (criticalThreshold = 5, warningThreshold = 15, lowThreshold = 25) => {
    return api.get(`/reports/inventory-alerts?critical_threshold=${criticalThreshold}&warning_threshold=${warningThreshold}&low_threshold=${lowThreshold}`);
  },
  getDashboardStats: (days = 7) => api.get(`/reports/dashboard-stats?days=${days}`),
  getProductAnalytics: (productId, days = 30) => api.get(`/reports/analytics/product/${productId}?days=${days}`),
  // Export functions
  exportSalesPDF: (days = 30, vendorId = null) => {
    const queryParams = new URLSearchParams();
    queryParams.append('days', days);
    if (vendorId) queryParams.append('vendor_id', vendorId);
    const token = localStorage.getItem('access_token');
    return fetch(`${API_BASE_URL}/reports/export/sales/pdf?${queryParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(response => response.blob());
  },
  exportSalesExcel: (days = 30, vendorId = null) => {
    const queryParams = new URLSearchParams();
    queryParams.append('days', days);
    if (vendorId) queryParams.append('vendor_id', vendorId);
    const token = localStorage.getItem('access_token');
    return fetch(`${API_BASE_URL}/reports/export/sales/excel?${queryParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(response => response.blob());
  },
  exportInventoryPDF: () => {
    const token = localStorage.getItem('access_token');
    return fetch(`${API_BASE_URL}/reports/export/inventory/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(response => response.blob());
  },
  exportInventoryExcel: () => {
    const token = localStorage.getItem('access_token');
    return fetch(`${API_BASE_URL}/reports/export/inventory/excel`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(response => response.blob());
  },
};

export default api;