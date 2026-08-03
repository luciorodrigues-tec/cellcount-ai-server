export const CONFIDENCE_FACTOR_SCHEMA_VERSION = "CRR-000030-v1";

export const CONFIDENCE_FACTOR_DIRECTIONS = Object.freeze([
  "POSITIVE",
  "NEGATIVE",
  "NEUTRAL",
]);

export function createConfidenceFactor({
  id,
  source,
  direction,
  value,
  weight = 1,
  rationale = "",
  metadata = {},
} = {}) {
  for (const [field, candidate] of Object.entries({ id, source, direction })) {
    if (!candidate || !String(candidate).trim()) {
      throw new TypeError(`ConfidenceFactor.${field} is required.`);
    }
  }

  const normalizedDirection = String(direction).trim().toUpperCase();
  if (!CONFIDENCE_FACTOR_DIRECTIONS.includes(normalizedDirection)) {
    throw new TypeError(
      `Unsupported confidence factor direction: ${normalizedDirection}`,
    );
  }

  const numericValue = Number(value);
  const numericWeight = Number(weight);

  for (const [field, candidate] of Object.entries({
    value: numericValue,
    weight: numericWeight,
  })) {
    if (!Number.isFinite(candidate) || candidate < 0 || candidate > 1) {
      throw new TypeError(
        `ConfidenceFactor.${field} must be between 0 and 1.`,
      );
    }
  }

  return Object.freeze({
    schemaVersion: CONFIDENCE_FACTOR_SCHEMA_VERSION,
    id: String(id).trim(),
    source: String(source).trim().toUpperCase(),
    direction: normalizedDirection,
    value: numericValue,
    weight: numericWeight,
    rationale: String(rationale || "").trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object" ? metadata : {}),
    }),
  });
}
