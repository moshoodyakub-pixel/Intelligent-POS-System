# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
