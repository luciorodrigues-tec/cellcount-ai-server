import assert from "node:assert/strict";
import test from "node:test";

import {
  createDecisionTreeNode,
} from "../ai/clinicalRules/explainableDecisionTree/domain/DecisionTreeNode.js";

import {
  createDecisionTreeEdge,
} from "../ai/clinicalRules/explainableDecisionTree/domain/DecisionTreeEdge.js";

import {
  createExplainableDecisionTreeInput,
} from "../ai/clinicalRules/explainableDecisionTree/domain/ExplainableDecisionTreeInput.js";

import {
  ExplainableDecisionTreeEngine,
} from "../ai/clinicalRules/explainableDecisionTree/application/ExplainableDecisionTreeEngine.js";

import {
  DecisionTreeGraphValidator,
} from "../ai/clinicalRules/explainableDecisionTree/application/DecisionTreeGraphValidator.js";

import {
  createExplainableDecisionTreeLibrary,
} from "../ai/clinicalRules/explainableDecisionTree/ExplainableDecisionTreeLibrary.js";

const input = (overrides = {}) =>
  createExplainableDecisionTreeInput({
    caseId: "CASE-032",
    patternResult: {
      selectedPattern: {
        id: "P-1",
        preferredName: "Pattern 1",
      },
      rankedMatches: [
        {
          patternId: "P-1",
          score: 0.9,
        },
      ],
    },
    syndromeResult: {
      selectedSyndrome: {
        id: "S-1",
        preferredName: "Syndrome 1",
      },
      rankedSyndromes: [
        {
          syndromeId: "S-1",
          score: 0.85,
        },
      ],
    },
    criteriaResults: [
      {
        criteriaSetId: "CSET-1",
        status: "MET",
      },
    ],
    classificationResult: {
      selectedClassification: {
        candidateId: "C-1",
        diseaseEntityId: "D-1",
      },
    },
    evidenceScores: [
      {
        hypothesisId: "D-1",
        status: "SUPPORTED",
        normalizedScore: 0.8,
      },
    ],
    reasoningResult: {
      selectedHypothesis: {
        diseaseId: "D-1",
        compositeScore: 0.82,
      },
    },
    consensusResult: {
      selectedConsensus: {
        hypothesisId: "D-1",
        consensusScore: 0.9,
      },
    },
    confidenceCalibrationResult: {
      caseId: "CASE-032",
      finalConfidenceScore: 0.88,
      confidenceLevel: "VERY_HIGH",
      requiresHumanReview: false,
    },
    uncertaintyResult: {
      caseId: "CASE-032",
      totalUncertaintyScore: 0.12,
      uncertaintyLevel: "VERY_LOW",
      requiresHumanReview: false,
      factors: [],
    },
    recommendations: [
      {
        recommendationId: "R-1",
        action: "Correlate clinically",
      },
    ],
    ...overrides,
  });

test("decision tree node is immutable", () => {
  const node =
    createDecisionTreeNode({
      id: "N-1",
      type: "ROOT",
      label: "Root",
    });

  assert.equal(Object.isFrozen(node), true);
});

test("decision tree edge validates weight", () => {
  assert.throws(
    () =>
      createDecisionTreeEdge({
        id: "E-1",
        fromNodeId: "N-1",
        toNodeId: "N-2",
        type: "LEADS_TO",
        weight: 2,
      }),
    /between 0 and 1/,
  );
});

test("input is immutable", () => {
  const value = input();
  assert.equal(Object.isFrozen(value), true);
  assert.equal(
    Object.isFrozen(value.evidenceScores),
    true,
  );
});

test("engine requires valid input", () => {
  assert.throws(
    () =>
      new ExplainableDecisionTreeEngine()
        .build(),
    /requires a valid input/,
  );
});

