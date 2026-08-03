import {
  MORPHOLOGY_EXPLANATION_VERSION,
  mergeExplanationPolicy,
} from "./ExplanationPolicy.js";

import {
  buildEvidenceNarrative,
} from "./EvidenceNarrative.js";

import {
  buildAlternativeExplanations,
} from "./AlternativeExplanation.js";

import {
  buildRejectedCandidateExplanations,
} from "./RejectedCandidateExplanation.js";

import {
  buildDecisionNarrative,
} from "./DecisionNarrative.js";

import {
  createExplanationSummary,
} from "./ExplanationSummary.js";

export class ExplanationEngine {
  constructor({
    policy = {},
  } = {}) {
    this.policy =
      mergeExplanationPolicy(policy);
  }

  explain({
    rankingResult,
    confidenceResult,
    specimenType = null,
  } = {}) {
    const startedAt =
      Date.now();

    if (
      !rankingResult ||
      typeof rankingResult !== "object"
    ) {
      throw new TypeError(
        "rankingResult is required.",
      );
    }

    if (
      !confidenceResult ||
      typeof confidenceResult !== "object"
    ) {
      throw new TypeError(
        "confidenceResult is required.",
      );
    }

    const originalRankingOrder =
      (rankingResult.ranking || [])
        .map(
          (item) =>
            item.cellId,
        );

    const originalConfidenceScore =
      Number(
        confidenceResult.score || 0,
      );

    const winner =
      rankingResult.winner || null;

    const evidence =
      buildEvidenceNarrative(
        winner,
        this.policy,
      );

    const alternatives =
      buildAlternativeExplanations(
        rankingResult,
        this.policy,
      );

    const rejectedCandidates =
      buildRejectedCandidateExplanations(
        rankingResult,
        this.policy,
      );

    const narrative =
      buildDecisionNarrative({
        rankingResult,
        confidenceResult,
        evidence,
        alternatives,
        policy:
          this.policy,
      });

    const reviewReasons = [
      ...(
        confidenceResult
          .reviewReasons || []
      ),
      ...(
        rankingResult
          ?.summary
          ?.reviewReasons || []
      ),
    ];

    if (
      this.policy
        .requireHumanReviewLanguage &&
      confidenceResult
        .humanReviewRecommended === true
    ) {
      reviewReasons.push(
        "EXPLANATION_REQUIRES_HUMAN_REVIEW_LANGUAGE",
      );
    }

    const currentRankingOrder =
      (rankingResult.ranking || [])
        .map(
          (item) =>
            item.cellId,
        );

    const currentConfidenceScore =
      Number(
        confidenceResult.score || 0,
      );

    const rankingPreserved =
      JSON.stringify(
        originalRankingOrder,
      ) ===
      JSON.stringify(
        currentRankingOrder,
      );

    const confidencePreserved =
      originalConfidenceScore ===
      currentConfidenceScore;

    return createExplanationSummary({
      version:
        MORPHOLOGY_EXPLANATION_VERSION,
      specimenType,
      winner:
        rankingResult.winner,
      runnerUp:
        rankingResult.runnerUp,
      confidence:
        confidenceResult,
      narrative,
      evidence,
      alternatives,
      rejectedCandidates,
      humanReviewRecommended:
        confidenceResult
          .humanReviewRecommended === true ||
        rankingResult
          ?.summary
          ?.humanReviewRecommended === true,
      reviewReasons:
        [...new Set(reviewReasons)],
      rankingPreserved,
      confidencePreserved,
      processingTimeMs:
        Date.now() - startedAt,
      policy:
        this.policy,
    });
  }
}
