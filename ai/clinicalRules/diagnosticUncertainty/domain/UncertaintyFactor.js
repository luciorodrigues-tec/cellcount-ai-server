export const UNCERTAINTY_FACTOR_SCHEMA_VERSION =
  "CRR-000031-v1";

export const UNCERTAINTY_FACTOR_TYPES =
  Object.freeze([
    "EPISTEMIC",
    "OBSERVATIONAL",
    "CONFLICT",
    "COMPETITION",
    "ABSTENTION",
    "MISSING_DATA",
    "OTHER",
  ]);

export function createUncertaintyFactor({
  id,
  type,
  severity,
  source,
  description,
  resolvable = true,
  recommendation = null,
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    type,
    source,
    description,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `UncertaintyFactor.${field} is required.`,
      );
    }
  }

  const normalizedType =
    String(type).trim().toUpperCase();

  if (
    !UNCERTAINTY_FACTOR_TYPES.includes(
      normalizedType,
    )
  ) {
    throw new TypeError(
      `Unsupported uncertainty factor type: ${normalizedType}`,
    );
  }

  const numericSeverity = Number(severity);

  if (
    !Number.isFinite(numericSeverity) ||
    numericSeverity < 0 ||
    numericSeverity > 1
  ) {
    throw new TypeError(
      "UncertaintyFactor.severity must be between 0 and 1.",
    );
  }

  return Object.freeze({
    schemaVersion:
      UNCERTAINTY_FACTOR_SCHEMA_VERSION,
    id: String(id).trim(),
    type: normalizedType,
    severity: numericSeverity,
    source: String(source).trim().toUpperCase(),
    description: String(description).trim(),
    resolvable: Boolean(resolvable),
    recommendation:
      recommendation === null
        ? null
        : String(recommendation).trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
