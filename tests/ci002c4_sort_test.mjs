import assert from "node:assert/strict";

import {
  CandidateGenerator,
} from "../ai/candidate/morphologyCandidate/index.js";

const generator =
  new CandidateGenerator();

const result =
  generator.generate([
    {
      cellId: "CELL-B",
      criteriaId: "CRITERIA-B",
      finalScore: 4,
      normalizedScore: 0.7,
      requiredSatisfied: true,
      minimumScoreSatisfied: true,
      blocked: false,
      excluded: false,
      summary: {
        overallCoverage: 0.8,
      },
    },
    {
      cellId: "CELL-A",
      criteriaId: "CRITERIA-A",
      finalScore: 5,
      normalizedScore: 0.9,
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
  result.eligible[0].cellId,
  "CELL-A",
);

console.log(
  "CI-002C.4 deterministic sort passed.",
);
