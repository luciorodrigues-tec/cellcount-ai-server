import assert from "node:assert/strict";

import {
  calculateCoverage,
} from "../ai/matching/featureMatcher/index.js";

const coverage =
  calculateCoverage({
    requiredMatched: 2,
    requiredTotal: 2,
    supportiveMatched: 1,
    supportiveTotal: 2,
    negativeMatched: 0,
    negativeTotal: 1,
    exclusionMatched: 0,
    exclusionTotal: 1,
  });

assert.equal(
  coverage.requiredCoverage,
  1,
);

assert.equal(
  coverage.supportiveCoverage,
  0.5,
);

assert.equal(
  coverage.overallCoverage,
  0.75,
);

console.log(
  "CI-002C.2 coverage passed.",
);
