export const DIAGNOSTIC_NARRATIVE_CONTEXT_SCHEMA_VERSION =
  "CRR-000024-v1";

export function createDiagnosticNarrativeContext({
  caseSynthesis,
  clinicalDecisionResult = null,
  report = null,
  locale = "pt-BR",
  audience = "CLINICAL",
  metadata = {},
} = {}) {
  if (!caseSynthesis || typeof caseSynthesis !== "object") {
    throw new TypeError(
      "DiagnosticNarrativeContext.caseSynthesis is required.",
    );
  }

  return Object.freeze({
    schemaVersion:
      DIAGNOSTIC_NARRATIVE_CONTEXT_SCHEMA_VERSION,
    caseSynthesis,
    clinicalDecisionResult,
    report,
    locale: String(locale).trim(),
    audience: String(audience).trim().toUpperCase(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
