import assert from "node:assert/strict";

import {
  CandidateGenerator,
} from "../ai/candidate/morphologyCandidate/index.js";

const generator =
  new CandidateGenerator({
    thresholds: {
      minimumCandidateScore: 5,
      minimumNormalizedScore: 0.9,
      minimumCoverage: 0.9,
    },
  });

const result =
  generator.generate([
    {
      cellId: "CELL-TEST",
      criteriaId: "CRITERIA-TEST",
      finalScore: 2,
      normalizedScore: 0.5,
      requiredSatisfied: true,
      minimumScoreSatisfied: true,
      blocked: false,
      excluded: false,
      summary: {
        overallCoverage: 0.7,
      },
    },
  ]);

assert.equal(
  result.eligible.length,
  0,
);
assert.equal(
  result.rejected.length,
  1,
);
assert.ok(
  result.rejected[0]
    .rejectedReasons
    .includes(
      "BELOW_MINIMUM_SCORE",
    ),
);

console.log(
  "CI-002C.4 thresholds passed.",
);
