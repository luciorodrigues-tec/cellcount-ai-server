export const DIFFERENTIAL_EVIDENCE_ENGINE_VERSION =
  "CI-002D.4-v1";

export const EvidenceStrength =
  Object.freeze({
    high: "HIGH",
    moderate: "MODERATE",
    low: "LOW",
    none: "NONE",
  });

export const DefaultDifferentialEvidencePolicy =
  Object.freeze({
    minimumObservedConfidence: 0.15,
    highStrengthThreshold: 0.70,
    moderateStrengthThreshold: 0.40,
    featureConfidenceWeight: 0.55,
    diagnosticRoleWeight: 0.30,
    coverageWeight: 0.15,
    sharedRoleFactor: 0.70,
    exclusiveRoleFactor: 1.00,
    exclusionRoleFactor: 1.15,
    missingRoleFactor: 0.55,
    conflictRoleFactor: 1.20,
    maxEvidencePerGroup: 12,
    includeMissingSharedFeatures: true,
    includeMissingExclusiveFeatures: true,
    includeExclusionEvidence: true,
  });

export function mergeDifferentialEvidencePolicy(
  override = {},
) {
  const merged = {
    ...DefaultDifferentialEvidencePolicy,
    ...(override &&
    typeof override === "object"
      ? override
      : {}),
  };

  const numericKeys =
    Object.keys(
      DefaultDifferentialEvidencePolicy,
    ).filter(
      (key) =>
        typeof DefaultDifferentialEvidencePolicy[key] ===
        "number",
    );

  for (const key of numericKeys) {
    const value =
      Number(merged[key]);

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      throw new TypeError(
        `Invalid differential evidence policy ${key}: ${merged[key]}`,
      );
    }

    merged[key] = value;
  }

  if (
    !Number.isInteger(
      merged.maxEvidencePerGroup,
    )
  ) {
    throw new TypeError(
      "maxEvidencePerGroup must be an integer.",
    );
  }

  const weightSum =
    merged.featureConfidenceWeight +
    merged.diagnosticRoleWeight +
    merged.coverageWeight;

  if (
    Math.abs(weightSum - 1) >
    0.000001
  ) {
    throw new TypeError(
      `Differential evidence weights must sum to 1. Current: ${weightSum}`,
    );
  }

  if (
    merged.highStrengthThreshold <
    merged.moderateStrengthThreshold
  ) {
    throw new TypeError(
      "highStrengthThreshold must be greater than or equal to moderateStrengthThreshold.",
    );
  }

  return Object.freeze(merged);
}
