export const MORPHOLOGIC_ONTOLOGY_POLICY_VERSION =
  "CRR-000018-v1.0.0";

export const DEFAULT_MORPHOLOGIC_ONTOLOGY_POLICY =
  Object.freeze({
    version:
      MORPHOLOGIC_ONTOLOGY_POLICY_VERSION,
    allowSelfRelations: false,
    requireKnownRelationEndpoints: true,
    rejectHierarchyCycles: true,
    includeInactiveByDefault: false,
    maximumTraversalDepth: 8,
    maximumTraversalNodes: 500,
  });

export function mergeMorphologicOntologyPolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_MORPHOLOGIC_ONTOLOGY_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
  });
}
