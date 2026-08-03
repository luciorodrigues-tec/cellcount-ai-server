import assert from "node:assert/strict";
import {
  calculateConflictSeverity,
  mergeConflictPolicy,
} from "../ai/differentialDiagnosis/conflictEngine/index.js";

const policy =
  mergeConflictPolicy();

const result =
  calculateConflictSeverity(
    {
      conflicts: [
        {
          severityContribution: 1,
        },
      ],
      winnerFeatures: [{}],
      alternativeFeatures: [{}],
      sharedFeatures: [],
      missingFeatures: [],
      totals: {
        winnerScore: 1,
        alternativeScore: 1,
        sharedScore: 0,
        missingScore: 0,
      },
    },
    {
      pair: {
        rule: {},
      },
      features: [{}, {}],
    },
    policy,
  );

assert.ok(
  ["HIGH", "CRITICAL"]
    .includes(
      result.severity,
    ),
);

console.log(
  "CI-002D.6 severity passed.",
);
