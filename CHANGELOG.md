# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `DEPLOYMENT.md`: A comprehensive guide for deploying the application, including steps for verification, smoke testing, monitoring, and rollback.

### Fixed
- Resolved a merge conflict in `docker-compose.yml` that was preventing the application from building correctly. The frontend service port is now correctly set to `3000:80`.
- Resolved merge conflicts in `DEPLOYMENT.md` to finalize the documentation.

### Changed
- Improved the `DEPLOYMENT.md` guide with additional details on security, health checks, automated testing, and rollback procedures.
