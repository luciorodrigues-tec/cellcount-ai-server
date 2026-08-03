export const FINAL_DIFFERENTIAL_DIAGNOSIS_VERSION =
  "CI-002D.8-v1";

export const DefaultFinalDiagnosisPolicy =
  Object.freeze({
    rankingWeight: 0.25,
    confidenceWeight: 0.20,
    evidenceWeight: 0.20,
    exclusiveFeatureWeight: 0.15,
    conflictResolutionWeight: 0.10,
    recommendationWeight: 0.10,
    minimumSafetyScore: 1,
    minimumConsistencyForStable: 0.60,
    maximumAlternatives: 5,
  });

export function mergeFinalDiagnosisPolicy(
  override = {},
) {
  const merged = {
    ...DefaultFinalDiagnosisPolicy,
    ...(override && typeof override === "object"
      ? override
      : {}),
  };

  for (const [key, value] of Object.entries(merged)) {
    if (
      typeof DefaultFinalDiagnosisPolicy[key] === "number" &&
      (!Number.isFinite(Number(value)) || Number(value) < 0)
    ) {
      throw new TypeError(
        `Invalid final diagnosis policy ${key}: ${value}`,
      );
    }
  }

  const sum =
    merged.rankingWeight +
    merged.confidenceWeight +
    merged.evidenceWeight +
    merged.exclusiveFeatureWeight +
    merged.conflictResolutionWeight +
    merged.recommendationWeight;

  if (Math.abs(sum - 1) > 0.000001) {
    throw new TypeError(
      `Final confidence weights must sum to 1. Current: ${sum}`,
    );
  }

  if (!Number.isInteger(merged.maximumAlternatives)) {
    throw new TypeError(
      "maximumAlternatives must be an integer.",
    );
  }

  return Object.freeze(merged);
}
