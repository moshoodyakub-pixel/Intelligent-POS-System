# Follow-up Issues

This document contains the content for follow-up issues to be created in the issue tracker.

---

## Status of Existing GitHub Issues and PRs

### GitHub Issue #1: API and Server Endpoint Verification Checklist

**Status:** OPEN (as of 2025-12-22)

**Summary:** Ensure all API endpoints in the backend are correctly routed and accessible. The issue originated due to misalignment between nginx proxy_pass and backend FastAPI router prefixes.

**Current State:**
- Backend health endpoint exists at `/health` in `main.py` (returns `{"status": "healthy", ...}`)
- Routers for products, vendors, transactions, forecasting, auth, and reports are included in `main.py`
- A separate `/api/health` endpoint exists in `routes/health.py` but is not included in the main app router
- DEPLOYMENT.md includes health check verification steps

**Recommendation:** Keep open until full verification is done in production/staging. Consider closing after confirming all endpoints work correctly post-deployment.

---

### GitHub PR #2: Add Health Check Endpoint and Include Health Router

**Status:** OPEN (as of 2025-12-22), appears stale/superseded

**Summary:** Added health check endpoint for application status.

**Current State:**
- The `/health` endpoint already exists directly in `main.py` (lines 96-103)
- The PR's `routes/health.py` adds an `/api/health` endpoint with different response format
- The health router in `routes/health.py` is NOT included in `main.py`'s router imports

**Recommendation:** This PR appears to be superseded by the existing `/health` endpoint in `main.py`. Consider closing this PR as the functionality already exists, or merge if the `/api/health` prefix is specifically needed for nginx proxy routing.

---

### GitHub PR #19: Improve Deployment and Verification Guide

**Status:** OPEN (as of 2025-12-22)

**Summary:** Enhances `DEPLOYMENT.md` with improvements including:
- Added "Secrets & Permissions" section
- Clarified expected HTTP status and JSON response for health check
- Included example for running automated tests locally
- Added rollback tag identification note
- Added link to `AUDIT-2025-11-23.md`

**Recommendation:** Review and merge if changes look good. The documentation improvements appear valuable for operators.

---

## Issues to Create

### Issue 1: Remove Temporary Mock for `react-router-dom`

**Title:** Chore: Remove temporary mock for `react-router-dom` and adopt a robust test approach

**Description:**

The current test suite uses a manual mock for `react-router-dom` to resolve module resolution issues in the Jest environment. While this has unblocked the CI/CD pipeline, it is a temporary solution. We should aim to remove this mock and use a more robust approach to testing components that rely on `react-router-dom`.

**Acceptance Criteria:**

- The manual mock for `react-router-dom` (`frontend/__mocks__/react-router-dom.js`) is removed.
- The `moduleNameMapper` entry for `react-router-dom` is removed from the Jest configuration in `package.json`.
- The frontend test suite still passes.
- A more robust testing strategy is in place, such as using `babel-jest` to transform the `react-router-dom` module, or refactoring the tests to not rely on the mock.

**Labels:** `chore`, `testing`, `frontend`

---

### Issue 2: Weekly Security Audit Follow-up (react-scripts/webpack-dev-server)

**Title:** Chore: Monitor react-scripts/webpack-dev-server advisories weekly

**Description:**

A weekly security audit has been configured to run every Sunday. This is a recurring task to review the results of the audit and address any new vulnerabilities that are found, particularly those related to `react-scripts` and `webpack-dev-server` which have known moderate advisories.

**Acceptance Criteria:**

- The results of the weekly `npm audit` are reviewed.
- Monitor for upstream fixes to react-scripts and webpack-dev-server vulnerabilities.
- Any new vulnerabilities are triaged and addressed.
- A new issue is created to track the resolution of any new vulnerabilities.
- Reference: [`frontend/AUDIT-2025-11-23.md`](../frontend/AUDIT-2025-11-23.md)

**Labels:** `chore`, `security`, `frontend`

---

### Issue 3: Expand E2E Coverage (Playwright/Cypress)

**Title:** Chore: Expand E2E test coverage with Playwright

**Description:**

The current E2E test suite in `/e2e` uses Playwright with basic smoke tests covering page loads and API health checks. We should expand this coverage to include more comprehensive user flows and edge cases.

**Current E2E Test Coverage:**
- Homepage, Dashboard, Products, Vendors, Transactions page loads
- Backend health endpoint checks (`/health`, `/`, `/docs`)
- Basic CRUD API endpoint availability checks (Products, Vendors, Transactions)
- Console error detection on main pages

**Proposed Expansion Areas:**

1. **Authentication Flows:**
   - Login/logout flow
   - Session persistence
   - Protected route redirection

2. **CRUD Operations:**
   - Create new product/vendor/transaction
   - Edit existing records
   - Delete records with confirmation
   - Form validation errors

3. **Forecasting Features:**
   - Sales forecast generation
   - Forecast visualization

4. **Error Handling:**
   - Network error recovery
   - API error display
   - Invalid form submissions

5. **Cross-browser Testing:**
   - Add Firefox and Safari projects to playwright.config.ts

**Acceptance Criteria:**

- At least 5 new E2E test scenarios covering user workflows
- Authentication flow tests added
- CRUD operation tests for at least one entity (Products or Vendors)
- Tests can run in CI environment
- Test documentation updated

**Labels:** `enhancement`, `testing`, `e2e`
