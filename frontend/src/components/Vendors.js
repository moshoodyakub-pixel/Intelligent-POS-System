import React, { useState, useEffect, useMemo } from 'react';
import { useTable } from 'react-table';
import Modal from 'react-modal';
import { vendorsAPI } from '../services/api';
import './Vendors.css';

Modal.setAppElement('#root');

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
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
      } else {
        await vendorsAPI.create(formData);
      }
      closeModal();
      fetchVendors();
    } catch (err) {
      setError('Failed to save vendor');
      console.error(err);
    }
  };

  const openModal = (vendor = null) => {
    if (vendor) {
      setFormData(vendor);
      setEditingId(vendor.id);
    } else {
      setFormData({ name: '', email: '', phone: '', address: '' });
      setEditingId(null);
    }
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', address: '' });
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

  const columns = useMemo(() => [
    { Header: 'Name', accessor: 'name' },
    { Header: 'Email', accessor: 'email' },
    { Header: 'Phone', accessor: 'phone' },
    { Header: 'Address', accessor: 'address' },
    {
      Header: 'Actions',
      Cell: ({ row }) => (
        <div className="actions">
          <button className="btn-edit" onClick={() => openModal(row.original)}>Edit</button>
          <button className="btn-delete" onClick={() => handleDelete(row.original.id)}>Delete</button>
        </div>
      ),
    },
  ], []);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data: vendors });

  if (loading) return <div className="loading">Loading vendors...</div>;

  return (
    <div className="vendors-container">
      <h1>🏢 Vendors Management</h1>
      
      {error && <div className="error">{error}</div>}

      <button className="btn-primary" onClick={() => openModal()}>
        ➕ Add Vendor
      </button>

      <table {...getTableProps()} className="vendors-table">
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => (
                  <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Vendor Form"
        className="modal"
        overlayClassName="overlay"
      >
        <h2>{editingId ? 'Edit Vendor' : 'Add New Vendor'}</h2>
        <form onSubmit={handleSubmit}>
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
          <div className="modal-actions">
            <button type="submit" className="btn-submit">
              {editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" className="btn-cancel" onClick={closeModal}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
