import {
  RecommendationLevel,
} from "./RecommendationPolicy.js";

function clamp01(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(0, Math.min(1, number));
}

export function classifyRecommendationLevel(
  score,
  policy,
) {
  if (score >= policy.primaryThreshold) {
    return RecommendationLevel.primary;
  }

  if (score >= policy.secondaryThreshold) {
    return RecommendationLevel.secondary;
  }

  if (score >= policy.tertiaryThreshold) {
    return RecommendationLevel.tertiary;
  }

  if (
    score >=
    policy.lowPriorityThreshold
  ) {
    return RecommendationLevel.lowPriority;
  }

  return RecommendationLevel.unlikely;
}

export function calculateRecommendationPriority({
  probability = 0,
  discrimination = 0,
  confidence = 0,
  conflictPenalty = 0,
  policy,
} = {}) {
  const score =
    (
      clamp01(probability) *
      policy.probabilityWeight
    ) +
    (
      clamp01(discrimination) *
      policy.discriminationWeight
    ) +
    (
      clamp01(confidence) *
      policy.confidenceWeight
    ) +
    (
      (1 - clamp01(conflictPenalty)) *
      policy.conflictPenaltyWeight
    );

  const normalized =
    Number(
      clamp01(score).toFixed(6),
    );

  return Object.freeze({
    score: normalized,
    level:
      classifyRecommendationLevel(
        normalized,
        policy,
      ),
  });
}
