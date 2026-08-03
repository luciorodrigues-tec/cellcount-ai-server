import {
  ConflictResolution,
} from "./ConflictPolicy.js";

export function resolveDiagnosticConflict({
  probabilities,
  severity,
  exclusiveFeatureResult,
  policy,
} = {}) {
  const winnerProbability =
    probabilities.winnerProbability;

  const alternativeProbability =
    probabilities
      .alternativeProbability;

  const margin =
    winnerProbability -
    alternativeProbability;

  const coverage =
    Number(
      exclusiveFeatureResult
        ?.features
        ?.filter(
          (item) =>
            item.observed === true,
        )
        .length || 0,
    ) /
    Math.max(
      1,
      Number(
        exclusiveFeatureResult
          ?.features
          ?.length || 0,
      ),
    );

  if (
    coverage <
    policy
      .insufficientEvidenceCoverage
  ) {
    return Object.freeze({
      resolution:
        ConflictResolution
          .insufficientEvidence,
      winnerMaintained: false,
      winnerChanged: false,
      diagnosticTie: false,
      insufficientEvidence: true,
      finalCell: null,
      rationale:
        "Observed discriminative coverage is insufficient to resolve the differential.",
    });
  }

  if (
    Math.abs(margin) <=
    policy.tieMargin
  ) {
    return Object.freeze({
      resolution:
        ConflictResolution
          .diagnosticTie,
      winnerMaintained: false,
      winnerChanged: false,
      diagnosticTie: true,
      insufficientEvidence: false,
      finalCell: null,
      rationale:
        "The recalibrated probabilities remain within the diagnostic tie margin.",
    });
  }

  if (
    margin >=
    policy.winnerMaintainMargin
  ) {
    return Object.freeze({
      resolution:
        ConflictResolution
          .maintainWinner,
      winnerMaintained: true,
      winnerChanged: false,
      diagnosticTie: false,
      insufficientEvidence: false,
      finalCell:
        exclusiveFeatureResult
          .primaryCell,
      rationale:
        severity.severity ===
          "HIGH" ||
        severity.severity ===
          "CRITICAL"
          ? "Winner retained despite relevant conflict because the recalibrated evidence remains superior."
          : "Winner retained because the recalibrated evidence remains superior.",
    });
  }

  if (
    -margin >=
    policy.alternativePromotionMargin
  ) {
    return Object.freeze({
      resolution:
        ConflictResolution
          .promoteAlternative,
      winnerMaintained: false,
      winnerChanged: true,
      diagnosticTie: false,
      insufficientEvidence: false,
      finalCell:
        exclusiveFeatureResult
          .alternativeCell,
      rationale:
        "Alternative promoted because its recalibrated discriminative evidence exceeds the original winner.",
    });
  }

  return Object.freeze({
    resolution:
      ConflictResolution
        .diagnosticTie,
    winnerMaintained: false,
    winnerChanged: false,
    diagnosticTie: true,
    insufficientEvidence: false,
    finalCell: null,
    rationale:
      "Conflict remains unresolved after probability recalibration.",
  });
}
