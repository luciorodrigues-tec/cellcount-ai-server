import assert from "node:assert/strict";

import {
  enforceBoneMarrowOutputContract,
} from "../ai/boneMarrow/boneMarrowOutputContract.js";

import {
  BONE_MARROW_REASONING_VERSION,
  applyBoneMarrowClinicalReasoning,
} from "../ai/boneMarrow/boneMarrowClinicalReasoningEngine.js";

const specimenGate = {
  specimenType: "BONE_MARROW_ASPIRATE",
  analysisType: "bone_marrow",
  decision: {
    status: "accepted",
    effectiveType: "BONE_MARROW_ASPIRATE",
  },
};

const contracted =
  enforceBoneMarrowOutputContract(
    {
      findings: {
        blastSuspicion: true,
        immatureCells: true,
      },
      marrowAdequacy: {
        status: "notAssessable",
      },
      myeloidSeries: {
        status: "present",
        maturation:
          "Precursores mieloides observados.",
      },
      erythroidSeries: {
        status: "present",
        summary:
          "Precursores eritroides observados.",
      },
      megakaryocyticSeries: {
        status: "notAssessable",
      },
      blastAssessment: {
        status: "present",
        observed: true,
        summary:
          "Células imaturas suspeitas.",
      },
    },
    {
      specimenGate,
    },
  );

const result =
  applyBoneMarrowClinicalReasoning(
    contracted,
    {
      specimenGate,
    },
  );

assert.equal(
  result.marrowReasoningVersion,
  BONE_MARROW_REASONING_VERSION,
);

assert.equal(
  result.boneMarrowClinicalReasoning
    .blast.concern,
  true,
);

assert.equal(
  result.marrowClinicalCategory,
  "MARROW_IMMATURE_OR_BLAST_SUSPICION",
);

assert.equal(
  result.normalityBlocked,
  true,
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

assert.ok(
  result.boneMarrowClinicalReasoning
    .lineages.myeloid,
);

assert.ok(
  result.boneMarrowClinicalReasoning
    .lineages.erythroid,
);

assert.ok(
  result.boneMarrowClinicalReasoning
    .lineages.megakaryocytic,
);

assert.equal(
  result.boneMarrowClinicalReasoning
    .cellularity.globalEstimateAllowed,
  false,
);

assert.equal(
  result.boneMarrowClinicalReasoning
    .blast.globalAbsenceAllowed,
  false,
);

console.log(
  "CI-001B.4 Bone Marrow Clinical Reasoning passed.",
);
