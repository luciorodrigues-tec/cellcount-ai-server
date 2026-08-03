import assert from "node:assert/strict";

import {
  stabilizeDualPipelineResult,
} from "../ai/dualPipeline/DualPipelineStabilizer.js";

const blocked =
  stabilizeDualPipelineResult(
    {
      specimenType:
        "INDETERMINATE",
    },
    {
      specimenGate: {
        specimenType:
          "INDETERMINATE",
      },
    },
  );

assert.equal(
  blocked.dualPipelineValidation
    .deliveryAllowed,
  false,
);

const incompleteMarrow =
  stabilizeDualPipelineResult(
    {
      specimenType:
        "BONE_MARROW_ASPIRATE",
      boneMarrowOutputContract: {
        complete: true,
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
  incompleteMarrow
    .dualPipelineValidation
    .deliveryAllowed,
  false,
);

console.log(
  "CI-001C blocking rules passed.",
);
