export const KNOWLEDGE_POPULATION_POLICY_VERSION =
  "CRR-000016-v1.0.0";

export const DEFAULT_KNOWLEDGE_POPULATION_POLICY =
  Object.freeze({
    version:
      KNOWLEDGE_POPULATION_POLICY_VERSION,
    allowedFamilies: Object.freeze([
      "WHO",
      "ICC",
      "ELN",
    ]),
    allowedModes: Object.freeze([
      "VALIDATE_ONLY",
      "DRY_RUN",
      "COMMIT",
    ]),
    requireOfficialSource: true,
    requireChecksumForCommit: true,
    requireApprovedStatusForCommit: true,
    requireIndependentReviewers: 2,
    rejectDuplicateEntityIds: true,
    rejectUnknownParentReferences: true,
    allowCommit: false,
  });

export function mergeKnowledgePopulationPolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_KNOWLEDGE_POPULATION_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
    allowedFamilies: Object.freeze([
      ...(
        overrides.allowedFamilies ||
        DEFAULT_KNOWLEDGE_POPULATION_POLICY.allowedFamilies
      ),
    ]),
    allowedModes: Object.freeze([
      ...(
        overrides.allowedModes ||
        DEFAULT_KNOWLEDGE_POPULATION_POLICY.allowedModes
      ),
    ]),
  });
}
