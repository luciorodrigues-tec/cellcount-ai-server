export const GUIDELINE_BRANCH_SCHEMA_VERSION =
  "CGL-000004-S1-v1";

export function createGuidelineBranch({
  branchId,
  conditionId,
  targetNodeId,
  label = null,
  priority = 100,
} = {}) {
  if (!branchId || !conditionId || !targetNodeId) {
    throw new TypeError(
      "GuidelineBranch requires branchId, conditionId and targetNodeId.",
    );
  }

  const numericPriority = Number(priority);
  if (
    !Number.isInteger(numericPriority) ||
    numericPriority < 1
  ) {
    throw new TypeError(
      "GuidelineBranch.priority must be a positive integer.",
    );
  }

  return Object.freeze({
    schemaVersion:
      GUIDELINE_BRANCH_SCHEMA_VERSION,
    branchId: String(branchId).trim(),
    conditionId: String(conditionId).trim(),
    targetNodeId: String(targetNodeId).trim(),
    label:
      label === null ? null : String(label).trim(),
    priority: numericPriority,
  });
}
