# CCK-001.1 — Core Foundation Specification

## Objective

Provide reusable and domain-independent primitives for identity, entities,
value objects, aggregates, domain events, explicit results and structured
errors.

## Acceptance criteria

- Identifiers support generated, scalar and composite values.
- Entity equality is identity-based.
- Value-object equality is structural and type-aware.
- Aggregate roots track versions and collect immutable domain events.
- Results cannot represent invalid success/failure states.
- Errors expose stable machine-readable codes.
- Public exports are available exclusively through `index.js`.
- Existing backend behavior remains unchanged.
