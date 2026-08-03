import assert from "node:assert/strict";

import {
  EvidenceGraphBuilder,
} from "../ai/graph/morphologyEvidence/index.js";

const builder =
  new EvidenceGraphBuilder();

const explanation = {
  winner: {
    cellId: "CELL-A",
  },
  runnerUp: {
    cellId: "CELL-B",
  },
  confidence: {
    score: 0.8,
    level: "HIGH",
    explanation: {
      positiveFactors: [],
    },
    penalties: {
      penalties: [],
    },
  },
  narrative: {
    headline: "CELL-A",
  },
  evidence: {
    supportingEvidence: [],
    contradictoryEvidence: [],
    missingRequiredEvidence: [],
  },
  alternatives: [],
  rejectedCandidates: [],
  humanReviewRecommended: false,
  reviewReasons: [],
};

const before =
  JSON.stringify(
    explanation,
  );

builder.build({
  explanation,
});

const after =
  JSON.stringify(
    explanation,
  );

assert.equal(
  before,
  after,
);

console.log(
  "CI-002C.8 regression guard passed.",
);
