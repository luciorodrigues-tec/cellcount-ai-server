import {
  featureConfidence,
} from "./ObservedFeatureIndex.js";

function round(value) {
  return Number(
    Number(value || 0)
      .toFixed(6),
  );
}

export function calculateDifferentialCoverage(
  pair,
  featureIndex,
  minimumConfidence = 0,
) {
  const rule =
    pair?.rule || {};

  const featureIds =
    [
      ...new Set([
        ...(rule.sharedFeatures || []),
        ...(rule.primaryExclusiveFeatures || []),
        ...(rule.differentialExclusiveFeatures || []),
        ...(rule.primaryExclusionFeatures || []),
        ...(rule.differentialExclusionFeatures || []),
      ]),
    ];

  if (featureIds.length === 0) {
    return Object.freeze({
      score: 0,
      evaluated: 0,
      total: 0,
      observed:
        Object.freeze([]),
    });
  }

  const observed =
    featureIds
      .filter(
        (featureId) =>
          featureConfidence(
            featureIndex,
            featureId,
          ) >=
          minimumConfidence,
      );

  return Object.freeze({
    score:
      round(
        observed.length /
        featureIds.length,
      ),
    evaluated:
      observed.length,
    total:
      featureIds.length,
    observed:
      Object.freeze(
        observed,
      ),
  });
}
