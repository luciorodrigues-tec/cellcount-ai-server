export const MASTER_ORCHESTRATOR_POLICY_VERSION =
  "CRR-000011-v1.0.0";

export const DEFAULT_MASTER_ORCHESTRATOR_POLICY =
  Object.freeze({
    version: MASTER_ORCHESTRATOR_POLICY_VERSION,
    failFast: false,
    continueOnStageError: true,
    requireHumanReviewOnAnyStageError: true,
    requireHumanReviewOnAnyAbstention: true,
    requireHumanReviewOnAnyConflict: true,
    includeRawStageOutputs: true,
  });

export function mergeMasterOrchestratorPolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_MASTER_ORCHESTRATOR_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
  });
}
