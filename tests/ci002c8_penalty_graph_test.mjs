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
      runnerUp: null,
      confidence: {
        score: 0.5,
        level: "LOW",
        explanation: {
          positiveFactors: [],
        },
        penalties: {
          penalties: [
            {
              code:
                "LIMITATION_PENALTY",
              amount: 0.2,
              reason:
                "Campo limitado.",
            },
          ],
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
      humanReviewRecommended: true,
      reviewReasons: [],
    },
  });

assert.ok(
  graph.nodes.some(
    (node) =>
      node.type === "PENALTY",
  ),
);

assert.ok(
  graph.edges.some(
    (edge) =>
      edge.type === "PENALIZES",
  ),
);

console.log(
  "CI-002C.8 penalty graph passed.",
);
