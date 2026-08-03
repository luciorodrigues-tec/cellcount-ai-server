import {
  createUncertaintyFactor,
} from "../domain/UncertaintyFactor.js";

import {
  createDiagnosticUncertaintyResult,
} from "../domain/DiagnosticUncertaintyResult.js";

import {
  mergeDiagnosticUncertaintyPolicy,
} from "../domain/DiagnosticUncertaintyPolicy.js";

import {
  UncertaintyNormalizer,
} from "./UncertaintyNormalizer.js";

import {
  HypothesisCompetitionAnalyzer,
} from "./HypothesisCompetitionAnalyzer.js";

import {
  EvidenceGapAnalyzer,
} from "./EvidenceGapAnalyzer.js";

import {
  ObservationQualityAnalyzer,
} from "./ObservationQualityAnalyzer.js";

export const DIAGNOSTIC_UNCERTAINTY_ENGINE_VERSION =
  "CRR-000031-v1.0.0";

function uncertaintyLevel(score) {
  if (score < 0.2) return "VERY_LOW";
  if (score < 0.4) return "LOW";
  if (score < 0.65) return "MODERATE";
  if (score < 0.85) return "HIGH";
  return "CRITICAL";
}

export class DiagnosticUncertaintyEngine {
  constructor({
    policy = {},
    clock = () => new Date(),
  } = {}) {
    this.policy =
      mergeDiagnosticUncertaintyPolicy(
        policy,
      );
    this.clock = clock;
    this.normalizer =
      new UncertaintyNormalizer();
    this.competitionAnalyzer =
      new HypothesisCompetitionAnalyzer();
    this.evidenceGapAnalyzer =
      new EvidenceGapAnalyzer();
    this.observationAnalyzer =
      new ObservationQualityAnalyzer();
  }

