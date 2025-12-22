# Release Notes - v0.9.0

**Release Date:** December 22, 2025

This release introduces ARIMA-based sales forecasting, JWT authentication with role-based access control, and significant UI improvements.

## ✨ New Features

- **ARIMA Forecasting:** Implemented ARIMA-based sales prediction using statsmodels with confidence intervals. Includes automatic fallback to moving average when historical data is insufficient.
- **Forecasting Dashboard:** Bar chart visualization with historical data vs forecast comparison, confidence range display, and detailed forecast table with predictions.
- **JWT Authentication:** Secure user registration and login endpoints (`/api/auth/register`, `/api/auth/login`) with bcrypt password hashing and token-based session management.
- **Role-Based Access Control (RBAC):** Admin and Staff roles with endpoint protection based on user permissions.
- **Frontend Auth Integration:** Login/Register pages with form validation, protected routes via AuthContext, and localStorage token persistence.
- **Rate Limiting:** Middleware protecting the API with 100 requests per minute per client limit.
- **Prometheus Metrics:** `/metrics` endpoint for monitoring request counts, latency histograms, and error rates.
- **Reports API:** New endpoints for sales reports, inventory alerts, dashboard statistics, and product analytics.
- **Loading States:** Spinner components implemented across all frontend pages.
- **Toast Notifications:** User feedback notification system in Forecasting and other components.

## 📈 Improvements

- **Pagination Support:** Full pagination with `page`, `page_size`, and response metadata across all list endpoints.
- **Search & Filtering:** Enhanced search capabilities for products and vendors with filter support.
- **Sorting:** Added `sort_by` and `sort_order` parameters to list endpoints.
- **Environment Configuration:** Sensible defaults in `config.py` with environment variable overrides.
- **CORS Configuration:** Configurable via `CORS_ORIGINS` environment variable for production security.

## 🐛 Bug Fixes

- **Transaction Delete Endpoint:** Resolved issue with transaction deletion not working correctly.
- **Error Handling:** Improved HTTPException handling throughout the backend for better error messages.

## 🚀 Deployment

To tag and release this version:

```bash
git tag -a v0.9.0 -m "release: v0.9.0 - ARIMA forecasting, auth, UI improvements"
git push origin v0.9.0
```

For production deployment, follow the checklist in `DEPLOYMENT.md`.

## ⚠️ Known Issues

- Dev server vulnerabilities (Moderate npm audit findings) - These affect development only and are not present in production builds.
