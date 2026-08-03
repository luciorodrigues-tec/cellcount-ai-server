export const HEMATOLOGIC_SYNDROME_MATCHER_VERSION =
  "CRR-000027-v1.0.0";

export class HematologicSyndromeMatcher {
  constructor({ policy } = {}) {
    this.policy = policy;
  }

  match(
    syndrome,
    {
      matchedPatternIds = [],
      observedFeatureIds = [],
    } = {},
  ) {
    const patterns = new Set(
      (Array.isArray(matchedPatternIds)
        ? matchedPatternIds
        : []
      ).map(String),
    );

    const features = new Set(
      (Array.isArray(observedFeatureIds)
        ? observedFeatureIds
        : []
      ).map(String),
    );

    const requiredPatternMatches =
      syndrome.requiredPatternIds.filter(
        (id) => patterns.has(id),
      );

    const supportivePatternMatches =
      syndrome.supportivePatternIds.filter(
        (id) => patterns.has(id),
      );

    const exclusionPatternMatches =
      syndrome.exclusionPatternIds.filter(
        (id) => patterns.has(id),
      );

    const requiredFeatureMatches =
      syndrome.requiredFeatureIds.filter(
        (id) => features.has(id),
      );

    const supportiveFeatureMatches =
      syndrome.supportiveFeatureIds.filter(
        (id) => features.has(id),
      );

    const exclusionFeatureMatches =
      syndrome.exclusionFeatureIds.filter(
        (id) => features.has(id),
      );

    const totalWeight =
      syndrome.requiredPatternIds.length *
        this.policy.requiredPatternWeight +
      syndrome.supportivePatternIds.length *
        this.policy.supportivePatternWeight +
      syndrome.requiredFeatureIds.length *
        this.policy.requiredFeatureWeight +
      syndrome.supportiveFeatureIds.length *
        this.policy.supportiveFeatureWeight;

    const matchedWeight =
      requiredPatternMatches.length *
        this.policy.requiredPatternWeight +
      supportivePatternMatches.length *
        this.policy.supportivePatternWeight +
      requiredFeatureMatches.length *
        this.policy.requiredFeatureWeight +
      supportiveFeatureMatches.length *
        this.policy.supportiveFeatureWeight;

    const baseScore =
      totalWeight > 0
        ? matchedWeight / totalWeight
        : 0;

    const exclusionConflict =
      exclusionPatternMatches.length > 0 ||
      exclusionFeatureMatches.length > 0;

    const score = Math.max(
      0,
      Math.min(
        1,
        baseScore -
          (
            exclusionConflict
              ? this.policy.exclusionPenalty
              : 0
          ),
      ),
    );

    const requiredSatisfied =
      requiredPatternMatches.length >=
        syndrome.minimumRequiredPatterns &&
      requiredFeatureMatches.length ===
        syndrome.requiredFeatureIds.length;

    const supportiveSatisfied =
      supportivePatternMatches.length >=
        syndrome.minimumSupportivePatterns;

    const matched =
      requiredSatisfied &&
      supportiveSatisfied &&
      !exclusionConflict &&
      score >= syndrome.minimumScore;

    return Object.freeze({
      matcherVersion:
        HEMATOLOGIC_SYNDROME_MATCHER_VERSION,
      syndromeId: syndrome.id,
      matched,
      score: Number(score.toFixed(8)),
      requiredSatisfied,
      supportiveSatisfied,
      exclusionConflict,
      requiredPatternMatches:
        Object.freeze(requiredPatternMatches),
      supportivePatternMatches:
        Object.freeze(supportivePatternMatches),
      exclusionPatternMatches:
        Object.freeze(exclusionPatternMatches),
      requiredFeatureMatches:
        Object.freeze(requiredFeatureMatches),
      supportiveFeatureMatches:
        Object.freeze(supportiveFeatureMatches),
      exclusionFeatureMatches:
        Object.freeze(exclusionFeatureMatches),
      requiresHumanReview:
        exclusionConflict &&
        this.policy.requireHumanReviewOnExclusionConflict,
    });
  }
}
