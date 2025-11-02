import React, { useState, useEffect } from 'react';
import { productsAPI, vendorsAPI, transactionsAPI, forecastingAPI } from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    vendors: 0,
    transactions: 0,
    forecasts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [products, vendors, transactions, forecasts] = await Promise.all([
        productsAPI.getAll(),
        vendorsAPI.getAll(),
        transactionsAPI.getAll(),
        forecastingAPI.getAll(),
      ]);

      setStats({
        products: products.data.length,
        vendors: vendors.data.length,
        transactions: transactions.data.length,
        forecasts: forecasts.data.length,
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard">
      <h1>📊 POS System Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card products">
          <h3>📦 Products</h3>
          <p className="stat-number">{stats.products}</p>
          <p className="stat-label">Total Products</p>
        </div>

        <div className="stat-card vendors">
          <h3>🏢 Vendors</h3>
          <p className="stat-number">{stats.vendors}</p>
          <p className="stat-label">Active Vendors</p>
        </div>

        <div className="stat-card transactions">
          <h3>💰 Transactions</h3>
          <p className="stat-number">{stats.transactions}</p>
          <p className="stat-label">Total Transactions</p>
        </div>

        <div className="stat-card forecasts">
          <h3>📈 Forecasts</h3>
          <p className="stat-number">{stats.forecasts}</p>
          <p className="stat-label">Sales Forecasts</p>
        </div>
      </div>

      <div className="welcome-section">
        <h2>Welcome to Intelligent POS System</h2>
        <p>Manage your multi-vendor sales and forecasting platform</p>
        <p>Use the navigation menu to access Products, Vendors, Transactions, and Forecasting</p>
      </div>
    </div>
  );
}