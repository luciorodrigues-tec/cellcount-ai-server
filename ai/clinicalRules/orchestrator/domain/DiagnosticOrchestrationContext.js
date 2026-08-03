export const DIAGNOSTIC_ORCHESTRATION_SCHEMA_VERSION =
  "CRR-000011-v1";

export function createDiagnosticOrchestrationContext({
  executionId,
  input,
  targetIds = [],
  metadata = {},
} = {}) {
  if (!executionId || !String(executionId).trim()) {
    throw new TypeError(
      "DiagnosticOrchestrationContext.executionId is required.",
    );
  }

  return Object.freeze({
    schemaVersion:
      DIAGNOSTIC_ORCHESTRATION_SCHEMA_VERSION,
    executionId: String(executionId).trim(),
    input,
    targetIds: Object.freeze([
      ...new Set(
        (Array.isArray(targetIds) ? targetIds : [])
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
