export const ConflictType =
  Object.freeze({
    winnerInternal:
      "WINNER_INTERNAL_CONFLICT",
    alternativeInternal:
      "ALTERNATIVE_INTERNAL_CONFLICT",
    crossHypothesis:
      "CROSS_HYPOTHESIS_CONFLICT",
    sharedAmbiguity:
      "SHARED_FEATURE_AMBIGUITY",
    missingCriticalFeature:
      "MISSING_CRITICAL_FEATURE",
    morphologicAmbiguity:
      "MORPHOLOGIC_AMBIGUITY",
  });

export function createConflictRecord({
  type,
  featureId = null,
  favors = null,
  weight = 0,
  severityContribution = 0,
  statement = "",
  metadata = {},
} = {}) {
  return Object.freeze({
    type,
    featureId,
    favors,
    weight:
      Number(weight || 0),
    severityContribution:
      Number(
        severityContribution || 0,
      ),
    statement:
      String(statement || ""),
    metadata:
      Object.freeze({
        ...(metadata &&
        typeof metadata === "object"
          ? metadata
          : {}),
      }),
  });
}
