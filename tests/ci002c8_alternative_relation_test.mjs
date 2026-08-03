import assert from "node:assert/strict";

import {
  EvidenceGraphBuilder,
} from "../ai/graph/morphologyEvidence/index.js";

const builder =
  new EvidenceGraphBuilder();

const graph =
  builder.build({
    explanation: {
      winner: {
        cellId: "CELL-A",
      },
      runnerUp: {
        cellId: "CELL-B",
        marginFromWinner: 0.02,
      },
      confidence: {
        score: 0.6,
        level: "MODERATE",
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
      alternatives: [
        {
          cellId: "CELL-B",
          rank: 2,
          score: 4,
          normalizedScore: 0.8,
          coverage: 0.9,
          requiredCoverage: 1,
          marginFromWinner: 0.02,
        },
      ],
      rejectedCandidates: [],
      humanReviewRecommended: true,
      reviewReasons: [
        "AMBIGUOUS_TOP_CANDIDATES",
      ],
    },
  });

assert.ok(
  graph.edges.some(
    (edge) =>
      edge.source ===
        "cell:CELL-B" &&
      edge.target ===
        "cell:CELL-A" &&
      edge.type ===
        "ALTERNATIVE_TO",
  ),
);

assert.ok(
  graph.nodes.some(
    (node) =>
      node.type ===
      "HUMAN_REVIEW",
  ),
);

console.log(
  "CI-002C.8 alternative relations passed.",
);
