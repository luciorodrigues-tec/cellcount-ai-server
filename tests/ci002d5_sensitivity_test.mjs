import assert from "node:assert/strict";
import {
  calculateFeatureSensitivity,
} from "../ai/differentialDiagnosis/exclusiveFeatureEngine/index.js";

const result =
  calculateFeatureSensitivity(
    "perinuclear_hof",
  );

assert.equal(
  result.featureId,
  "perinuclear_hof",
);

assert.ok(
  result.sensitivity > 0,
);

console.log(
  "CI-002D.5 sensitivity passed.",
);
