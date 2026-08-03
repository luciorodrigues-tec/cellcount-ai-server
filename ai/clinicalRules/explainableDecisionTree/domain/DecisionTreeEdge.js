export const DECISION_TREE_EDGE_SCHEMA_VERSION =
  "CRR-000032-v1";

export const DECISION_TREE_EDGE_TYPES = Object.freeze([
  "SUPPORTS",
  "OPPOSES",
  "LEADS_TO",
  "DERIVED_FROM",
  "QUALIFIES",
  "LIMITS",
  "RESOLVES",
  "CONFLICTS_WITH",
  "OTHER",
]);

export function createDecisionTreeEdge({
  id,
  fromNodeId,
  toNodeId,
  type,
  weight = 1,
  rationale = "",
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    fromNodeId,
    toNodeId,
    type,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(`DecisionTreeEdge.${field} is required.`);
    }
  }

  const normalizedType = String(type).trim().toUpperCase();
  if (!DECISION_TREE_EDGE_TYPES.includes(normalizedType)) {
    throw new TypeError(
      `Unsupported decision tree edge type: ${normalizedType}`,
    );
  }

  const numericWeight = Number(weight);
  if (
    !Number.isFinite(numericWeight) ||
    numericWeight < 0 ||
    numericWeight > 1
  ) {
    throw new TypeError(
      "DecisionTreeEdge.weight must be between 0 and 1.",
    );
  }

  return Object.freeze({
    schemaVersion: DECISION_TREE_EDGE_SCHEMA_VERSION,
    id: String(id).trim(),
    fromNodeId: String(fromNodeId).trim(),
    toNodeId: String(toNodeId).trim(),
    type: normalizedType,
    weight: numericWeight,
    rationale: String(rationale || "").trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object" ? metadata : {}),
    }),
  });
}
