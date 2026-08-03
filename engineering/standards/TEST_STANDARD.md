# CellCount Test Standard

Tests must be deterministic and runnable directly with Node.js.

## Required categories

- Unit: isolated behavior.
- Integration: collaboration between modules.
- E2E: complete public workflow.
- Regression: preservation of approved behavior.
- Contract: public API and server integration.

## Rules

- Use `node:assert/strict`.
- Do not depend on network access.
- Do not mutate fixtures.
- Every failure must clearly identify the violated contract.
- Test files end with `_test.mjs`.
