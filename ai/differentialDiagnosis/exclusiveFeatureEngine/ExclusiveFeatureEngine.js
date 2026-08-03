import {
  EXCLUSIVE_FEATURE_ENGINE_VERSION,
  mergeExclusiveFeaturePolicy,
} from "./ExclusiveFeaturePolicy.js";

import {
  calculateFeatureSpecificity,
} from "./FeatureSpecificityCalculator.js";

import {
  calculateFeatureSensitivity,
} from "./FeatureSensitivityCalculator.js";

import {
  calculateFeatureDiscrimination,
} from "./FeatureDiscriminationCalculator.js";

import {
  createExclusiveFeatureResult,
} from "./ExclusiveFeatureResult.js";

import {
  buildExclusiveFeatureSummary,
} from "./ExclusiveFeatureSummary.js";

function mapEvidence(
  evidence,
  policy,
) {
  const specificity =
    calculateFeatureSpecificity(
      evidence.featureId,
    );

  const sensitivity =
    calculateFeatureSensitivity(
      evidence.featureId,
    );

  const discrimination =
    calculateFeatureDiscrimination({
      specificity:
        specificity.specificity,
      sensitivity:
        sensitivity.sensitivity,
      evidenceWeight:
        evidence.weight,
      confidence:
        evidence.confidence,
      crossLineagePenalty:
        specificity
          .crossLineagePenalty,
      policy,
    });

  return createExclusiveFeatureResult({
    featureId:
      evidence.featureId,
    group:
      evidence.group,
    favors:
      evidence.favors,
    specificity:
      specificity.specificity,
    sensitivity:
      sensitivity.sensitivity,
    evidenceWeight:
      evidence.weight,
    confidence:
      evidence.confidence,
    crossLineagePenalty:
      specificity
        .crossLineagePenalty,
    discriminationScore:
      discrimination.score,
    classification:
      discrimination
        .classification,
    observed:
      evidence.observed,
    missing:
      evidence.missing,
    pathognomonic:
      discrimination
        .classification ===
      "PATHOGNOMONIC",
    sourceEvidence:
      evidence,
    metadata: {
      engineVersion:
        EXCLUSIVE_FEATURE_ENGINE_VERSION,
      specificityMetadata:
        specificity.metadata,
    },
  });
}

export class ExclusiveFeatureEngine {
  constructor({
    policy = {},
  } = {}) {
    this.policy =
      mergeExclusiveFeaturePolicy(
        policy,
      );
  }

  analyze({
    differentialEvidenceResult,
  } = {}) {
    if (
      !differentialEvidenceResult ||
      typeof differentialEvidenceResult !==
        "object"
    ) {
      throw new TypeError(
        "differentialEvidenceResult is required.",
      );
    }

    const sources = [
      ...(
        differentialEvidenceResult
          .winnerEvidence || []
      ),
      ...(
        differentialEvidenceResult
          .alternativeEvidence || []
      ),
      ...(
        this.policy
          .includeSharedFeatures
          ? differentialEvidenceResult
              .sharedEvidence || []
          : []
      ),
      ...(
        this.policy
          .includeMissingExclusiveFeatures
          ? differentialEvidenceResult
              .missingEvidence || []
          : []
      ),
    ];

    const unique =
      new Map();

    for (const evidence of sources) {
      const key =
        `${evidence.group}:${evidence.featureId}:${evidence.favors}`;

      if (!unique.has(key)) {
        unique.set(
          key,
          evidence,
        );
      }
    }

    const features =
      [...unique.values()]
        .map(
          (evidence) =>
            mapEvidence(
              evidence,
              this.policy,
            ),
        )
        .sort(
          (first, second) =>
            Number(
              second
                .discriminationScore || 0,
            ) -
            Number(
              first
                .discriminationScore || 0,
            ),
        )
        .slice(
          0,
          this.policy
            .maxFeaturesPerGroup,
        );

    const summary =
      buildExclusiveFeatureSummary(
        features,
      );

    return Object.freeze({
      version:
        EXCLUSIVE_FEATURE_ENGINE_VERSION,
      pair:
        differentialEvidenceResult.pair,
      pairId:
        differentialEvidenceResult
          .pairId,
      primaryCell:
        differentialEvidenceResult
          .primaryCell,
      alternativeCell:
        differentialEvidenceResult
          .alternativeCell,
      features:
        Object.freeze(features),
      summary,
      statistics:
        summary.statistics,
      policy:
        this.policy,
    });
  }

  analyzeMany({
    evidenceResults = [],
  } = {}) {
    return Object.freeze(
      evidenceResults.map(
        (
          differentialEvidenceResult,
        ) =>
          this.analyze({
            differentialEvidenceResult,
          }),
      ),
    );
  }
}
