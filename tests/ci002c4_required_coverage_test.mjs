import assert from "node:assert/strict";

import {
  CandidateGenerator,
} from "../ai/candidate/morphologyCandidate/index.js";

const generator =
  new CandidateGenerator();

const result =
  generator.generate([
    {
      cellId: "CELL-MISSING-REQUIRED",
      criteriaId: "CRITERIA-1",
      finalScore: 5,
      normalizedScore: 0.9,
      requiredSatisfied: false,
      minimumScoreSatisfied: true,
      blocked: false,
      excluded: false,
      summary: {
        overallCoverage: 1,
      },
    },
    {
      cellId: "CELL-LOW-COVERAGE",
      criteriaId: "CRITERIA-2",
      finalScore: 5,
      normalizedScore: 0.9,
      requiredSatisfied: true,
      minimumScoreSatisfied: true,
      blocked: false,
      excluded: false,
      summary: {
        overallCoverage: 0.2,
      },
    },
  ]);

assert.equal(
  result.eligible.length,
  0,
);
assert.equal(
  result.statistics
    .missingRequired,
  1,
);
assert.equal(
  result.statistics
    .lowCoverage,
  1,
);

console.log(
  "CI-002C.4 required/coverage passed.",
);
