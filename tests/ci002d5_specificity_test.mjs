import assert from "node:assert/strict";
import {
  calculateFeatureSpecificity,
} from "../ai/differentialDiagnosis/exclusiveFeatureEngine/index.js";

const hof =
  calculateFeatureSpecificity(
    "perinuclear_hof",
  );

const chromatin =
  calculateFeatureSpecificity(
    "fine_chromatin",
  );

assert.ok(
  hof.specificity >
  chromatin.specificity,
);

assert.ok(
  hof.crossLineagePenalty <
  chromatin.crossLineagePenalty,
);

console.log(
  "CI-002D.5 specificity passed.",
);
