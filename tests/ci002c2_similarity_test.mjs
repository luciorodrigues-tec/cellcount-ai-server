import assert from "node:assert/strict";

import {
  createDefaultFeatureAliasRegistry,
  createDefaultFeatureSimilarity,
} from "../ai/matching/featureMatcher/index.js";

const aliases =
  createDefaultFeatureAliasRegistry();

const similarity =
  createDefaultFeatureSimilarity(
    aliases,
  );

assert.equal(
  similarity.score(
    "fine_chromatin",
    "fine_chromatin",
  ),
  1,
);

assert.ok(
  similarity.score(
    "fine_chromatin",
    "open_chromatin",
  ) >= 0.8,
);

console.log(
  "CI-002C.2 similarity passed.",
);
