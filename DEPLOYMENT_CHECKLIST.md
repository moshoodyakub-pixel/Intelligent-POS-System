# 🚀 Deployment Phase Checklist

**Intelligent POS System - Final Steps to Production**

This document provides a step-by-step checklist for deploying the Intelligent POS System to production. Complete each section in order.

> 📖 **Related Documentation:**
> - [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed verification guide, monitoring setup, and rollback procedures
> - [docs/STAGING_DEPLOYMENT.md](./docs/STAGING_DEPLOYMENT.md) - Staging environment specifics

---

## 📋 Pre-Deployment Checklist

### 1. GitHub Repository Setup (5 minutes)

- [ ] **Configure Docker Hub Secrets** (Required for automated deployments)
  ```
  Go to: GitHub Repository → Settings → Secrets and Variables → Actions
  
  Add these repository secrets:
  • DOCKERHUB_USERNAME: Your Docker Hub username
  • DOCKERHUB_TOKEN: Docker Hub access token (create at https://hub.docker.com/settings/security)
  ```

- [ ] **Create GitHub Environment** (Optional - for production approval gate)
  ```
  Go to: GitHub Repository → Settings → Environments → New Environment
  
  Create environment: "production"
  • Enable "Required reviewers" - add approvers for production deployments
  • Enable "Wait timer" (optional) - add delay before production deploy
  ```

### 2. Generate Production Secrets (5 minutes)

- [ ] **Generate SECRET_KEY** (Required for JWT authentication)
  ```bash
  # Run this command to generate a secure key:
  python3 -c "import secrets; print(secrets.token_urlsafe(64))"
  
  # Save this key - you'll need it for both staging and production
  ```

- [ ] **Prepare Database Credentials**
  ```
  For production PostgreSQL:
  • Database name: pos_db
  • Username: [your-username]
  • Password: [strong-password]
  • Host: [your-database-host]
  • Port: 5432
  ```

### 3. Choose Deployment Platform (Select One)

#### Option A: Docker Compose on VPS/Server (Recommended for small deployments)

- [ ] **Provision Server**
  - Ubuntu 22.04 LTS or similar
  - Minimum: 2 CPU cores, 4GB RAM, 20GB storage
  - Install Docker and Docker Compose

#### Option B: Kubernetes (For scalable deployments)

- [ ] **Configure Kubernetes Cluster**
  - Create namespace: `pos-system`
  - Set up ingress controller
  - Configure persistent volumes for database

#### Option C: Cloud Platform (AWS, GCP, Azure)

- [ ] **Choose Services**
  - Container service (ECS, Cloud Run, Azure Container Apps)
  - Managed PostgreSQL (RDS, Cloud SQL, Azure Database)
  - Load Balancer / CDN

---

## 🏗️ Deployment Steps

### Step 1: Test Locally with Docker Compose (15 minutes)

```bash
# Clone repository (if not already cloned)
git clone https://github.com/moshoodyakub-pixel/Intelligent-POS-System.git
cd Intelligent-POS-System

# Build and start all services
docker compose up --build

# Verify services are running
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

**Verification Checklist:**
- [ ] Frontend loads at http://localhost:3000
- [ ] Backend health check returns OK at http://localhost:8000/health
- [ ] API documentation loads at http://localhost:8000/docs
- [ ] Can create/view/edit/delete vendors
- [ ] Can create/view/edit/delete products
- [ ] Can create/view transactions
- [ ] Forecasting page displays correctly

### Step 2: Deploy to Staging (30 minutes)

#### Option A: Using GitHub Actions (Automatic)

```bash
# Push to staging branch to trigger automatic staging deployment
git checkout -b staging
git push origin staging

# Or manually trigger via GitHub:
# Go to: Actions → "Deploy to Staging & Run Smoke Tests" → "Run workflow"
```

#### Option B: Manual Staging Deployment

```bash
# On your staging server:

# 1. Create environment file
cat > .env << EOF
DOCKERHUB_USERNAME=your-dockerhub-username
IMAGE_TAG=latest
SENTRY_DSN=your-sentry-dsn-optional
REACT_APP_SENTRY_DSN=your-frontend-sentry-dsn-optional
EOF

# 2. Deploy using staging compose file
./scripts/deploy-staging.sh latest

# Or manually:
export IMAGE_TAG=latest
docker compose -f docker-compose.staging.yml up -d --wait
```

**Staging Verification:**
- [ ] Ensure scripts are executable: `chmod +x scripts/*.sh`
- [ ] Run smoke tests: `./scripts/smoke-tests.sh`
- [ ] Check backend logs: `docker logs pos-backend-staging`
- [ ] Check frontend logs: `docker logs pos-frontend-staging`
- [ ] All health endpoints return 200 OK

### Step 3: Configure Production Environment (15 minutes)

Create a `.env.production` file on your production server:

```bash
# Required
SECRET_KEY=your-generated-secret-key-from-step-2
DATABASE_URL=postgresql://username:password@db-host:5432/pos_db

# Security
CORS_ORIGINS=https://your-production-domain.com
DEBUG=false
ENVIRONMENT=production

# Rate Limiting
RATE_LIMIT_REQUESTS=100

# Monitoring (Optional but recommended)
SENTRY_DSN=https://your-dsn@sentry.io/project-id
METRICS_ENABLED=true
SENTRY_TRACES_SAMPLE_RATE=0.1

# Frontend
REACT_APP_API_URL=https://api.your-production-domain.com
REACT_APP_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=1.0.0
```

### Step 4: Deploy to Production (30 minutes)

#### Option A: Promote from Staging via GitHub Actions

```bash
# Go to GitHub:
# Actions → "Promote Staging to Production" → "Run workflow"
# 
# Fill in:
# • Staging tag: latest (or specific commit SHA)
# • Confirmation: PROMOTE
#
# This will:
# 1. Run smoke tests on staging images
# 2. Request manual approval (if configured)
# 3. Tag and push images as production
```

#### Option B: Manual Production Deployment

```bash
# On production server:

# 1. Pull latest images
docker pull your-username/pos-backend:production
docker pull your-username/pos-frontend:production

# 2. Create production compose override file
cat > docker-compose.production.yml << 'EOF'
services:
  backend:
    image: ${DOCKERHUB_USERNAME}/pos-backend:production
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SECRET_KEY=${SECRET_KEY}
      - CORS_ORIGINS=${CORS_ORIGINS}
      - SENTRY_DSN=${SENTRY_DSN}
      - ENVIRONMENT=production
    restart: always
    
  frontend:
    image: ${DOCKERHUB_USERNAME}/pos-frontend:production
    environment:
      - REACT_APP_ENVIRONMENT=production
    restart: always
    
  db:
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - /data/postgres:/var/lib/postgresql/data
    restart: always
EOF

# 3. Deploy
source .env.production
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d
```

### Step 5: Post-Deployment Setup (30 minutes)

#### A. Enable Auto-Start on Boot

```bash
# Copy systemd service file
sudo cp systemd/pos-system.service /etc/systemd/system/

# Edit WorkingDirectory to your deployment path
sudo nano /etc/systemd/system/pos-system.service

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable pos-system.service
sudo systemctl start pos-system.service

# Verify status
sudo systemctl status pos-system.service
```

#### B. Configure Database Backups

```bash
# Set up automated daily backups
./scripts/setup-backup-cron.sh --daily

# Or weekly backups
./scripts/setup-backup-cron.sh --weekly

# Verify cron job
crontab -l

# Test backup manually
./scripts/backup.sh
```

#### C. Set Up Monitoring (Optional but Recommended)

**Sentry Integration:**
1. Create account at https://sentry.io
2. Create a project for Backend (Python) and Frontend (React)
3. Get DSN values and add to environment variables

**Prometheus Metrics:**
- Backend exposes metrics at `/metrics` endpoint
- Configure Prometheus to scrape this endpoint
- See DEPLOYMENT.md for scrape config example

### Step 6: Production Verification (15 minutes)

Run the complete smoke test suite:

```bash
# Run manual smoke tests
./scripts/smoke-tests.sh

# Or run Playwright E2E tests against production
cd e2e
FRONTEND_URL=https://your-production-domain.com \
BACKEND_URL=https://api.your-production-domain.com \
npx playwright test --project=chromium
```

**Final Verification Checklist:**
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Dashboard displays statistics
- [ ] Vendor CRUD operations work
- [ ] Product CRUD operations work
- [ ] Transaction creation works
- [ ] Forecasting generates predictions
- [ ] Reports can be exported (PDF/Excel)
- [ ] Health endpoint returns: `{"status": "healthy"}`
- [ ] No errors in browser console
- [ ] No errors in server logs

---

## 🔐 Security Checklist

Before going live, ensure:

- [ ] SECRET_KEY is a unique, randomly generated value (not from examples)
- [ ] Database passwords are strong (16+ characters, mixed)
- [ ] CORS_ORIGINS restricts to your domain only
- [ ] DEBUG=false in production
- [ ] HTTPS/TLS is configured (use reverse proxy like nginx or Cloudflare)
- [ ] Database is not exposed to public internet
- [ ] Docker Hub credentials are stored as secrets (not in code)
- [ ] No `.env` files committed to repository

---

## 🔄 Rollback Procedure

If issues occur after deployment:

```bash
# Quick rollback to previous version
docker compose -f docker-compose.staging.yml down

# Re-deploy with previous tag
export IMAGE_TAG=previous-tag
docker compose -f docker-compose.staging.yml up -d

# Or use Kubernetes rollback
kubectl -n pos-system rollout undo deployment/backend
kubectl -n pos-system rollout undo deployment/frontend
```

---

## 📞 Support & Troubleshooting

### Common Issues

**Backend won't start:**
```bash
# Check logs
docker logs pos-backend

# Common fixes:
# - Verify DATABASE_URL is correct
# - Ensure database is running and accessible
# - Check SECRET_KEY is set
```

**Frontend shows blank page:**
```bash
# Check logs
docker logs pos-frontend

# Common fixes:
# - Verify REACT_APP_API_URL points to backend
# - Check browser console for errors
# - Ensure backend is running
```

**Database connection errors:**
```bash
# Check database is running
docker compose ps db

# Check connection from backend container
docker exec pos-backend python -c "from app.database import engine; engine.connect()"
```

### Reference Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment and verification guide
- [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) - API reference
- [docs/USER_MANUAL.md](./docs/USER_MANUAL.md) - End-user documentation
- [docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md) - Developer setup guide
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System architecture

---

## ✅ Deployment Complete

Once all checklist items are complete:

1. **Monitor** the application for the first 24-48 hours
2. **Document** any issues encountered for future reference
3. **Set up alerts** for error rates and response times
4. **Schedule regular backups** verification
5. **Plan for updates** - establish a release cadence

**Congratulations! 🎉 Your Intelligent POS System is now live!**

---

*Last Updated: December 29, 2025*
*Version: 1.0.0*
