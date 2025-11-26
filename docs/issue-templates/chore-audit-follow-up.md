---
name: 'Chore: Security audit follow-up'
about: Track the monitoring of frontend dependencies for security vulnerabilities.
title: 'Chore: Monitor react-scripts and webpack-dev-server for security updates'
labels: chore, security, frontend
---

**Describe the chore**
As part of the recent security audit documented in [`frontend/AUDIT-2025-11-23.md`](../../frontend/AUDIT-2025-11-23.md), several moderate vulnerabilities were triaged and mitigated using `npm overrides`. While this is an effective short-term solution, the long-term fix is to update the underlying packages (`react-scripts`, `webpack-dev-server`) when new versions are released that resolve these vulnerabilities.

This issue is to track the ongoing monitoring of these packages.

**Tasks**
- [ ] Set up a recurring reminder (weekly or bi-weekly) to check for new releases of `react-scripts` and `webpack-dev-server`.
- [ ] When a new version is released, create a new branch to test the upgrade.
- [ ] If the upgrade is successful and does not introduce breaking changes, remove the corresponding entry from the `overrides` section in `frontend/package.json`.
- [ ] Close this issue once all relevant overrides have been removed.

**Additional context**
The automated weekly `npm audit` workflow will provide continuous monitoring, but this issue serves as a reminder to take action on the specific, known vulnerabilities that have been temporarily mitigated.
