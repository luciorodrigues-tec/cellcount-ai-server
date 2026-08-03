import {
  ConflictType,
  createConflictRecord,
} from "./ConflictTypeLibrary.js";

function sumScores(
  features = [],
) {
  return features.reduce(
    (sum, item) =>
      sum +
      Number(
        item.discriminationScore || 0,
      ),
    0,
  );
}

export function analyzeConflictEvidence(
  exclusiveFeatureResult,
) {
  const features =
    exclusiveFeatureResult?.features || [];

  const winner =
    features.filter(
      (item) =>
        item.observed === true &&
        item.favors ===
          exclusiveFeatureResult
            .primaryCell,
    );

  const alternative =
    features.filter(
      (item) =>
        item.observed === true &&
        item.favors ===
          exclusiveFeatureResult
            .alternativeCell,
    );

  const shared =
    features.filter(
      (item) =>
        item.observed === true &&
        item.favors === "BOTH",
    );

  const missing =
    features.filter(
      (item) =>
        item.missing === true,
    );

  const conflicts = [];

  if (
    winner.length > 0 &&
    alternative.length > 0
  ) {
    conflicts.push(
      createConflictRecord({
        type:
          ConflictType.crossHypothesis,
        weight:
          Math.min(
            1,
            (
              sumScores(winner) +
              sumScores(alternative)
            ) /
            Math.max(
              1,
              winner.length +
              alternative.length,
            ),
          ),
        severityContribution:
          Math.min(
            1,
            Math.min(
              sumScores(winner),
              sumScores(alternative),
            ),
          ),
        statement:
          "Observed discriminative features support both competing hypotheses.",
      }),
    );
  }

  if (
    shared.length >= 2 &&
    winner.length === 0 &&
    alternative.length === 0
  ) {
    conflicts.push(
      createConflictRecord({
        type:
          ConflictType.sharedAmbiguity,
        weight:
          Math.min(
            1,
            sumScores(shared) /
            shared.length,
          ),
        severityContribution:
          0.35,
        statement:
          "The observed pattern is dominated by shared features.",
      }),
    );
  }

  const highMissing =
    missing.filter(
      (item) =>
        item.classification ===
          "PATHOGNOMONIC" ||
        item.classification ===
          "VERY_HIGH",
    );

  for (const item of highMissing) {
    conflicts.push(
      createConflictRecord({
        type:
          ConflictType
            .missingCriticalFeature,
        featureId:
          item.featureId,
        favors:
          item.favors,
        weight:
          item.discriminationScore,
        severityContribution:
          Math.min(
            1,
            item.discriminationScore,
          ),
        statement:
          `${item.featureId} is a high-value discriminative feature but was not observed.`,
      }),
    );
  }

  if (
    winner.length === 0 &&
    alternative.length === 0 &&
    shared.length === 0
  ) {
    conflicts.push(
      createConflictRecord({
        type:
          ConflictType
            .morphologicAmbiguity,
        weight: 0.5,
        severityContribution: 0.5,
        statement:
          "No observed discriminative feature resolved the competing hypotheses.",
      }),
    );
  }

  return Object.freeze({
    winnerFeatures:
      Object.freeze(winner),
    alternativeFeatures:
      Object.freeze(alternative),
    sharedFeatures:
      Object.freeze(shared),
    missingFeatures:
      Object.freeze(missing),
    conflicts:
      Object.freeze(conflicts),
    totals:
      Object.freeze({
        winnerScore:
          Number(
            sumScores(winner)
              .toFixed(6),
          ),
        alternativeScore:
          Number(
            sumScores(alternative)
              .toFixed(6),
          ),
        sharedScore:
          Number(
            sumScores(shared)
              .toFixed(6),
          ),
        missingScore:
          Number(
            sumScores(missing)
              .toFixed(6),
          ),
      }),
  });
}
