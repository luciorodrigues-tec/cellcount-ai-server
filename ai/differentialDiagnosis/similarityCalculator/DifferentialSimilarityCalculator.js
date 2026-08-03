import {
  DIFFERENTIAL_SIMILARITY_VERSION,
  mergeDifferentialSimilarityPolicy,
} from "./DifferentialSimilarityPolicy.js";

import {
  buildObservedFeatureIndex,
} from "./ObservedFeatureIndex.js";

import {
  calculateSharedFeatureAgreement,
} from "./FeatureAgreementCalculator.js";

import {
  calculateDifferentialFeatureConflict,
} from "./FeatureConflictCalculator.js";

import {
  calculateDifferentialCoverage,
} from "./DifferentialCoverageCalculator.js";

import {
  calculateRankingSupport,
} from "./RankingSupportCalculator.js";

import {
  calculateConfidenceSupport,
} from "./ConfidenceSupportCalculator.js";

import {
  calculateSpecimenCompatibility,
} from "./SpecimenCompatibilityCalculator.js";

import {
  createDifferentialSimilarityResult,
} from "./DifferentialSimilarityResult.js";

function clamp01(value) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(1, number),
  );
}

function round(value) {
  return Number(
    Number(value || 0)
      .toFixed(6),
  );
}

export class DifferentialSimilarityCalculator {
  constructor({
    policy = {},
  } = {}) {
    this.policy =
      mergeDifferentialSimilarityPolicy(
        policy,
      );
  }

  calculate({
    pair,
    detectedFeatures = {},
    confidenceResult = null,
    specimenType = null,
  } = {}) {
    if (
      !pair ||
      typeof pair !== "object"
    ) {
      throw new TypeError(
        "pair is required.",
      );
    }

    if (
      pair.eligible !== true
    ) {
      throw new Error(
        `Differential pair is not eligible: ${pair.id}`,
      );
    }

    if (!pair.rule) {
      throw new Error(
        `Differential pair has no registered rule: ${pair.id}`,
      );
    }

    const featureIndex =
      buildObservedFeatureIndex(
        detectedFeatures,
      );

    const baselineSimilarity =
      clamp01(
        pair.rule.similarity,
      );

    const sharedAgreement =
      calculateSharedFeatureAgreement(
        pair.rule,
        featureIndex,
        this.policy
          .minimumObservedConfidence,
      );

    const featureConflict =
      calculateDifferentialFeatureConflict(
        pair,
        featureIndex,
        this.policy,
      );

    const coverage =
      calculateDifferentialCoverage(
        pair,
        featureIndex,
        this.policy
          .minimumObservedConfidence,
      );

    const rankingSupport =
      calculateRankingSupport(
        pair,
      );

    const confidenceSupport =
      calculateConfidenceSupport(
        confidenceResult,
      );

    const specimenCompatibility =
      calculateSpecimenCompatibility(
        pair,
        specimenType,
      );

    const positiveScore =
      (
        baselineSimilarity *
        this.policy
          .baselineWeight
      ) +
      (
        sharedAgreement.score *
        this.policy
          .sharedAgreementWeight
      ) +
      (
        rankingSupport.score *
        this.policy
          .rankingSupportWeight
      ) +
      (
        confidenceSupport.score *
        this.policy
          .confidenceSupportWeight
      ) +
      (
        coverage.score *
        this.policy
          .coverageWeight
      ) +
      (
        specimenCompatibility.score *
        this.policy
          .specimenCompatibilityWeight
      ) +
      featureConflict
        .primarySupport;

    const totalConflict =
      featureConflict.conflict;

    const rawFinal =
      positiveScore -
      totalConflict;

    const finalSimilarity =
      this.policy.clampOutput
        ? clamp01(rawFinal)
        : rawFinal;

    const intervalRadius =
      Math.max(
        0.02,
        this.policy
          .confidenceIntervalBaseRadius -
        (
          coverage.score *
          this.policy
            .confidenceIntervalCoverageFactor
        ),
      );

    const confidenceInterval = {
      low:
        round(
          clamp01(
            finalSimilarity -
            intervalRadius,
          ),
        ),
      high:
        round(
          clamp01(
            finalSimilarity +
            intervalRadius,
          ),
        ),
      radius:
        round(intervalRadius),
    };

    return createDifferentialSimilarityResult({
      pair,
      baselineSimilarity:
        round(
          baselineSimilarity,
        ),
      sharedAgreement,
      featureConflict,
      coverage,
      rankingSupport,
      confidenceSupport,
      specimenCompatibility,
      positiveScore:
        round(
          positiveScore,
        ),
      totalConflict:
        round(
          totalConflict,
        ),
      finalSimilarity:
        round(
          finalSimilarity,
        ),
      confidenceInterval,
      insufficientEvidence:
        coverage.evaluated === 0 ||
        (
          sharedAgreement.total > 0 &&
          sharedAgreement.matched === 0
        ),
      metadata: {
        engineVersion:
          DIFFERENTIAL_SIMILARITY_VERSION,
        observedFeatureCount:
          featureIndex.size,
      },
    });
  }

  calculateMany({
    pairs = [],
    detectedFeatures = {},
    confidenceResult = null,
    specimenType = null,
  } = {}) {
    return Object.freeze(
      pairs.map(
        (pair) =>
          this.calculate({
            pair,
            detectedFeatures,
            confidenceResult,
            specimenType,
          }),
      ),
    );
  }
}
