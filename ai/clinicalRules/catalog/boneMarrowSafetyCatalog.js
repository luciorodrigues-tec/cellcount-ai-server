import {
  boneMarrowSafetyRules,
} from "../../clinicalSafety/rules/boneMarrowSafetyRules.js";

import {
  createClinicalRule,
} from "../domain/ClinicalRule.js";

export const boneMarrowSafetyClinicalRules = Object.freeze(
  boneMarrowSafetyRules.map((rule) =>
    createClinicalRule({
      id: rule.id,
      version: "1.0.0",
      title: rule.description || rule.id,
      description: rule.description || "",
      category: "CLINICAL_SAFETY",
      severity: rule.severity || "high",
      specimenTypes: ["BONE_MARROW_ASPIRATE"],
      tags: [
        "BONE_MARROW",
        "SAFETY_GOVERNOR",
        "EXISTING_RULE_ADAPTER",
      ],
      evidenceLevel: "UNSPECIFIED",
      references: [],
      applies: rule.applies,
      apply: rule.apply,
      metadata: {
        field: rule.field || null,
        reason: rule.reason || null,
        sourceModule:
          "ai/clinicalSafety/rules/boneMarrowSafetyRules.js",
        migratedWithoutClinicalChange: true,
      },
    }),
  ),
);
