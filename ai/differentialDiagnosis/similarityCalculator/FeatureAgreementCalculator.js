import {
  featureConfidence,
} from "./ObservedFeatureIndex.js";

function round(value) {
  return Number(
    Number(value || 0)
      .toFixed(6),
  );
}

export function calculateSharedFeatureAgreement(
  rule,
  featureIndex,
  minimumConfidence = 0,
) {
  const shared =
    rule?.sharedFeatures || [];

  if (shared.length === 0) {
    return Object.freeze({
      score: 0,
      matched: 0,
      total: 0,
      observed:
        Object.freeze([]),
      missing:
        Object.freeze([]),
    });
  }

  const observed = [];
  const missing = [];
  let confidenceSum = 0;

  for (
    const featureId
    of shared
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
      observed.push(
        Object.freeze({
          featureId,
          confidence:
            round(confidence),
        }),
      );

      confidenceSum +=
        confidence;
    } else {
      missing.push(
        featureId,
      );
    }
  }

  return Object.freeze({
    score:
      round(
        confidenceSum /
        shared.length,
      ),
    matched:
      observed.length,
    total:
      shared.length,
    observed:
      Object.freeze(
        observed,
      ),
    missing:
      Object.freeze(
        missing,
      ),
  });
}
