# API Documentation

## Overview

The Intelligent POS System provides a comprehensive RESTful API for managing point-of-sale operations, including products, vendors, transactions, sales forecasting, and analytics.

**Base URL:** `http://localhost:8000/api`

**Interactive Documentation:**
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Authentication

The API uses JWT (JSON Web Token) authentication.

### Register a New User

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "full_name": "John Doe"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/x-www-form-urlencoded

username=john_doe&password=securepassword123
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Using the Token

Include the token in the Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Products API

### List Products

```http
GET /api/products/
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 1 | Page number |
| page_size | int | 10 | Items per page (max: 100) |
| search | string | - | Search in name and description |
| vendor_id | int | - | Filter by vendor ID |
| min_price | float | - | Minimum price filter |
| max_price | float | - | Maximum price filter |
| min_quantity | int | - | Minimum quantity filter |
| sort_by | string | - | Sort field (name, price, quantity, created_at) |
| sort_order | string | asc | Sort direction (asc, desc) |

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Widget A",
      "description": "A useful widget",
      "price": 29.99,
      "quantity": 100,
      "vendor_id": 1,
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "page_size": 10,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

### Get Low Stock Products

```http
GET /api/products/low-stock?threshold=10
```

### Create Product

```http
POST /api/products/
Content-Type: application/json

{
  "name": "Widget A",
  "description": "A useful widget",
  "price": 29.99,
  "quantity": 100,
  "vendor_id": 1
}
```

### Get Product by ID

```http
GET /api/products/{product_id}
```

### Update Product

```http
PUT /api/products/{product_id}
Content-Type: application/json

{
  "price": 34.99,
  "quantity": 150
}
```

### Delete Product

```http
DELETE /api/products/{product_id}
```

---

## Vendors API

### List Vendors

```http
GET /api/vendors/
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 1 | Page number |
| page_size | int | 10 | Items per page (max: 100) |
| search | string | - | Search in name, email, address |
| sort_by | string | - | Sort field (name, email, created_at) |
| sort_order | string | asc | Sort direction (asc, desc) |

### Create Vendor

```http
POST /api/vendors/
Content-Type: application/json

{
  "name": "Acme Corp",
  "email": "contact@acme.com",
  "phone": "555-0123",
  "address": "123 Business St"
}
```

### Get Vendor by ID

```http
GET /api/vendors/{vendor_id}
```

### Update Vendor

```http
PUT /api/vendors/{vendor_id}
Content-Type: application/json

{
  "phone": "555-9999"
}
```

### Delete Vendor

```http
DELETE /api/vendors/{vendor_id}
```

---

## Transactions API

### List Transactions

```http
GET /api/transactions/
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 1 | Page number |
| page_size | int | 10 | Items per page (max: 100) |
| vendor_id | int | - | Filter by vendor ID |
| product_id | int | - | Filter by product ID |
| min_price | float | - | Minimum total price |
| max_price | float | - | Maximum total price |
| date_from | datetime | - | Start date filter |
| date_to | datetime | - | End date filter |
| sort_by | string | transaction_date | Sort field |
| sort_order | string | desc | Sort direction |

### Get Recent Transactions

```http
GET /api/transactions/recent?days=7&limit=10
```

### Create Transaction

```http
POST /api/transactions/
Content-Type: application/json

{
  "vendor_id": 1,
  "product_id": 1,
  "quantity": 5,
  "total_price": 149.95
}
```

**Note:** Creating a transaction automatically decrements the product's stock.

### Get Transaction by ID

```http
GET /api/transactions/{transaction_id}
```

### Update Transaction

```http
PUT /api/transactions/{transaction_id}
Content-Type: application/json

{
  "quantity": 10
}
```

### Delete Transaction

```http
DELETE /api/transactions/{transaction_id}
```

---

## Forecasting API

### List Forecasts

```http
GET /api/forecasting/sales
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 1 | Page number |
| page_size | int | 10 | Items per page |
| product_id | int | - | Filter by product ID |

### Generate ARIMA Forecast

Generate an AI-powered sales forecast using ARIMA (AutoRegressive Integrated Moving Average) model.

```http
POST /api/forecasting/arima
Content-Type: application/json

{
  "product_id": 1,
  "periods": 14,
  "confidence_level": 0.95
}
```

**Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| product_id | int | null | Product to forecast (null for total sales) |
| periods | int | 7 | Number of days to forecast (1-365) |
| confidence_level | float | 0.95 | Confidence level for intervals (0.5-0.99) |

**Response:**
```json
{
  "product_id": 1,
  "product_name": "Widget A",
  "forecast_generated_at": "2025-01-15T10:30:00Z",
  "periods": 14,
  "historical_data": [
    {"date": "2025-01-01", "value": 1250.50},
    {"date": "2025-01-02", "value": 1189.25}
  ],
  "forecast_data": [
    {
      "date": "2025-01-16",
      "predicted_value": 1305.75,
      "lower_bound": 1150.00,
      "upper_bound": 1461.50
    }
  ],
  "model_metrics": {
    "model_type": "ARIMA",
    "order": [1, 1, 1],
    "aic": 145.23,
    "bic": 149.67,
    "data_points": 30
  }
}
```

### Create Manual Forecast

```http
POST /api/forecasting/sales
Content-Type: application/json

{
  "product_id": 1,
  "forecasted_quantity": 150,
  "forecasted_price": 89.99
}
```

---

## Reports & Analytics API

### Sales Report

```http
GET /api/reports/sales?days=30
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| days | int | 30 | Days to include in report (1-365) |
| vendor_id | int | - | Filter by vendor ID |

**Response:**
```json
{
  "total_revenue": 45678.90,
  "total_transactions": 523,
  "average_transaction_value": 87.34,
  "top_products": [
    {
      "product_id": 1,
      "product_name": "Widget A",
      "total_quantity": 245,
      "total_revenue": 7339.55
    }
  ],
  "sales_by_vendor": [
    {
      "vendor_id": 1,
      "vendor_name": "Acme Corp",
      "total_transactions": 156,
      "total_revenue": 15678.90
    }
  ],
  "sales_trend": [
    {"date": "2025-01-01", "revenue": 1250.50, "transactions": 15}
  ],
  "period_start": "2024-12-15T00:00:00Z",
  "period_end": "2025-01-15T00:00:00Z"
}
```

### Inventory Alerts

```http
GET /api/reports/inventory-alerts?critical_threshold=5&warning_threshold=15
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| critical_threshold | int | 5 | Critical stock level |
| warning_threshold | int | 15 | Warning stock level |
| low_threshold | int | 25 | Low stock level |

**Response:**
```json
{
  "alerts": [
    {
      "product_id": 3,
      "product_name": "Widget C",
      "current_quantity": 2,
      "threshold": 25,
      "vendor_id": 1,
      "vendor_name": "Acme Corp",
      "alert_level": "critical"
    }
  ],
  "total_alerts": 5,
  "critical_count": 1,
  "warning_count": 2,
  "low_count": 2
}
```

### Dashboard Statistics

```http
GET /api/reports/dashboard-stats?days=7
```

**Response:**
```json
{
  "total_products": 150,
  "total_vendors": 12,
  "total_transactions": 2345,
  "total_revenue": 125678.90,
  "low_stock_count": 8,
  "recent_transactions": [...],
  "revenue_trend": [
    {"date": "2025-01-10", "revenue": 1567.80}
  ]
}
```

### Product Analytics

```http
GET /api/reports/analytics/product/{product_id}?days=30
```

---

## Rate Limiting

The API implements rate limiting to ensure fair usage:
- **Limit:** 100 requests per minute per IP
- **Headers:**
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in window
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

When rate limited, you'll receive:
```json
{
  "detail": "Rate limit exceeded. Please try again later.",
  "retry_after": 60
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "detail": "Error message description"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 422 | Validation Error - Invalid data format |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Pagination

All list endpoints support pagination with the following response format:

```json
{
  "items": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "page_size": 10,
    "total_pages": 10,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## SDKs and Client Libraries

For TypeScript/JavaScript applications, you can use the provided API client in `frontend/src/services/api.js` as a reference implementation.

Example usage:
```javascript
import { productsAPI, transactionsAPI } from './services/api';

// Get products with pagination
const response = await productsAPI.getAll({ page: 1, page_size: 20 });
console.log(response.data.items);
console.log(response.data.pagination);

// Search products
const searchResults = await productsAPI.search('widget');
```
