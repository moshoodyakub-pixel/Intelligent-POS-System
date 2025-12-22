import React, { useState, useEffect, useCallback } from 'react';
import { productsAPI, vendorsAPI, transactionsAPI, forecastingAPI, reportsAPI } from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    vendors: 0,
    transactions: 0,
    forecasts: 0,
    totalRevenue: 0,
    lowStockCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [exporting, setExporting] = useState(null);

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const handleExport = async (type, format) => {
    try {
      setExporting(`${type}-${format}`);
      let blob;
      let filename;
      
      if (type === 'sales') {
        if (format === 'pdf') {
          blob = await reportsAPI.exportSalesPDF(30);
          filename = `sales_report_${new Date().toISOString().split('T')[0]}.pdf`;
        } else {
          blob = await reportsAPI.exportSalesExcel(30);
          filename = `sales_report_${new Date().toISOString().split('T')[0]}.xlsx`;
        }
      } else if (type === 'inventory') {
        if (format === 'pdf') {
          blob = await reportsAPI.exportInventoryPDF();
          filename = `inventory_alerts_${new Date().toISOString().split('T')[0]}.pdf`;
        } else {
          blob = await reportsAPI.exportInventoryExcel();
          filename = `inventory_alerts_${new Date().toISOString().split('T')[0]}.xlsx`;
        }
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showNotification(`${type} report exported successfully!`, 'success');
    } catch (err) {
      console.error('Export error:', err);
      showNotification(`Failed to export ${type} report`, 'error');
    } finally {
      setExporting(null);
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const [products, vendors, transactions, forecasts, dashboardStats, inventoryAlerts] = await Promise.all([
        productsAPI.getAll(),
        vendorsAPI.getAll(),
        transactionsAPI.getAll(),
        forecastingAPI.getAll(),
        reportsAPI.getDashboardStats(7).catch(() => null),
        reportsAPI.getInventoryAlerts().catch(() => null),
      ]);

      setStats({
        products: products.data?.pagination?.total || products.data?.items?.length || 0,
        vendors: vendors.data?.pagination?.total || vendors.data?.items?.length || 0,
        transactions: transactions.data?.pagination?.total || transactions.data?.items?.length || 0,
        forecasts: forecasts.data?.pagination?.total || forecasts.data?.items?.length || 0,
        totalRevenue: dashboardStats?.data?.total_revenue || 0,
        lowStockCount: dashboardStats?.data?.low_stock_count || 0,
      });

      if (dashboardStats?.data) {
        setRecentTransactions(dashboardStats.data.recent_transactions || []);
      }

      if (inventoryAlerts?.data) {
        setLowStockAlerts(inventoryAlerts.data.alerts?.slice(0, 5) || []);
      }

      setError(null);
      
      // Show warning if there are critical stock alerts
      if (inventoryAlerts?.data?.critical_count > 0) {
        showNotification(`⚠️ ${inventoryAlerts.data.critical_count} product(s) critically low on stock!`, 'warning');
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard data');
      showNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="dashboard">
        <h1>📊 POS System Dashboard</h1>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <h1>📊 POS System Dashboard</h1>
        <div className="error-container">
          <div className="error">{error}</div>
          <button className="btn-retry" onClick={fetchStats}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
          <button className="notification-close" onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      <h1>📊 POS System Dashboard</h1>

      {/* Export Buttons */}
      <div className="export-section">
        <h3>📥 Export Reports</h3>
        <div className="export-buttons">
          <button 
            className="export-btn pdf" 
            onClick={() => handleExport('sales', 'pdf')}
            disabled={exporting}
          >
            {exporting === 'sales-pdf' ? '⏳ Exporting...' : '📄 Sales Report (PDF)'}
          </button>
          <button 
            className="export-btn excel" 
            onClick={() => handleExport('sales', 'excel')}
            disabled={exporting}
          >
            {exporting === 'sales-excel' ? '⏳ Exporting...' : '📊 Sales Report (Excel)'}
          </button>
          <button 
            className="export-btn pdf" 
            onClick={() => handleExport('inventory', 'pdf')}
            disabled={exporting}
          >
            {exporting === 'inventory-pdf' ? '⏳ Exporting...' : '📄 Inventory Alerts (PDF)'}
          </button>
          <button 
            className="export-btn excel" 
            onClick={() => handleExport('inventory', 'excel')}
            disabled={exporting}
          >
            {exporting === 'inventory-excel' ? '⏳ Exporting...' : '📊 Inventory Alerts (Excel)'}
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card products">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Products</h3>
            <p className="stat-number">{stats.products}</p>
            <p className="stat-label">Total Products</p>
          </div>
        </div>

        <div className="stat-card vendors">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3>Vendors</h3>
            <p className="stat-number">{stats.vendors}</p>
            <p className="stat-label">Active Vendors</p>
          </div>
        </div>

        <div className="stat-card transactions">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Transactions</h3>
            <p className="stat-number">{stats.transactions}</p>
            <p className="stat-label">Total Transactions</p>
          </div>
        </div>

        <div className="stat-card revenue">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <h3>Revenue</h3>
            <p className="stat-number">${stats.totalRevenue.toLocaleString()}</p>
            <p className="stat-label">Total Revenue</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Recent Transactions */}
        <div className="dashboard-card">
          <h3>📈 Recent Transactions</h3>
          {recentTransactions.length > 0 ? (
            <ul className="transaction-list">
              {recentTransactions.map((t, index) => (
                <li key={index} className="transaction-item">
                  <span className="transaction-product">{t.product_name}</span>
                  <span className="transaction-amount">${t.total_price.toFixed(2)}</span>
                  <span className="transaction-date">{new Date(t.date).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">No recent transactions</p>
          )}
        </div>

        {/* Inventory Alerts */}
        <div className="dashboard-card">
          <h3>⚠️ Inventory Alerts</h3>
          {lowStockAlerts.length > 0 ? (
            <ul className="alert-list">
              {lowStockAlerts.map((alert, index) => (
                <li key={index} className={`alert-item alert-${alert.alert_level}`}>
                  <span className="alert-product">{alert.product_name}</span>
                  <span className="alert-quantity">{alert.current_quantity} left</span>
                  <span className={`alert-badge ${alert.alert_level}`}>{alert.alert_level}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">✅ All products well stocked</p>
          )}
        </div>
      </div>

      <div className="welcome-section">
        <h2>Welcome to Intelligent POS System</h2>
        <p>Manage your multi-vendor sales and forecasting platform</p>
        <p>Use the navigation menu to access Products, Vendors, Transactions, and Forecasting</p>
        <div className="quick-actions">
          <a href="/products" className="quick-action-btn">📦 Manage Products</a>
          <a href="/transactions" className="quick-action-btn">💰 New Transaction</a>
          <a href="/forecasting" className="quick-action-btn">📈 View Forecasts</a>
        </div>
      </div>
    </div>
  );
}