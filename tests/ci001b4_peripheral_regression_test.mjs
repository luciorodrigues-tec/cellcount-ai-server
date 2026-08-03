import assert from "node:assert/strict";

import {
  applyBoneMarrowClinicalReasoning,
} from "../ai/boneMarrow/boneMarrowClinicalReasoningEngine.js";

const input = {
  specimenType: "PERIPHERAL_BLOOD",
  morphologicRiskClass:
    "CLASS_2_ATYPICAL_POPULATION",
  structuredReport: {
    conclusion:
      "Padrão periférico atípico.",
  },
};

const output =
  applyBoneMarrowClinicalReasoning(
    input,
    {
      specimenGate: {
        specimenType:
          "PERIPHERAL_BLOOD",
      },
    },
  );

assert.deepEqual(
  output,
  input,
);

assert.equal(
  output.boneMarrowClinicalReasoning,
  undefined,
);

console.log(
  "CI-001B.4 peripheral regression guard passed.",
);
