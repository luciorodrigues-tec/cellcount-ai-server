export const POLICY_CONSTRAINT_SCHEMA_VERSION =
  "CGL-000003-S1-v1";

export function createPolicyConstraint({
  constraintId,
  type,
  value,
  message = null,
} = {}) {
  for (const [field, candidate] of Object.entries({
    constraintId,
    type,
    value,
  })) {
    if (
      candidate === null ||
      candidate === undefined ||
      String(candidate).trim() === ""
    ) {
      throw new TypeError(
        `PolicyConstraint.${field} is required.`,
      );
    }
  }

  return Object.freeze({
    schemaVersion:
      POLICY_CONSTRAINT_SCHEMA_VERSION,
    constraintId: String(constraintId).trim(),
    type: String(type).trim().toUpperCase(),
    value,
    message:
      message === null ? null : String(message).trim(),
  });
}
