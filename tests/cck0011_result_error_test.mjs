import assert from "node:assert/strict";

import {
  BusinessRuleError,
  DomainError,
  DomainException,
  DomainResult,
  ValidationError,
} from "../kernel/core/index.js";

const success =
  DomainResult.success(
    2,
  ).map(
    (value) =>
      value * 3,
  );

assert.equal(
  success.value,
  6,
);

const failure =
  DomainResult.failure(
    new ValidationError(
      "Invalid.",
    ),
  );

assert.equal(
  failure.isFailure,
  true,
);

assert.equal(
  failure.errors[0].code,
  "VALIDATION_ERROR",
);

assert.equal(
  failure.getOrElse(10),
  10,
);

assert.throws(
  () => failure.value,
  /failed result/i,
);

assert.ok(
  new BusinessRuleError(
    "Rule.",
  ) instanceof DomainError,
);

assert.equal(
  new DomainException(
    "Exceptional.",
  ).code,
  "DOMAIN_EXCEPTION",
);

console.log(
  "CCK-001.1 Result and errors passed.",
);
