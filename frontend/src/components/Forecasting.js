import React, { useState, useEffect } from 'react';
import { forecastingAPI, productsAPI } from '../services/api';
import './Forecasting.css';

export default function Forecasting() {
  const [forecasts, setForecasts] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    product_id: '',
    forecasted_quantity: '',
    forecasted_price: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [foreRes, prodRes] = await Promise.all([
        forecastingAPI.getAll(),
        productsAPI.getAll(),
      ]);
      setForecasts(foreRes.data);
      setProducts(prodRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load forecasts');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'forecasted_quantity' || name === 'forecasted_price' ? parseFloat(value) || '' : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await forecastingAPI.create(formData);
      setFormData({ product_id: '', forecasted_quantity: '', forecasted_price: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError('Failed to create forecast');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await forecastingAPI.delete(id);
        fetchData();
      } catch (err) {
        setError('Failed to delete forecast');
      }
    }
  };

  const getProductName = (id) => {
    const product = products.find(p => p.id === id);
    return product ? product.name : 'Unknown';
  };

  if (loading) return <div className="loading">Loading forecasts...</div>;

  return (
    <div className="forecasting-container">
      <h1>📈 Sales Forecasting</h1>
      
      {error && <div className="error">{error}</div>}

      <button className="btn-primary" onClick={() => {
        setShowForm(!showForm);
        setFormData({ product_id: '', forecasted_quantity: '', forecasted_price: '' });
      }}>
        {showForm ? '✕ Close Form' : '➕ New Forecast'}
      </button>

      {showForm && (
        <form className="forecast-form" onSubmit={handleSubmit}>
          <h3>Create New Forecast</h3>

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
            required
          />

          <input
            type="number"
            name="forecasted_price"
            placeholder="Forecasted Price"
            value={formData.forecasted_price}
            onChange={handleInputChange}
            step="0.01"
            required
          />

          <button type="submit" className="btn-submit">Create Forecast</button>
        </form>
      )}

      <div className="forecasts-grid">
        {forecasts.map(forecast => (
          <div key={forecast.id} className="forecast-card">
            <h3>📦 {getProductName(forecast.product_id)}</h3>
            <p><strong>Forecasted Quantity:</strong> {forecast.forecasted_quantity} units</p>
            <p><strong>Forecasted Price:</strong> ${forecast.forecasted_price}</p>
            <p><strong>Forecast Value:</strong> ${(forecast.forecasted_quantity * forecast.forecasted_price).toFixed(2)}</p>
            <p><strong>Date:</strong> {new Date(forecast.forecast_date).toLocaleDateString()}</p>
            <button
              className="btn-delete"
              onClick={() => handleDelete(forecast.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}