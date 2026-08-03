import {
  createClinicalCaseSynthesisResult,
} from "../domain/ClinicalCaseSynthesisResult.js";

import {
  mergeClinicalCaseSynthesisPolicy,
} from "../domain/ClinicalCaseSynthesisPolicy.js";

export const CLINICAL_CASE_SYNTHESIS_ENGINE_VERSION =
  "CRR-000023-v1.0.0";

function leadingHypothesisFrom(input) {
  return (
    input.hypothesisRanking?.selectedClassification ||
    input.hypothesisRanking?.finalRanking?.rankedHypotheses?.[0] ||
    input.hypothesisRanking?.rankedResults?.[0] ||
    input.hypothesisRanking?.rankedHypotheses?.[0] ||
    null
  );
}

export class ClinicalCaseSynthesisEngine {
  constructor({
    policy = {},
    clock = () => new Date(),
  } = {}) {
    this.policy =
      mergeClinicalCaseSynthesisPolicy(policy);
    this.clock = clock;
  }

  synthesize(input) {
    if (!input?.caseId) {
      throw new TypeError(
        "ClinicalCaseSynthesisEngine requires a valid input.",
      );
    }

    const leadingHypothesis =
      leadingHypothesisFrom(input);

    const selectedClassification =
      input.classificationResult
        ?.selectedClassification || null;

    const criteriaResults = [
      ...(input.criteriaResults || []),
    ].slice(
      0,
      this.policy.maximumCriteriaResults,
    );

    const evidenceScores = [
      ...(input.evidenceScores || []),
    ].slice(
      0,
      this.policy.maximumEvidenceResults,
    );

    const recommendations = [
      ...(input.recommendations || []),
    ].slice(
      0,
      this.policy.maximumRecommendations,
    );

    const criteriaSummary = Object.freeze({
      total: criteriaResults.length,
      met:
        criteriaResults.filter(
          (item) => item.status === "MET",
        ).length,
      excluded:
        criteriaResults.filter(
          (item) => item.status === "EXCLUDED",
        ).length,
      indeterminate:
        criteriaResults.filter(
          (item) =>
            item.status === "INDETERMINATE",
        ).length,
      requiresHumanReview:
        criteriaResults.some(
          (item) =>
            item.requiresHumanReview === true,
        ),
    });

    const evidenceSummary = Object.freeze({
      total: evidenceScores.length,
      supported:
        evidenceScores.filter(
          (item) => item.status === "SUPPORTED",
        ).length,
      opposed:
        evidenceScores.filter(
          (item) => item.status === "OPPOSED",
        ).length,
      conflicted:
        evidenceScores.filter(
          (item) => item.status === "CONFLICTED",
        ).length,
      abstained:
        evidenceScores.filter(
          (item) => item.status === "ABSTAINED",
        ).length,
      leading:
        evidenceScores
          .slice()
          .sort(
            (a, b) =>
              Number(b.normalizedScore || 0) -
                Number(a.normalizedScore || 0) ||
              String(a.hypothesisId || "").localeCompare(
                String(b.hypothesisId || ""),
              ),
          )[0] || null,
      requiresHumanReview:
        evidenceScores.some(
          (item) =>
            item.requiresHumanReview === true,
        ),
    });

    const recommendationSummary = Object.freeze({
      total: recommendations.length,
      highestPriority:
        recommendations[0]?.highestPriority ||
        recommendations[0]?.priority ||
        null,
      requiresHumanReview:
        recommendations.some(
          (item) =>
            item.requiresHumanReview === true,
        ),
      automationBlocked:
        recommendations.some(
          (item) =>
            item.automationBlocked === true ||
            item.blocksAutomation === true,
        ),
    });

    const morphologySummary =
      input.morphology &&
      typeof input.morphology === "object"
        ? Object.freeze({
            riskClass:
              input.morphology
                .morphologicRiskClass ||
              input.morphology.riskClass ||
              null,
            patternRecognition:
              input.morphology
                .patternRecognition ||
              null,
            preserved:
              input.morphology.preserved ??
              null,
          })
        : null;

    const combinedConflicts = Object.freeze([
      ...(input.conflicts || []),
      ...evidenceScores.filter(
        (item) => item.conflictDetected === true,
      ),
      ...(
        input.classificationResult
          ?.competitionConflicts || []
      ),
    ]);

    const indeterminate =
      !leadingHypothesis ||
      criteriaSummary.indeterminate > 0 ||
      evidenceSummary.abstained > 0;

    const conflictDetected =
      combinedConflicts.length > 0 ||
      evidenceSummary.conflicted > 0;

    let status = "SYNTHESIZED";

    if (
      evidenceSummary.abstained > 0
    ) {
      status = "ABSTAINED";
    } else if (conflictDetected) {
      status = "CONFLICTED";
    } else if (indeterminate) {
      status = "INDETERMINATE";
    }

    const requiresHumanReview =
      criteriaSummary.requiresHumanReview ||
      evidenceSummary.requiresHumanReview ||
      recommendationSummary.requiresHumanReview ||
      input.classificationResult
        ?.requiresHumanReview === true ||
      (
        conflictDetected &&
        this.policy.requireHumanReviewOnConflict
      ) ||
      (
        indeterminate &&
        this.policy.requireHumanReviewOnIndeterminate
      ) ||
      (
        !selectedClassification &&
        this.policy
          .requireHumanReviewOnMissingClassification
      ) ||
      (
        evidenceScores.length === 0 &&
        this.policy
          .requireHumanReviewOnMissingEvidence
      );

    const automationBlocked =
      recommendationSummary.automationBlocked ||
      (
        evidenceSummary.abstained > 0 &&
        this.policy.blockAutomationOnAbstention
      ) ||
      (
        recommendations.some(
          (item) =>
            (
              item.highestPriority === "CRITICAL" ||
              item.priority === "CRITICAL"
            ),
        ) &&
        this.policy
          .blockAutomationOnCriticalRecommendation
      );

    return createClinicalCaseSynthesisResult({
      caseId: input.caseId,
      status,
      leadingHypothesis,
      selectedClassification,
      criteriaSummary,
      evidenceSummary,
      recommendationSummary,
      morphologySummary,
      conflicts: combinedConflicts,
      alerts: input.alerts,
      requiresHumanReview,
      automationBlocked,
      createdAt:
        this.clock().toISOString(),
      metadata: {
        engineVersion:
          CLINICAL_CASE_SYNTHESIS_ENGINE_VERSION,
        sourceMetadata:
          input.metadata || {},
      },
    });
  }
}
