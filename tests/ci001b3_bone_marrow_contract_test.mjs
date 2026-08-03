import assert from "node:assert/strict";

import {
  BONE_MARROW_CONTRACT_VERSION,
  MarrowObservationStatus,
  enforceBoneMarrowOutputContract,
} from "../ai/boneMarrow/boneMarrowOutputContract.js";

const specimenGate = {
  specimenType: "BONE_MARROW_ASPIRATE",
  analysisType: "bone_marrow",
  reviewRequired: false,
  decision: {
    status: "accepted",
    effectiveType: "BONE_MARROW_ASPIRATE",
  },
};

const result = enforceBoneMarrowOutputContract(
  {
    structuredReport:
      "Medula normal, sem blastos e sem displasia.",
    overallAssessment: {},
  },
  {
    specimenGate,
    rawResult: {
      myeloidSeries:
        "Maturação mieloide parcialmente visível.",
      erythroidSeries: {
        status: "present",
        summary: "Precursores eritroides observados.",
      },
      marrowLimitations: [
        "Campo isolado.",
      ],
    },
  },
);

const required = [
  "specimenAssessment",
  "marrowAdequacy",
  "spiculeAssessment",
  "hemodilutionAssessment",
  "cellularityAssessment",
  "myeloidSeries",
  "erythroidSeries",
  "megakaryocyticSeries",
  "plasmaCellAssessment",
  "blastAssessment",
  "dysplasiaAssessment",
  "infiltrationAssessment",
  "marrowLimitations",
];

for (const field of required) {
  assert.notEqual(
    result[field],
    undefined,
    `Campo obrigatório ausente: ${field}`,
  );
}

assert.equal(
  result.boneMarrowOutputContract.version,
  BONE_MARROW_CONTRACT_VERSION,
);

assert.equal(
  result.boneMarrowOutputContract.complete,
  true,
);

assert.equal(
  result.cellularityAssessment.globalEstimateAllowed,
  false,
);

assert.equal(
  result.blastAssessment.globalAbsenceAllowed,
  false,
);

assert.equal(
  result.dysplasiaAssessment.globalExclusionAllowed,
  false,
);

assert.equal(
  result.infiltrationAssessment.globalExclusionAllowed,
  false,
);

assert.equal(
  result.overallAssessment.requiresHumanReview,
  true,
);

assert.ok(
  Object.values(MarrowObservationStatus).includes(
    result.megakaryocyticSeries.status,
  ),
);

const serialized =
  JSON.stringify(result).toLowerCase();

assert.equal(
  serialized.includes("medula normal"),
  false,
);

assert.equal(
  serialized.includes("sem blastos"),
  false,
);

assert.equal(
  serialized.includes("sem displasia"),
  false,
);

console.log(
  "CI-001B.3 Bone Marrow Output Contract passed.",
);
