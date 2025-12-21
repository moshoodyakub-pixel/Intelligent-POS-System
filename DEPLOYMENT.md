# Deployment and Verification Guide

This guide provides a comprehensive checklist for deploying changes to the Intelligent POS System.

## A — Quick Verification (Confirm Images were Pushed)

From your workstation (or CI logs), note the image tags used (preferably commit SHA).

-   **Example in CI logs:** `your-docker-user/frontend:abcdef1`
-   Check images exist on the registry (Docker Hub web UI) or via CLI:
    ```bash
    docker pull your-docker-user/frontend:abcdef1
    docker pull your-docker-user/backend:abcdef1
    ```
    *(Replace tags with the ones from your CI logs.)*

### Secrets & Permissions
- **Ensure registry credentials** are stored in repo/organization Actions secrets (`DOCKERHUB_USERNAME`/`DOCKERHUB_TOKEN` or a GHCR PAT).
- **Never run `npm start`** or any other development server on a publicly routable host.

## B — Deploy to Staging: Options & Exact Commands

### If staging is a docker-compose host

On the staging server:

1.  **Pull new images** (replace tags):
    ```bash
    docker pull your-docker-user/backend:abcdef1
    docker pull your-docker-user/frontend:abcdef1
    ```

2.  **Update `docker-compose.yml`** to reference the exact tags (or use env file).
    -   If the compose file already uses an `image:` with a tag variable, set it in `.env` or `export`:
        ```bash
        export FRONTEND_IMAGE=your-docker-user/frontend:abcdef1
        export BACKEND_IMAGE=your-docker-user/backend:abcdef1
        ```

3.  **Restart with zero-downtime** (if you have a good compose setup):
    ```bash
    docker compose pull
    docker compose up -d
    ```

4.  **Check status:**
    ```bash
    docker compose ps
    docker logs -f <frontend_container_name> # watch startup logs
    ```

### If staging uses Kubernetes

Use `kubectl` to update the deployments to the new images:

1.  **Set images** (replace names, namespace):
    ```bash
    kubectl -n staging set image deployment/frontend frontend=your-docker-user/frontend:abcdef1
    kubectl -n staging set image deployment/backend backend=your-docker-user/backend:abcdef1
    ```

2.  **Wait for rollout:**
    ```bash
    kubectl -n staging rollout status deployment/frontend
    kubectl -n staging rollout status deployment/backend
    ```

3.  **Verify pods:**
    ```bash
    kubectl -n staging get pods -l app=frontend -o wide
    ```

4.  **If you're using Helm:**
    ```bash
    helm upgrade frontend ./chart --namespace staging --set image.tag=abcdef1
    ```

### If you just want to run the app quickly (manual test)

On a staging host or local machine:
```bash
docker run -d --name frontend -p 8080:80 your-docker-user/frontend:abcdef1
```

## C — Manual Smoke Tests (What to Manually Check)

-   **Homepage:** Open `https://staging.yoursite.example` or `http://staging-host:8080`.
    -   Page loads without long blocking errors; status 200.
-   **Navigate key pages:** Dashboard, Transactions, Vendors.
    -   Data loads; UI renders; no blank screens.
-   **Create / Edit / Delete flow:**
    1.  Create a Vendor (fill form → save) → assert success toast and vendor visible in list.
    2.  Edit that vendor → change field → save → confirm change persisted (refresh page).
    3.  Delete the vendor → confirm it’s removed.
-   **Browser console:** Open DevTools → Console and ensure no uncaught exceptions or repeated 500 network responses.
-   **API checks:** Use `curl` to confirm backend endpoints:
    ```bash
    # Health check should return HTTP 200 and a JSON body like {"status":"ok"}
    curl -s -f https://staging.api.example/health || echo "health failed"
    curl -s -f https://staging.api.example/api/vendors | jq '.[0]' # verify response shape
    ```

## D — Automated Smoke Tests (Headless)

-   **Playwright (if you have tests):**
    ```bash
    # Run tests locally with the target URL set
    FRONTEND_BASE_URL=https://staging.example npx playwright test --grep @smoke --project=chromium --reporter=list
    ```
-   **Cypress:**
    ```bash
    npx cypress run --spec "cypress/e2e/smoke.spec.js"
    ```
-   **Simple script (curl-based):** `./scripts/smoke-check.sh`
    -   Create a small script that runs a few curl/POST checks and exits non-zero if any fail.

## E — Post-Deploy Monitoring (First 30–60 Minutes)

### Log Monitoring

