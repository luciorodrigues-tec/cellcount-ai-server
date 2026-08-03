export const EVIDENCE_NODE_SCHEMA_VERSION =
  "CGL-000002-S1-v1";

export const EVIDENCE_NODE_TYPES = Object.freeze([
  "SOURCE",
  "OBSERVATION",
  "FEATURE",
  "MORPHOLOGY",
  "PATTERN",
  "SYNDROME",
  "HYPOTHESIS",
  "DECISION",
  "REPORT",
  "OTHER",
]);

export function createEvidenceNode({
  nodeId,
  type,
  label,
  origin = null,
  sourceReference = null,
  weight = null,
  confidence = null,
  version = null,
  integrity = null,
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    nodeId,
    type,
    label,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `EvidenceNode.${field} is required.`,
      );
    }
  }

  const normalizedType =
    String(type).trim().toUpperCase();

  if (!EVIDENCE_NODE_TYPES.includes(normalizedType)) {
    throw new TypeError(
      `Unsupported evidence node type: ${normalizedType}`,
    );
  }

  return Object.freeze({
    schemaVersion:
      EVIDENCE_NODE_SCHEMA_VERSION,
    nodeId: String(nodeId).trim(),
    type: normalizedType,
    label: String(label).trim(),
    origin,
    sourceReference,
    weight,
    confidence,
    version,
    integrity,
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
