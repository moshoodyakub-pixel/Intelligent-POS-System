import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Vendors from './components/Vendors';
import Transactions from './components/Transactions';
import Forecasting from './components/Forecasting';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout, isAuthenticated } = useAuth();

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
          <li>
            <Link to="/vendors" className="nav-link">
              <span className="icon">🏢</span>
              <span className="label">Vendors</span>
            </Link>
          </li>
          <li>
            <Link to="/transactions" className="nav-link">
              <span className="icon">💰</span>
              <span className="label">Transactions</span>
            </Link>
          </li>
          <li>
            <Link to="/forecasting" className="nav-link">
              <span className="icon">📈</span>
              <span className="label">Forecasting</span>
            </Link>
          </li>
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
            <span className="user-info">
              {user?.full_name || user?.username}
              {user?.role === 'admin' && <span className="role-badge">Admin</span>}
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
              <ProtectedRoute>
                <Vendors />
              </ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            } />
            <Route path="/forecasting" element={
              <ProtectedRoute>
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
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;