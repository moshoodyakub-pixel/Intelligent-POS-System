import React, { useState, useEffect } from 'react';
import { productsAPI, vendorsAPI } from '../services/api';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Modal, Box, TextField, Select, MenuItem, FormControl, InputLabel, CircularProgress } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [open, setOpen] = useState(false);
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

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setFormData({ name: '', description: '', price: '', quantity: '', vendor_id: '' });
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
      } else {
        await productsAPI.create(formData);
      }
      handleClose();
      fetchData();
    } catch (err) {
      setError('Failed to save product');
      console.error(err);
    }
  };

  const handleEdit = (product) => {
    setFormData(product);
    setEditingId(product.id);
    handleOpen();
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

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'description', headerName: 'Description', width: 250 },
    { field: 'price', headerName: 'Price', type: 'number', width: 110 },
    { field: 'quantity', headerName: 'Quantity', type: 'number', width: 110 },
    {
      field: 'vendor_id',
      headerName: 'Vendor',
      width: 150,
      valueGetter: (params) => {
        const vendor = vendors.find(v => v.id === params.row.vendor_id);
        return vendor ? vendor.name : 'Unknown';
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      width: 150,
      renderCell: (params) => (
        <>
          <IconButton onClick={() => handleEdit(params.row)}>
            <Edit />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row.id)}>
            <Delete />
          </IconButton>
        </>
      ),
    },
  ];

  if (loading) return <CircularProgress />;

  return (
    <div style={{ height: 400, width: '100%' }}>
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={handleOpen}
        sx={{ mb: 2 }}
      >
        Add Product
      </Button>
      <DataGrid
        rows={products}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
        checkboxSelection
        disableSelectionOnClick
      />
      <Modal
        open={open}
        onClose={handleClose}
      >
        <Box sx={style}>
          <Typography variant="h6" component="h2">
            {editingId ? 'Edit Product' : 'Add New Product'}
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Product Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Vendor</InputLabel>
              <Select
                name="vendor_id"
                value={formData.vendor_id}
                onChange={handleInputChange}
                required
              >
                {vendors.map(vendor => (
                  <MenuItem key={vendor.id} value={vendor.id}>{vendor.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button type="submit" variant="contained">
              {editingId ? 'Update' : 'Create'}
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}
