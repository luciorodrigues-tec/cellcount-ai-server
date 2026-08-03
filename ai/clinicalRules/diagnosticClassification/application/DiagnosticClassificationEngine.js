import {
  mergeDiagnosticClassificationPolicy,
} from "../domain/DiagnosticClassificationPolicy.js";

export const DIAGNOSTIC_CLASSIFICATION_ENGINE_VERSION =
  "CRR-000020-v1.0.0";

export class DiagnosticClassificationEngine {
  constructor({
    repository,
    criteriaEngine,
    policy = {},
  } = {}) {
    if (!repository) {
      throw new TypeError(
        "DiagnosticClassificationEngine requires a repository.",
      );
    }

    if (!criteriaEngine) {
      throw new TypeError(
        "DiagnosticClassificationEngine requires a diagnostic criteria engine.",
      );
    }

    this.repository = repository;
    this.criteriaEngine = criteriaEngine;
    this.policy =
      mergeDiagnosticClassificationPolicy(policy);
  }

  evaluate({
    observedFeatureIds = [],
    measurements = {},
    classificationId = null,
  } = {}) {
    const candidates =
      this.repository.listCandidates({
        classificationId,
        status: "ACTIVE",
      });

    const evaluated = candidates.map(
      (candidate) => {
        const criteriaResult =
          this.criteriaEngine.evaluateSet({
            criteriaSetId:
              candidate.criteriaSetId,
            observedFeatureIds,
            measurements,
          });

        let status = "INELIGIBLE";
        let reason =
          "CRITERIA_STATUS_NOT_ELIGIBLE";

        if (
          this.policy.excludedStatuses.includes(
            criteriaResult.status,
          )
        ) {
          status = "EXCLUDED";
          reason =
            "CRITERIA_SET_EXCLUDED";
        } else if (
          this.policy.indeterminateStatuses.includes(
            criteriaResult.status,
          )
        ) {
          status = "INDETERMINATE";
          reason =
            "CRITERIA_SET_INDETERMINATE";
        } else if (
          this.policy.eligibleStatuses.includes(
            criteriaResult.status,
          ) &&
          criteriaResult.status ===
            candidate.requiredStatus
        ) {
          status = "ELIGIBLE";
          reason =
            "CRITERIA_SET_ELIGIBLE";
        }

        return Object.freeze({
          engineVersion:
            DIAGNOSTIC_CLASSIFICATION_ENGINE_VERSION,
          candidateId: candidate.id,
          classificationId:
            candidate.classificationId,
          diseaseEntityId:
            candidate.diseaseEntityId,
          label: candidate.label,
          precedence:
            candidate.precedence,
          status,
          reason,
          criteriaResult,
          exclusionCandidateIds:
            candidate.exclusionCandidateIds,
          competingCandidateIds:
            candidate.competingCandidateIds,
          requiresHumanReview:
            status === "INDETERMINATE" ||
            criteriaResult
              .requiresHumanReview === true,
        });
      },
    );

    const eligible = evaluated.filter(
      (item) => item.status === "ELIGIBLE",
    );

    const excludedIds = new Set();

    for (const item of eligible) {
      for (
        const excludedId of
        item.exclusionCandidateIds
      ) {
        excludedIds.add(excludedId);
      }
    }

    const postExclusion = eligible
      .filter(
        (item) =>
          !excludedIds.has(item.candidateId),
      )
      .map((item) =>
        excludedIds.has(item.candidateId)
          ? Object.freeze({
              ...item,
              status: "EXCLUDED_BY_PRECEDENCE",
            })
          : item,
      );

    const ranked = [...postExclusion].sort(
      (a, b) =>
        (
          this.policy.preferHigherPrecedence
            ? b.precedence - a.precedence
            : a.precedence - b.precedence
        ) ||
        a.candidateId.localeCompare(
          b.candidateId,
        ),
    );

    const top = ranked[0] || null;
    const topTie =
      ranked.length > 1 &&
      top &&
      ranked[1].precedence ===
        top.precedence;

    const competitionConflicts = [];

    for (const item of ranked) {
      for (
        const competitorId of
        item.competingCandidateIds
      ) {
        const competitor =
          ranked.find(
            (entry) =>
              entry.candidateId ===
              competitorId,
          );

        if (!competitor) {
          continue;
        }

        const pair = [
          item.candidateId,
          competitor.candidateId,
        ].sort();

        const key = pair.join("::");

        if (
          !competitionConflicts.some(
            (entry) => entry.key === key,
          )
        ) {
          competitionConflicts.push(
            Object.freeze({
              key,
              candidateIds:
                Object.freeze(pair),
            }),
          );
        }
      }
    }

    const indeterminateCount =
      evaluated.filter(
        (item) =>
          item.status === "INDETERMINATE",
      ).length;

    return Object.freeze({
      engineVersion:
        DIAGNOSTIC_CLASSIFICATION_ENGINE_VERSION,
      classificationId:
        classificationId || null,
      evaluatedCount:
        evaluated.length,
      eligibleCount: ranked.length,
      indeterminateCount,
      excludedCount:
        evaluated.filter(
          (item) =>
            item.status === "EXCLUDED",
        ).length,
      topTie,
      competitionConflicts:
        Object.freeze(
          competitionConflicts,
        ),
      selectedClassification: top,
      rankedClassifications:
        Object.freeze(
          ranked.slice(
            0,
            this.policy.maximumResults,
          ),
        ),
      allEvaluations:
        Object.freeze(evaluated),
      requiresHumanReview:
        evaluated.some(
          (item) =>
            item.requiresHumanReview,
        ) ||
        (
          topTie &&
          this.policy
            .requireHumanReviewOnTie
        ) ||
        (
          competitionConflicts.length > 0 &&
          this.policy
            .requireHumanReviewOnCompetition
        ) ||
        (
          indeterminateCount > 0 &&
          this.policy
            .requireHumanReviewOnIndeterminate
        ),
      explanation: Object.freeze({
        summary:
          top
            ? `Selected classification candidate ${top.candidateId}.`
            : "No classification candidate selected.",
        rationale:
          `Eligible ${ranked.length}; indeterminate ${indeterminateCount}; ties ${topTie}; competition conflicts ${competitionConflicts.length}.`,
        safetyStatement:
          "Diagnostic classification is clinical decision support and not a definitive diagnosis.",
      }),
    });
  }
}
