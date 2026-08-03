export const MEDICAL_KNOWLEDGE_GRAPH_POLICY_VERSION =
  "CRR-000014-v1.0.0";

export const DEFAULT_MEDICAL_KNOWLEDGE_GRAPH_POLICY =
  Object.freeze({
    version:
      MEDICAL_KNOWLEDGE_GRAPH_POLICY_VERSION,
    allowOrphanEntities: true,
    allowSelfRelations: false,
    requireKnownRelationEndpoints: true,
    maximumTraversalDepth: 6,
    maximumTraversalNodes: 500,
    defaultMinimumConfidence: 0,
    includeInactiveByDefault: false,
  });

export function mergeMedicalKnowledgeGraphPolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_MEDICAL_KNOWLEDGE_GRAPH_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
  });
}
