import React, { useState, useEffect, useCallback } from 'react';
import { forecastingAPI, productsAPI } from '../services/api';
import './Forecasting.css';

export default function Forecasting() {
  const [forecasts, setForecasts] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showARIMAForm, setShowARIMAForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
    total_pages: 0,
  });

  // Manual forecast form
  const [formData, setFormData] = useState({
    product_id: '',
    forecasted_quantity: '',
    forecasted_price: '',
  });

  // ARIMA form
  const [arimaForm, setArimaForm] = useState({
    product_id: '',
    periods: 14,
    confidence_level: 0.95,
  });

  // ARIMA forecast result
  const [arimaResult, setArimaResult] = useState(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [foreRes, prodRes] = await Promise.all([
        forecastingAPI.getAll({ page: pagination.page, page_size: pagination.page_size }),
        productsAPI.getAll({ page_size: 100 }),
      ]);
      setForecasts(foreRes.data.items || []);
      setPagination(prev => ({ ...prev, ...foreRes.data.pagination }));
      setProducts(prodRes.data.items || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load forecasts');
      showNotification('Failed to load forecasts', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.page_size]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'forecasted_quantity' || name === 'forecasted_price' ? parseFloat(value) || '' : value,
    }));
  };

  const handleARIMAInputChange = (e) => {
    const { name, value } = e.target;
    setArimaForm(prev => ({
      ...prev,
      [name]: name === 'periods' ? parseInt(value) || 7 : 
              name === 'confidence_level' ? parseFloat(value) || 0.95 :
              value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await forecastingAPI.create(formData);
      setFormData({ product_id: '', forecasted_quantity: '', forecasted_price: '' });
      setShowForm(false);
      showNotification('Forecast created successfully', 'success');
      fetchData();
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to create forecast';
      showNotification(message, 'error');
    }
  };

  const handleARIMASubmit = async (e) => {
    e.preventDefault();
    try {
      setGenerating(true);
      setArimaResult(null);
      const response = await forecastingAPI.generateARIMAForecast({
        product_id: arimaForm.product_id || null,
        periods: arimaForm.periods,
        confidence_level: arimaForm.confidence_level,
      });
      setArimaResult(response.data);
      showNotification('ARIMA forecast generated successfully!', 'success');
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to generate ARIMA forecast';
      showNotification(message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this forecast?')) {
      try {
        await forecastingAPI.delete(id);
        showNotification('Forecast deleted successfully', 'success');
        fetchData();
      } catch (err) {
        showNotification('Failed to delete forecast', 'error');
      }
    }
  };

  const getProductName = (id) => {
    const product = products.find(p => p.id === id);
    return product ? product.name : 'Unknown';
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Render simple visualization bars for forecast
  const renderForecastChart = (forecastData, historicalData) => {
    if (!forecastData || forecastData.length === 0) return null;

    // Find max value for scaling
    const allValues = [
      ...historicalData.map(d => d.value),
      ...forecastData.map(d => d.upper_bound)
    ];
    const maxValue = Math.max(...allValues) * 1.1;

    return (
      <div className="forecast-chart">
        <div className="chart-container">
          <div className="chart-section">
            <h5>📊 Historical Data</h5>
            <div className="chart-bars">
              {historicalData.slice(-7).map((point, idx) => (
                <div key={idx} className="bar-wrapper">
                  <div 
                    className="bar historical"
                    style={{ height: `${(point.value / maxValue) * 100}%` }}
                    title={`${point.date}: $${point.value.toFixed(2)}`}
                  />
                  <span className="bar-label">{point.date.slice(-5)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-divider">→</div>

          <div className="chart-section">
            <h5>🔮 Forecast</h5>
            <div className="chart-bars">
              {forecastData.slice(0, 7).map((point, idx) => (
                <div key={idx} className="bar-wrapper">
                  <div 
                    className="bar-range"
                    style={{ 
                      height: `${((point.upper_bound - point.lower_bound) / maxValue) * 100}%`,
                      bottom: `${(point.lower_bound / maxValue) * 100}%`
                    }}
                  />
                  <div 
                    className="bar forecast"
                    style={{ height: `${(point.predicted_value / maxValue) * 100}%` }}
                    title={`${point.date}: $${point.predicted_value.toFixed(2)} (${point.lower_bound.toFixed(2)} - ${point.upper_bound.toFixed(2)})`}
                  />
                  <span className="bar-label">{point.date.slice(-5)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-legend">
          <span><span className="legend-box historical"></span> Historical</span>
          <span><span className="legend-box forecast"></span> Predicted</span>
          <span><span className="legend-box range"></span> Confidence Range</span>
        </div>
      </div>
    );
  };

  return (
    <div className="forecasting-container">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
          <button className="notification-close" onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      <div className="page-header">
        <h1>📈 Sales Forecasting</h1>
        <div className="header-actions">
          <button className="btn-primary arima" onClick={() => {
            setShowARIMAForm(!showARIMAForm);
            setShowForm(false);
          }}>
            {showARIMAForm ? '✕ Close' : '🤖 Generate AI Forecast'}
          </button>
          <button className="btn-primary" onClick={() => {
            setShowForm(!showForm);
            setShowARIMAForm(false);
            setFormData({ product_id: '', forecasted_quantity: '', forecasted_price: '' });
          }}>
            {showForm ? '✕ Close' : '➕ Manual Forecast'}
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {/* ARIMA Forecast Generator */}
      {showARIMAForm && (
        <div className="arima-section">
          <form className="arima-form" onSubmit={handleARIMASubmit}>
            <h3>🤖 ARIMA Forecast Generator</h3>
            <p className="form-description">
              Generate AI-powered sales forecasts using ARIMA (AutoRegressive Integrated Moving Average) model.
            </p>

            <div className="form-grid">
              <div className="form-group">
                <label>Product (Optional)</label>
                <select
                  name="product_id"
                  value={arimaForm.product_id}
                  onChange={handleARIMAInputChange}
                >
                  <option value="">All Products (Total Sales)</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Forecast Period (Days)</label>
                <input
                  type="number"
                  name="periods"
                  value={arimaForm.periods}
                  onChange={handleARIMAInputChange}
                  min="1"
                  max="365"
                />
              </div>

              <div className="form-group">
                <label>Confidence Level</label>
                <select
                  name="confidence_level"
                  value={arimaForm.confidence_level}
                  onChange={handleARIMAInputChange}
                >
                  <option value="0.90">90%</option>
                  <option value="0.95">95%</option>
                  <option value="0.99">99%</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-generate" disabled={generating}>
              {generating ? (
                <>
                  <span className="spinner"></span>
                  Generating Forecast...
                </>
              ) : (
                '🔮 Generate Forecast'
              )}
            </button>
          </form>

          {/* ARIMA Results */}
          {arimaResult && (
            <div className="arima-results">
              <h4>
                📊 Forecast Results
                {arimaResult.product_name && ` - ${arimaResult.product_name}`}
              </h4>

              <div className="results-meta">
                <span>📅 Generated: {new Date(arimaResult.forecast_generated_at).toLocaleString()}</span>
                <span>📈 Model: {arimaResult.model_metrics?.model_type || 'ARIMA'}</span>
                <span>📊 Data Points: {arimaResult.model_metrics?.data_points || 'N/A'}</span>
              </div>

              {/* Visualization */}
              {renderForecastChart(arimaResult.forecast_data, arimaResult.historical_data)}

              {/* Forecast Table */}
              <div className="forecast-table-container">
                <h5>📋 Detailed Forecast</h5>
                <table className="forecast-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Predicted Value</th>
                      <th>Lower Bound</th>
                      <th>Upper Bound</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arimaResult.forecast_data.map((point, idx) => (
                      <tr key={idx}>
                        <td>{point.date}</td>
                        <td className="value-cell">${point.predicted_value.toFixed(2)}</td>
                        <td className="bound-cell">${point.lower_bound.toFixed(2)}</td>
                        <td className="bound-cell">${point.upper_bound.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Forecast Form */}
      {showForm && (
        <form className="forecast-form" onSubmit={handleSubmit}>
          <h3>➕ Create Manual Forecast</h3>

          <select
            name="product_id"
            value={formData.product_id}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Product</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>

          <input
            type="number"
            name="forecasted_quantity"
            placeholder="Forecasted Quantity"
            value={formData.forecasted_quantity}
            onChange={handleInputChange}
            min="0"
            required
          />

          <input
            type="number"
            name="forecasted_price"
            placeholder="Forecasted Price"
            value={formData.forecasted_price}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            required
          />

          <button type="submit" className="btn-submit">✅ Create Forecast</button>
        </form>
      )}

      {/* Forecasts List */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading forecasts...</p>
        </div>
      ) : (
        <>
          <div className="forecasts-grid">
            {forecasts.length === 0 ? (
              <div className="no-data">
                <p>No forecasts yet. Generate an AI forecast or create a manual one!</p>
              </div>
            ) : (
              forecasts.map(forecast => (
                <div key={forecast.id} className="forecast-card">
                  <div className="card-header">
                    <h3>📦 {getProductName(forecast.product_id)}</h3>
                    <span className="forecast-id">#{forecast.id}</span>
                  </div>
                  <div className="card-body">
                    <div className="forecast-stat">
                      <span className="stat-label">Quantity</span>
                      <span className="stat-value">{forecast.forecasted_quantity} units</span>
                    </div>
                    <div className="forecast-stat">
                      <span className="stat-label">Price</span>
                      <span className="stat-value">${forecast.forecasted_price?.toFixed(2)}</span>
                    </div>
                    <div className="forecast-stat highlight">
                      <span className="stat-label">Total Value</span>
                      <span className="stat-value">
                        ${(forecast.forecasted_quantity * forecast.forecasted_price).toFixed(2)}
                      </span>
                    </div>
                    <div className="forecast-date">
                      📅 {new Date(forecast.forecast_date).toLocaleDateString()}
                    </div>
                  </div>
                  <button className="btn-delete" onClick={() => handleDelete(forecast.id)}>
                    🗑️ Delete
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-btn"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.has_prev}
              >
                ◀ Prev
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <button 
                className="pagination-btn"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.has_next}
              >
                Next ▶
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}