import {
  mergeDiagnosticCriteriaPolicy,
} from "../domain/DiagnosticCriteriaPolicy.js";

export const DIAGNOSTIC_CRITERIA_ENGINE_VERSION =
  "CRR-000019-v1.0.0";

function isCriterionMatched(criterion, observedFeatureIds, measurements) {
  const observed = new Set(observedFeatureIds || []);
  const matches = criterion.featureIds.filter((id) => observed.has(id));

  let matched = false;

  if (criterion.operator === "ALL") {
    matched =
      criterion.featureIds.length > 0 &&
      matches.length === criterion.featureIds.length;
  } else if (criterion.operator === "COUNT_AT_LEAST") {
    matched = matches.length >= criterion.requiredCount;
  } else if (criterion.operator === "THRESHOLD_GTE") {
    matched =
      criterion.threshold !== null &&
      Number(measurements?.[criterion.id]) >= criterion.threshold;
  } else if (criterion.operator === "THRESHOLD_LTE") {
    matched =
      criterion.threshold !== null &&
      Number(measurements?.[criterion.id]) <= criterion.threshold;
  } else {
    matched = matches.length > 0;
  }

  return Object.freeze({
    matched,
    matchedFeatureIds: Object.freeze(matches),
    measuredValue:
      measurements?.[criterion.id] ?? null,
  });
}

export class DiagnosticCriteriaEngine {
  constructor({
    repository,
    policy = {},
  } = {}) {
    if (!repository) {
      throw new TypeError(
        "DiagnosticCriteriaEngine requires a repository.",
      );
    }

    this.repository = repository;
    this.policy = mergeDiagnosticCriteriaPolicy(policy);
  }

  evaluateSet({
    criteriaSetId,
    observedFeatureIds = [],
    measurements = {},
  } = {}) {
    const criteriaSet =
      this.repository.getSet(criteriaSetId);

    if (!criteriaSet) {
      throw new Error(
        `Unknown diagnostic criteria set: ${criteriaSetId}`,
      );
    }

    const evaluations = criteriaSet.criterionIds.map((criterionId) => {
      const criterion =
        this.repository.getCriterion(criterionId);

      if (!criterion) {
        if (this.policy.rejectUnknownCriteria) {
          throw new Error(
            `Unknown diagnostic criterion: ${criterionId}`,
          );
        }

        return Object.freeze({
          criterionId,
          status: "UNKNOWN",
          matched: false,
        });
      }

      const result =
        isCriterionMatched(
          criterion,
          observedFeatureIds,
          measurements,
        );

      return Object.freeze({
        criterionId: criterion.id,
        criterionType: criterion.type,
        label: criterion.label,
        weight: criterion.weight,
        matched: result.matched,
        matchedFeatureIds:
          result.matchedFeatureIds,
        measuredValue:
          result.measuredValue,
      });
    });

    const countMatched = (type) =>
      evaluations.filter(
        (item) =>
          item.criterionType === type &&
          item.matched,
      ).length;

    const required = evaluations.filter(
      (item) => item.criterionType === "REQUIRED",
    );

    const requiredSatisfied =
      !this.policy.requireAllRequiredCriteria ||
      required.every((item) => item.matched);

    const exclusionMatched =
      evaluations.some(
        (item) =>
          item.criterionType === "EXCLUSION" &&
          item.matched,
      );

    const majorCount = countMatched("MAJOR");
    const minorCount = countMatched("MINOR");
    const supportiveCount =
      countMatched("SUPPORTIVE");

    const score = evaluations
      .filter(
        (item) =>
          item.matched &&
          item.criterionType !== "EXCLUSION",
      )
      .reduce(
        (total, item) =>
          total + Number(item.weight || 0),
        0,
      );

    const thresholdsSatisfied =
      majorCount >= criteriaSet.minimumMajor &&
      minorCount >= criteriaSet.minimumMinor &&
      supportiveCount >=
        criteriaSet.minimumSupportive &&
      score >= criteriaSet.minimumScore;

    const exclusionOverrides =
      criteriaSet.exclusionOverrides ??
      this.policy.exclusionOverridesByDefault;

    let status = "NOT_MET";
    let reason = "CRITERIA_THRESHOLDS_NOT_MET";

    if (exclusionMatched && exclusionOverrides) {
      status = "EXCLUDED";
      reason = "EXCLUSION_CRITERION_MATCHED";
    } else if (!requiredSatisfied) {
      status = "NOT_MET";
      reason = "REQUIRED_CRITERION_MISSING";
    } else if (thresholdsSatisfied) {
      status = "MET";
      reason = "CRITERIA_SET_SATISFIED";
    } else if (
      evaluations.some((item) => item.status === "UNKNOWN")
    ) {
      status = "INDETERMINATE";
      reason = "UNKNOWN_CRITERION_PRESENT";
    }

    const conflictDetected =
      exclusionMatched &&
      requiredSatisfied &&
      thresholdsSatisfied;

    return Object.freeze({
      engineVersion:
        DIAGNOSTIC_CRITERIA_ENGINE_VERSION,
      criteriaSetId: criteriaSet.id,
      classificationId:
        criteriaSet.classificationId,
      diseaseEntityId:
        criteriaSet.diseaseEntityId,
      status,
      reason,
      requiredSatisfied,
      exclusionMatched,
      conflictDetected,
      majorCount,
      minorCount,
      supportiveCount,
      score: Number(score.toFixed(8)),
      evaluations: Object.freeze(evaluations),
      requiresHumanReview:
        (
          conflictDetected &&
          this.policy.requireHumanReviewOnConflict
        ) ||
        (
          status === "INDETERMINATE" &&
          this.policy.requireHumanReviewOnIndeterminate
        ),
      explanation: Object.freeze({
        summary:
          `Criteria set ${criteriaSet.id} evaluated as ${status}.`,
        rationale:
          `Required ${requiredSatisfied}; major ${majorCount}; minor ${minorCount}; supportive ${supportiveCount}; score ${score.toFixed(4)}.`,
        safetyStatement:
          "Structured criteria evaluation is clinical decision support and not a definitive diagnosis.",
      }),
    });
  }
}
