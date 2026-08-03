import {
  ExclusiveFeatureClass,
} from "./ExclusiveFeaturePolicy.js";

function clamp01(value) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(1, number),
  );
}

function round(value) {
  return Number(
    Number(value || 0)
      .toFixed(6),
  );
}

export function classifyDiscrimination(
  score,
  policy,
) {
  if (
    score >=
    policy.pathognomonicThreshold
  ) {
    return ExclusiveFeatureClass
      .pathognomonic;
  }

  if (
    score >=
    policy.veryHighThreshold
  ) {
    return ExclusiveFeatureClass
      .veryHigh;
  }

  if (
    score >=
    policy.highThreshold
  ) {
    return ExclusiveFeatureClass
      .high;
  }

  if (
    score >=
    policy.moderateThreshold
  ) {
    return ExclusiveFeatureClass
      .moderate;
  }

  if (
    score >=
    policy.lowThreshold
  ) {
    return ExclusiveFeatureClass
      .low;
  }

  return ExclusiveFeatureClass
    .nonDiscriminative;
}

export function calculateFeatureDiscrimination({
  specificity = 0,
  sensitivity = 0,
  evidenceWeight = 0,
  confidence = 0,
  crossLineagePenalty = 0,
  policy,
} = {}) {
  const positive =
    (
      clamp01(specificity) *
      policy.specificityWeight
    ) +
    (
      clamp01(sensitivity) *
      policy.sensitivityWeight
    ) +
    (
      clamp01(evidenceWeight) *
      policy.evidenceWeight
    ) +
    (
      clamp01(confidence) *
      policy.confidenceWeight
    );

  const penalty =
    clamp01(
      crossLineagePenalty,
    ) *
    policy
      .crossLineagePenaltyWeight;

  const score =
    round(
      clamp01(
        positive - penalty,
      ),
    );

  return Object.freeze({
    positive:
      round(positive),
    penalty:
      round(penalty),
    score,
    classification:
      classifyDiscrimination(
        score,
        policy,
      ),
  });
}
