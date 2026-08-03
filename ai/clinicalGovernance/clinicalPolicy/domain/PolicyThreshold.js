export const POLICY_THRESHOLD_SCHEMA_VERSION =
  "CGL-000003-S1-v1";

export function createPolicyThreshold({
  key,
  value,
  minimum = null,
  maximum = null,
  unit = null,
  metadata = {},
} = {}) {
  if (!key || !String(key).trim()) {
    throw new TypeError(
      "PolicyThreshold.key is required.",
    );
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    throw new TypeError(
      "PolicyThreshold.value must be numeric.",
    );
  }

  const numericMinimum =
    minimum === null ? null : Number(minimum);
  const numericMaximum =
    maximum === null ? null : Number(maximum);

  if (
    numericMinimum !== null &&
    numericValue < numericMinimum
  ) {
    throw new TypeError(
      "PolicyThreshold.value is below minimum.",
    );
  }

  if (
    numericMaximum !== null &&
    numericValue > numericMaximum
  ) {
    throw new TypeError(
      "PolicyThreshold.value is above maximum.",
    );
  }

  return Object.freeze({
    schemaVersion:
      POLICY_THRESHOLD_SCHEMA_VERSION,
    key: String(key).trim(),
    value: numericValue,
    minimum: numericMinimum,
    maximum: numericMaximum,
    unit:
      unit === null ? null : String(unit).trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
