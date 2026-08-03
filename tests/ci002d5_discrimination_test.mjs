import assert from "node:assert/strict";
import {
  calculateFeatureDiscrimination,
  mergeExclusiveFeaturePolicy,
} from "../ai/differentialDiagnosis/exclusiveFeatureEngine/index.js";

const policy =
  mergeExclusiveFeaturePolicy();

const strong =
  calculateFeatureDiscrimination({
    specificity: 1,
    sensitivity: 1,
    evidenceWeight: 1,
    confidence: 1,
    crossLineagePenalty: 0,
    policy,
  });

const weak =
  calculateFeatureDiscrimination({
    specificity: 0.2,
    sensitivity: 0.3,
    evidenceWeight: 0.2,
    confidence: 0.2,
    crossLineagePenalty: 0.5,
    policy,
  });

assert.ok(
  strong.score > weak.score,
);

assert.equal(
  strong.classification,
  "PATHOGNOMONIC",
);

console.log(
  "CI-002D.5 discrimination passed.",
);
