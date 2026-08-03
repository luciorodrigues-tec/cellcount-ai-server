import {
  FINAL_DIFFERENTIAL_DIAGNOSIS_VERSION,
  mergeFinalDiagnosisPolicy,
} from "./FinalDiagnosisPolicy.js";

import {
  aggregateFinalDiagnosisInput,
} from "./FinalDiagnosisAggregator.js";

import {
  checkFinalDiagnosisConsistency,
} from "./FinalDiagnosisConsistencyChecker.js";

import {
  fuseFinalDiagnosisConfidence,
} from "./FinalDiagnosisConfidenceFusion.js";

import {
  buildFinalDiagnosisExecutiveSummary,
} from "./FinalDiagnosisExecutiveSummary.js";

import {
  validateFinalDiagnosisSafety,
} from "./FinalDiagnosisSafetyValidator.js";

import {
  createFinalDiagnosisResult,
} from "./FinalDiagnosisResult.js";

export class FinalDifferentialDiagnosisEngine {
  constructor({
    policy = {},
  } = {}) {
    this.policy =
      mergeFinalDiagnosisPolicy(policy);
  }

  analyze({
    recommendationAnalysis,
    executionTimeMs = null,
  } = {}) {
    if (
      !recommendationAnalysis ||
      typeof recommendationAnalysis !== "object"
    ) {
      throw new TypeError(
        "recommendationAnalysis is required.",
      );
    }

    const aggregate =
      aggregateFinalDiagnosisInput(
        recommendationAnalysis,
        this.policy,
      );

    const consistency =
      checkFinalDiagnosisConsistency(
        aggregate,
      );

    const confidenceFusion =
      fuseFinalDiagnosisConfidence(
        aggregate,
        consistency,
        this.policy,
      );

    const executiveSummary =
      buildFinalDiagnosisExecutiveSummary({
        aggregate,
        consistency,
        confidenceFusion,
      });

    const safetyValidation =
      validateFinalDiagnosisSafety({
        primaryCell:
          aggregate.primaryCell,
        overallConfidence:
          confidenceFusion
            .overallConfidence,
        overallConsistency:
          consistency
            .overallConsistency,
        executiveSummary,
        recommendations:
          aggregate.recommendations,
      });

    const primaryDiagnosis = {
      cell:
        aggregate.primaryCell,
      probability:
        Number(
          aggregate.primaryRecommendation
            ?.probability ||
          aggregate.winner
            ?.normalizedScore ||
          0,
        ),
      confidence:
        confidenceFusion
          .overallConfidence,
      recommendation:
        aggregate
          .primaryRecommendation,
    };

    return createFinalDiagnosisResult({
      version:
        FINAL_DIFFERENTIAL_DIAGNOSIS_VERSION,
      pipelineVersion:
        "CI-002D-v1",
      specimenType:
        aggregate.specimenType,
      primaryDiagnosis,
      alternativeDiagnoses:
        aggregate.alternatives,
      ranking:
        aggregate.ranking,
      confidence:
        aggregate.confidence,
      evidence:
        aggregate.evidenceResults,
      exclusiveFeatures:
        aggregate
          .exclusiveFeatureResults,
      conflicts:
        aggregate.conflicts,
      recommendations:
        aggregate.recommendations,
      consistency,
      confidenceFusion,
      executiveSummary,
      safetyValidation,
      statistics: {
        overallConfidence:
          confidenceFusion
            .overallConfidence,
        overallConsistency:
          consistency
            .overallConsistency,
        agreementIndex:
          consistency.agreementIndex,
        conflictIndex:
          consistency.conflictIndex,
        recommendationAgreement:
          consistency.agreementIndex,
        safetyValidated:
          safetyValidation.safe,
        executionTimeMs:
          executionTimeMs == null
            ? null
            : Number(executionTimeMs),
      },
      metadata: {
        policy:
          this.policy,
        generatedAt:
          new Date().toISOString(),
      },
    });
  }
}
