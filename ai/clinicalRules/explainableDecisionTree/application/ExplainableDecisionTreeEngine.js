import {
  createDecisionTreeNode,
} from "../domain/DecisionTreeNode.js";

import {
  createDecisionTreeEdge,
} from "../domain/DecisionTreeEdge.js";

import {
  createExplainableDecisionTreeResult,
} from "../domain/ExplainableDecisionTreeResult.js";

import {
  mergeExplainableDecisionTreePolicy,
} from "../domain/ExplainableDecisionTreePolicy.js";

import {
  DecisionTreeGraphValidator,
} from "./DecisionTreeGraphValidator.js";

import {
  DecisionPathExtractor,
} from "./DecisionPathExtractor.js";

export const EXPLAINABLE_DECISION_TREE_ENGINE_VERSION =
  "CRR-000032-v1.0.0";

export class ExplainableDecisionTreeEngine {
  constructor({
    policy = {},
    clock = () => new Date(),
  } = {}) {
    this.policy =
      mergeExplainableDecisionTreePolicy(policy);
    this.clock = clock;
    this.validator = new DecisionTreeGraphValidator();
    this.pathExtractor = new DecisionPathExtractor();
  }

  build(input) {
    if (!input?.caseId) {
      throw new TypeError(
        "ExplainableDecisionTreeEngine requires a valid input.",
      );
    }

    const nodes = [];
    const edges = [];
    let nodeCounter = 0;
    let edgeCounter = 0;

    const addNode = (node) => {
      if (nodes.length >= this.policy.maximumNodes) {
        return null;
      }
      nodes.push(node);
      return node.id;
    };

    const addEdge = (fromNodeId, toNodeId, type, rationale = "") => {
      if (
        !fromNodeId ||
        !toNodeId ||
        edges.length >= this.policy.maximumEdges
      ) {
        return null;
      }

      const edge = createDecisionTreeEdge({
        id: `EDGE-${++edgeCounter}`,
        fromNodeId,
        toNodeId,
        type,
        rationale,
      });

      edges.push(edge);
      return edge.id;
    };

    const nextNodeId = (prefix) =>
      `${prefix}-${++nodeCounter}`;

    const rootNodeId = addNode(
      createDecisionTreeNode({
        id: nextNodeId("ROOT"),
        type: "ROOT",
        label: `Clinical reasoning for ${input.caseId}`,
        status: "INFORMATIONAL",
        rationale:
          "Root of the explainable clinical decision tree.",
      }),
    );

    let previousStageNodeId = rootNodeId;

    const pattern =
      input.patternResult?.selectedPattern || null;
    if (pattern) {
      const id = addNode(
        createDecisionTreeNode({
          id: nextNodeId("PATTERN"),
          type: "PATTERN",
          label:
            pattern.preferredName ||
            pattern.id ||
            "Selected morphologic pattern",
          status: "SELECTED",
          score:
            input.patternResult?.rankedMatches?.[0]?.score ?? null,
          rationale:
            "Pattern selected by morphologic recognition.",
          sourceRef: pattern.id || null,
        }),
      );
      addEdge(previousStageNodeId, id, "LEADS_TO");
      previousStageNodeId = id;
    }

    const syndrome =
      input.syndromeResult?.selectedSyndrome || null;
    if (syndrome) {
      const id = addNode(
        createDecisionTreeNode({
          id: nextNodeId("SYNDROME"),
          type: "SYNDROME",
          label:
            syndrome.preferredName ||
            syndrome.id ||
            "Selected hematologic syndrome",
          status: "SELECTED",
          score:
            input.syndromeResult?.rankedSyndromes?.[0]?.score ?? null,
          rationale:
            "Syndrome selected from the recognized morphologic pattern.",
          sourceRef: syndrome.id || null,
        }),
      );
      addEdge(previousStageNodeId, id, "LEADS_TO");
      previousStageNodeId = id;
    }

    for (const criterion of input.criteriaResults) {
      const status =
        criterion.status === "MET"
          ? "SUPPORTED"
          : criterion.status === "EXCLUDED"
            ? "OPPOSED"
            : "INDETERMINATE";

      const id = addNode(
        createDecisionTreeNode({
          id: nextNodeId("CRITERIA"),
          type: "CRITERIA",
          label:
            criterion.criteriaSetId ||
            criterion.criterionId ||
            "Diagnostic criterion",
          status,
          rationale:
            criterion.explanation?.summary ||
            `Criterion status ${criterion.status || "UNKNOWN"}.`,
          sourceRef:
            criterion.criteriaSetId ||
            criterion.criterionId ||
            null,
        }),
      );

      addEdge(
        previousStageNodeId,
        id,
        status === "SUPPORTED"
          ? "SUPPORTS"
          : status === "OPPOSED"
            ? "OPPOSES"
            : "QUALIFIES",
      );
    }

    const classification =
      input.classificationResult?.selectedClassification || null;
    let classificationNodeId = null;

    if (classification) {
      classificationNodeId = addNode(
        createDecisionTreeNode({
          id: nextNodeId("CLASSIFICATION"),
          type: "CLASSIFICATION",
          label:
            classification.label ||
            classification.candidateId ||
            classification.diseaseEntityId ||
            "Selected classification",
          status: "SELECTED",
          rationale:
            input.classificationResult?.explanation?.summary ||
            "Classification selected by the diagnostic classification engine.",
          sourceRef:
            classification.candidateId ||
            classification.diseaseEntityId ||
            null,
        }),
      );

      addEdge(
        previousStageNodeId,
        classificationNodeId,
        "LEADS_TO",
      );
      previousStageNodeId = classificationNodeId;
    }

    if (this.policy.includeEvidence) {
      for (const evidence of input.evidenceScores) {
        const direction =
          evidence.status === "SUPPORTED"
            ? "SUPPORTED"
            : evidence.status === "OPPOSED"
              ? "OPPOSED"
              : evidence.status === "CONFLICTED"
                ? "CONFLICTED"
                : evidence.status === "ABSTAINED"
                  ? "ABSTAINED"
                  : "INDETERMINATE";

        const id = addNode(
          createDecisionTreeNode({
            id: nextNodeId("EVIDENCE"),
            type: "EVIDENCE",
            label:
              evidence.hypothesisId ||
              "Evidence score",
            status: direction,
            score:
              evidence.normalizedScore == null
                ? null
                : Math.max(
                    0,
                    Math.min(
                      1,
                      (Number(evidence.normalizedScore) + 1) / 2,
                    ),
                  ),
            rationale:
              evidence.explanation?.summary ||
              `Evidence status ${evidence.status || "UNKNOWN"}.`,
            sourceRef:
              evidence.hypothesisId || null,
          }),
        );

        addEdge(
          classificationNodeId || previousStageNodeId,
          id,
          direction === "SUPPORTED"
            ? "SUPPORTS"
            : direction === "OPPOSED"
              ? "OPPOSES"
              : direction === "CONFLICTED"
                ? "CONFLICTS_WITH"
                : "QUALIFIES",
        );
      }
    }

    const reasoning =
      input.reasoningResult?.selectedHypothesis || null;
    let reasoningNodeId = null;

    if (reasoning) {
      reasoningNodeId = addNode(
        createDecisionTreeNode({
          id: nextNodeId("REASONING"),
          type: "REASONING",
          label:
            reasoning.diseaseId ||
            "Selected hematologic hypothesis",
          status: "SELECTED",
          score:
            reasoning.compositeScore ?? null,
          rationale:
            input.reasoningResult?.explanation?.summary ||
            "Hypothesis selected by hematologic diagnostic reasoning.",
          sourceRef:
            reasoning.diseaseId || null,
        }),
      );

      addEdge(
        classificationNodeId || previousStageNodeId,
        reasoningNodeId,
        "LEADS_TO",
      );
      previousStageNodeId = reasoningNodeId;
    }

    const consensus =
      input.consensusResult?.selectedConsensus || null;
    let consensusNodeId = null;

    if (consensus) {
      consensusNodeId = addNode(
        createDecisionTreeNode({
          id: nextNodeId("CONSENSUS"),
          type: "CONSENSUS",
          label:
            consensus.hypothesisId ||
            "Diagnostic consensus",
          status: "SELECTED",
          score:
            consensus.consensusScore == null
              ? null
              : Math.max(
                  0,
                  Math.min(
                    1,
                    Number(consensus.consensusScore),
                  ),
                ),
          rationale:
            input.consensusResult?.explanation?.summary ||
            "Consensus reached across diagnostic engines.",
          sourceRef:
            consensus.hypothesisId || null,
        }),
      );

      addEdge(
        reasoningNodeId || previousStageNodeId,
        consensusNodeId,
        "LEADS_TO",
      );
      previousStageNodeId = consensusNodeId;
    }

    const confidence =
      input.confidenceCalibrationResult || null;
    let confidenceNodeId = null;

    if (confidence) {
      confidenceNodeId = addNode(
        createDecisionTreeNode({
          id: nextNodeId("CONFIDENCE"),
          type: "CONFIDENCE",
          label:
            `Calibrated confidence: ${confidence.confidenceLevel || "UNKNOWN"}`,
          status:
            confidence.requiresHumanReview
              ? "INDETERMINATE"
              : "SUPPORTED",
          score:
            confidence.finalConfidenceScore ?? null,
          rationale:
            confidence.explanation?.summary ||
            "Confidence calibrated from independent clinical engines.",
          sourceRef:
            confidence.caseId || input.caseId,
        }),
      );

      addEdge(
        consensusNodeId || previousStageNodeId,
        confidenceNodeId,
        "QUALIFIES",
      );
      previousStageNodeId = confidenceNodeId;
    }

    const uncertainty =
      input.uncertaintyResult || null;
    let uncertaintyNodeId = null;

    if (uncertainty) {
      uncertaintyNodeId = addNode(
        createDecisionTreeNode({
          id: nextNodeId("UNCERTAINTY"),
          type: "UNCERTAINTY",
          label:
            `Diagnostic uncertainty: ${uncertainty.uncertaintyLevel || "UNKNOWN"}`,
          status:
            uncertainty.requiresHumanReview
              ? "INDETERMINATE"
              : "INFORMATIONAL",
          score:
            uncertainty.totalUncertaintyScore ?? null,
          rationale:
            uncertainty.explanation?.summary ||
            "Residual uncertainty quantified after confidence calibration.",
          sourceRef:
            uncertainty.caseId || input.caseId,
        }),
      );

      addEdge(
        confidenceNodeId || previousStageNodeId,
        uncertaintyNodeId,
        "LIMITS",
      );
      previousStageNodeId = uncertaintyNodeId;

      if (this.policy.includeUncertaintyFactors) {
        for (const factor of uncertainty.factors || []) {
          const id = addNode(
            createDecisionTreeNode({
              id: nextNodeId("UNCERTAINTY-FACTOR"),
              type: "UNCERTAINTY",
              label: factor.description,
              status: "INDETERMINATE",
              score: factor.severity,
              rationale:
                factor.recommendation ||
                "Uncertainty factor.",
              sourceRef: factor.id,
            }),
          );

          addEdge(
            uncertaintyNodeId,
            id,
            "DERIVED_FROM",
          );
        }
      }
    }

    if (this.policy.includeRecommendations) {
      for (const recommendation of input.recommendations) {
        const id = addNode(
          createDecisionTreeNode({
            id: nextNodeId("RECOMMENDATION"),
            type: "RECOMMENDATION",
            label:
              recommendation.action ||
              recommendation.title ||
              recommendation.recommendationId ||
              "Clinical recommendation",
            status: "INFORMATIONAL",
            rationale:
              recommendation.rationale ||
              recommendation.explanation?.summary ||
              "Structured recommendation.",
            sourceRef:
              recommendation.recommendationId ||
              recommendation.id ||
              null,
          }),
        );

        addEdge(
          previousStageNodeId,
          id,
          "LEADS_TO",
        );
      }
    }

    const selectedLabel =
      consensus?.hypothesisId ||
      reasoning?.diseaseId ||
      classification?.diseaseEntityId ||
      classification?.candidateId ||
      "No selected hypothesis";

    const outcomeNodeId = addNode(
      createDecisionTreeNode({
        id: nextNodeId("OUTCOME"),
        type: "OUTCOME",
        label: selectedLabel,
        status:
          selectedLabel === "No selected hypothesis"
            ? "INDETERMINATE"
            : "SELECTED",
        rationale:
          "Final structured outcome of the explainable decision path.",
        sourceRef:
          selectedLabel === "No selected hypothesis"
            ? null
            : selectedLabel,
      }),
    );

    addEdge(
      previousStageNodeId,
      outcomeNodeId,
      "LEADS_TO",
    );

    const graphValidation =
      this.validator.validate({
        nodes,
        edges,
        rootNodeId,
        outcomeNodeId,
      });

    const paths =
      this.pathExtractor.extract({
        rootNodeId,
        outcomeNodeId,
        edges,
      });

    const requiresHumanReview =
      (
        graphValidation.cycleDetected &&
        this.policy.requireHumanReviewOnCycle
      ) ||
      (
        graphValidation.disconnectedOutcome &&
        this.policy.requireHumanReviewOnDisconnectedOutcome
      ) ||
      input.confidenceCalibrationResult?.requiresHumanReview === true ||
      input.uncertaintyResult?.requiresHumanReview === true;

    return createExplainableDecisionTreeResult({
      caseId: input.caseId,
      rootNodeId,
      outcomeNodeId,
      nodes,
      edges,
      selectedPath: paths.selectedPath,
      alternativePaths: paths.alternativePaths,
      cycleDetected:
        graphValidation.cycleDetected,
      disconnectedOutcome:
        graphValidation.disconnectedOutcome,
      requiresHumanReview,
      explanation: {
        summary:
          `Decision tree contains ${nodes.length} nodes and ${edges.length} edges.`,
        rationale:
          `Selected path length ${paths.selectedPath.length}; alternatives ${paths.alternativePaths.length}; cycle ${graphValidation.cycleDetected}; disconnected outcome ${graphValidation.disconnectedOutcome}.`,
        safetyStatement:
          "The decision tree explains structured reasoning and does not establish a definitive diagnosis.",
      },
      auditTrail: {
        engineVersion:
          EXPLAINABLE_DECISION_TREE_ENGINE_VERSION,
        policyVersion:
          this.policy.version,
        nodeIds:
          Object.freeze(nodes.map((node) => node.id)),
        edgeIds:
          Object.freeze(edges.map((edge) => edge.id)),
      },
      createdAt:
        this.clock().toISOString(),
      metadata: {
        sourceMetadata:
          input.metadata,
      },
    });
  }
}
