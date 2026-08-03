export const FUSION_SIGNAL_SCHEMA_VERSION =
  "CRR-000009-v1";

export const FUSION_SIGNAL_DIRECTIONS =
  Object.freeze([
    "SUPPORT",
    "OPPOSE",
    "NEUTRAL",
    "ABSTAIN",
  ]);

export const FUSION_SOURCE_TYPES =
  Object.freeze([
    "CLINICAL_RULE",
    "RULE_TRACE",
    "SCIENTIFIC_EVIDENCE",
    "GUIDELINE",
    "CONSENSUS",
    "DIFFERENTIAL",
    "BAYESIAN",
    "MORPHOLOGY",
    "MANUAL_COUNT",
    "AI_VISION",
    "AI_REASONING",
    "SAFETY_GUARD",
    "OTHER",
  ]);

function finiteNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(`${field} must be a finite number.`);
  }
  return number;
}

export function createFusionSignal({
  id,
  targetId,
  sourceId,
  sourceType,
  direction,
  strength = 1,
  confidence = 1,
  reliability = 1,
  evidenceLevel = "UNSPECIFIED",
  rationale = "",
  requiresHumanReview = false,
  blocking = false,
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    targetId,
    sourceId,
    sourceType,
    direction,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `FusionSignal.${field} is required.`,
      );
    }
  }

  const normalizedSourceType = String(sourceType)
    .trim()
    .toUpperCase();

  if (!FUSION_SOURCE_TYPES.includes(normalizedSourceType)) {
    throw new TypeError(
      `Unsupported fusion source type: ${normalizedSourceType}`,
    );
  }

  const normalizedDirection = String(direction)
    .trim()
    .toUpperCase();

  if (!FUSION_SIGNAL_DIRECTIONS.includes(normalizedDirection)) {
    throw new TypeError(
      `Unsupported fusion direction: ${normalizedDirection}`,
    );
  }

  const normalizedStrength = finiteNumber(
    strength,
    "FusionSignal.strength",
  );
  const normalizedConfidence = finiteNumber(
    confidence,
    "FusionSignal.confidence",
  );
  const normalizedReliability = finiteNumber(
    reliability,
    "FusionSignal.reliability",
  );

  if (normalizedStrength < 0) {
    throw new TypeError(
      "FusionSignal.strength must be non-negative.",
    );
  }

  for (const [field, value] of [
    ["FusionSignal.confidence", normalizedConfidence],
    ["FusionSignal.reliability", normalizedReliability],
  ]) {
    if (value < 0 || value > 1) {
      throw new TypeError(
        `${field} must be between 0 and 1.`,
      );
    }
  }

  return Object.freeze({
    schemaVersion: FUSION_SIGNAL_SCHEMA_VERSION,
    id: String(id).trim(),
    targetId: String(targetId).trim(),
    sourceId: String(sourceId).trim(),
    sourceType: normalizedSourceType,
    direction: normalizedDirection,
    strength: normalizedStrength,
    confidence: normalizedConfidence,
    reliability: normalizedReliability,
    evidenceLevel: String(evidenceLevel)
      .trim()
      .toUpperCase(),
    rationale: String(rationale || "").trim(),
    requiresHumanReview: Boolean(
      requiresHumanReview,
    ),
    blocking: Boolean(blocking),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
