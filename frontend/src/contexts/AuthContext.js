import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && typeof parsedUser === 'object' && parsedUser.username) {
          setUser(parsedUser);
          // Verify token is still valid
          authAPI.getProfile()
            .then(response => {
              setUser(response.data);
              localStorage.setItem('user', JSON.stringify(response.data));
            })
            .catch(() => {
              // Token invalid, clear storage
              localStorage.removeItem('access_token');
              localStorage.removeItem('user');
              setUser(null);
            })
            .finally(() => {
              setLoading(false);
            });
        } else {
          // Invalid user data format
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setLoading(false);
        }
      } catch (e) {
        // JSON parse error, clear storage
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      setError(null);
      const response = await authAPI.login(username, password);
      const { access_token } = response.data;
      
      // Store token
      localStorage.setItem('access_token', access_token);
      
      // Get user profile
      const profileResponse = await authAPI.getProfile();
      const userData = profileResponse.data;
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      await authAPI.register(userData);
      // After registration, automatically log in
      return await login(userData.username, userData.password);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateProfile = async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Update failed';
      return { success: false, error: errorMessage };
    }
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isVendor = () => {
    return user?.role === 'vendor' || user?.role === 'admin';
  };

  const isCashier = () => {
    return user?.role === 'cashier' || user?.role === 'vendor' || user?.role === 'admin';
  };

  const hasRole = (allowedRoles) => {
    return allowedRoles.includes(user?.role);
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    isAdmin,
    isVendor,
    isCashier,
    hasRole,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
