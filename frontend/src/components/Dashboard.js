import React, { useState, useEffect } from 'react';
import { productsAPI, vendorsAPI, transactionsAPI } from '../services/api';
import { Grid, Card, CardContent, Typography, CircularProgress, Box } from '@mui/material';
import { Store, Inventory, Receipt } from '@mui/icons-material';

export default function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    vendors: 0,
    transactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [products, vendors, transactions] = await Promise.all([
        productsAPI.getAll(),
        vendorsAPI.getAll(),
        transactionsAPI.getAll(),
      ]);

      setStats({
        products: products.data.length,
        vendors: vendors.data.length,
        transactions: transactions.data.length,
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <CircularProgress />
    </Box>
  );
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Inventory sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography variant="h5" component="div">
                {stats.products}
              </Typography>
              <Typography sx={{ mb: 1.5 }} color="text.secondary">
                Total Products
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Store sx={{ fontSize: 40, color: 'secondary.main' }} />
              <Typography variant="h5" component="div">
                {stats.vendors}
              </Typography>
              <Typography sx={{ mb: 1.5 }} color="text.secondary">
                Active Vendors
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Receipt sx={{ fontSize: 40, color: 'error.main' }} />
              <Typography variant="h5" component="div">
                {stats.transactions}
              </Typography>
              <Typography sx={{ mb: 1.5 }} color="text.secondary">
                Total Transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
