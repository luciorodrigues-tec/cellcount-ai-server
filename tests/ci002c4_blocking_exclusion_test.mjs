import assert from "node:assert/strict";

import {
  CandidateGenerator,
} from "../ai/candidate/morphologyCandidate/index.js";

const generator =
  new CandidateGenerator();

const result =
  generator.generate([
    {
      cellId: "CELL-BLOCKED",
      criteriaId: "CRITERIA-BLOCKED",
      finalScore: 5,
      normalizedScore: 0.9,
      requiredSatisfied: true,
      minimumScoreSatisfied: true,
      blocked: true,
      excluded: false,
      summary: {
        overallCoverage: 1,
      },
    },
    {
      cellId: "CELL-EXCLUDED",
      criteriaId: "CRITERIA-EXCLUDED",
      finalScore: 5,
      normalizedScore: 0.9,
      requiredSatisfied: true,
      minimumScoreSatisfied: true,
      blocked: false,
      excluded: true,
      summary: {
        overallCoverage: 1,
      },
    },
  ]);

assert.equal(
  result.eligible.length,
  0,
);
assert.equal(
  result.statistics.blocked,
  1,
);
assert.equal(
  result.statistics.excluded,
  1,
);

console.log(
  "CI-002C.4 blocking/exclusion passed.",
);
