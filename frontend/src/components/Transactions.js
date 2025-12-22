import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTable } from 'react-table';
import Modal from 'react-modal';
import { transactionsAPI, productsAPI, vendorsAPI } from '../services/api';
import './Transactions.css';

Modal.setAppElement('#root');

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
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
      closeModal();
      fetchData();
    } catch (err) {
      setError('Failed to create transaction');
      console.error(err);
    }
  };

  const openModal = () => {
    setFormData({ vendor_id: '', product_id: '', quantity: '', total_price: '' });
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await transactionsAPI.delete(id);
        fetchData();
      } catch (err) {
        setError('Failed to delete transaction');
      }
    }
  }, []);

  const handleViewReceipt = useCallback(async (id) => {
    try {
      const response = await transactionsAPI.getReceiptData(id);
      setReceiptData(response.data);
      setReceiptModalOpen(true);
    } catch (err) {
      console.error('Error fetching receipt:', err);
      setError('Failed to load receipt');
    }
  }, []);

  const handleDownloadReceipt = useCallback(async (id) => {
    try {
      const blob = await transactionsAPI.downloadReceipt(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading receipt:', err);
      setError('Failed to download receipt');
    }
  }, []);

  const handlePrintReceipt = useCallback(() => {
    window.print();
  }, []);

  const getProductName = useCallback((id) => products.find(p => p.id === id)?.name || 'Unknown', [products]);
  const getVendorName = useCallback((id) => vendors.find(v => v.id === id)?.name || 'Unknown', [vendors]);

  const columns = useMemo(() => [
    { Header: 'ID', accessor: 'id' },
    { Header: 'Vendor', accessor: 'vendor_id', Cell: ({ value }) => getVendorName(value) },
    { Header: 'Product', accessor: 'product_id', Cell: ({ value }) => getProductName(value) },
    { Header: 'Quantity', accessor: 'quantity' },
    { Header: 'Total Price', accessor: 'total_price', Cell: ({ value }) => `$${value}` },
    { Header: 'Date', accessor: 'transaction_date', Cell: ({ value }) => new Date(value).toLocaleDateString() },
    {
      Header: 'Actions',
      Cell: ({ row }) => (
        <div className="action-buttons">
          <button className="btn-receipt" onClick={() => handleViewReceipt(row.original.id)} title="View Receipt">
            🧾
          </button>
          <button className="btn-download" onClick={() => handleDownloadReceipt(row.original.id)} title="Download PDF">
            📥
          </button>
          <button className="btn-delete" onClick={() => handleDelete(row.original.id)} title="Delete">
            🗑️
          </button>
        </div>
      ),
    },
  ], [getVendorName, getProductName, handleDelete, handleViewReceipt, handleDownloadReceipt]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data: transactions });

  if (loading) return <div className="loading">Loading transactions...</div>;

  return (
    <div className="transactions-container">
      <h1>💰 Transactions</h1>
      
      {error && <div className="error">{error}</div>}

      <button className="btn-primary" onClick={openModal}>
        ➕ New Transaction
      </button>

      <table {...getTableProps()} className="transactions-table">
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
        contentLabel="Transaction Form"
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Create New Transaction</h2>
        <form onSubmit={handleSubmit}>
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
          <div className="modal-actions">
            <button type="submit" className="btn-submit">Create</button>
            <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        isOpen={receiptModalOpen}
        onRequestClose={() => setReceiptModalOpen(false)}
        contentLabel="Receipt"
        className="receipt-modal"
        overlayClassName="overlay"
      >
        {receiptData && (
          <div className="receipt-content">
            <div className="receipt-header">
              <h2>🎯 Intelligent POS System</h2>
              <p className="receipt-title">SALES RECEIPT</p>
            </div>
            
            <div className="receipt-divider"></div>
            
            <div className="receipt-details">
              <p><strong>Receipt #:</strong> {receiptData.receipt_number}</p>
              <p><strong>Date:</strong> {new Date(receiptData.transaction_date).toLocaleString()}</p>
              <p><strong>Vendor:</strong> {receiptData.vendor?.name}</p>
            </div>
            
            <div className="receipt-divider"></div>
            
            <div className="receipt-items">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{receiptData.item?.name}</td>
                    <td>{receiptData.item?.quantity}</td>
                    <td>${receiptData.item?.unit_price?.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="receipt-divider"></div>
            
            <div className="receipt-total">
              <strong>TOTAL: ${receiptData.total_price?.toFixed(2)}</strong>
            </div>
            
            <div className="receipt-divider"></div>
            
            <div className="receipt-footer">
              <p>Thank you for your purchase!</p>
              <p className="company-info">{receiptData.company?.name}</p>
              <p className="company-info">{receiptData.company?.website}</p>
            </div>
            
            <div className="receipt-actions">
              <button className="btn-print" onClick={handlePrintReceipt}>🖨️ Print</button>
              <button 
                className="btn-download-pdf" 
                onClick={() => handleDownloadReceipt(receiptData.id)}
              >
                📥 Download PDF
              </button>
              <button className="btn-close" onClick={() => setReceiptModalOpen(false)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
