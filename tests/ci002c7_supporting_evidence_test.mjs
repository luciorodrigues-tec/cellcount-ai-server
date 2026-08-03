import assert from "node:assert/strict";

import {
  ExplanationEngine,
} from "../ai/explanation/morphologyExplanation/index.js";

const engine =
  new ExplanationEngine();

const rankingResult = {
  winner: {
    cellId: "CELL-A",
    normalizedScore: 0.9,
    coverage: 1,
    candidate: {
      sourceScore: {
        summary: {
          requiredMatched: 2,
          requiredTotal: 2,
          supportiveMatched: 1,
          supportiveTotal: 1,
        },
        contributions: [
          {
            cellId: "CELL-A",
            featureId: "fine_chromatin",
            role: "required",
            matched: true,
            confidence: 0.95,
            similarity: 1,
            weight: 2,
            appliedContribution: 2.28,
            penalty: 0,
            label: "Cromatina delicada",
            sourceCriterionId: "CRIT-1",
          },
        ],
      },
    },
  },
  runnerUp: null,
  ranking: [],
  rejected: [],
  summary: {
    absoluteMargin: 1,
    ambiguous: false,
    humanReviewRecommended: false,
    reviewReasons: [],
  },
};

const confidenceResult = {
  score: 0.9,
  level: "VERY_HIGH",
  humanReviewRecommended: false,
  reviewReasons: [],
};

const result =
  engine.explain({
    rankingResult,
    confidenceResult,
    specimenType:
      "BONE_MARROW_ASPIRATE",
  });

assert.equal(
  result.evidence
    .supportingEvidence[0]
    .featureId,
  "fine_chromatin",
);

assert.ok(
  result.evidence
    .supportingEvidence[0]
    .contribution > 0,
);

console.log(
  "CI-002C.7 supporting evidence passed.",
);
