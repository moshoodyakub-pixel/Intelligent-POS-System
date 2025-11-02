import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Vendors from './components/Vendors';
import Transactions from './components/Transactions';
import Forecasting from './components/Forecasting';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Router>
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
              <span>User: moshoodyakub-pixel</span>
            </div>
          </header>

          <div className="content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/forecasting" element={<Forecasting />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;