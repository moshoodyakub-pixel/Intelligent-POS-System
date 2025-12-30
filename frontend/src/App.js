import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Vendors from './components/Vendors';
import Transactions from './components/Transactions';
import Forecasting from './components/Forecasting';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Error fallback component for Sentry error boundary
function ErrorFallback({ error, resetError }) {
  return (
    <div className="error-boundary" style={{
      padding: '40px',
      textAlign: 'center',
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '8px',
      margin: '20px'
    }}>
      <h2 style={{ color: '#991b1b' }}>Something went wrong</h2>
      <p style={{ color: '#7f1d1d' }}>
        An unexpected error occurred. Our team has been notified.
      </p>
      <details style={{ marginTop: '20px', textAlign: 'left' }}>
        <summary style={{ cursor: 'pointer', color: '#666' }}>Error Details</summary>
        <pre style={{ 
          backgroundColor: '#f3f4f6', 
          padding: '10px', 
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '12px'
        }}>
          {error?.message}
        </pre>
      </details>
      <button 
        onClick={resetError}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Try Again
      </button>
    </div>
  );
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout, isAuthenticated, isAdmin, isVendor } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  // Get role badge text
  const getRoleBadge = () => {
    switch (user?.role) {
      case 'admin': return 'Admin';
      case 'vendor': return 'Vendor';
      case 'cashier': return 'Cashier';
      case 'staff': return 'Staff';
      default: return null;
    }
  };

  // If not authenticated, show login/register routes only
  if (!isAuthenticated()) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>🎯 POS System</h2>
          <button
            className="toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
        </div>

        <ul className="nav-menu">
          <li>
            <Link to="/" className="nav-link">
              <span className="icon">📊</span>
              <span className="label">Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/products" className="nav-link">
              <span className="icon">📦</span>
              <span className="label">Products</span>
            </Link>
          </li>
          {/* Vendors - only visible to Admin and Vendor roles */}
          {isVendor() && (
            <li>
              <Link to="/vendors" className="nav-link">
                <span className="icon">🏢</span>
                <span className="label">Vendors</span>
              </Link>
            </li>
          )}
          <li>
            <Link to="/transactions" className="nav-link">
              <span className="icon">💰</span>
              <span className="label">Transactions</span>
            </Link>
          </li>
          {/* Forecasting - only visible to Admin and Vendor roles */}
          {isVendor() && (
            <li>
              <Link to="/forecasting" className="nav-link">
                <span className="icon">📈</span>
                <span className="label">Forecasting</span>
              </Link>
            </li>
          )}
        </ul>

        <div className="sidebar-footer">
          <p>© 2025 Intelligent POS</p>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <header className="app-header">
          <h1>Intelligent POS System</h1>
          <div className="header-info">
            <button 
              className="theme-toggle" 
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <span className="user-info">
              {user?.full_name || user?.username}
              {getRoleBadge() && <span className={`role-badge role-${user?.role}`}>{getRoleBadge()}</span>}
            </span>
            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <div className="content">
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            } />
            <Route path="/vendors" element={
              <ProtectedRoute allowedRoles={['admin', 'vendor']}>
                <Vendors />
              </ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            } />
            <Route path="/forecasting" element={
              <ProtectedRoute allowedRoles={['admin', 'vendor']}>
                <Forecasting />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/register" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Sentry.ErrorBoundary 
      fallback={({ error, resetError }) => (
        <ErrorFallback error={error} resetError={resetError} />
      )}
      onError={(error) => {
        console.error('Error caught by Sentry boundary:', error);
      }}
    >
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  );
}

export default App;