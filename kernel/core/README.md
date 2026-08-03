# CCK-001.1 — Core Foundation

Zero-dependency, domain-independent primitives for the CellCount Kernel.

## Public API

```javascript
import {
  Identifier,
  Entity,
  ValueObject,
  AggregateRoot,
  DomainEvent,
  DomainResult,
  DomainError,
  ValidationError,
  BusinessRuleError,
  InfrastructureError,
  DomainException,
} from "./kernel/core/index.js";
```

## Guarantees

- Stable identity semantics.
- Structural value-object equality.
- Aggregate versioning and event collection.
- Explicit success/failure results.
- Structured errors and exceptional failures.
- No dependency on scientific domain modules.
- No external runtime dependency.

## Validation

```bat
node --check kernel\core\index.js
node tests\cck0011_identifier_test.mjs
node tests\cck0011_entity_value_object_test.mjs
node tests\cck0011_aggregate_test.mjs
node tests\cck0011_result_error_test.mjs
node tests\cck0011_contract_test.mjs
node tests\cck0011_e2e_test.mjs
node tests\cck0011_regression_test.mjs
```
