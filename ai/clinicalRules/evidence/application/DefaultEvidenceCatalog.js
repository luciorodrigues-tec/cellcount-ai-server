import {
  createRuleEvidenceBinding,
} from "../domain/ClinicalEvidence.js";

export function createUnspecifiedEvidenceBindings(
  rules = [],
) {
  return Object.freeze(
    rules.map((rule) =>
      createRuleEvidenceBinding({
        ruleId: rule.id,
        ruleVersion: rule.version,
        evidenceLevel: "UNSPECIFIED",
        sourceIds: [],
        rationale:
          "Scientific evidence has not yet been structured in this baseline.",
        limitations: [
          "No structured bibliography is attached to this rule.",
          "Do not infer an evidence grade from rule severity.",
        ],
        status: "ACTIVE",
        metadata: {
          migrationMode: "NO_SCIENTIFIC_INFERENCE",
          sourceModule:
            rule.metadata?.sourceModule || null,
        },
      }),
    ),
  );
}
