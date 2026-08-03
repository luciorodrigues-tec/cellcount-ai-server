import assert from "node:assert/strict";
import {
  calculateRecommendationPriority,
  mergeRecommendationPolicy,
} from "../ai/differentialDiagnosis/recommendationEngine/index.js";

const policy =
  mergeRecommendationPolicy();

const high =
  calculateRecommendationPriority({
    probability: 0.9,
    discrimination: 0.9,
    confidence: 0.9,
    conflictPenalty: 0.1,
    policy,
  });

const low =
  calculateRecommendationPriority({
    probability: 0.2,
    discrimination: 0.2,
    confidence: 0.2,
    conflictPenalty: 0.8,
    policy,
  });

assert.ok(high.score > low.score);
assert.equal(high.level, "PRIMARY");

console.log(
  "CI-002D.7 priority passed.",
);
