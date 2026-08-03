import assert from "node:assert/strict";

import {
  CandidateGenerator,
} from "../ai/candidate/morphologyCandidate/index.js";

const generator =
  new CandidateGenerator();

const result =
  generator.generate([
    {
      cellId: "CELL-A",
      criteriaId: "CRITERIA-A",
      finalScore: 4,
      normalizedScore: 0.8,
      requiredSatisfied: true,
      minimumScoreSatisfied: true,
      blocked: false,
      excluded: false,
      summary: {
        overallCoverage: 0.8,
      },
    },
    {
      cellId: "CELL-B",
      criteriaId: "CRITERIA-B",
      finalScore: 0.2,
      normalizedScore: 0.1,
      requiredSatisfied: false,
      minimumScoreSatisfied: false,
      blocked: false,
      excluded: false,
      summary: {
        overallCoverage: 0.1,
      },
    },
  ]);

assert.equal(
  result.statistics.evaluated,
  2,
);
assert.equal(
  result.statistics.eligible,
  1,
);
assert.equal(
  result.statistics.rejected,
  1,
);

console.log(
  "CI-002C.4 statistics passed.",
);
