export const DIFFERENTIAL_PAIR_BUILDER_VERSION =
  "CI-002D.2-v1";

export const DefaultDifferentialPairPolicy =
  Object.freeze({
    maxAlternatives: 5,
    includeRunnerUp: true,
    includeRankedAlternatives: true,
    includeRejectedCandidates: false,
    requireRegisteredRule: true,
    requireSpecimenCompatibility: true,
    allowReverseRuleLookup: true,
    minimumAlternativeNormalizedScore: 0.25,
    maximumMarginFromWinner: 0.50,
  });

export function mergeDifferentialPairPolicy(
  override = {},
) {
  const merged = {
    ...DefaultDifferentialPairPolicy,
    ...(override &&
    typeof override === "object"
      ? override
      : {}),
  };

  const integerKeys = [
    "maxAlternatives",
  ];

  for (const key of integerKeys) {
    const value = Number(merged[key]);

    if (
      !Number.isInteger(value) ||
      value < 0
    ) {
      throw new TypeError(
        `Invalid differential pair policy ${key}: ${merged[key]}`,
      );
    }

    merged[key] = value;
  }

  const decimalKeys = [
    "minimumAlternativeNormalizedScore",
    "maximumMarginFromWinner",
  ];

  for (const key of decimalKeys) {
    const value = Number(merged[key]);

    if (
      !Number.isFinite(value) ||
      value < 0 ||
      value > 1
    ) {
      throw new TypeError(
        `Invalid differential pair policy ${key}: ${merged[key]}`,
      );
    }

    merged[key] = value;
  }

  return Object.freeze(merged);
}
