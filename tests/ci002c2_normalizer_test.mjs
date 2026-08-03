import assert from "node:assert/strict";

import {
  createDefaultFeatureAliasRegistry,
  normalizeDetectedFeatures,
} from "../ai/matching/featureMatcher/index.js";

const registry =
  createDefaultFeatureAliasRegistry();

const normalized =
  normalizeDetectedFeatures(
    {
      "Cromatina delicada": 0.91,
      "FEATURE_FINE_CHROMATIN": 0.80,
      "Nucléolos visíveis": {
        confidence: 0.82,
      },
    },
    {
      aliasRegistry: registry,
    },
  );

assert.equal(
  normalized.get(
    "fine_chromatin",
  ).confidence,
  0.91,
);

assert.equal(
  normalized.get(
    "visible_nucleoli",
  ).confidence,
  0.82,
);

console.log(
  "CI-002C.2 normalizer passed.",
);
