export const GUIDELINE_EXECUTION_RESULT_SCHEMA_VERSION =
  "CGL-000004-S2-v1";

export function createGuidelineExecutionResult({
  guidelineId,
  version,
  status,
  visitedNodes = [],
  matchedConditions = [],
  selectedBranches = [],
  recommendations = [],
  references = [],
  outcome = null,
  requiresHumanReview = false,
  executionTrace = [],
  executionTimeMs = 0,
  createdAt,
  metadata = {},
} = {}) {
  if (!guidelineId || !version || !status || !createdAt) {
    throw new TypeError(
      "GuidelineExecutionResult requires guidelineId, version, status and createdAt.",
    );
  }

  return Object.freeze({
    schemaVersion:
      GUIDELINE_EXECUTION_RESULT_SCHEMA_VERSION,
    guidelineId: String(guidelineId),
    version: String(version),
    status: String(status),
    visitedNodes:
      Object.freeze([...visitedNodes]),
    matchedConditions:
      Object.freeze([...matchedConditions]),
    selectedBranches:
      Object.freeze([...selectedBranches]),
    recommendations:
      Object.freeze([...recommendations]),
    references:
      Object.freeze([...references]),
    outcome,
    requiresHumanReview:
      Boolean(requiresHumanReview),
    executionTrace:
      Object.freeze([...executionTrace]),
    executionTimeMs:
      Number(executionTimeMs),
    createdAt: String(createdAt),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
    safetyStatement:
      "Clinical guideline execution provides structured decision support and does not establish a definitive diagnosis.",
  });
}
