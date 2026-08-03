export const DIAGNOSTIC_CLASSIFICATION_POLICY_VERSION =
  "CRR-000020-v1.0.0";

export const DEFAULT_DIAGNOSTIC_CLASSIFICATION_POLICY =
  Object.freeze({
    version:
      DIAGNOSTIC_CLASSIFICATION_POLICY_VERSION,
    eligibleStatuses: Object.freeze(["MET"]),
    indeterminateStatuses:
      Object.freeze(["INDETERMINATE"]),
    excludedStatuses: Object.freeze(["EXCLUDED"]),
    preferHigherPrecedence: true,
    requireHumanReviewOnTie: true,
    requireHumanReviewOnCompetition: true,
    requireHumanReviewOnIndeterminate: true,
    maximumResults: 20,
  });

export function mergeDiagnosticClassificationPolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_DIAGNOSTIC_CLASSIFICATION_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
    eligibleStatuses: Object.freeze([
      ...(overrides.eligibleStatuses ||
        DEFAULT_DIAGNOSTIC_CLASSIFICATION_POLICY
          .eligibleStatuses),
    ]),
    indeterminateStatuses: Object.freeze([
      ...(overrides.indeterminateStatuses ||
        DEFAULT_DIAGNOSTIC_CLASSIFICATION_POLICY
          .indeterminateStatuses),
    ]),
    excludedStatuses: Object.freeze([
      ...(overrides.excludedStatuses ||
        DEFAULT_DIAGNOSTIC_CLASSIFICATION_POLICY
          .excludedStatuses),
    ]),
  });
}
