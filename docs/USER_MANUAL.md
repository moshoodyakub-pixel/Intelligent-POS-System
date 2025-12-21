# User Manual - Intelligent POS System

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Products Management](#products-management)
4. [Vendors Management](#vendors-management)
5. [Transactions](#transactions)
6. [Sales Forecasting](#sales-forecasting)
7. [Reports & Analytics](#reports--analytics)
8. [User Account](#user-account)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Logging In

1. Navigate to the POS System URL (default: `http://localhost:3000`)
2. Enter your username and password
3. Click "Login"

If you don't have an account, click "Register" to create one.

### First-Time Setup

1. **Add Vendors** - Start by adding your suppliers/vendors
2. **Add Products** - Create products associated with vendors
3. **Process Transactions** - Begin recording sales

---

## Dashboard

The Dashboard provides a quick overview of your business metrics:

### Statistics Cards

- **📦 Products** - Total number of products in inventory
- **🏢 Vendors** - Number of active vendors
- **💰 Transactions** - Total transactions recorded
- **📈 Forecasts** - Number of sales forecasts generated

### Quick Actions

From the Dashboard, you can quickly navigate to:
- View recent transactions
- Check low stock alerts
- Access sales reports

---

## Products Management

### Viewing Products

1. Click "Products" in the sidebar
2. View the product list with pagination
3. Use the search bar to find specific products
4. Apply filters:
   - By vendor
   - By price range
   - By quantity

### Adding a New Product

1. Click "➕ Add Product"
2. Fill in the product details:
   - **Name** - Product name (required)
   - **Description** - Product description
   - **Price** - Unit price (required)
   - **Quantity** - Initial stock quantity (required)
   - **Vendor** - Select the vendor (required)
3. Click "Create Product"

### Editing a Product

1. Find the product in the list
2. Click "Edit"
3. Modify the desired fields
4. Click "Update Product"

### Deleting a Product

1. Find the product in the list
2. Click "Delete"
3. Confirm the deletion

> ⚠️ **Warning:** Deleting a product is permanent and cannot be undone.

### Low Stock Alerts

Products with low stock are automatically highlighted. To view all low stock items:
1. Go to Products
2. Set a minimum quantity filter, or
3. Check the Reports section for inventory alerts

---

## Vendors Management

### Viewing Vendors

1. Click "Vendors" in the sidebar
2. View the vendor list
3. Use search to find vendors by name, email, or address

### Adding a New Vendor

1. Click "➕ Add Vendor"
2. Fill in the vendor details:
   - **Name** - Vendor/Company name (required)
   - **Email** - Contact email (required, must be unique)
   - **Phone** - Contact phone number
   - **Address** - Business address
3. Click "Create Vendor"

### Editing a Vendor

1. Find the vendor in the list
2. Click "Edit"
3. Modify the desired fields
4. Click "Update Vendor"

### Deleting a Vendor

1. Find the vendor in the list
2. Click "Delete"
3. Confirm the deletion

> ⚠️ **Note:** You cannot delete a vendor that has associated products. Remove or reassign products first.

---

## Transactions

### Viewing Transactions

1. Click "Transactions" in the sidebar
2. View the transaction list (sorted by newest first)
3. Filter transactions by:
   - Vendor
   - Product
   - Date range
   - Price range

### Creating a New Transaction

1. Click "➕ New Transaction"
2. Select the vendor
3. Select the product
4. Enter the quantity
5. Enter the total price
6. Click "Create"

> 📝 **Note:** Creating a transaction automatically reduces the product's stock quantity.

### Transaction Details

Each transaction shows:
- Transaction ID
- Vendor name
- Product name
- Quantity sold
- Total price
- Transaction date

---

## Sales Forecasting

The Forecasting module uses AI-powered ARIMA (AutoRegressive Integrated Moving Average) models to predict future sales.

### Generating a Forecast

1. Click "Forecasting" in the sidebar
2. Click "Generate Forecast"
3. Configure the forecast:
   - **Product** - Select a specific product or forecast total sales
   - **Periods** - Number of days to forecast (1-365)
   - **Confidence Level** - Prediction interval confidence (0.5-0.99)
4. Click "Generate"

### Understanding Forecast Results

The forecast visualization shows:
- **Historical Data** - Past sales data (blue line)
- **Predicted Values** - Forecasted values (green line)
- **Confidence Interval** - Upper and lower bounds (shaded area)

### Model Metrics

- **Model Type** - ARIMA or fallback method
- **AIC/BIC** - Model quality scores (lower is better)
- **Data Points** - Amount of historical data used

### Manual Forecasts

You can also create manual forecasts:
1. Click "➕ New Forecast"
2. Select a product
3. Enter forecasted quantity
4. Enter forecasted price
5. Click "Create Forecast"

---

## Reports & Analytics

### Sales Report

Access comprehensive sales reports:

1. Go to Dashboard or Reports section
2. Select the time period (7, 30, 90 days)
3. View:
   - Total revenue
   - Transaction count
   - Average transaction value
   - Top-selling products
   - Sales by vendor
   - Daily sales trend

### Inventory Alerts

Monitor stock levels:

1. Access the inventory alerts
2. View products categorized by alert level:
   - **Critical** (red) - Quantity ≤ 5
   - **Warning** (orange) - Quantity ≤ 15
   - **Low** (yellow) - Quantity ≤ 25

### Product Analytics

Detailed analysis for individual products:

1. Go to Products
2. Click on a product
3. View Analytics, including:
   - Sales summary
   - Daily sales trend
   - Stock forecast
   - Reorder recommendations

---

## User Account

### Profile Management

1. Click on your username in the header
2. Access profile settings
3. Update your information:
   - Full name
   - Email
   - Password

### User Roles

- **Admin** - Full access to all features
- **Staff** - Limited access (cannot manage users)

### Logging Out

1. Click "Logout" in the header
2. You'll be redirected to the login page

---

## Troubleshooting

### Common Issues

#### "Login Failed"
- Verify your username and password
- Check if your account is active
- Contact an admin if issues persist

#### "Failed to Load Data"
- Check your internet connection
- Verify the API server is running
- Refresh the page

#### "Rate Limit Exceeded"
- Wait a few seconds before retrying
- The API allows 100 requests per minute

#### "Product Not Found"
- The product may have been deleted
- Refresh the page to update the list

#### "Insufficient Stock"
- Cannot create a transaction for more items than available
- Update product quantity first or reduce transaction quantity

### Getting Help

For additional support:
1. Check the API Documentation
2. Review error messages for specific details
3. Contact your system administrator

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + /` | Open search |
| `Esc` | Close modal/form |
| `Enter` | Submit form |

---

## Best Practices

1. **Regular Backups** - Ensure database backups are configured
2. **Stock Monitoring** - Review inventory alerts daily
3. **Forecasting** - Generate forecasts weekly for better planning
4. **Data Accuracy** - Verify transaction details before submission
5. **Security** - Log out when leaving the workstation

---

*Last Updated: December 2025*
*Version: 1.0.0*
