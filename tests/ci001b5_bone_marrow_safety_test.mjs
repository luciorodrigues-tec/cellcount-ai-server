import assert from "node:assert/strict";

import {
  applyBoneMarrowSafetyGovernor,
} from "../ai/clinicalSafety/governors/BoneMarrowSafetyGovernor.js";

const result =
  applyBoneMarrowSafetyGovernor({
    specimenType:
      "BONE_MARROW_ASPIRATE",
    boneMarrowOutputContract: {
      complete: true,
    },
    boneMarrowClinicalReasoning: {
      adequacy: {
        assessable: false,
      },
      cellularity: {
        globalEstimateAllowed: true,
        estimate: "hipercelular",
      },
      blast: {
        concern: true,
      },
      dysplasia: {
        suspected: true,
      },
      infiltration: {
        suspected: true,
      },
    },
    cellularityAssessment: {
      globalEstimateAllowed: true,
      estimate: "hipercelular",
    },
    findings: {
      monomorphicPopulation: true,
    },
    requiresHumanReview: false,
    overallAssessment: {
      requiresHumanReview: false,
      riskCategory:
        "CLASS_0_NORMAL",
    },
    structuredReport: {
      conclusion:
        "Medula normal, sem blastos, sem displasia e sem infiltração.",
    },
    marrowLimitations: [],
  });

assert.equal(
  result.marrowSafetyValidation.passed,
  true,
);

assert.ok(
  result.marrowSafetyValidation.rulesTriggered >= 6,
);

assert.equal(
  result.cellularityAssessment
    .globalEstimateAllowed,
  false,
);

assert.equal(
  result.requiresHumanReview,
  true,
);

assert.equal(
  result.overallAssessment
    .requiresHumanReview,
  true,
);

assert.equal(
  result.overallAssessment
    .riskCategory,
  "MARROW_ATYPICAL_OR_INFILTRATIVE_PATTERN",
);

const clinicalText =
  JSON.stringify({
    structuredReport:
      result.structuredReport,
    overallAssessment:
      result.overallAssessment,
    boneMarrowClinicalReasoning:
      result.boneMarrowClinicalReasoning,
  }).toLowerCase();

assert.equal(
  clinicalText.includes("sem blastos"),
  false,
);

assert.equal(
  clinicalText.includes("sem displasia"),
  false,
);

assert.equal(
  clinicalText.includes("sem infiltração"),
  false,
);

assert.ok(
  result.marrowSafetyValidation
    .auditTrail.length > 0,
);

console.log(
  "CI-001B.5 Bone Marrow Safety Governor passed.",
);
