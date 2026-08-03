export const MORPHOLOGIC_PATTERN_MATCHER_VERSION =
  "CRR-000026-v1.0.0";

export class MorphologicPatternMatcher {
  constructor({ policy } = {}) {
    this.policy = policy;
  }

  match(pattern, observedFeatureIds = []) {
    const observed = new Set(
      (Array.isArray(observedFeatureIds)
        ? observedFeatureIds
        : []
      ).map(String),
    );

    const requiredMatches =
      pattern.requiredFeatureIds.filter(
        (featureId) => observed.has(featureId),
      );

    const supportiveMatches =
      pattern.supportiveFeatureIds.filter(
        (featureId) => observed.has(featureId),
      );

    const exclusionMatches =
      pattern.exclusionFeatureIds.filter(
        (featureId) => observed.has(featureId),
      );

    const weighted =
      pattern.weightedFeatures.length > 0
        ? pattern.weightedFeatures
        : [
            ...pattern.requiredFeatureIds.map(
              (featureId) => ({
                featureId,
                weight:
                  this.policy.defaultRequiredWeight,
                required: true,
              }),
            ),
            ...pattern.supportiveFeatureIds.map(
              (featureId) => ({
                featureId,
                weight:
                  this.policy.defaultSupportiveWeight,
                required: false,
              }),
            ),
          ];

    const totalWeight = weighted.reduce(
      (total, item) => total + item.weight,
      0,
    );

    const matchedWeight = weighted.reduce(
      (total, item) =>
        total +
        (
          observed.has(item.featureId)
            ? item.weight
            : 0
        ),
      0,
    );

    const baseScore =
      totalWeight > 0
        ? matchedWeight / totalWeight
        : 0;

    const exclusionPenalty =
      exclusionMatches.length > 0
        ? this.policy.exclusionPenalty
        : 0;

    const score = Math.max(
      0,
      Math.min(
        1,
        baseScore - exclusionPenalty,
      ),
    );

    const requiredSatisfied =
      requiredMatches.length >=
      pattern.minimumRequiredMatches;

    const supportiveSatisfied =
      supportiveMatches.length >=
      pattern.minimumSupportiveMatches;

    const exclusionConflict =
      exclusionMatches.length > 0;

    const matched =
      requiredSatisfied &&
      supportiveSatisfied &&
      !exclusionConflict &&
      score >= pattern.minimumScore;

    return Object.freeze({
      matcherVersion:
        MORPHOLOGIC_PATTERN_MATCHER_VERSION,
      patternId: pattern.id,
      matched,
      score: Number(score.toFixed(8)),
      requiredSatisfied,
      supportiveSatisfied,
      exclusionConflict,
      requiredMatches:
        Object.freeze(requiredMatches),
      supportiveMatches:
        Object.freeze(supportiveMatches),
      exclusionMatches:
        Object.freeze(exclusionMatches),
      observedFeatureCount:
        observed.size,
      requiresHumanReview:
        exclusionConflict &&
        this.policy
          .requireHumanReviewOnExclusionConflict,
    });
  }
}
