import assert from "node:assert/strict";
import {
  FinalDifferentialDiagnosisEngine,
} from "../ai/differentialDiagnosis/finalDiagnosisEngine/index.js";

const engine =
  new FinalDifferentialDiagnosisEngine();

const result =
  engine.analyze({
    recommendationAnalysis: {
      specimenType:
        "BONE_MARROW_ASPIRATE",
      recommendations: [
        {
          recommendations: [
            {
              cell: "CELL-A",
              probability: 0.8,
              confidence: 0.8,
              priorityScore: 0.9,
              recommendationLevel:
                "PRIMARY",
            },
            {
              cell: "CELL-B",
              probability: 0.2,
              confidence: 0.8,
              priorityScore: 0.3,
              recommendationLevel:
                "TERTIARY",
            },
          ],
          summary: {
            recommendedCorrelation: [],
          },
        },
      ],
      conflictAnalysis: {
        conflicts: [],
        exclusiveAnalysis: {
          exclusiveFeatures: [],
          evidenceAnalysis: {
            evidence: [],
            similarityAnalysis: {
              similarities: [],
              pairAnalysis: {
                graphAnalysis: {
                  explained: {
                    explanation: {
                      winner: {
                        cellId: "CELL-A",
                        normalizedScore: 0.8,
                      },
                      confidence: {
                        score: 0.8,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

for (const key of [
  "primaryDiagnosis",
  "alternativeDiagnoses",
  "overallConfidence",
  "overallConsistency",
  "agreementIndex",
  "conflictIndex",
  "executiveSummary",
  "safetyValidation",
]) {
  assert.ok(
    Object.hasOwn(result, key),
    key,
  );
}

assert.equal(
  result.primaryDiagnosis.cell,
  "CELL-A",
);
console.log(
  "CI-002D.8 final contract passed.",
);
