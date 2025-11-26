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
    curl -s -f https://staging.api.example/health || echo "health failed"
    curl -s -f https://staging.api.example/api/vendors | jq '.[0]' # verify response shape
    ```

## D — Automated Smoke Tests (Headless)

-   **Playwright (if you have tests):** `npx playwright test --grep @smoke --project=chromium --reporter=list`
-   **Cypress:** `npx cypress run --spec "cypress/e2e/smoke.spec.js"`
-   **Simple script (curl-based):** `./scripts/smoke-check.sh`
    -   Create a small script that runs a few curl/POST checks and exits non-zero if any fail.

## E — Post-Deploy Monitoring (First 30–60 Minutes)

-   **Tail logs for errors:**
    -   `docker logs -f <frontend_container>`
    -   `kubectl -n staging logs -f deployment/frontend`
-   **Error tracking (Sentry / Rollbar):**
    -   Watch for spikes / new exceptions. Open Sentry and set a filter for "new in last 30m".
-   **Metrics:**
    -   Check response time p95/p99, CPU, and memory on the new pods/containers.
    -   Watch for increased 5xx rates or large request latencies.
-   **Health endpoint:**
    -   `curl -f https://staging.yoursite.example/health` (should return HTTP 200)

## F — Rollback Procedure (Quick)

-   **docker-compose:** Re-deploy the previous tag (be sure you saved it).
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
    -   **Body:** Link to `frontend/AUDIT-2025-11-23.md`, note the remaining moderate advisories and monitoring cadence.

## H — Checklist You Can Copy/Paste into a Runbook

-   [ ] Confirm images pushed to registry with SHA tag
-   [ ] Deploy images to staging (compose/k8s/helm)
-   [ ] Wait for services to become ready (rollout status)
-   [ ] Manual smoke tests completed (homepage, Dashboard, Transactions, Vendors)
-   [ ] Create/Edit/Delete flow executed successfully
-   [ ] No critical console errors
-   [ ] Headless smoke tests passed (Playwright/Cypress)
-   [ ] Monitor logs + Sentry for first 30–60m
-   [ ] If issues found → rollback and create hotfix issue
-   [ ] Create follow-up issues (frontend-test, audit follow-up)
