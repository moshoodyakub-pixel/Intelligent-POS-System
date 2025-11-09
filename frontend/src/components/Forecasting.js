import React, { useState, useEffect } from 'react';
import { forecastingAPI, productsAPI } from '../services/api';
import './Forecasting.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Forecasting() {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [model, setModel] = useState('Moving Average');
  const [period, setPeriod] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forecastData, setForecastData] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await productsAPI.getAll();
      setProducts(res.data);
    } catch (err) {
      setError('Failed to load products');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await forecastingAPI.generate(productId, model, period);
      setForecastData(res.data);
    } catch (err) {
      setError('Failed to generate forecast');
    } finally {
      setLoading(false);
    }
  };

  const chartData = forecastData ? [...forecastData.historical_data, ...forecastData.forecast_data.map(d => ({...d, forecast: d.quantity}))] : [];

  return (
    <div className="forecasting-container">
      <h1>📈 Sales Forecasting</h1>
      
      {error && <div className="error">{error}</div>}

      <form className="forecast-form" onSubmit={handleSubmit}>
        <h3>Generate Forecast</h3>

        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          required
        >
          <option value="">Select Product</option>
          {products.map(product => (
            <option key={product.id} value={product.id}>{product.name}</option>
          ))}
        </select>

        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          required
        >
          <option value="Moving Average">Moving Average</option>
          <option value="ARIMA" disabled>ARIMA (coming soon)</option>
        </select>

        <input
          type="number"
          placeholder="Forecast Period (days)"
          value={period}
          onChange={(e) => setPeriod(parseInt(e.target.value) || '')}
          required
        />

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Generating...' : 'Generate Forecast'}
        </button>
      </form>

      {forecastData && (
        <div className="forecast-results">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="quantity" stroke="#8884d8" name="Historical Data" />
              <Line type="monotone" dataKey="forecast" stroke="#82ca9d" name="Forecasted Data" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
