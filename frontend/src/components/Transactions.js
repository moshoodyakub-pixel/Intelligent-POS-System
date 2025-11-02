import React, { useState, useEffect } from 'react';
import { transactionsAPI, productsAPI, vendorsAPI } from '../services/api';
import './Transactions.css';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    vendor_id: '',
    product_id: '',
    quantity: '',
    total_price: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transRes, prodRes, vendRes] = await Promise.all([
        transactionsAPI.getAll(),
        productsAPI.getAll(),
        vendorsAPI.getAll(),
      ]);
      setTransactions(transRes.data);
      setProducts(prodRes.data);
      setVendors(vendRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'total_price' ? parseFloat(value) || '' : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await transactionsAPI.create(formData);
      setFormData({ vendor_id: '', product_id: '', quantity: '', total_price: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError('Failed to create transaction');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await transactionsAPI.delete(id);
        fetchData();
      } catch (err) {
        setError('Failed to delete transaction');
      }
    }
  };

  const getProductName = (id) => {
    const product = products.find(p => p.id === id);
    return product ? product.name : 'Unknown';
  };

  const getVendorName = (id) => {
    const vendor = vendors.find(v => v.id === id);
    return vendor ? vendor.name : 'Unknown';
  };

  if (loading) return <div className="loading">Loading transactions...</div>;

  return (
    <div className="transactions-container">
      <h1>💰 Transactions</h1>
      
      {error && <div className="error">{error}</div>}

      <button className="btn-primary" onClick={() => {
        setShowForm(!showForm);
        setFormData({ vendor_id: '', product_id: '', quantity: '', total_price: '' });
      }}>
        {showForm ? '✕ Close Form' : '➕ New Transaction'}
      </button>

      {showForm && (
        <form className="transaction-form" onSubmit={handleSubmit}>
          <h3>Create New Transaction</h3>
          
          <select
            name="vendor_id"
            value={formData.vendor_id}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Vendor</option>
            {vendors.map(vendor => (
              <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
            ))}
          </select>
          
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
            name="quantity"
            placeholder="Quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            required
          />
          
          <input
            type="number"
            name="total_price"
            placeholder="Total Price"
            value={formData.total_price}
            onChange={handleInputChange}
            step="0.01"
            required
          />
          
          <button type="submit" className="btn-submit">Create Transaction</button>
        </form>
      )}

      <div className="transactions-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Vendor</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Total Price</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => (
              <tr key={transaction.id}>
                <td>{transaction.id}</td>
                <td>{getVendorName(transaction.vendor_id)}</td>
                <td>{getProductName(transaction.product_id)}</td>
                <td>{transaction.quantity}</td>
                <td>${transaction.total_price}</td>
                <td>{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                <td>
                  <button 
                    className="btn-delete" 
                    onClick={() => handleDelete(transaction.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}