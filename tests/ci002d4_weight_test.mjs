import assert from "node:assert/strict";

import {
  calculateEvidenceWeight,
  mergeDifferentialEvidencePolicy,
} from "../ai/differentialDiagnosis/evidenceEngine/index.js";

const policy =
  mergeDifferentialEvidencePolicy();

const strong =
  calculateEvidenceWeight({
    confidence: 1,
    diagnosticFactor: 1,
    coverage: 1,
    policy,
  });

const weak =
  calculateEvidenceWeight({
    confidence: 0.2,
    diagnosticFactor: 0.2,
    coverage: 0.2,
    policy,
  });

assert.ok(
  strong.weight >
  weak.weight,
);

assert.equal(
  strong.strength,
  "HIGH",
);

console.log(
  "CI-002D.4 evidence weighting passed.",
);
