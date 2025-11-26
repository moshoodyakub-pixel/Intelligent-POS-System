# Release Notes - v1.1.0 (Tentative)

**Release Date:** YYYY-MM-DD

This release focuses on improving the project's documentation and CI/CD processes.

## ✨ New Features

- **Deployment Guide:** Added a comprehensive `DEPLOYMENT.md` file that provides a step-by-step checklist for deploying the application to staging and production environments.
- **Weekly Security Audits:** Implemented a new GitHub Actions workflow that automatically runs `npm audit` every Sunday to proactively identify security vulnerabilities in frontend dependencies.

## 🐛 Bug Fixes

- **`docker-compose.yml`:** Resolved a persistent merge conflict that was blocking builds. The frontend service is now correctly configured to be accessible on port 3000.
- **Frontend Tests:** Fixed the frontend test suite, which was previously failing due to issues with module resolution and test environment setup. The tests now pass reliably.

## ⚠️ Known Issues

- There are no known issues in this release.
