import assert from "node:assert/strict";
import {
  buildExclusiveFeatureSummary,
} from "../ai/differentialDiagnosis/exclusiveFeatureEngine/index.js";

const summary =
  buildExclusiveFeatureSummary([
    {
      featureId: "a",
      discriminationScore: 0.95,
      classification:
        "PATHOGNOMONIC",
    },
    {
      featureId: "b",
      discriminationScore: 0.70,
      classification:
        "HIGH",
    },
  ]);

assert.equal(
  summary.statistics.total,
  2,
);

assert.equal(
  summary.statistics.pathognomonic,
  1,
);

assert.equal(
  summary.rankedFeatures[0]
    .featureId,
  "a",
);

console.log(
  "CI-002D.5 summary passed.",
);
