import assert from "node:assert/strict";

import {
  EvidenceGraphBuilder,
} from "../ai/graph/morphologyEvidence/index.js";

const builder =
  new EvidenceGraphBuilder();

const graph =
  builder.build({
    specimenType:
      "BONE_MARROW_ASPIRATE",
    explanation: {
      winner: {
        cellId: "CELL-A",
      },
      runnerUp: null,
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
        supportingEvidence: [
          {
            featureId:
              "fine_chromatin",
            label:
              "Cromatina delicada",
            role:
              "required",
            confidence: 0.95,
            similarity: 1,
            contribution: 2,
            sourceCriterionId:
              "CRITERIA-A-1",
            statement:
              "Suporte forte.",
          },
        ],
        contradictoryEvidence: [],
        missingRequiredEvidence: [],
      },
      alternatives: [],
      rejectedCandidates: [],
      humanReviewRecommended: false,
      reviewReasons: [],
    },
  });

const feature =
  graph.nodes.find(
    (node) =>
      node.id ===
      "feature:fine_chromatin",
  );

assert.ok(feature);

assert.ok(
  graph.edges.some(
    (edge) =>
      edge.source ===
        "feature:fine_chromatin" &&
      edge.target ===
        "cell:CELL-A" &&
      edge.type === "SUPPORTS",
  ),
);

assert.ok(
  graph.nodes.some(
    (node) =>
      node.id ===
      "criterion:CRITERIA-A-1",
  ),
);

console.log(
  "CI-002C.8 feature relations passed.",
);
