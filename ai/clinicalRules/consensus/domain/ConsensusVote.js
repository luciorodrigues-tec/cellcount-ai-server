export const CONSENSUS_VOTE_SCHEMA_VERSION =
  "CRR-000006-v1";

export const VOTE_DIRECTIONS = Object.freeze([
  "SUPPORT",
  "OPPOSE",
  "NEUTRAL",
  "ABSTAIN",
]);

export function createConsensusVote({
  hypothesisId,
  sourceId,
  sourceType,
  direction,
  weight = 1,
  confidence = null,
  ruleId = null,
  ruleVersion = null,
  rationale = "",
  evidenceLevel = "UNSPECIFIED",
  requiresHumanReview = false,
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    hypothesisId,
    sourceId,
    sourceType,
    direction,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `ConsensusVote.${field} is required.`,
      );
    }
  }

  const normalizedDirection = String(direction)
    .trim()
    .toUpperCase();

  if (!VOTE_DIRECTIONS.includes(normalizedDirection)) {
    throw new TypeError(
      `Unsupported vote direction: ${normalizedDirection}`,
    );
  }

  const numericWeight = Number(weight);

  if (!Number.isFinite(numericWeight) || numericWeight < 0) {
    throw new TypeError(
      "ConsensusVote.weight must be a non-negative number.",
    );
  }

  const normalizedConfidence =
    confidence === null || confidence === undefined
      ? null
      : Number(confidence);

  if (
    normalizedConfidence !== null &&
    (
      !Number.isFinite(normalizedConfidence) ||
      normalizedConfidence < 0 ||
      normalizedConfidence > 1
    )
  ) {
    throw new TypeError(
      "ConsensusVote.confidence must be between 0 and 1.",
    );
  }

  return Object.freeze({
    schemaVersion: CONSENSUS_VOTE_SCHEMA_VERSION,
    hypothesisId: String(hypothesisId).trim(),
    sourceId: String(sourceId).trim(),
    sourceType: String(sourceType).trim().toUpperCase(),
    direction: normalizedDirection,
    weight: numericWeight,
    confidence: normalizedConfidence,
    ruleId:
      ruleId === null ? null : String(ruleId).trim(),
    ruleVersion:
      ruleVersion === null
        ? null
        : String(ruleVersion).trim(),
    rationale: String(rationale || "").trim(),
    evidenceLevel: String(evidenceLevel)
      .trim()
      .toUpperCase(),
    requiresHumanReview: Boolean(
      requiresHumanReview,
    ),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
