import React, { useState, useEffect } from 'react';
import { productsAPI, vendorsAPI } from '../services/api';
import './Products.css';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    vendor_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, vendorsRes] = await Promise.all([
        productsAPI.getAll(),
        vendorsAPI.getAll(),
      ]);
      setProducts(productsRes.data);
      setVendors(vendorsRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'quantity' ? parseFloat(value) || '' : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await productsAPI.update(editingId, formData);
        setEditingId(null);
      } else {
        await productsAPI.create(formData);
      }
      setFormData({ name: '', description: '', price: '', quantity: '', vendor_id: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError('Failed to save product');
      console.error(err);
    }
  };

  const handleEdit = (product) => {
    setFormData(product);
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await productsAPI.delete(id);
        fetchData();
      } catch (err) {
        setError('Failed to delete product');
      }
    }
  };

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div className="products-container">
      <h1>📦 Products Management</h1>

      {error && <div className="error">{error}</div>}

      <button className="btn-primary" onClick={() => {
        setShowForm(!showForm);
        setEditingId(null);
        setFormData({ name: '', description: '', price: '', quantity: '', vendor_id: '' });
      }}>
        {showForm ? '✕ Close Form' : '➕ Add Product'}
      </button>

      {showForm && (
        <form className="product-form" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit Product' : 'Add New Product'}</h3>

          <input
            type="text"
            name="name"
            placeholder="Product Name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />

          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
          />

          <input
            type="number"
            name="price"
            placeholder="Price"
            value={formData.price}
            onChange={handleInputChange}
            step="0.01"
            required
          />

          <input
            type="number"
            name="quantity"
            placeholder="Quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            required
          />

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

          <button type="submit" className="btn-submit">
            {editingId ? 'Update Product' : 'Create Product'}
          </button>
        </form>
      )}

      <div className="products-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Vendor</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.description}</td>
                <td>${product.price}</td>
                <td>{product.quantity}</td>
                <td>{product.vendor_id}</td>
                <td>
                  <button className="btn-edit" onClick={() => handleEdit(product)}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDelete(product.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}