test("engine builds complete selected path", () => {
  const result =
    new ExplainableDecisionTreeEngine()
      .build(input());

  assert.ok(result.nodes.length >= 9);
  assert.ok(result.edges.length >= 8);
  assert.equal(
    result.selectedPath[0],
    result.rootNodeId,
  );
  assert.equal(
    result.selectedPath.at(-1),
    result.outcomeNodeId,
  );
});

test("tree includes confidence and uncertainty", () => {
  const result =
    new ExplainableDecisionTreeEngine()
      .build(input());

  assert.ok(
    result.nodes.some(
      (node) => node.type === "CONFIDENCE",
    ),
  );
  assert.ok(
    result.nodes.some(
      (node) => node.type === "UNCERTAINTY",
    ),
  );
});

test("tree represents opposing evidence", () => {
  const result =
    new ExplainableDecisionTreeEngine()
      .build(
        input({
          evidenceScores: [
            {
              hypothesisId: "D-1",
              status: "OPPOSED",
              normalizedScore: -0.7,
            },
          ],
        }),
      );

  assert.ok(
    result.nodes.some(
      (node) => node.status === "OPPOSED",
    ),
  );
  assert.ok(
    result.edges.some(
      (edge) => edge.type === "OPPOSES",
    ),
  );
});

test("uncertainty factors are included", () => {
  const result =
    new ExplainableDecisionTreeEngine()
      .build(
        input({
          uncertaintyResult: {
            caseId: "CASE-032",
            totalUncertaintyScore: 0.7,
            uncertaintyLevel: "HIGH",
            requiresHumanReview: true,
            factors: [
              {
                id: "UF-1",
                severity: 0.8,
                description:
                  "Missing confirmatory evidence",
                recommendation:
                  "Acquire additional evidence",
              },
            ],
          },
        }),
      );

  assert.ok(
    result.nodes.some(
      (node) =>
        node.sourceRef === "UF-1",
    ),
  );
  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("graph validator detects cycles", () => {
  const validator =
    new DecisionTreeGraphValidator();

  const nodes = [
    createDecisionTreeNode({
      id: "A",
      type: "ROOT",
      label: "A",
    }),
    createDecisionTreeNode({
      id: "B",
      type: "OUTCOME",
      label: "B",
    }),
  ];

  const edges = [
    createDecisionTreeEdge({
      id: "E-1",
      fromNodeId: "A",
      toNodeId: "B",
      type: "LEADS_TO",
    }),
    createDecisionTreeEdge({
      id: "E-2",
      fromNodeId: "B",
      toNodeId: "A",
      type: "LEADS_TO",
    }),
  ];

  const result =
    validator.validate({
      nodes,
      edges,
      rootNodeId: "A",
      outcomeNodeId: "B",
    });

  assert.equal(
    result.cycleDetected,
    true,
  );
});

test("missing hypothesis creates indeterminate outcome", () => {
  const result =
    new ExplainableDecisionTreeEngine()
      .build(
        createExplainableDecisionTreeInput({
          caseId: "CASE-NONE",
        }),
      );

  const outcome =
    result.nodes.find(
      (node) =>
        node.id ===
        result.outcomeNodeId,
    );

  assert.equal(
    outcome.status,
    "INDETERMINATE",
  );
});

test("repository stores decision tree", () => {
  const library =
    createExplainableDecisionTreeLibrary();

  const result =
    library.buildAndStore(input());

  assert.equal(
    library.repository.get("CASE-032"),
    result,
  );
});

test("audit trail contains node and edge ids", () => {
  const result =
    new ExplainableDecisionTreeEngine()
      .build(input());

  assert.equal(
    result.auditTrail.nodeIds.length,
    result.nodes.length,
  );
  assert.equal(
    result.auditTrail.edgeIds.length,
    result.edges.length,
  );
});

test("safety statement avoids diagnostic finality", () => {
  const result =
    new ExplainableDecisionTreeEngine()
      .build(input());

  assert.match(
    result.safetyStatement,
    /does not establish a definitive diagnosis/i,
  );
});
