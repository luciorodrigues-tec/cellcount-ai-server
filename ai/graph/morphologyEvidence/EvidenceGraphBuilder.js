import {
  EvidenceGraph,
} from "./EvidenceGraph.js";

import {
  createEvidenceGraphNode,
} from "./EvidenceGraphNode.js";

import {
  createEvidenceGraphEdge,
} from "./EvidenceGraphEdge.js";

import {
  MORPHOLOGY_EVIDENCE_GRAPH_VERSION,
  EvidenceNodeType,
  EvidenceEdgeType,
  mergeEvidenceGraphPolicy,
} from "./EvidenceGraphPolicy.js";

function safeId(value) {
  return String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9_.:-]+/g, "_");
}

function addCellNode(
  graph,
  candidate,
  {
    status,
  } = {},
) {
  if (!candidate?.cellId) {
    return null;
  }

  const id =
    `cell:${safeId(candidate.cellId)}`;

  return graph.addNode(
    createEvidenceGraphNode({
      id,
      type:
        EvidenceNodeType.cell,
      label:
        candidate.cellId,
      data: {
        cellId:
          candidate.cellId,
        rank:
          candidate.rank || null,
        score:
          Number(
            candidate.score || 0,
          ),
        normalizedScore:
          Number(
            candidate.normalizedScore || 0,
          ),
        coverage:
          Number(
            candidate.coverage || 0,
          ),
        requiredCoverage:
          Number(
            candidate.requiredCoverage || 0,
          ),
        status:
          status || null,
      },
      tags: [
        status || "",
        candidate.isWinner
          ? "winner"
          : "",
        candidate.isRunnerUp
          ? "runner_up"
          : "",
      ],
    }),
  );
}

function addFeatureEvidence(
  graph,
  winner,
  explanation,
) {
  const winnerNodeId =
    winner?.cellId
      ? `cell:${safeId(winner.cellId)}`
      : null;

  if (!winnerNodeId) {
    return;
  }

  const groups = [
    {
      items:
        explanation
          ?.evidence
          ?.supportingEvidence || [],
      edgeType:
        EvidenceEdgeType.supports,
      tag:
        "supporting",
    },
    {
      items:
        explanation
          ?.evidence
          ?.contradictoryEvidence || [],
      edgeType:
        EvidenceEdgeType.contradicts,
      tag:
        "contradictory",
    },
    {
      items:
        explanation
          ?.evidence
          ?.missingRequiredEvidence || [],
      edgeType:
        EvidenceEdgeType.requires,
      tag:
        "missing_required",
    },
  ];

  for (const group of groups) {
    for (const item of group.items) {
      const featureNodeId =
        `feature:${safeId(item.featureId)}`;

      const criterionNodeId =
        item.sourceCriterionId
          ? `criterion:${safeId(item.sourceCriterionId)}`
          : null;

      graph.addNode(
        createEvidenceGraphNode({
          id:
            featureNodeId,
          type:
            EvidenceNodeType.feature,
          label:
            item.label ||
            item.featureId,
          data: {
            featureId:
              item.featureId,
            confidence:
              Number(
                item.confidence || 0,
              ),
            similarity:
              Number(
                item.similarity || 0,
              ),
            contribution:
              Number(
                item.contribution || 0,
              ),
            penalty:
              Number(
                item.penalty || 0,
              ),
            statement:
              item.statement || "",
          },
          tags: [
            group.tag,
            item.role || "",
          ],
        }),
      );

      graph.addEdge(
        createEvidenceGraphEdge({
          source:
            featureNodeId,
          target:
            winnerNodeId,
          type:
            group.edgeType,
          weight:
            Number(
              item.contribution ||
              item.penalty ||
              0,
            ),
          data: {
            statement:
              item.statement || "",
          },
        }),
      );

      if (criterionNodeId) {
        graph.addNode(
          createEvidenceGraphNode({
            id:
              criterionNodeId,
            type:
              EvidenceNodeType.criterion,
            label:
              item.sourceCriterionId,
            data: {
              criterionId:
                item.sourceCriterionId,
              role:
                item.role || null,
            },
            tags: [
              group.tag,
            ],
          }),
        );

        graph.addEdge(
          createEvidenceGraphEdge({
            source:
              featureNodeId,
            target:
              criterionNodeId,
            type:
              EvidenceEdgeType.matchedBy,
            weight:
              Number(
                item.contribution ||
                item.penalty ||
                0,
              ),
          }),
        );

        graph.addEdge(
          createEvidenceGraphEdge({
            source:
              criterionNodeId,
            target:
              winnerNodeId,
            type:
              group.edgeType,
            weight:
              Number(
                item.contribution ||
                item.penalty ||
                0,
              ),
          }),
        );
      }
    }
  }
}

