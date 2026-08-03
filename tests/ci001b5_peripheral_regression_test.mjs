import assert from "node:assert/strict";

import {
  applyClinicalSafetyGovernor,
} from "../ai/clinicalSafety/ClinicalSafetyGovernor.js";

const input = {
  specimenType:
    "PERIPHERAL_BLOOD",
  structuredReport: {
    conclusion:
      "Padrão periférico.",
  },
};

const output =
  applyClinicalSafetyGovernor(
    input,
    {
      specimenGate: {
        specimenType:
          "PERIPHERAL_BLOOD",
      },
    },
  );

assert.deepEqual(output, input);
assert.equal(
  output.marrowSafetyValidation,
  undefined,
);

console.log(
  "CI-001B.5 peripheral regression guard passed.",
);