  evaluate(input) {
    if (!input?.caseId) {
      throw new TypeError(
        "DiagnosticUncertaintyEngine requires a valid input.",
      );
    }

    const confidenceScore =
      this.normalizer.clamp(
        input
          .confidenceCalibrationResult
          .finalConfidenceScore,
        0,
      );

    const residualUncertainty =
      this.normalizer
        .inverseConfidence(
          confidenceScore,
        );

    const competingHypotheses =
      input.competingHypotheses.length > 0
        ? input.competingHypotheses
        : (
            input.reasoningResult
              ?.rankedHypotheses ||
            input.consensusResult
              ?.rankedConsensus ||
            []
          );

    const competition =
      this.competitionAnalyzer
        .analyze(
          competingHypotheses,
        );

    const evidenceGap =
      this.evidenceGapAnalyzer
        .analyze({
          evidenceScores:
            input.evidenceScores,
          missingData:
            input.missingData,
        });

    const observation =
      this.observationAnalyzer
        .analyze({
          imageQualityScore:
            input.imageQualityScore,
          multiImageConsistencyScore:
            input
              .multiImageConsistencyScore,
          policy: this.policy,
        });

    const conflictDetected =
      input.consensusResult
        ?.divergenceDetected === true ||
      input.reasoningResult
        ?.conflictDetected === true ||
      input
        .confidenceCalibrationResult
        .residualConflictDetected ===
        true;

    const abstentionDetected =
      input.consensusResult
        ?.abstentionDetected === true ||
      input.reasoningResult
        ?.abstentionDetected === true ||
      input
        .confidenceCalibrationResult
        .abstentionDetected === true;

    const conflictUncertainty =
      conflictDetected
        ? 1
        : abstentionDetected
          ? 0.9
          : 0;

    const epistemicUncertainty =
      Number(
        Math.max(
          residualUncertainty,
          evidenceGap
            .uncertaintyScore,
        ).toFixed(8),
      );

    const observationalUncertainty =
      observation
        .uncertaintyScore;

    const competitionUncertainty =
      competition
        .uncertaintyScore;

    const weighted =
      residualUncertainty *
        this.policy.confidenceWeight +
      competitionUncertainty *
        this.policy.competitionWeight +
      evidenceGap.uncertaintyScore *
        this.policy.evidenceGapWeight +
      observationalUncertainty *
        this.policy.observationWeight +
      conflictUncertainty *
        this.policy.conflictWeight;

    const totalUncertaintyScore =
      Number(
        Math.max(
          0,
          Math.min(1, weighted),
        ).toFixed(8),
      );

    const factors = [];

    if (
      residualUncertainty > 0
    ) {
      factors.push(
        createUncertaintyFactor({
          id:
            "residual-confidence-gap",
          type: "EPISTEMIC",
          severity:
            residualUncertainty,
          source:
            "CONFIDENCE_CALIBRATION",
          description:
            "Residual uncertainty remains after confidence calibration.",
          resolvable: false,
        }),
      );
    }

    if (
      competitionUncertainty > 0
    ) {
      factors.push(
        createUncertaintyFactor({
          id:
            "competing-hypotheses",
          type: "COMPETITION",
          severity:
            competitionUncertainty,
          source:
            "HYPOTHESIS_RANKING",
          description:
            "Competing hypotheses have similar support.",
          resolvable: true,
          recommendation:
            "Acquire discriminative evidence or specialist review.",
        }),
      );
    }

    if (
      evidenceGap
        .uncertaintyScore > 0
    ) {
      factors.push(
        createUncertaintyFactor({
          id: "evidence-gap",
          type: "MISSING_DATA",
          severity:
            evidenceGap
              .uncertaintyScore,
          source:
            "EVIDENCE_SCORING",
          description:
            "Evidence is incomplete, absent, or insufficient.",
          resolvable: true,
          recommendation:
            "Collect additional laboratory, morphologic, or clinical evidence.",
        }),
      );
    }

    if (
      observationalUncertainty > 0
    ) {
      factors.push(
        createUncertaintyFactor({
          id:
            "observation-quality",
          type:
            "OBSERVATIONAL",
          severity:
            observationalUncertainty,
          source:
            "IMAGE_ANALYSIS",
          description:
            "Observation quality limits interpretation.",
          resolvable: true,
          recommendation:
            "Repeat image acquisition or review additional fields.",
        }),
      );
    }

    if (conflictDetected) {
      factors.push(
        createUncertaintyFactor({
          id: "engine-conflict",
          type: "CONFLICT",
          severity: 1,
          source:
            "DIAGNOSTIC_CONSENSUS",
          description:
            "Diagnostic engines remain materially divergent.",
          resolvable: true,
          recommendation:
            "Perform expert review and resolve conflicting evidence.",
        }),
      );
    }

    if (abstentionDetected) {
      factors.push(
        createUncertaintyFactor({
          id: "engine-abstention",
          type: "ABSTENTION",
          severity: 0.9,
          source:
            "CLINICAL_SAFETY",
          description:
            "At least one engine abstained or blocked automated inference.",
          resolvable: true,
          recommendation:
            "Stop automation and obtain human review.",
        }),
      );
    }

    const limitedFactors =
      factors.slice(
        0,
        this.policy.maximumFactors,
      );

    const unresolvedQuestions = [
      ...evidenceGap
        .unresolvedQuestions,
      ...observation
        .limitations,
    ];

    const recommendations = [
      ...new Set(
        limitedFactors
          .map(
            (factor) =>
              factor.recommendation,
          )
          .filter(Boolean),
      ),
    ].slice(
      0,
      this.policy
        .maximumRecommendations,
    );

    const highUncertainty =
      totalUncertaintyScore >=
      this.policy
        .highUncertaintyThreshold;

    const criticalUncertainty =
      totalUncertaintyScore >=
      this.policy
        .criticalUncertaintyThreshold;

    const requiresHumanReview =
      (
        highUncertainty &&
        this.policy
          .requireHumanReviewOnHighUncertainty
      ) ||
      (
        conflictDetected &&
        this.policy
          .requireHumanReviewOnConflict
      ) ||
      (
        input.missingData.length > 0 &&
        this.policy
          .requireHumanReviewOnMissingData
      );

    const automationAllowed =
      !(
        criticalUncertainty &&
        this.policy
          .blockAutomationOnCriticalUncertainty
      ) &&
      !abstentionDetected;

    const level =
      uncertaintyLevel(
        totalUncertaintyScore,
      );

    return createDiagnosticUncertaintyResult({
      caseId: input.caseId,
      totalUncertaintyScore,
      uncertaintyLevel: level,
      epistemicUncertainty,
      observationalUncertainty,
      conflictUncertainty,
      competitionUncertainty,
      residualUncertainty,
      requiresHumanReview,
      automationAllowed,
      factors: limitedFactors,
      unresolvedQuestions,
      recommendations,
      explanation: {
        summary:
          `Diagnostic uncertainty is ${level} (${totalUncertaintyScore.toFixed(4)}).`,
        rationale:
          `Epistemic ${epistemicUncertainty.toFixed(4)}; observational ${observationalUncertainty.toFixed(4)}; competition ${competitionUncertainty.toFixed(4)}; conflict ${conflictUncertainty.toFixed(4)}.`,
        safetyStatement:
          "Uncertainty analysis supports expert judgment and does not establish a definitive diagnosis.",
      },
      auditTrail: {
        engineVersion:
          DIAGNOSTIC_UNCERTAINTY_ENGINE_VERSION,
        policyVersion:
          this.policy.version,
        factorIds:
          Object.freeze(
            limitedFactors.map(
              (factor) => factor.id,
            ),
          ),
      },
      createdAt:
        this.clock().toISOString(),
      metadata: {
        sourceMetadata:
          input.metadata,
      },
    });
  }
}
