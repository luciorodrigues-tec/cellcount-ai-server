export const AUDIT_POLICY_VERSION =
  "CGL-000001-S1-v1.0.0";

export const DEFAULT_AUDIT_POLICY = Object.freeze({
  version: AUDIT_POLICY_VERSION,
  requirePseudonymizedPatientId: false,
  requireEngineReferences: true,
  requireDecisionReferenceBeforeSeal: true,
  requireIntegrityBeforeSeal: true,
  allowMutationAfterSeal: false,
  maximumEvents: 5000,
  maximumSteps: 500,
  maximumSnapshots: 100,
});

export function mergeAuditPolicy(overrides = {}) {
  return Object.freeze({
    ...DEFAULT_AUDIT_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
  });
}
