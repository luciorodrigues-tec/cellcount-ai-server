import {
  createConfidenceFactor,
} from "../domain/ConfidenceFactor.js";

import {
  createConfidenceCalibrationResult,
} from "../domain/ConfidenceCalibrationResult.js";

import {
  confidenceLevelFromScore,
} from "../domain/ConfidenceLevel.js";

import {
  mergeDiagnosticConfidencePolicy,
} from "../domain/DiagnosticConfidencePolicy.js";

import {
  ConfidenceNormalizer,
} from "./ConfidenceNormalizer.js";

import {
  ConfidenceWeightCalculator,
} from "./ConfidenceWeightCalculator.js";

import {
  OverconfidenceDetector,
} from "./OverconfidenceDetector.js";

import {
  UnderconfidenceDetector,
} from "./UnderconfidenceDetector.js";

import {
  ConfidenceSafetyValidator,
} from "./ConfidenceSafetyValidator.js";

import {
  ConfidenceExplainer,
} from "./ConfidenceExplainer.js";

import {
  ConfidenceAuditBuilder,
} from "./ConfidenceAuditBuilder.js";

export const DIAGNOSTIC_CONFIDENCE_CALIBRATION_ENGINE_VERSION =
  "CRR-000030-v1.0.0";

function selectedEvidence(input) {
  const selectedHypothesisId =
    input.consensusResult?.selectedConsensus?.hypothesisId ||
    input.reasoningResult?.selectedHypothesis?.diseaseId ||
    input.classificationResult?.selectedClassification?.diseaseEntityId ||
    null;

  if (!selectedHypothesisId) {
    return input.evidenceScores?.[0] || null;
  }

  return (
    input.evidenceScores?.find(
      (item) =>
        item.hypothesisId === selectedHypothesisId,
    ) ||
    input.evidenceScores?.[0] ||
    null
  );
}

export class DiagnosticConfidenceCalibrationEngine {
  constructor({
    policy = {},
    clock = () => new Date(),
  } = {}) {
    this.policy =
      mergeDiagnosticConfidencePolicy(policy);
    this.clock = clock;
    this.normalizer = new ConfidenceNormalizer();
    this.weightCalculator =
      new ConfidenceWeightCalculator();
    this.overconfidenceDetector =
      new OverconfidenceDetector();
    this.underconfidenceDetector =
      new UnderconfidenceDetector();
    this.safetyValidator =
      new ConfidenceSafetyValidator();
    this.explainer =
      new ConfidenceExplainer();
    this.auditBuilder =
      new ConfidenceAuditBuilder();
  }

