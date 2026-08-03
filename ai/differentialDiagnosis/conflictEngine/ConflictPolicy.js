export const DIAGNOSTIC_CONFLICT_ENGINE_VERSION =
  "CI-002D.6-v1";

export const ConflictSeverity =
  Object.freeze({
    none: "NONE",
    low: "LOW",
    moderate: "MODERATE",
    high: "HIGH",
    critical: "CRITICAL",
  });

export const ConflictResolution =
  Object.freeze({
    maintainWinner: "MAINTAIN_WINNER",
    promoteAlternative: "PROMOTE_ALTERNATIVE",
    diagnosticTie: "DIAGNOSTIC_TIE",
    insufficientEvidence: "INSUFFICIENT_EVIDENCE",
  });

export const DefaultConflictPolicy =
  Object.freeze({
    winnerEvidenceWeight: 0.35,
    alternativeEvidenceWeight: 0.35,
    conflictBurdenWeight: 0.20,
    missingEvidenceWeight: 0.10,

    lowThreshold: 0.15,
    moderateThreshold: 0.30,
    highThreshold: 0.50,
    criticalThreshold: 0.75,

    winnerMaintainMargin: 0.10,
    alternativePromotionMargin: 0.12,
    tieMargin: 0.05,
    insufficientEvidenceCoverage: 0.20,

    maximumProbabilityShift: 0.30,
    minimumProbability: 0.01,
    maximumProbability: 0.99,
  });

export function mergeConflictPolicy(
  override = {},
) {
  const merged = {
    ...DefaultConflictPolicy,
    ...(override &&
    typeof override === "object"
      ? override
      : {}),
  };

  const numericKeys =
    Object.keys(
      DefaultConflictPolicy,
    ).filter(
      (key) =>
        typeof DefaultConflictPolicy[key] ===
        "number",
    );

  for (const key of numericKeys) {
    const value = Number(merged[key]);

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      throw new TypeError(
        `Invalid conflict policy ${key}: ${merged[key]}`,
      );
    }

    merged[key] = value;
  }

  const weightSum =
    merged.winnerEvidenceWeight +
    merged.alternativeEvidenceWeight +
    merged.conflictBurdenWeight +
    merged.missingEvidenceWeight;

  if (
    Math.abs(weightSum - 1) >
    0.000001
  ) {
    throw new TypeError(
      `Conflict weights must sum to 1. Current: ${weightSum}`,
    );
  }

  return Object.freeze(merged);
}
