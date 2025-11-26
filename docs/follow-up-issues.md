# Follow-up Issues

This document contains the content for follow-up issues to be created in the issue tracker.

---

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

### Issue 2: Weekly Security Audit Follow-up

**Title:** Chore: Follow up on weekly security audit results

**Description:**

A weekly security audit has been configured to run every Sunday. This is a recurring task to review the results of the audit and address any new vulnerabilities that are found.

**Acceptance Criteria:**

- The results of the weekly `npm audit` are reviewed.
- Any new vulnerabilities are triaged and addressed.
- A new issue is created to track the resolution of any new vulnerabilities.

**Labels:** `chore`, `security`, `frontend`
