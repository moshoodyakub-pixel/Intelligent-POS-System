import React, { useState, useEffect, useCallback } from 'react';
import { productsAPI, vendorsAPI } from '../services/api';
import './Products.css';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
    total_pages: 0,
  });

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    vendor_id: '',
    min_price: '',
    max_price: '',
    sort_by: 'name',
    sort_order: 'asc',
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    vendor_id: '',
  });

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [productsRes, vendorsRes] = await Promise.all([
        productsAPI.getAll({
          page: pagination.page,
          page_size: pagination.page_size,
          search: filters.search || undefined,
          vendor_id: filters.vendor_id || undefined,
          min_price: filters.min_price || undefined,
          max_price: filters.max_price || undefined,
          sort_by: filters.sort_by || undefined,
          sort_order: filters.sort_order || undefined,
        }),
        vendorsAPI.getAll({ page_size: 100 }),
      ]);
      
      setProducts(productsRes.data.items || []);
      setPagination(prev => ({
        ...prev,
        ...productsRes.data.pagination,
      }));
      setVendors(vendorsRes.data.items || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load products');
      showNotification('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.page_size, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchData();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
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
        showNotification('Product updated successfully', 'success');
        setEditingId(null);
      } else {
        await productsAPI.create(formData);
        showNotification('Product created successfully', 'success');
      }
      setFormData({ name: '', description: '', price: '', quantity: '', vendor_id: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to save product';
      setError(message);
      showNotification(message, 'error');
    }
  };

  const handleEdit = (product) => {
    setFormData(product);
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.delete(id);
        showNotification('Product deleted successfully', 'success');
        fetchData();
      } catch (err) {
        const message = err.response?.data?.detail || 'Failed to delete product';
        showNotification(message, 'error');
      }
    }
  };

  const getVendorName = (vendorId) => {
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor ? vendor.name : 'Unknown';
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className="products-container">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
          <button className="notification-close" onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      <div className="page-header">
        <h1>📦 Products Management</h1>
        <button className="btn-primary" onClick={() => {
          setShowForm(!showForm);
          setEditingId(null);
          setFormData({ name: '', description: '', price: '', quantity: '', vendor_id: '' });
        }}>
          {showForm ? '✕ Close Form' : '➕ Add Product'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            name="search"
            placeholder="🔍 Search products..."
            value={filters.search}
            onChange={handleFilterChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn-search" onClick={handleSearch}>Search</button>
        </div>
        
        <div className="filters-row">
          <select
            name="vendor_id"
            value={filters.vendor_id}
            onChange={handleFilterChange}
          >
            <option value="">All Vendors</option>
            {vendors.map(vendor => (
              <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
            ))}
          </select>
          
          <input
            type="number"
            name="min_price"
            placeholder="Min Price"
            value={filters.min_price}
            onChange={handleFilterChange}
          />
          
          <input
            type="number"
            name="max_price"
            placeholder="Max Price"
            value={filters.max_price}
            onChange={handleFilterChange}
          />
          
          <select
            name="sort_by"
            value={filters.sort_by}
            onChange={handleFilterChange}
          >
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
            <option value="quantity">Sort by Quantity</option>
            <option value="created_at">Sort by Date</option>
          </select>
          
          <select
            name="sort_order"
            value={filters.sort_order}
            onChange={handleFilterChange}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
          
          <button className="btn-filter" onClick={handleSearch}>Apply Filters</button>
        </div>
      </div>

      {showForm && (
        <form className="product-form" onSubmit={handleSubmit}>
          <h3>{editingId ? '✏️ Edit Product' : '➕ Add New Product'}</h3>

          <div className="form-grid">
            <input
              type="text"
              name="name"
              placeholder="Product Name"
              value={formData.name}
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

            <input
              type="number"
              name="price"
              placeholder="Price"
              value={formData.price}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              required
            />

            <input
              type="number"
              name="quantity"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="0"
              required
            />
          </div>

          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
          />

          <div className="form-actions">
            <button type="submit" className="btn-submit">
              {editingId ? '💾 Update Product' : '✅ Create Product'}
            </button>
            <button type="button" className="btn-cancel" onClick={() => {
              setShowForm(false);
              setEditingId(null);
            }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
      ) : (
        <>
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
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="no-data">No products found</td>
                  </tr>
                ) : (
                  products.map(product => (
                    <tr key={product.id} className={product.quantity <= 10 ? 'low-stock' : ''}>
                      <td>{product.id}</td>
                      <td>
                        <span className="product-name">{product.name}</span>
                        {product.quantity <= 5 && <span className="badge critical">Low Stock</span>}
                      </td>
                      <td className="description-cell">{product.description}</td>
                      <td className="price-cell">${product.price?.toFixed(2)}</td>
                      <td className={`quantity-cell ${product.quantity <= 10 ? 'low' : ''}`}>
                        {product.quantity}
                      </td>
                      <td>{getVendorName(product.vendor_id)}</td>
                      <td className="actions-cell">
                        <button className="btn-edit" onClick={() => handleEdit(product)}>Edit</button>
                        <button className="btn-delete" onClick={() => handleDelete(product.id)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-btn"
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
              >
                ⏮ First
              </button>
              <button 
                className="pagination-btn"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.has_prev}
              >
                ◀ Prev
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.total_pages} ({pagination.total} items)
              </span>
              <button 
                className="pagination-btn"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.has_next}
              >
                Next ▶
              </button>
              <button 
                className="pagination-btn"
                onClick={() => handlePageChange(pagination.total_pages)}
                disabled={pagination.page === pagination.total_pages}
              >
                Last ⏭
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}