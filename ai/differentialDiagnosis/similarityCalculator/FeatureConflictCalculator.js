import {
  featureConfidence,
} from "./ObservedFeatureIndex.js";

function round(value) {
  return Number(
    Number(value || 0)
      .toFixed(6),
  );
}

function orientationGroups(
  pair,
) {
  const rule =
    pair?.rule || {};

  if (
    pair?.reverseOrientation === true
  ) {
    return {
      primaryExclusive:
        rule
          .differentialExclusiveFeatures || [],
      alternativeExclusive:
        rule
          .primaryExclusiveFeatures || [],
      primaryExclusion:
        rule
          .differentialExclusionFeatures || [],
      alternativeExclusion:
        rule
          .primaryExclusionFeatures || [],
    };
  }

  return {
    primaryExclusive:
      rule
        .primaryExclusiveFeatures || [],
    alternativeExclusive:
      rule
        .differentialExclusiveFeatures || [],
    primaryExclusion:
      rule
        .primaryExclusionFeatures || [],
    alternativeExclusion:
      rule
        .differentialExclusionFeatures || [],
  };
}

function scoreGroup(
  featureIds,
  featureIndex,
  minimumConfidence,
) {
  if (featureIds.length === 0) {
    return {
      score: 0,
      observed: [],
    };
  }

  const observed = [];
  let sum = 0;

  for (
    const featureId
    of featureIds
  ) {
    const confidence =
      featureConfidence(
        featureIndex,
        featureId,
      );

    if (
      confidence >=
      minimumConfidence
    ) {
      observed.push({
        featureId,
        confidence:
          round(confidence),
      });
      sum += confidence;
    }
  }

  return {
    score:
      sum / featureIds.length,
    observed,
  };
}

export function calculateDifferentialFeatureConflict(
  pair,
  featureIndex,
  policy,
) {
  const groups =
    orientationGroups(pair);

  const primaryExclusive =
    scoreGroup(
      groups.primaryExclusive,
      featureIndex,
      policy
        .minimumObservedConfidence,
    );

  const alternativeExclusive =
    scoreGroup(
      groups.alternativeExclusive,
      featureIndex,
      policy
        .minimumObservedConfidence,
    );

  const primaryExclusion =
    scoreGroup(
      groups.primaryExclusion,
      featureIndex,
      policy
        .minimumObservedConfidence,
    );

  const alternativeExclusion =
    scoreGroup(
      groups.alternativeExclusion,
      featureIndex,
      policy
        .minimumObservedConfidence,
    );

  const conflict =
    (
      alternativeExclusive.score *
      policy
        .alternativeExclusiveConflictWeight
    ) +
    (
      primaryExclusion.score *
      policy
        .exclusionConflictWeight
    );

  const primarySupport =
    (
      primaryExclusive.score *
      policy
        .primaryExclusiveConflictWeight
    ) +
    (
      alternativeExclusion.score *
      policy
        .exclusionConflictWeight
    );

  return Object.freeze({
    conflict:
      round(conflict),
    primarySupport:
      round(primarySupport),
    groups:
      Object.freeze({
        primaryExclusive:
          Object.freeze({
            score:
              round(
                primaryExclusive.score,
              ),
            observed:
              Object.freeze(
                primaryExclusive.observed,
              ),
          }),
        alternativeExclusive:
          Object.freeze({
            score:
              round(
                alternativeExclusive.score,
              ),
            observed:
              Object.freeze(
                alternativeExclusive.observed,
              ),
          }),
        primaryExclusion:
          Object.freeze({
            score:
              round(
                primaryExclusion.score,
              ),
            observed:
              Object.freeze(
                primaryExclusion.observed,
              ),
          }),
        alternativeExclusion:
          Object.freeze({
            score:
              round(
                alternativeExclusion.score,
              ),
            observed:
              Object.freeze(
                alternativeExclusion.observed,
              ),
          }),
      }),
  });
}
