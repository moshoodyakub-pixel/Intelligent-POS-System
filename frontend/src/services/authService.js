import { authAPI } from './api';

const TOKEN_KEY = 'authToken';

export const authService = {
  login: async (credentials) => {
    const response = await authAPI.login(credentials);
    localStorage.setItem(TOKEN_KEY, response.data.access_token);
    return response.data;
  },
  register: async (userData) => {
    const response = await authAPI.register(userData);
    localStorage.setItem(TOKEN_KEY, response.data.access_token);
    return response.data;
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
  },
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },
  isAuthenticated: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};
