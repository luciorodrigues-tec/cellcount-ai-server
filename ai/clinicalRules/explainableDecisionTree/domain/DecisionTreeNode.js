export const DECISION_TREE_NODE_SCHEMA_VERSION =
  "CRR-000032-v1";

export const DECISION_TREE_NODE_TYPES = Object.freeze([
  "ROOT",
  "EVIDENCE",
  "PATTERN",
  "SYNDROME",
  "CRITERIA",
  "CLASSIFICATION",
  "REASONING",
  "CONSENSUS",
  "CONFIDENCE",
  "UNCERTAINTY",
  "RECOMMENDATION",
  "OUTCOME",
  "OTHER",
]);

export const DECISION_TREE_NODE_STATUSES = Object.freeze([
  "SUPPORTED",
  "OPPOSED",
  "INDETERMINATE",
  "CONFLICTED",
  "ABSTAINED",
  "SELECTED",
  "REJECTED",
  "INFORMATIONAL",
]);

export function createDecisionTreeNode({
  id,
  type,
  label,
  status = "INFORMATIONAL",
  score = null,
  rationale = "",
  sourceRef = null,
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({ id, type, label })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(`DecisionTreeNode.${field} is required.`);
    }
  }

  const normalizedType = String(type).trim().toUpperCase();
  const normalizedStatus = String(status).trim().toUpperCase();

  if (!DECISION_TREE_NODE_TYPES.includes(normalizedType)) {
    throw new TypeError(
      `Unsupported decision tree node type: ${normalizedType}`,
    );
  }

  if (!DECISION_TREE_NODE_STATUSES.includes(normalizedStatus)) {
    throw new TypeError(
      `Unsupported decision tree node status: ${normalizedStatus}`,
    );
  }

  let normalizedScore = null;
  if (score !== null && score !== undefined) {
    const numeric = Number(score);
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 1) {
      throw new TypeError(
        "DecisionTreeNode.score must be between 0 and 1.",
      );
    }
    normalizedScore = numeric;
  }

  return Object.freeze({
    schemaVersion: DECISION_TREE_NODE_SCHEMA_VERSION,
    id: String(id).trim(),
    type: normalizedType,
    label: String(label).trim(),
    status: normalizedStatus,
    score: normalizedScore,
    rationale: String(rationale || "").trim(),
    sourceRef:
      sourceRef === null ? null : String(sourceRef).trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object" ? metadata : {}),
    }),
  });
}
