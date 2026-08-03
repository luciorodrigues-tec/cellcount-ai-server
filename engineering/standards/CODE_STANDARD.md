# CellCount Code Standard — CCK-000.1

## Runtime

- ECMAScript modules.
- Node.js 20 or newer.
- No implicit global state.
- Public APIs must be exported through `index.js`.

## Design

- Domain objects should be immutable whenever practical.
- Constructors and factories must reject invalid input early.
- Engines must accept explicit input objects and return deterministic outputs.
- Modules may consume another module only through its public entry point.
- Knowledge, inference, presentation and infrastructure must remain separated.

## Naming

- Classes: `PascalCase`.
- Functions and variables: `camelCase`.
- Constants: `SCREAMING_SNAKE_CASE`.
- Test files: `*_test.mjs`.
- Canonical scientific identifiers are data and must not be embedded in the Kernel.

## Quality

A module is complete only when it has:

1. Public contract.
2. Unit tests.
3. Integration or E2E test when applicable.
4. Regression guard.
5. README, specification, architecture notes and changelog.
6. Successful syntax validation.
