import assert from "node:assert/strict";

import {
  stabilizeDualPipelineResult,
} from "../ai/dualPipeline/DualPipelineStabilizer.js";

const peripheral =
  stabilizeDualPipelineResult(
    {
      specimenType:
        "PERIPHERAL_BLOOD",
      structuredReport: {
        conclusion:
          "Padrão periférico.",
      },
    },
    {
      specimenGate: {
        specimenType:
          "PERIPHERAL_BLOOD",
      },
    },
  );

assert.equal(
  peripheral.dualPipelineValidation
    .passed,
  true,
);

const leakedPeripheral =
  stabilizeDualPipelineResult(
    {
      specimenType:
        "PERIPHERAL_BLOOD",
      boneMarrowClinicalReasoning: {},
    },
    {
      specimenGate: {
        specimenType:
          "PERIPHERAL_BLOOD",
      },
    },
  );

assert.equal(
  leakedPeripheral
    .dualPipelineValidation
    .passed,
  false,
);

const marrow =
  stabilizeDualPipelineResult(
    {
      specimenType:
        "BONE_MARROW_ASPIRATE",
      boneMarrowOutputContract: {
        complete: true,
      },
      boneMarrowClinicalReasoning: {},
      marrowSafetyValidation: {
        deliveryAllowed: true,
      },
    },
    {
      specimenGate: {
        specimenType:
          "BONE_MARROW_ASPIRATE",
      },
    },
  );

assert.equal(
  marrow.dualPipelineValidation
    .passed,
  true,
);

console.log(
  "CI-001C pipeline isolation passed.",
);