-   **Tail logs for errors:**
    -   `docker logs -f <frontend_container>`
    -   `docker logs -f <backend_container>`
    -   `kubectl -n staging logs -f deployment/frontend`
    -   `kubectl -n staging logs -f deployment/backend`

### Error Tracking with Sentry

The application is configured with Sentry integration for exception tracking:

-   **Setup Sentry:**
    1.  Create a project in [Sentry](https://sentry.io)
    2.  Get your DSN from Project Settings → Client Keys
    3.  Set environment variables:
        ```bash
        # Backend
        export SENTRY_DSN=https://your-dsn@sentry.io/project-id
        
        # Frontend (React uses REACT_APP_ prefix)
        export REACT_APP_SENTRY_DSN=https://your-dsn@sentry.io/project-id
        ```

-   **Monitor in Sentry:**
    -   Watch for spikes / new exceptions
    -   Set a filter for "new in last 30m" after deployment
    -   Check the Issues dashboard for unhandled exceptions
    -   Review error trends and performance data

### Metrics Monitoring with Prometheus

The backend exposes a `/metrics` endpoint for Prometheus scraping:

-   **Access metrics:**
    ```bash
    curl https://staging.api.example/metrics
    ```

-   **Key metrics to monitor:**
    -   `http_requests_total` - Total request count by method, endpoint, status code
    -   `http_request_duration_seconds` - Request latency histogram (p50, p90, p95, p99)
    -   `http_5xx_errors_total` - 5xx server error count
    -   `http_errors_total` - All error count (4xx and 5xx)
    -   `http_requests_active` - Currently active requests
    -   `process_resident_memory_bytes` - Memory usage
    -   `process_cpu_seconds_total` - CPU usage

-   **Prometheus scrape config example:**
    ```yaml
    scrape_configs:
      - job_name: 'pos-backend'
        static_configs:
          - targets: ['backend:8000']
        metrics_path: /metrics
    ```

-   **Alerting thresholds (recommended):**
    -   p95 latency > 1s for 5 minutes
    -   5xx rate > 1% for 5 minutes
    -   Memory usage > 80% for 10 minutes
    -   CPU usage > 80% for 10 minutes

### Health Endpoint

-   **Health check:**
    ```bash
    curl -f https://staging.yoursite.example/health
    ```
    Expected response:
    ```json
    {
      "status": "healthy",
      "message": "API is running",
      "version": "1.0.0",
      "environment": "staging"
    }
    ```

## F — Rollback Procedure (Quick)

-   **Identify Rollback Tag:** The previous stable release tag should be stored in a `RELEASES.md` file or in your CI build artifacts.
-   **docker-compose:** Re-deploy the previous tag.
    ```bash
    export FRONTEND_IMAGE=your-docker-user/frontend:previous-tag
    docker compose up -d
    ```

-   **Kubernetes:**
    ```bash
    kubectl -n staging rollout undo deployment/frontend
    kubectl -n staging rollout status deployment/frontend
    ```

-   **Manual docker run:**
    ```bash
    docker stop frontend && docker rm frontend
    docker run -d --name frontend -p 8080:80 your-docker-user/frontend:previous-tag
    ```

## G — Post-Deploy Follow-Ups & Issue Creation

-   **Create Issue A — Frontend failing test:**
    -   **Title:** "Frontend test failing — [test name / CI job]"
    -   **Body:** Steps to reproduce, failing log, screenshot, expected vs actual, assign owner.
-   **Create Issue B — Audit follow-up:**
    -   **Title:** "Audit triage: monitor react-scripts / webpack-dev-server for upstream fix"
    -   **Body:** Link to [`frontend/AUDIT-2025-11-23.md`](./frontend/AUDIT-2025-11-23.md), note the remaining moderate advisories and monitoring cadence.

## H — Checklist You Can Copy/Paste into a Runbook

-   [ ] Confirm images pushed to registry with SHA tag
-   [ ] Deploy images to staging (compose/k8s/helm)
-   [ ] Wait for services to become ready (rollout status)
-   [ ] Manual smoke tests completed (homepage, Dashboard, Transactions, Vendors)
-   [ ] Create/Edit/Delete flow executed successfully
-   [ ] No critical console errors
-   [ ] Headless smoke tests passed (Playwright/Cypress)
-   [ ] Verify Sentry is receiving events (if configured)
-   [ ] Verify Prometheus metrics endpoint is accessible (`/metrics`)
-   [ ] Monitor logs + Sentry for first 30–60m
-   [ ] Check p95 latency and 5xx rate in metrics
-   [ ] If issues found → rollback and create hotfix issue
-   [ ] Create follow-up issues (frontend-test, audit follow-up)
