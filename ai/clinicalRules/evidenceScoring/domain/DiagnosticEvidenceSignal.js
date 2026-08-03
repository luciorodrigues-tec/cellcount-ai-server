export const DIAGNOSTIC_EVIDENCE_SIGNAL_SCHEMA_VERSION =
  "CRR-000021-v1";

export const DIAGNOSTIC_EVIDENCE_SIGNAL_TYPES =
  Object.freeze([
    "MORPHOLOGY",
    "CLINICAL_RULE",
    "DIAGNOSTIC_CRITERIA",
    "DIAGNOSTIC_CLASSIFICATION",
    "SCIENTIFIC_EVIDENCE",
    "GUIDELINE",
    "CONSENSUS",
    "BAYESIAN",
    "FUSION",
    "HUMAN_REVIEW",
    "OTHER",
  ]);

export const DIAGNOSTIC_EVIDENCE_DIRECTIONS =
  Object.freeze([
    "SUPPORT",
    "OPPOSE",
    "NEUTRAL",
    "ABSTAIN",
  ]);

export function createDiagnosticEvidenceSignal({
  id,
  hypothesisId,
  sourceType,
  sourceId,
  direction,
  strength = 1,
  confidence = 1,
  reliability = 1,
  weight = 1,
  blocking = false,
  evidenceSourceIds = [],
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
        `DiagnosticEvidenceSignal.${field} is required.`,
      );
    }
  }

  const normalizedSourceType = String(sourceType)
    .trim()
    .toUpperCase();

  if (
    !DIAGNOSTIC_EVIDENCE_SIGNAL_TYPES.includes(
      normalizedSourceType,
    )
  ) {
    throw new TypeError(
      `Unsupported diagnostic evidence source type: ${normalizedSourceType}`,
    );
  }

  const normalizedDirection = String(direction)
    .trim()
    .toUpperCase();

  if (
    !DIAGNOSTIC_EVIDENCE_DIRECTIONS.includes(
      normalizedDirection,
    )
  ) {
    throw new TypeError(
      `Unsupported diagnostic evidence direction: ${normalizedDirection}`,
    );
  }

  const numericFields = {
    strength: Number(strength),
    confidence: Number(confidence),
    reliability: Number(reliability),
    weight: Number(weight),
  };

  for (const [field, value] of Object.entries(numericFields)) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new TypeError(
        `DiagnosticEvidenceSignal.${field} must be between 0 and 1.`,
      );
    }
  }

  return Object.freeze({
    schemaVersion:
      DIAGNOSTIC_EVIDENCE_SIGNAL_SCHEMA_VERSION,
    id: String(id).trim(),
    hypothesisId: String(hypothesisId).trim(),
    sourceType: normalizedSourceType,
    sourceId: String(sourceId).trim(),
    direction: normalizedDirection,
    strength: numericFields.strength,
    confidence: numericFields.confidence,
    reliability: numericFields.reliability,
    weight: numericFields.weight,
    blocking: Boolean(blocking),
    evidenceSourceIds: Object.freeze([
      ...new Set(
        (Array.isArray(evidenceSourceIds)
          ? evidenceSourceIds
          : []
        )
          .map(String)
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ]),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
