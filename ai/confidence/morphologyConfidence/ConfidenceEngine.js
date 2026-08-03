import {
  MORPHOLOGY_CONFIDENCE_VERSION,
  ConfidenceLevel,
  mergeConfidencePolicy,
} from "./ConfidencePolicy.js";

import {
  calculateConfidenceFactors,
} from "./ConfidenceFactors.js";

import {
  calculateConfidencePenalties,
} from "./ConfidencePenalty.js";

import {
  normalizeConfidenceScore,
} from "./ConfidenceNormalizer.js";

import {
  buildConfidenceExplanation,
} from "./ConfidenceExplanation.js";

import {
  createConfidenceSummary,
} from "./ConfidenceSummary.js";

function round(value) {
  return Number(
    Number(value || 0)
      .toFixed(6),
  );
}

function classifyLevel(
  score,
  available,
  policy,
) {
  if (!available) {
    return ConfidenceLevel.unavailable;
  }

  if (
    score >=
    policy.veryHighThreshold
  ) {
    return ConfidenceLevel.veryHigh;
  }

  if (
    score >=
    policy.highThreshold
  ) {
    return ConfidenceLevel.high;
  }

  if (
    score >=
    policy.moderateThreshold
  ) {
    return ConfidenceLevel.moderate;
  }

  if (
    score >=
    policy.lowThreshold
  ) {
    return ConfidenceLevel.low;
  }

  return ConfidenceLevel.veryLow;
}

export class ConfidenceEngine {
  constructor({
    policy = {},
  } = {}) {
    this.policy =
      mergeConfidencePolicy(policy);
  }

  calculate(
    rankingResult,
  ) {
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

    const originalOrder =
      (rankingResult.ranking || [])
        .map(
          (item) =>
            item.cellId,
        );

    const factors =
      calculateConfidenceFactors(
        rankingResult,
        this.policy,
      );

    const penalties =
      calculateConfidencePenalties(
        rankingResult,
        this.policy,
      );

    const rawScore =
      factors.available
        ? factors.positiveScore -
          penalties.totalPenalty
        : 0;

    const score =
      round(
        normalizeConfidenceScore(
          rawScore,
          {
            clamp:
              this.policy
                .clampScore,
          },
        ),
      );

    const level =
      classifyLevel(
        score,
        factors.available,
        this.policy,
      );

    const explanation =
      buildConfidenceExplanation(
        factors,
        penalties,
      );

    const reviewReasons = [
      ...(
        rankingResult
          ?.summary
          ?.reviewReasons || []
      ),
    ];

    if (!factors.available) {
      reviewReasons.push(
        "CONFIDENCE_UNAVAILABLE",
      );
    }

    if (
      score <
      this.policy
        .humanReviewThreshold
    ) {
      reviewReasons.push(
        "CONFIDENCE_BELOW_HUMAN_REVIEW_THRESHOLD",
      );
    }

    if (
      penalties.totalPenalty > 0.25
    ) {
      reviewReasons.push(
        "MATERIAL_CONFIDENCE_PENALTIES",
      );
    }

    const currentOrder =
      (rankingResult.ranking || [])
        .map(
          (item) =>
            item.cellId,
        );

    const rankingPreserved =
      JSON.stringify(
        originalOrder,
      ) ===
      JSON.stringify(
        currentOrder,
      );

    return createConfidenceSummary({
      version:
        MORPHOLOGY_CONFIDENCE_VERSION,
      winner:
        rankingResult.winner,
      score,
      level,
      available:
        factors.available,
      factors: {
        ...factors,
        positiveScore:
          round(
            factors.positiveScore,
          ),
      },
      penalties: {
        ...penalties,
        totalPenalty:
          round(
            penalties.totalPenalty,
          ),
      },
      explanation,
      humanReviewRecommended:
        reviewReasons.length > 0,
      reviewReasons:
        [...new Set(reviewReasons)],
      rankingPreserved,
      processingTimeMs:
        Date.now() - startedAt,
      policy:
        this.policy,
    });
  }
}
