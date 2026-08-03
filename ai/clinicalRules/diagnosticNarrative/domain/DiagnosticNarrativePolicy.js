export const DIAGNOSTIC_NARRATIVE_POLICY_VERSION =
  "CRR-000024-v1.0.0";

export const DEFAULT_DIAGNOSTIC_NARRATIVE_POLICY =
  Object.freeze({
    version:
      DIAGNOSTIC_NARRATIVE_POLICY_VERSION,
    supportedLocales: Object.freeze([
      "pt-BR",
      "en-US",
    ]),
    defaultLocale: "pt-BR",
    maximumLimitations: 10,
    includeScores: true,
    includeClassification: true,
    includeRecommendations: true,
    requireHumanReviewOnConflict: true,
    requireHumanReviewOnAbstention: true,
    avoidDiagnosticFinality: true,
  });

export function mergeDiagnosticNarrativePolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_DIAGNOSTIC_NARRATIVE_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
    supportedLocales: Object.freeze([
      ...(overrides.supportedLocales ||
        DEFAULT_DIAGNOSTIC_NARRATIVE_POLICY
          .supportedLocales),
    ]),
  });
}
