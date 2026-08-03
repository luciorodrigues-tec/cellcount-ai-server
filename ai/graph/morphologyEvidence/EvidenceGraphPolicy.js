export const MORPHOLOGY_EVIDENCE_GRAPH_VERSION =
  "CI-002C.8-v1";

export const EvidenceNodeType =
  Object.freeze({
    decision: "DECISION",
    cell: "CELL",
    feature: "FEATURE",
    criterion: "CRITERION",
    evidence: "EVIDENCE",
    confidence: "CONFIDENCE",
    penalty: "PENALTY",
    specimen: "SPECIMEN",
    review: "HUMAN_REVIEW",
  });

export const EvidenceEdgeType =
  Object.freeze({
    supports: "SUPPORTS",
    contradicts: "CONTRADICTS",
    excludes: "EXCLUDES",
    limits: "LIMITS",
    requires: "REQUIRES",
    matchedBy: "MATCHED_BY",
    rankedAbove: "RANKED_ABOVE",
    alternativeTo: "ALTERNATIVE_TO",
    contributesTo: "CONTRIBUTES_TO",
    penalizes: "PENALIZES",
    classifiedAs: "CLASSIFIED_AS",
    derivedFrom: "DERIVED_FROM",
    requiresReview: "REQUIRES_REVIEW",
    appliesToSpecimen: "APPLIES_TO_SPECIMEN",
  });

export const DefaultEvidenceGraphPolicy =
  Object.freeze({
    includeRejectedCandidates: true,
    includeUnmatchedRequired: true,
    includeConfidenceFactors: true,
    includePenalties: true,
    includeSpecimenNode: true,
    maxRejectedCandidates: 15,
    maxAlternatives: 5,
    deduplicateNodes: true,
    deduplicateEdges: true,
  });

export function mergeEvidenceGraphPolicy(
  override = {},
) {
  const merged = {
    ...DefaultEvidenceGraphPolicy,
    ...(override &&
    typeof override === "object"
      ? override
      : {}),
  };

  for (
    const key
    of [
      "maxRejectedCandidates",
      "maxAlternatives",
    ]
  ) {
    const value =
      Number(merged[key]);

    if (
      !Number.isInteger(value) ||
      value < 0
    ) {
      throw new TypeError(
        `Invalid evidence graph policy ${key}: ${merged[key]}`,
      );
    }

    merged[key] = value;
  }

  return Object.freeze(merged);
}
