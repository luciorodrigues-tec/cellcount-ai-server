export const DIAGNOSTIC_CONSENSUS_VOTE_SCHEMA_VERSION =
  "CRR-000029-v1";

export const DIAGNOSTIC_CONSENSUS_SOURCE_TYPES =
  Object.freeze([
    "MORPHOLOGIC_PATTERN",
    "HEMATOLOGIC_SYNDROME",
    "DIAGNOSTIC_CRITERIA",
    "DIAGNOSTIC_CLASSIFICATION",
    "EVIDENCE_SCORING",
    "HEMATOLOGIC_REASONING",
    "HUMAN_REVIEW",
    "OTHER",
  ]);

export const DIAGNOSTIC_CONSENSUS_VOTE_DIRECTIONS =
  Object.freeze([
    "SUPPORT",
    "OPPOSE",
    "ABSTAIN",
  ]);

export function createDiagnosticConsensusVote({
  id,
  hypothesisId,
  sourceType,
  sourceId,
  direction,
  confidence = 1,
  weight = 1,
  blocking = false,
  rationale = "",
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    hypothesisId,
    sourceType,
    sourceId,
    direction,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `DiagnosticConsensusVote.${field} is required.`,
      );
    }
  }

  const normalizedSource =
    String(sourceType).trim().toUpperCase();

  if (
    !DIAGNOSTIC_CONSENSUS_SOURCE_TYPES.includes(
      normalizedSource,
    )
  ) {
    throw new TypeError(
      `Unsupported diagnostic consensus source type: ${normalizedSource}`,
    );
  }

  const normalizedDirection =
    String(direction).trim().toUpperCase();

  if (
    !DIAGNOSTIC_CONSENSUS_VOTE_DIRECTIONS.includes(
      normalizedDirection,
    )
  ) {
    throw new TypeError(
      `Unsupported diagnostic consensus vote direction: ${normalizedDirection}`,
    );
  }

  const numericConfidence = Number(confidence);
  const numericWeight = Number(weight);

  for (const [field, value] of Object.entries({
    confidence: numericConfidence,
    weight: numericWeight,
  })) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new TypeError(
        `DiagnosticConsensusVote.${field} must be between 0 and 1.`,
      );
    }
  }

  return Object.freeze({
    schemaVersion:
      DIAGNOSTIC_CONSENSUS_VOTE_SCHEMA_VERSION,
    id: String(id).trim(),
    hypothesisId: String(hypothesisId).trim(),
    sourceType: normalizedSource,
    sourceId: String(sourceId).trim(),
    direction: normalizedDirection,
    confidence: numericConfidence,
    weight: numericWeight,
    blocking: Boolean(blocking),
    rationale: String(rationale || "").trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
