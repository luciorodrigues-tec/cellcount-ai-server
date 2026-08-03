import {
  EvidenceStrength,
} from "./DifferentialEvidencePolicy.js";

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

export function classifyEvidenceStrength(
  weight,
  policy,
) {
  if (
    weight >=
    policy.highStrengthThreshold
  ) {
    return EvidenceStrength.high;
  }

  if (
    weight >=
    policy.moderateStrengthThreshold
  ) {
    return EvidenceStrength.moderate;
  }

  if (weight > 0) {
    return EvidenceStrength.low;
  }

  return EvidenceStrength.none;
}

export function calculateEvidenceWeight({
  confidence = 0,
  diagnosticFactor = 0,
  coverage = 0,
  policy,
} = {}) {
  const score =
    (
      clamp01(confidence) *
      policy.featureConfidenceWeight
    ) +
    (
      clamp01(diagnosticFactor) *
      policy.diagnosticRoleWeight
    ) +
    (
      clamp01(coverage) *
      policy.coverageWeight
    );

  const weight =
    round(
      clamp01(score),
    );

  return Object.freeze({
    weight,
    strength:
      classifyEvidenceStrength(
        weight,
        policy,
      ),
  });
}
