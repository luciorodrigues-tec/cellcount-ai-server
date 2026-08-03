export const EVIDENCE_EDGE_SCHEMA_VERSION =
  "CGL-000002-S1-v1";

export const EVIDENCE_RELATIONSHIPS = Object.freeze([
  "GENERATED_BY",
  "DERIVED_FROM",
  "SUPPORTS",
  "CONTRADICTS",
  "CONFIRMS",
  "PROPAGATES",
  "REPLACES",
  "SUPERSEDES",
  "INVALIDATES",
  "OTHER",
]);

export function createEvidenceEdge({
  edgeId,
  fromNodeId,
  toNodeId,
  relationship,
  weight = null,
  transformationId = null,
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    edgeId,
    fromNodeId,
    toNodeId,
    relationship,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `EvidenceEdge.${field} is required.`,
      );
    }
  }

  const normalizedRelationship =
    String(relationship).trim().toUpperCase();

  if (
    !EVIDENCE_RELATIONSHIPS.includes(
      normalizedRelationship,
    )
  ) {
    throw new TypeError(
      `Unsupported evidence relationship: ${normalizedRelationship}`,
    );
  }

  return Object.freeze({
    schemaVersion:
      EVIDENCE_EDGE_SCHEMA_VERSION,
    edgeId: String(edgeId).trim(),
    fromNodeId: String(fromNodeId).trim(),
    toNodeId: String(toNodeId).trim(),
    relationship: normalizedRelationship,
    weight,
    transformationId:
      transformationId === null
        ? null
        : String(transformationId).trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
