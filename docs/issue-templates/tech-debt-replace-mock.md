---
name: 'Tech Debt: Replace react-router-dom mock with transform'
about: Plan the work to remove the Jest mock for `react-router-dom` and use the real library in tests.
title: 'Tech Debt: Replace react-router-dom mock with a robust transform'
labels: tech-debt, frontend, testing
---

**Is your feature request related to a problem? Please describe.**
The frontend test suite was recently fixed by introducing a manual mock for `react-router-dom` in `frontend/__mocks__/react-router-dom.js`. While this unblocked the tests and allowed the CI to pass, it is a workaround, not a permanent solution. The tests currently run against a mock, not the real library, which means we are not validating the application's true routing behavior.

**Describe the solution you'd like**
We should remove the manual mock and configure the Jest environment to correctly transform the `react-router-dom` ES Module. This will allow tests to use the real components (like `MemoryRouter`) and provide more accurate and reliable test coverage.

**Acceptance Criteria**
1.  The `frontend/__mocks__/react-router-dom.js` file is deleted.
2.  The `moduleNameMapper` entry for `react-router-dom` in `frontend/jest.config.cjs` is removed.
3.  The `transformIgnorePatterns` in `frontend/jest.config.cjs` is correctly configured to whitelist `react-router-dom` for transformation by Babel.
4.  The `App.test.js` file is updated to use the real `MemoryRouter` from `react-router-dom`.
5.  All frontend tests (`npm test --prefix frontend`) continue to pass.

**Additional context**
This work will improve the long-term maintainability and reliability of the frontend test suite. It is a direct follow-up to the work done in PR #XX to fix the test environment.
