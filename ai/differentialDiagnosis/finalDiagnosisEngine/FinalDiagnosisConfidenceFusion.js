function clamp01(value) {
  const n = Number(value);
  return Number.isFinite(n)
    ? Math.max(0, Math.min(1, n))
    : 0;
}

function average(items) {
  if (!items.length) return 0;
  return items.reduce((a, b) => a + b, 0) /
    items.length;
}

export function fuseFinalDiagnosisConfidence(
  aggregate,
  consistency,
  policy,
) {
  const ranking =
    clamp01(
      aggregate.primaryRecommendation?.probability ??
      aggregate.winner?.normalizedScore ??
      0,
    );

  const confidence =
    clamp01(
      aggregate.confidence?.score ?? 0,
    );

  const evidence =
    clamp01(
      average(
        aggregate.evidenceResults.map(
          (item) =>
            Math.max(
              0,
              Math.min(
                1,
                0.5 +
                Number(item?.summary?.balance || 0) / 2,
              ),
            ),
        ),
      ),
    );

  const exclusive =
    clamp01(
      average(
        aggregate.exclusiveFeatureResults.map(
          (item) =>
            Number(
              item?.statistics
                ?.maximumDiscrimination || 0,
            ),
        ),
      ),
    );

  const conflictResolution =
    clamp01(
      average(
        aggregate.conflicts.map(
          (item) =>
            item?.resolution?.insufficientEvidence
              ? 0
              : item?.resolution?.diagnosticTie
                ? 0.5
                : 1 -
                  Number(item?.severity?.score || 0) *
                    0.5,
        ),
      ),
    );

  const recommendation =
    clamp01(
      aggregate.primaryRecommendation
        ?.priorityScore || 0,
    );

  const raw =
    ranking * policy.rankingWeight +
    confidence * policy.confidenceWeight +
    evidence * policy.evidenceWeight +
    exclusive * policy.exclusiveFeatureWeight +
    conflictResolution *
      policy.conflictResolutionWeight +
    recommendation *
      policy.recommendationWeight;

  const consistencyAdjusted =
    clamp01(
      raw *
      (
        0.75 +
        consistency.overallConsistency * 0.25
      ),
    );

  return Object.freeze({
    overallConfidence:
      Number(
        consistencyAdjusted.toFixed(6),
      ),
    components:
      Object.freeze({
        ranking:
          Number(ranking.toFixed(6)),
        confidence:
          Number(confidence.toFixed(6)),
        evidence:
          Number(evidence.toFixed(6)),
        exclusiveFeatures:
          Number(exclusive.toFixed(6)),
        conflictResolution:
          Number(
            conflictResolution.toFixed(6),
          ),
        recommendation:
          Number(recommendation.toFixed(6)),
      }),
    consistencyAdjustment:
      consistency.overallConsistency,
  });
}