  calibrate(input) {
    if (!input?.caseId) {
      throw new TypeError(
        "DiagnosticConfidenceCalibrationEngine requires a valid input.",
      );
    }

    const factors = [];
    const weights = this.policy.sourceWeights;

    const classificationSelected =
      input.classificationResult?.selectedClassification != null;

    factors.push(
      createConfidenceFactor({
        id: "classification",
        source: "CLASSIFICATION",
        direction:
          classificationSelected
            ? "POSITIVE"
            : "NEGATIVE",
        value: classificationSelected ? 1 : 0.5,
        weight: weights.classification,
        rationale:
          classificationSelected
            ? "A diagnostic classification was selected."
            : "No diagnostic classification was selected.",
      }),
    );

    const evidence = selectedEvidence(input);
    const signedEvidence =
      this.normalizer.normalizeSigned(
        evidence?.normalizedScore,
        0,
      );

    factors.push(
      createConfidenceFactor({
        id: "evidence",
        source: "EVIDENCE",
        direction:
          evidence?.status === "ABSTAINED"
            ? "NEGATIVE"
            : signedEvidence >= 0
              ? "POSITIVE"
              : "NEGATIVE",
        value: Math.abs(signedEvidence),
        weight: weights.evidence,
        rationale:
          `Evidence status ${evidence?.status || "UNAVAILABLE"}.`,
      }),
    );

    const syndromeScore =
      this.normalizer.normalize(
        input.syndromeResult?.rankedSyndromes?.[0]?.score,
        input.syndromeResult?.selectedSyndrome ? 1 : 0,
      );

    factors.push(
      createConfidenceFactor({
        id: "syndrome",
        source: "SYNDROME",
        direction:
          input.syndromeResult?.selectedSyndrome
            ? "POSITIVE"
            : "NEUTRAL",
        value: syndromeScore,
        weight: weights.syndrome,
        rationale:
          input.syndromeResult?.selectedSyndrome
            ? "A hematologic syndrome was selected."
            : "No hematologic syndrome was selected.",
      }),
    );

    const reasoningScore =
      this.normalizer.normalize(
        input.reasoningResult?.selectedHypothesis?.compositeScore,
        input.reasoningResult?.rankedHypotheses?.[0]?.compositeScore,
      );

    factors.push(
      createConfidenceFactor({
        id: "reasoning",
        source: "REASONING",
        direction:
          input.reasoningResult?.selectedHypothesis
            ? "POSITIVE"
            : "NEGATIVE",
        value:
          input.reasoningResult?.selectedHypothesis
            ? reasoningScore
            : Math.max(0.25, 1 - reasoningScore),
        weight: weights.reasoning,
        rationale:
          input.reasoningResult?.selectedHypothesis
            ? "Hematologic reasoning selected a supported hypothesis."
            : "Hematologic reasoning did not select a supported hypothesis.",
      }),
    );

    const consensusScore =
      this.normalizer.normalize(
        input.consensusResult?.selectedConsensus?.consensusScore,
        0,
      );

    factors.push(
      createConfidenceFactor({
        id: "consensus",
        source: "CONSENSUS",
        direction:
          input.consensusResult?.selectedConsensus
            ? "POSITIVE"
            : "NEGATIVE",
        value:
          input.consensusResult?.selectedConsensus
            ? consensusScore
            : 0.75,
        weight: weights.consensus,
        rationale:
          input.consensusResult?.selectedConsensus
            ? "Diagnostic consensus was reached."
            : "Diagnostic consensus was not reached.",
      }),
    );

    if (input.imageQualityScore !== null) {
      const quality =
        this.normalizer.normalize(
          input.imageQualityScore,
          0,
        );

      factors.push(
        createConfidenceFactor({
          id: "image-quality",
          source: "IMAGE_QUALITY",
          direction:
            quality >= this.policy.minimumImageQuality
              ? "POSITIVE"
              : "NEGATIVE",
          value:
            quality >= this.policy.minimumImageQuality
              ? quality
              : this.policy.lowImageQualityPenalty,
          weight: weights.imageQuality,
          rationale:
            `Image quality score ${quality.toFixed(4)}.`,
        }),
      );
    }

    if (
      input.multiImageConsistencyScore !== null
    ) {
      const consistency =
        this.normalizer.normalize(
          input.multiImageConsistencyScore,
          0,
        );

      factors.push(
        createConfidenceFactor({
          id: "multi-image-consistency",
          source: "MULTI_IMAGE_CONSISTENCY",
          direction:
            consistency >= 0.5
              ? "POSITIVE"
              : "NEGATIVE",
          value:
            consistency >= 0.5
              ? consistency
              : 1 - consistency,
          weight:
            weights.multiImageConsistency,
          rationale:
            `Multi-image consistency score ${consistency.toFixed(4)}.`,
        }),
      );
    }

    for (
      const factor of
      input.additionalFactors || []
    ) {
      factors.push(factor);
    }

    const residualConflictDetected =
      input.consensusResult?.divergenceDetected === true ||
      input.reasoningResult?.conflictDetected === true ||
      evidence?.status === "CONFLICTED";

    const abstentionDetected =
      input.consensusResult?.abstentionDetected === true ||
      input.reasoningResult?.abstentionDetected === true ||
      evidence?.status === "ABSTAINED";

    if (residualConflictDetected) {
      factors.push(
        createConfidenceFactor({
          id: "residual-conflict",
          source: "SAFETY",
          direction: "NEGATIVE",
          value: this.policy.conflictPenalty,
          weight: 1,
          rationale:
            "Residual disagreement remains between diagnostic engines.",
        }),
      );
    }

    if (abstentionDetected) {
      factors.push(
        createConfidenceFactor({
          id: "abstention",
          source: "SAFETY",
          direction: "NEGATIVE",
          value: this.policy.abstentionPenalty,
          weight: 1,
          rationale:
            "At least one engine abstained or blocked automated inference.",
        }),
      );
    }

    const limitedFactors =
      factors.slice(
        0,
        this.policy.maximumAuditFactors,
      );

    const weightedResult =
      this.weightCalculator.calculate(
        limitedFactors,
      );

    const calibratedConfidence =
      weightedResult.score;

    const declaredConfidence =
      input.declaredConfidence === null
        ? null
        : this.normalizer.normalize(
            input.declaredConfidence,
            0,
          );

    const overconfidenceDetected =
      this.overconfidenceDetector.detect({
        declaredConfidence,
        calibratedConfidence,
        threshold:
          this.policy.overconfidenceGap,
      });

    const underconfidenceDetected =
      this.underconfidenceDetector.detect({
        declaredConfidence,
        calibratedConfidence,
        threshold:
          this.policy.underconfidenceGap,
      });

    const safety =
      this.safetyValidator.validate({
        score: calibratedConfidence,
        residualConflictDetected,
        abstentionDetected,
        overconfidenceDetected,
        policy: this.policy,
      });

    const level =
      confidenceLevelFromScore(
        calibratedConfidence,
      );

    const positiveFactors =
      limitedFactors.filter(
        (factor) =>
          factor.direction === "POSITIVE",
      );

    const negativeFactors =
      limitedFactors.filter(
        (factor) =>
          factor.direction === "NEGATIVE",
      );

    const explanation =
      this.explainer.explain({
        score: calibratedConfidence,
        level,
        factorCount:
          limitedFactors.length,
        positiveCount:
          positiveFactors.length,
        negativeCount:
          negativeFactors.length,
        residualConflictDetected,
        abstentionDetected,
        overconfidenceDetected,
        underconfidenceDetected,
      });

    const auditTrail =
      this.auditBuilder.build({
        input,
        weightedResult,
        policy: this.policy,
        factors: limitedFactors,
      });

    return createConfidenceCalibrationResult({
      caseId: input.caseId,
      finalConfidenceScore:
        calibratedConfidence,
      confidenceLevel: level,
      calibrationStatus:
        "CALIBRATED",
      overconfidenceDetected,
      underconfidenceDetected,
      residualConflictDetected,
      abstentionDetected,
      requiresHumanReview:
        safety.requiresHumanReview,
      automationAllowed:
        safety.automationAllowed,
      confidenceFactors:
        limitedFactors,
      positiveFactors,
      negativeFactors,
      auditTrail,
      explanation,
      createdAt:
        this.clock().toISOString(),
      metadata: {
        engineVersion:
          DIAGNOSTIC_CONFIDENCE_CALIBRATION_ENGINE_VERSION,
      },
    });
  }
}
