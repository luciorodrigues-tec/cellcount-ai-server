export const HEMATOLOGIC_DISEASE_KNOWLEDGE_POLICY_VERSION =
  "CRR-000025-v1.0.0";

export const DEFAULT_HEMATOLOGIC_DISEASE_KNOWLEDGE_POLICY =
  Object.freeze({
    version:
      HEMATOLOGIC_DISEASE_KNOWLEDGE_POLICY_VERSION,
    rejectUnknownParents: true,
    rejectUnknownDiseaseRelationSources: true,
    rejectHierarchyCycles: true,
    includeInactiveByDefault: false,
    requireEvidenceForActiveDisease: false,
    maximumTraversalDepth: 8,
  });

export function mergeHematologicDiseaseKnowledgePolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_HEMATOLOGIC_DISEASE_KNOWLEDGE_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
  });
}
