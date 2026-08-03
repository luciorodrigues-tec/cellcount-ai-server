import assert from "node:assert/strict";
import {
  validateFinalDiagnosisSafety,
} from "../ai/differentialDiagnosis/finalDiagnosisEngine/index.js";

const safe =
  validateFinalDiagnosisSafety({
    primaryCell: "CELL-A",
    overallConfidence: 0.8,
    overallConsistency: 0.8,
    executiveSummary: {
      fullText:
        "Os achados favorecem CELL-A.",
    },
    recommendations: [],
  });

assert.equal(
  safe.safe,
  true,
);

const unsafe =
  validateFinalDiagnosisSafety({
    primaryCell: "CELL-A",
    overallConfidence: 0.8,
    overallConsistency: 0.8,
    executiveSummary: {
      fullText:
        "Diagnóstico confirmado.",
    },
    recommendations: [],
  });

assert.equal(
  unsafe.safe,
  false,
);
console.log(
  "CI-002D.8 safety passed.",
);
