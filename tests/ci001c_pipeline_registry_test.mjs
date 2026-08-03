import assert from "node:assert/strict";

import {
  SpecimenPipeline,
  resolveSpecimenPipeline,
} from "../ai/dualPipeline/SpecimenPipelineRegistry.js";

assert.equal(
  resolveSpecimenPipeline({
    specimenType: "PERIPHERAL_BLOOD",
  }),
  SpecimenPipeline.peripheralBlood,
);

assert.equal(
  resolveSpecimenPipeline({
    specimenType: "BONE_MARROW_ASPIRATE",
  }),
  SpecimenPipeline.boneMarrow,
);

assert.equal(
  resolveSpecimenPipeline({
    specimenType: "HEMODILUTED_BONE_MARROW",
  }),
  SpecimenPipeline.boneMarrow,
);

assert.equal(
  resolveSpecimenPipeline({
    specimenType: "INDETERMINATE",
  }),
  SpecimenPipeline.blocked,
);

assert.equal(
  resolveSpecimenPipeline({
    specimenType: "INDETERMINATE",
    analysisSource: "manual",
  }),
  SpecimenPipeline.manual,
);

console.log(
  "CI-001C pipeline registry passed.",
);
