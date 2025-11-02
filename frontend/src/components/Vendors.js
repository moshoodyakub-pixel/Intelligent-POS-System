import React, { useState, useEffect } from 'react';
import { vendorsAPI } from '../services/api';
import './Vendors.css';

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await vendorsAPI.getAll();
      setVendors(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await vendorsAPI.update(editingId, formData);
        setEditingId(null);
      } else {
        await vendorsAPI.create(formData);
      }
      setFormData({ name: '', email: '', phone: '', address: '' });
      setShowForm(false);
      fetchVendors();
    } catch (err) {
      setError('Failed to save vendor');
      console.error(err);
    }
  };

  const handleEdit = (vendor) => {
    setFormData(vendor);
    setEditingId(vendor.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await vendorsAPI.delete(id);
        fetchVendors();
      } catch (err) {
        setError('Failed to delete vendor');
      }
    }
  };

  if (loading) return <div className="loading">Loading vendors...</div>;

  return (
    <div className="vendors-container">
      <h1>🏢 Vendors Management</h1>
      
      {error && <div className="error">{error}</div>}

      <button className="btn-primary" onClick={() => {
        setShowForm(!showForm);
        setEditingId(null);
        setFormData({ name: '', email: '', phone: '', address: '' });
      }}>
        {showForm ? '✕ Close Form' : '➕ Add Vendor'}
      </button>

      {showForm && (
        <form className="vendor-form" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit Vendor' : 'Add New Vendor'}</h3>
          
          <input
            type="text"
            name="name"
            placeholder="Vendor Name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          
          <input
            type="tel"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
          />
          
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleInputChange}
            required
          />
          
          <button type="submit" className="btn-submit">
            {editingId ? 'Update Vendor' : 'Create Vendor'}
          </button>
        </form>
      )}

      <div className="vendors-grid">
        {vendors.map(vendor => (
          <div key={vendor.id} className="vendor-card">
            <h3>{vendor.name}</h3>
            <p><strong>Email:</strong> {vendor.email}</p>
            <p><strong>Phone:</strong> {vendor.phone}</p>
            <p><strong>Address:</strong> {vendor.address}</p>
            <div className="vendor-actions">
              <button className="btn-edit" onClick={() => handleEdit(vendor)}>Edit</button>
              <button className="btn-delete" onClick={() => handleDelete(vendor.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}