import assert from "node:assert/strict";

import {
  buildObservedFeatureIndex,
  calculateSharedFeatureAgreement,
} from "../ai/differentialDiagnosis/similarityCalculator/index.js";

const featureIndex =
  buildObservedFeatureIndex({
    fine_chromatin: 1,
    visible_nucleoli: 0.8,
    high_nc_ratio: 0.6,
  });

const result =
  calculateSharedFeatureAgreement(
    {
      sharedFeatures: [
        "fine_chromatin",
        "visible_nucleoli",
        "high_nc_ratio",
      ],
    },
    featureIndex,
    0.15,
  );

assert.equal(
  result.matched,
  3,
);

assert.equal(
  result.total,
  3,
);

assert.equal(
  result.score,
  0.8,
);

console.log(
  "CI-002D.3 shared agreement passed.",
);
