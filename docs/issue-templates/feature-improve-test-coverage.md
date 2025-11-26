---
name: 'Feature: Improve frontend test coverage'
about: Expand the frontend test suite to cover more components and user flows.
title: 'Feature: Expand frontend test coverage beyond the basic App render test'
labels: feature, frontend, testing
---

**Is your feature request related to a problem? Please describe.**
The current frontend test suite (`App.test.js`) only contains a single test that verifies the application header renders. While this was instrumental in fixing the test environment, it provides very little coverage and does not validate the functionality of individual components or user flows.

**Describe the solution you'd like**
We should expand the test suite to include more meaningful tests. This will help us catch regressions and ensure the application remains stable as we add new features.

**Proposed New Tests**
- **Component Render Tests:**
  - `Dashboard.js`: Test that the dashboard component renders without crashing.
  - `Products.js`: Test that the products table renders.
  - `Vendors.js`: Test that the vendors table renders.
  - `Transactions.js`: Test that the transactions table renders.
- **User Flow Tests (Integration):**
  - **Add Vendor:** Write a test that simulates a user clicking the "Add Vendor" button, filling out the form, and submitting it. The test should assert that the new vendor appears in the table.
  - **Delete Vendor:** Write a test that simulates a user deleting a vendor and asserts that it is removed from the table.

**Acceptance Criteria**
1.  New test files are created for at least the `Dashboard` and `Vendors` components.
2.  The new tests provide meaningful assertions (e.g., checking for the presence of key elements).
3.  All frontend tests (`npm test --prefix frontend`) pass.
4.  The overall test coverage of the frontend codebase is significantly increased.

**Additional context**
This work will provide a strong foundation for a more robust and reliable frontend. It will also help prevent future regressions as the application grows.
