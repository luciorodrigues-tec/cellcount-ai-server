import {
  DIFFERENTIAL_RECOMMENDATION_VERSION,
  mergeRecommendationPolicy,
} from "./RecommendationPolicy.js";

import {
  calculateRecommendationPriority,
} from "./RecommendationPriorityCalculator.js";

import {
  aggregateRecommendationEvidence,
} from "./RecommendationEvidenceAggregator.js";

import {
  buildRecommendationExplanation,
} from "./RecommendationExplanationBuilder.js";

import {
  buildRecommendationSummary,
} from "./RecommendationSummaryBuilder.js";

import {
  validateRecommendationSafety,
  sanitizeRecommendationLanguage,
} from "./RecommendationSafetyGovernor.js";

import {
  createRecommendationResult,
} from "./RecommendationResult.js";

function uniqueTests(
  rule,
) {
  const tests =
    rule?.recommendedTests || [];

  const map = new Map();

  for (const item of tests) {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  }

  return [...map.values()];
}

export class DifferentialRecommendationEngine {
  constructor({
    policy = {},
  } = {}) {
    this.policy =
      mergeRecommendationPolicy(
        policy,
      );
  }

  analyze({
    conflictResult,
    exclusiveFeatureResult,
  } = {}) {
    if (
      !conflictResult ||
      !exclusiveFeatureResult
    ) {
      throw new TypeError(
        "conflictResult and exclusiveFeatureResult are required.",
      );
    }

    const evidence =
      aggregateRecommendationEvidence(
        conflictResult,
        exclusiveFeatureResult,
      );

    const primaryProbability =
      Number(
        conflictResult
          ?.probabilities
          ?.winnerProbability || 0,
      );

    const alternativeProbability =
      Number(
        conflictResult
          ?.probabilities
          ?.alternativeProbability || 0,
      );

    const confidence =
      1 -
      Number(
        conflictResult
          ?.severity
          ?.score || 0,
      );

    const primaryPriority =
      calculateRecommendationPriority({
        probability:
          primaryProbability,
        discrimination:
          evidence
            .primaryDiscrimination,
        confidence,
        conflictPenalty:
          evidence.conflictPenalty,
        policy:
          this.policy,
      });

    const alternativePriority =
      calculateRecommendationPriority({
        probability:
          alternativeProbability,
        discrimination:
          evidence
            .alternativeDiscrimination,
        confidence,
        conflictPenalty:
          evidence.conflictPenalty,
        policy:
          this.policy,
      });

    const resolvedPrimaryCell =
      conflictResult
        ?.resolution
        ?.winnerChanged
        ? exclusiveFeatureResult
            .alternativeCell
        : exclusiveFeatureResult
            .primaryCell;

    const recommendations = [
      Object.freeze({
        cell:
          resolvedPrimaryCell,
        priority: 1,
        probability:
          conflictResult
            ?.resolution
            ?.winnerChanged
            ? alternativeProbability
            : primaryProbability,
        confidence:
          Number(
            confidence.toFixed(6),
          ),
        recommendationLevel:
          "PRIMARY",
        priorityScore:
          conflictResult
            ?.resolution
            ?.winnerChanged
            ? alternativePriority.score
            : primaryPriority.score,
        supportingEvidence:
          Object.freeze(
            conflictResult
              ?.resolution
              ?.winnerChanged
              ? evidence.alternative
              : evidence.primary,
          ),
        conflictingEvidence:
          Object.freeze(
            conflictResult
              ?.conflicts || [],
          ),
        limitations:
          Object.freeze(
            evidence.missing,
          ),
      }),
      Object.freeze({
        cell:
          conflictResult
            ?.resolution
            ?.winnerChanged
            ? exclusiveFeatureResult
                .primaryCell
            : exclusiveFeatureResult
                .alternativeCell,
        priority: 2,
        probability:
          conflictResult
            ?.resolution
            ?.winnerChanged
            ? primaryProbability
            : alternativeProbability,
        confidence:
          Number(
            confidence.toFixed(6),
          ),
        recommendationLevel:
          alternativePriority.level ===
          "PRIMARY"
            ? "SECONDARY"
            : alternativePriority.level,
        priorityScore:
          conflictResult
            ?.resolution
            ?.winnerChanged
            ? primaryPriority.score
            : alternativePriority.score,
        supportingEvidence:
          Object.freeze(
            conflictResult
              ?.resolution
              ?.winnerChanged
              ? evidence.primary
              : evidence.alternative,
          ),
        conflictingEvidence:
          Object.freeze(
            conflictResult
              ?.conflicts || [],
          ),
        limitations:
          Object.freeze(
            evidence.missing,
          ),
      }),
    ].sort(
      (first, second) =>
        first.priority -
        second.priority,
    );

    const explanation =
      buildRecommendationExplanation({
        primaryCell:
          recommendations[0].cell,
        alternativeCell:
          recommendations[1].cell,
        primaryProbability:
          recommendations[0]
            .probability,
        alternativeProbability:
          recommendations[1]
            .probability,
        resolution:
          conflictResult
            .resolution,
        evidence,
      });

    const sanitizedText =
      sanitizeRecommendationLanguage(
        explanation.fullText,
      );

    const safetyValidation =
      validateRecommendationSafety(
        sanitizedText,
      );

    const recommendedCorrelation =
      this.policy
        .includeRecommendedTests
        ? uniqueTests(
            exclusiveFeatureResult
              ?.pair
              ?.rule,
          )
        : [];

    const limitations =
      this.policy.includeLimitations
        ? [
            ...evidence.missing.map(
              (item) =>
                item.featureId,
            ),
            ...(
              conflictResult
                ?.resolution
                ?.insufficientEvidence
                ? [
                    "Evidência discriminativa insuficiente.",
                  ]
                : []
            ),
          ]
        : [];

    const safetyStatement =
      "Resultado destinado a apoio à decisão morfológica; requer correlação clínica, laboratorial e revisão profissional.";

    const summary =
      buildRecommendationSummary({
        recommendations,
        recommendedCorrelation,
        limitations,
        safetyStatement,
      });

    return createRecommendationResult({
      version:
        DIFFERENTIAL_RECOMMENDATION_VERSION,
      pairId:
        exclusiveFeatureResult
          .pairId,
      recommendations,
      explanation: {
        ...explanation,
        fullText:
          sanitizedText,
      },
      summary,
      safetyValidation,
      metadata: {
        conflictAdjusted:
          conflictResult
            .conflictDetected === true,
        policy:
          this.policy,
      },
    });
  }

  analyzeMany({
    conflictResults = [],
    exclusiveFeatureResults = [],
  } = {}) {
    const byPair =
      new Map(
        exclusiveFeatureResults.map(
          (item) => [
            item.pairId,
            item,
          ],
        ),
      );

    return Object.freeze(
      conflictResults
        .map(
          (conflictResult) => {
            const exclusiveFeatureResult =
              byPair.get(
                conflictResult.pairId,
              );

            return exclusiveFeatureResult
              ? this.analyze({
                  conflictResult,
                  exclusiveFeatureResult,
                })
              : null;
          },
        )
        .filter(Boolean),
    );
  }
}