function addConfidenceGraph(
  graph,
  explanation,
  policy,
) {
  if (
    policy
      .includeConfidenceFactors !== true
  ) {
    return;
  }

  const confidence =
    explanation?.confidence;

  if (!confidence) {
    return;
  }

  const confidenceNodeId =
    "confidence:final";

  graph.addNode(
    createEvidenceGraphNode({
      id:
        confidenceNodeId,
      type:
        EvidenceNodeType.confidence,
      label:
        `Confidence ${confidence.level || "UNAVAILABLE"}`,
      data: {
        score:
          Number(
            confidence.score || 0,
          ),
        level:
          confidence.level ||
          "UNAVAILABLE",
        available:
          confidence.available === true,
      },
      tags: [
        confidence.level ||
        "UNAVAILABLE",
      ],
    }),
  );

  if (explanation?.winner?.cellId) {
    graph.addEdge(
      createEvidenceGraphEdge({
        source:
          `cell:${safeId(explanation.winner.cellId)}`,
        target:
          confidenceNodeId,
        type:
          EvidenceEdgeType.contributesTo,
        weight:
          Number(
            confidence.score || 0,
          ),
      }),
    );
  }

  const factors =
    confidence
      ?.explanation
      ?.positiveFactors || [];

  for (const factor of factors) {
    const factorNodeId =
      `evidence:confidence:${safeId(factor.code)}`;

    graph.addNode(
      createEvidenceGraphNode({
        id:
          factorNodeId,
        type:
          EvidenceNodeType.evidence,
        label:
          factor.message ||
          factor.code,
        data: {
          code:
            factor.code,
          value:
            Number(
              factor.value || 0,
            ),
        },
        tags: [
          "confidence_positive",
        ],
      }),
    );

    graph.addEdge(
      createEvidenceGraphEdge({
        source:
          factorNodeId,
        target:
          confidenceNodeId,
        type:
          EvidenceEdgeType.contributesTo,
        weight:
          Number(
            factor.value || 0,
          ),
      }),
    );
  }

  if (
    policy.includePenalties === true
  ) {
    for (
      const penalty
      of confidence
        ?.penalties
        ?.penalties || []
    ) {
      const penaltyNodeId =
        `penalty:${safeId(penalty.code)}`;

      graph.addNode(
        createEvidenceGraphNode({
          id:
            penaltyNodeId,
          type:
            EvidenceNodeType.penalty,
          label:
            penalty.reason ||
            penalty.code,
          data: {
            code:
              penalty.code,
            amount:
              Number(
                penalty.amount || 0,
              ),
          },
          tags: [
            "confidence_penalty",
          ],
        }),
      );

      graph.addEdge(
        createEvidenceGraphEdge({
          source:
            penaltyNodeId,
          target:
            confidenceNodeId,
          type:
            EvidenceEdgeType.penalizes,
          weight:
            Number(
              penalty.amount || 0,
            ),
        }),
      );
    }
  }
}

export class EvidenceGraphBuilder {
  constructor({
    policy = {},
  } = {}) {
    this.policy =
      mergeEvidenceGraphPolicy(
        policy,
      );
  }

