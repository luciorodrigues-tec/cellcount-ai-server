import assert from "node:assert/strict";
import {
  sanitizeRecommendationLanguage,
  validateRecommendationSafety,
} from "../ai/differentialDiagnosis/recommendationEngine/index.js";

const text =
  sanitizeRecommendationLanguage(
    "Diagnóstico confirmado. O paciente possui plasmoblastos.",
  );

const validation =
  validateRecommendationSafety(text);

assert.equal(validation.safe, true);
assert.doesNotMatch(
  text,
  /diagnóstico confirmado/i,
);

console.log(
  "CI-002D.7 safety passed.",
);
