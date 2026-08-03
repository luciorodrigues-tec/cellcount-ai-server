import assert from "node:assert/strict";
import {
  balanceConflictProbabilities,
  mergeConflictPolicy,
} from "../ai/differentialDiagnosis/conflictEngine/index.js";

const policy =
  mergeConflictPolicy();

const result =
  balanceConflictProbabilities({
    exclusiveFeatureResult: {
      pair: {
        primaryNormalizedScore: 0.9,
        alternativeNormalizedScore: 0.7,
      },
    },
    evidenceAnalysis: {
      totals: {
        winnerScore: 2,
        alternativeScore: 1,
      },
    },
    severity: {
      score: 0.5,
    },
    policy,
  });

assert.ok(
  result.winnerProbability >
  result.alternativeProbability,
);

assert.equal(
  Number(
    (
      result.winnerProbability +
      result.alternativeProbability
    ).toFixed(6),
  ),
  1,
);

console.log(
  "CI-002D.6 probability balancing passed.",
);
