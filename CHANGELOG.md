# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **CI/CD Workflow**: Fixed incorrect secret checking syntax in `staging-deploy.yml` workflow
- **Frontend Dependencies**: Updated `package-lock.json` to resolve `npm ci` failures due to missing dependencies
- **CI Triggers**: Added push trigger to main branch for CI workflow to ensure tests run on direct pushes

## [0.9.0] - 2025-12-22

### Added
- **ARIMA Forecasting**: Implemented ARIMA-based sales prediction using statsmodels with confidence intervals and fallback to moving average when data is insufficient.
- **Forecasting Dashboard**: Bar chart visualization with historical data vs forecast, confidence range display, and detailed forecast table.
- **JWT Authentication**: User registration and login endpoints (`/api/auth/register`, `/api/auth/login`) with password hashing via bcrypt.
- **Role-Based Access Control (RBAC)**: Admin and Staff roles with endpoint protection based on user permissions.
- **Frontend Auth Integration**: Login/Register pages with form validation, protected routes via AuthContext, and token persistence.
- **Rate Limiting**: Middleware limiting requests to 100 per minute per client.
- **Prometheus Metrics**: `/metrics` endpoint exposing request counts, latency histograms, and error rates.
- **Reports API**: Sales reports, inventory alerts, dashboard stats, and product analytics endpoints.
- **Loading States**: Loading spinners implemented across all frontend components.
- **Toast Notifications**: Notification system for user feedback in Forecasting and other components.

### Changed
- **Pagination Support**: Full pagination with `page`, `page_size`, and response metadata across all list endpoints.
- **Search & Filtering**: Enhanced search for products and vendors with filter support.
- **Sorting**: Added `sort_by` and `sort_order` parameters to list endpoints.
- **Environment Configuration**: Sensible defaults in `config.py` with environment variable overrides.
- **CORS Configuration**: Configurable via `CORS_ORIGINS` environment variable.

### Fixed
- **Transaction Delete Endpoint**: Resolved issue with transaction deletion.
- **Error Handling**: Improved HTTPException handling throughout the backend.

## [1.0.0] - 2025-11-26

### Fixed
- Resolved persistent frontend test failures by implementing a robust Jest configuration.
- Corrected the Jest `transformIgnorePatterns` to properly handle ES Modules.
- Replaced unsafe global mocks in `setupTests.js` with scoped mocks in the relevant test file.

### Added
- A custom Jest configuration in `package.json` to handle module mapping and transformations.
- Mocks for `react-router-dom` and static assets.
- `identity-obj-proxy` as a dev dependency for CSS module mocking.
- A weekly security audit GitHub Actions workflow.

### Changed
- Updated the `ci.yml` workflow to use `npm ci` for faster, more reliable builds.
- Removed `continue-on-error: true` from the frontend test job in the CI workflow.

### Removed
- Redundant `RELEASE_NOTES.md` file to standardize on `CHANGELOG.md`.
