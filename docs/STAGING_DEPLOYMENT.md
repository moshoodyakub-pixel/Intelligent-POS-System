# Staging Deployment & Smoke Tests

This document describes how to deploy the POS System to a staging environment and run smoke tests.

## Prerequisites

- Docker and Docker Compose installed
- Access to Docker Hub (for pulling images)
- Node.js 18+ (for E2E tests)

## Quick Start

### 1. Deploy to Staging

```bash
# Deploy using the latest images
./scripts/deploy-staging.sh

# Or deploy a specific commit
./scripts/deploy-staging.sh 7e5033c
```

### 2. Run Manual Smoke Tests

```bash
./scripts/smoke-tests.sh
```

### 3. Run Automated E2E Tests

```bash
cd e2e
npm install
npx playwright install chromium
npx playwright test
```

## Staging Environment

The staging environment uses `docker-compose.staging.yml` which:

- Pulls images from Docker Hub (tagged with commit SHA or `latest`)
- Runs all services in isolated staging network
- Includes health checks for all services
- Uses staging-specific container names to avoid conflicts

### Services

| Service  | Port | Health Check URL            |
|----------|------|----------------------------|
| Frontend | 3000 | http://localhost:3000      |
| Backend  | 8000 | http://localhost:8000/health |
| Database | 5432 | Internal only              |

## Smoke Test Coverage

### Manual Tests (smoke-tests.sh)

1. **Health Endpoints**
   - Backend `/health` returns HTTP 200
   - Backend `/` returns HTTP 200
   - API docs accessible

2. **Frontend Pages**
   - Homepage loads
   - Dashboard page loads
   - Products page loads
   - Vendors page loads
   - Transactions page loads

3. **API Endpoints**
   - Products API responds
   - Vendors API responds
   - Transactions API responds

### Automated E2E Tests (Playwright)

Located in `e2e/tests/smoke.spec.ts`:

1. **Core Pages**
   - Homepage loads without errors
   - Dashboard page accessible
   - Products page accessible
   - Vendors page accessible
   - Transactions page accessible

2. **API Health**
   - Health endpoint returns 200 with correct status
   - Root endpoint returns 200
   - API docs accessible

3. **CRUD Operations**
   - Products list endpoint works
   - Vendors list endpoint works
   - Transactions list endpoint works

4. **Console Errors**
   - No critical JavaScript errors on any page

## CI/CD Integration

The staging deployment workflow (`.github/workflows/staging-deploy.yml`) automatically:

1. Triggers on pushes to `staging` or `develop` branches
2. Triggers on pull requests to `main`
3. Can be manually triggered with a specific commit SHA
4. Deploys to staging environment
5. Runs all smoke tests
6. Uploads test reports as artifacts
7. Cleans up staging environment

### Manual Workflow Trigger

Go to Actions → "Deploy to Staging & Run Smoke Tests" → "Run workflow" → Enter commit SHA (optional)

## Acceptance Criteria

✅ All smoke tests pass  
✅ No critical console errors  
✅ Health endpoints return HTTP 200  
✅ All core pages load successfully  
✅ API endpoints respond correctly  

## Troubleshooting

### Services not starting

```bash
# Check service logs
docker compose -f docker-compose.staging.yml logs

# Check specific service
docker compose -f docker-compose.staging.yml logs backend
```

### Health checks failing

```bash
# Manually test endpoints
curl -v http://localhost:8000/health
curl -v http://localhost:3000
```

### E2E tests failing

```bash
# Run with UI mode for debugging
cd e2e
npx playwright test --ui

# Run with headed browser
npx playwright test --headed
```