  build({
    explanation,
    specimenType = null,
  } = {}) {
    if (
      !explanation ||
      typeof explanation !== "object"
    ) {
      throw new TypeError(
        "explanation is required.",
      );
    }

    const graph =
      new EvidenceGraph({
        version:
          MORPHOLOGY_EVIDENCE_GRAPH_VERSION,
        policy:
          this.policy,
      });

    const decisionNodeId =
      "decision:morphology";

    graph.addNode(
      createEvidenceGraphNode({
        id:
          decisionNodeId,
        type:
          EvidenceNodeType.decision,
        label:
          explanation
            ?.narrative
            ?.headline ||
          "Morphologic decision",
        data: {
          conclusion:
            explanation
              ?.narrative
              ?.conclusion || "",
          rationale:
            explanation
              ?.narrative
              ?.rationale || "",
          safetyStatement:
            explanation
              ?.narrative
              ?.safetyStatement || "",
          humanReviewRecommended:
            explanation
              ?.humanReviewRecommended === true,
        },
        tags: [
          "morphologic_decision",
        ],
      }),
    );

    if (
      specimenType &&
      this.policy
        .includeSpecimenNode === true
    ) {
      const specimenNodeId =
        `specimen:${safeId(specimenType)}`;

      graph.addNode(
        createEvidenceGraphNode({
          id:
            specimenNodeId,
          type:
            EvidenceNodeType.specimen,
          label:
            specimenType,
          data: {
            specimenType,
          },
        }),
      );

      graph.addEdge(
        createEvidenceGraphEdge({
          source:
            decisionNodeId,
          target:
            specimenNodeId,
          type:
            EvidenceEdgeType.appliesToSpecimen,
        }),
      );
    }

    const winner =
      explanation.winner || null;

    const winnerNode =
      addCellNode(
        graph,
        winner,
        {
          status:
            winner
              ? "WINNER"
              : null,
        },
      );

    if (winnerNode) {
      graph.addEdge(
        createEvidenceGraphEdge({
          source:
            decisionNodeId,
          target:
            winnerNode.id,
          type:
            EvidenceEdgeType.classifiedAs,
          weight:
            Number(
              explanation
                ?.confidence
                ?.score || 0,
            ),
        }),
      );
    }

    const runnerUp =
      explanation.runnerUp || null;

    const runnerUpNode =
      addCellNode(
        graph,
        runnerUp,
        {
          status:
            runnerUp
              ? "RUNNER_UP"
              : null,
        },
      );

    if (
      winnerNode &&
      runnerUpNode
    ) {
      graph.addEdge(
        createEvidenceGraphEdge({
          source:
            winnerNode.id,
          target:
            runnerUpNode.id,
          type:
            EvidenceEdgeType.rankedAbove,
          weight:
            Number(
              runnerUp
                .marginFromWinner || 0,
            ),
        }),
      );

      graph.addEdge(
        createEvidenceGraphEdge({
          source:
            runnerUpNode.id,
          target:
            winnerNode.id,
          type:
            EvidenceEdgeType.alternativeTo,
        }),
      );
    }

    for (
      const alternative
      of (
        explanation.alternatives || []
      ).slice(
        0,
        this.policy.maxAlternatives,
      )
    ) {
      const node =
        addCellNode(
          graph,
          alternative,
          {
            status:
              "ALTERNATIVE",
          },
        );

      if (
        node &&
        winnerNode
      ) {
        graph.addEdge(
          createEvidenceGraphEdge({
            source:
              node.id,
            target:
              winnerNode.id,
            type:
              EvidenceEdgeType.alternativeTo,
            weight:
              Number(
                alternative
                  .marginFromWinner || 0,
              ),
          }),
        );
      }
    }

    if (
      this.policy
        .includeRejectedCandidates === true
    ) {
      for (
        const rejected
        of (
          explanation
            .rejectedCandidates || []
        ).slice(
          0,
          this.policy
            .maxRejectedCandidates,
        )
      ) {
        const node =
          addCellNode(
            graph,
            rejected,
            {
              status:
                "REJECTED",
            },
          );

        if (node) {
          graph.addEdge(
            createEvidenceGraphEdge({
              source:
                node.id,
              target:
                decisionNodeId,
              type:
                EvidenceEdgeType.excludes,
              data: {
                rejectedReasons:
                  rejected
                    .rejectedReasons || [],
              },
            }),
          );
        }
      }
    }

    addFeatureEvidence(
      graph,
      winner,
      explanation,
    );

    addConfidenceGraph(
      graph,
      explanation,
      this.policy,
    );

    if (
      explanation
        .humanReviewRecommended === true
    ) {
      const reviewNodeId =
        "review:human";

      graph.addNode(
        createEvidenceGraphNode({
          id:
            reviewNodeId,
          type:
            EvidenceNodeType.review,
          label:
            "Human review recommended",
          data: {
            reasons:
              explanation
                .reviewReasons || [],
          },
          tags: [
            "safety",
            "human_review",
          ],
        }),
      );

      graph.addEdge(
        createEvidenceGraphEdge({
          source:
            decisionNodeId,
          target:
            reviewNodeId,
          type:
            EvidenceEdgeType.requiresReview,
        }),
      );
    }

    return graph.snapshot();
  }
}
