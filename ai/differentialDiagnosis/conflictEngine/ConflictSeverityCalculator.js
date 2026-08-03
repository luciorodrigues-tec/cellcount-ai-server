import {
  ConflictSeverity,
} from "./ConflictPolicy.js";

function clamp01(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(1, number),
  );
}

export function calculateConflictSeverity(
  analysis,
  exclusiveFeatureResult,
  policy,
) {
  const conflictBurden =
    analysis.conflicts.length === 0
      ? 0
      : analysis.conflicts.reduce(
          (sum, item) =>
            sum +
            Number(
              item
                .severityContribution || 0,
            ),
          0,
        ) /
        analysis.conflicts.length;

  const totalObserved =
    analysis.winnerFeatures.length +
    analysis.alternativeFeatures.length +
    analysis.sharedFeatures.length;

  const evidenceTotal =
    analysis.totals.winnerScore +
    analysis.totals.alternativeScore;

  const balance =
    evidenceTotal > 0
      ? Math.abs(
          analysis.totals.winnerScore -
          analysis.totals.alternativeScore,
        ) /
        evidenceTotal
      : 0;

  const ambiguity =
    1 - clamp01(balance);

  const missingBurden =
    analysis.missingFeatures.length === 0
      ? 0
      : clamp01(
          analysis.totals.missingScore /
          Math.max(
            1,
            analysis.missingFeatures.length,
          ),
        );

  const coverage =
    Number(
      exclusiveFeatureResult
        ?.pair
        ?.rule
        ? exclusiveFeatureResult
            ?.features
            ?.length > 0
          ? Math.min(
              1,
              totalObserved /
              exclusiveFeatureResult
                .features.length,
            )
          : 0
        : 0,
    );

  const raw =
    (
      ambiguity *
      policy.winnerEvidenceWeight
    ) +
    (
      ambiguity *
      policy.alternativeEvidenceWeight
    ) +
    (
      clamp01(conflictBurden) *
      policy.conflictBurdenWeight
    ) +
    (
      missingBurden *
      policy.missingEvidenceWeight
    );

  const score =
    clamp01(raw);

  let severity =
    ConflictSeverity.none;

  if (
    score >=
    policy.criticalThreshold
  ) {
    severity =
      ConflictSeverity.critical;
  } else if (
    score >=
    policy.highThreshold
  ) {
    severity =
      ConflictSeverity.high;
  } else if (
    score >=
    policy.moderateThreshold
  ) {
    severity =
      ConflictSeverity.moderate;
  } else if (
    score >=
    policy.lowThreshold
  ) {
    severity =
      ConflictSeverity.low;
  }

  return Object.freeze({
    score:
      Number(
        score.toFixed(6),
      ),
    severity,
    conflictBurden:
      Number(
        conflictBurden.toFixed(6),
      ),
    balance:
      Number(
        balance.toFixed(6),
      ),
    ambiguity:
      Number(
        ambiguity.toFixed(6),
      ),
    missingBurden:
      Number(
        missingBurden.toFixed(6),
      ),
    coverage:
      Number(
        coverage.toFixed(6),
      ),
  });
}
