import assert from "node:assert/strict";

import {
  applyBoneMarrowSafetyGovernor,
} from "../ai/clinicalSafety/governors/BoneMarrowSafetyGovernor.js";

const result =
  applyBoneMarrowSafetyGovernor({
    specimenType:
      "BONE_MARROW_ASPIRATE",
    structuredReport: {
      conclusion: "Resultado incompleto.",
    },
  });

assert.equal(
  result.marrowSafetyValidation.passed,
  false,
);

assert.equal(
  result.marrowSafetyValidation
    .deliveryAllowed,
  false,
);

assert.equal(
  result.marrowSafetyValidation
    .severity,
  "blocking",
);

assert.equal(
  result.deliveryBlocked,
  true,
);

console.log(
  "CI-001B.5 blocking safety test passed.",
);
