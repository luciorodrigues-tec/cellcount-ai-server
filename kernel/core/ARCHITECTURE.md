# CCK-001.1 — Architecture

## Boundary

`kernel/core` is generic infrastructure. It does not import from `ai`,
application services, server routes or scientific packs.

## Dependencies

Only Node.js built-ins are used. `Identifier` uses `node:crypto` for UUID
generation.

## Invariants

- Identity does not change.
- Value-object state is deeply immutable.
- Domain events are immutable snapshots.
- Aggregate event queues are private.
- Failure results always contain at least one structured error.
- Successful results never contain errors.
