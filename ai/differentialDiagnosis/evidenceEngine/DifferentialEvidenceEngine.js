import {
  DIFFERENTIAL_EVIDENCE_ENGINE_VERSION,
  mergeDifferentialEvidencePolicy,
} from "./DifferentialEvidencePolicy.js";

import {
  buildObservedFeatureIndex,
} from "../similarityCalculator/ObservedFeatureIndex.js";

import {
  resolveOrientedDifferentialFeatures,
} from "./DifferentialEvidenceOrientation.js";

import {
  collectSharedEvidence,
  collectWinnerEvidence,
  collectAlternativeEvidence,
  collectMissingEvidence,
  collectConflictEvidence,
} from "./DifferentialEvidenceCollectors.js";

import {
  buildDifferentialEvidenceSummary,
} from "./DifferentialEvidenceSummary.js";

import {
  createDifferentialEvidenceResult,
} from "./DifferentialEvidenceResult.js";

function limitAndSort(
  items,
  max,
) {
  return items
    .sort(
      (first, second) =>
        Number(
          second.weight || 0,
        ) -
        Number(
          first.weight || 0,
        ),
    )
    .slice(0, max);
}

export class DifferentialEvidenceEngine {
  constructor({
    policy = {},
  } = {}) {
    this.policy =
      mergeDifferentialEvidencePolicy(
        policy,
      );
  }

  analyze({
    similarityResult,
    detectedFeatures = {},
  } = {}) {
    if (
      !similarityResult ||
      typeof similarityResult !==
        "object"
    ) {
      throw new TypeError(
        "similarityResult is required.",
      );
    }

    const pair =
      similarityResult.pair;

    if (
      !pair ||
      pair.eligible !== true
    ) {
      throw new Error(
        "Eligible differential pair is required.",
      );
    }

    const featureIndex =
      buildObservedFeatureIndex(
        detectedFeatures,
      );

    const orientedFeatures =
      resolveOrientedDifferentialFeatures(
        pair,
      );

    const coverage =
      Number(
        similarityResult
          ?.coverage
          ?.score || 0,
      );

    const context = {
      pair,
      featureIndex,
      coverage,
      policy:
        this.policy,
    };

    const sharedEvidence =
      limitAndSort(
        collectSharedEvidence(
          orientedFeatures,
          context,
        ),
        this.policy
          .maxEvidencePerGroup,
      );

    const winnerEvidence =
      limitAndSort(
        collectWinnerEvidence(
          orientedFeatures,
          context,
        ),
        this.policy
          .maxEvidencePerGroup,
      );

    const alternativeEvidence =
      limitAndSort(
        collectAlternativeEvidence(
          orientedFeatures,
          context,
        ),
        this.policy
          .maxEvidencePerGroup,
      );

    const missingEvidence =
      limitAndSort(
        collectMissingEvidence(
          orientedFeatures,
          context,
        ),
        this.policy
          .maxEvidencePerGroup,
      );

    const conflictEvidence =
      limitAndSort(
        collectConflictEvidence(
          orientedFeatures,
          context,
        ),
        this.policy
          .maxEvidencePerGroup,
      );

    const summary =
      buildDifferentialEvidenceSummary({
        pair,
        sharedEvidence,
        winnerEvidence,
        alternativeEvidence,
        missingEvidence,
        conflictEvidence,
        coverage,
      });

    const allEvidence =
      summary.weightedEvidence ||
      [];

    const statistics = {
      shared:
        sharedEvidence.length,
      winner:
        winnerEvidence.length,
      alternative:
        alternativeEvidence.length,
      missing:
        missingEvidence.length,
      conflicts:
        conflictEvidence.length,
      highStrength:
        allEvidence.filter(
          (item) =>
            item.strength ===
            "HIGH",
        ).length,
      moderateStrength:
        allEvidence.filter(
          (item) =>
            item.strength ===
            "MODERATE",
        ).length,
      lowStrength:
        allEvidence.filter(
          (item) =>
            item.strength ===
            "LOW",
        ).length,
      coverage,
    };

    return createDifferentialEvidenceResult({
      pair,
      similarity:
        similarityResult,
      sharedEvidence,
      winnerEvidence,
      alternativeEvidence,
      missingEvidence,
      conflictEvidence,
      summary,
      statistics,
      metadata: {
        engineVersion:
          DIFFERENTIAL_EVIDENCE_ENGINE_VERSION,
        observedFeatureCount:
          featureIndex.size,
      },
    });
  }

  analyzeMany({
    similarityResults = [],
    detectedFeatures = {},
  } = {}) {
    return Object.freeze(
      similarityResults.map(
        (similarityResult) =>
          this.analyze({
            similarityResult,
            detectedFeatures,
          }),
      ),
    );
  }
}
