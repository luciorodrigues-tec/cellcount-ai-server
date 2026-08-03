import {
  confidenceAdjustedLikelihoodRatio,
  oddsToProbability,
  probabilityToOdds,
} from "./BayesianMath.js";

import {
  mergeBayesianConfidencePolicy,
} from "../domain/BayesianConfidencePolicy.js";

export const BAYESIAN_DIAGNOSTIC_CONFIDENCE_ENGINE_VERSION =
  "CRR-000008-v1.0.0";

function calibrateProbability(
  probability,
  policy,
) {
  const epsilon = 1e-9;
  const clipped = Math.min(
    1 - epsilon,
    Math.max(epsilon, probability),
  );
  const logit = Math.log(
    clipped / (1 - clipped),
  );
  const calibratedLogit =
    policy.calibrationIntercept +
    policy.calibrationSlope * logit;

  return 1 / (1 + Math.exp(-calibratedLogit));
}

function confidenceBand(
  probability,
  policy,
) {
  if (
    probability >=
    policy.highConfidenceThreshold
  ) {
    return "HIGH";
  }

  if (
    probability >=
    policy.moderateConfidenceThreshold
  ) {
    return "MODERATE";
  }

  return "LOW";
}

export class BayesianDiagnosticConfidenceEngine {
  constructor({
    profileRepository,
    policy = {},
  } = {}) {
    if (!profileRepository) {
      throw new TypeError(
        "BayesianDiagnosticConfidenceEngine requires a profile repository.",
      );
    }

    this.profileRepository =
      profileRepository;
    this.policy =
      mergeBayesianConfidencePolicy(policy);
  }

  evaluateHypothesis({
    hypothesisId,
    evidence = [],
  } = {}) {
    const profile =
      this.profileRepository.get(hypothesisId);

    if (!profile) {
      if (
        this.policy.abstainOnMissingProfile
      ) {
        return Object.freeze({
          engineVersion:
            BAYESIAN_DIAGNOSTIC_CONFIDENCE_ENGINE_VERSION,
          hypothesisId: String(hypothesisId),
          status: "ABSTAINED",
          reason: "MISSING_BAYESIAN_PROFILE",
          requiresHumanReview: true,
          evidenceCount: 0,
        });
      }

      throw new Error(
        `Unknown Bayesian hypothesis profile: ${hypothesisId}`,
      );
    }

    const relevantEvidence =
      (Array.isArray(evidence)
        ? evidence
        : []
      )
        .filter(
          (item) =>
            item.hypothesisId === hypothesisId,
        )
        .slice(
          0,
          this.policy.maximumEvidenceItems,
        );

    const humanReviewEvidence =
      relevantEvidence.filter(
        (item) =>
          item.requiresHumanReview,
      );

    let posteriorOdds =
      probabilityToOdds(
        profile.priorProbability,
      );

    const appliedEvidence = [];

    for (const item of relevantEvidence) {
      const adjustedLR =
        confidenceAdjustedLikelihoodRatio({
          likelihoodRatio:
            item.likelihoodRatio,
          confidence: item.confidence,
        });

      posteriorOdds *= adjustedLR;

      appliedEvidence.push(
        Object.freeze({
          evidenceId: item.id,
          sourceId: item.sourceId,
          direction: item.direction,
          rawLikelihoodRatio:
            item.likelihoodRatio,
          confidence: item.confidence,
          adjustedLikelihoodRatio:
            Number(adjustedLR.toFixed(8)),
          evidenceLevel:
            item.evidenceLevel,
          rationale: item.rationale,
        }),
      );
    }

    const posteriorProbability =
      oddsToProbability(posteriorOdds);

    const calibratedProbability =
      calibrateProbability(
        posteriorProbability,
        this.policy,
      );

    const minimumEvidenceCount =
      Math.max(
        profile.minimumEvidenceCount,
        this.policy.minimumEvidenceCount,
      );

    const threshold =
      Math.max(
        profile.minimumPosteriorProbability,
        this.policy
          .minimumPosteriorProbability,
      );

    let status =
      "INSUFFICIENT_EVIDENCE";
    let reason =
      "MINIMUM_EVIDENCE_NOT_MET";

    if (
      this.policy
        .abstainOnHumanReviewEvidence &&
      humanReviewEvidence.length > 0
    ) {
      status = "ABSTAINED";
      reason =
        "HUMAN_REVIEW_EVIDENCE_PRESENT";
    } else if (
      relevantEvidence.length >=
      minimumEvidenceCount
    ) {
      if (
        calibratedProbability >= threshold
      ) {
        status = "SUPPORTED";
        reason =
          "POSTERIOR_THRESHOLD_MET";
      } else {
        status = "NOT_SUPPORTED";
        reason =
          "POSTERIOR_THRESHOLD_NOT_MET";
      }
    }

    return Object.freeze({
      engineVersion:
        BAYESIAN_DIAGNOSTIC_CONFIDENCE_ENGINE_VERSION,
      hypothesisId: profile.hypothesisId,
      hypothesisLabel: profile.label,
      status,
      reason,
      priorProbability:
        profile.priorProbability,
      posteriorProbability: Number(
        posteriorProbability.toFixed(8),
      ),
      calibratedProbability: Number(
        calibratedProbability.toFixed(8),
      ),
      confidenceBand:
        confidenceBand(
          calibratedProbability,
          this.policy,
        ),
      evidenceCount:
        relevantEvidence.length,
      minimumEvidenceCount,
      posteriorThreshold: threshold,
      appliedEvidence:
        Object.freeze(appliedEvidence),
      requiresHumanReview:
        status === "ABSTAINED" ||
        humanReviewEvidence.length > 0,
      explanation: Object.freeze({
        summary:
          `Bayesian confidence for ${profile.hypothesisId}: ` +
          `${calibratedProbability.toFixed(4)}.`,
        rationale:
          `Prior ${profile.priorProbability.toFixed(4)}, ` +
          `posterior ${posteriorProbability.toFixed(4)}, ` +
          `${relevantEvidence.length} evidence item(s).`,
        safetyStatement:
          "This probability is decision support, not a definitive diagnosis.",
      }),
    });
  }

  evaluateAll({
    evidence = [],
  } = {}) {
    const results =
      this.profileRepository
        .list()
        .map((profile) =>
          this.evaluateHypothesis({
            hypothesisId:
              profile.hypothesisId,
            evidence,
          }),
        );

    const rankedResults =
      [...results].sort(
        (a, b) =>
          Number(
            b.calibratedProbability || 0,
          ) -
            Number(
              a.calibratedProbability || 0,
            ) ||
          a.hypothesisId.localeCompare(
            b.hypothesisId,
          ),
      );

    const topTie =
      rankedResults.length > 1 &&
      rankedResults[0]
        .calibratedProbability ===
        rankedResults[1]
          .calibratedProbability;

    return Object.freeze({
      engineVersion:
        BAYESIAN_DIAGNOSTIC_CONFIDENCE_ENGINE_VERSION,
      totalHypotheses:
        rankedResults.length,
      supportedCount:
        rankedResults.filter(
          (result) =>
            result.status === "SUPPORTED",
        ).length,
      abstainedCount:
        rankedResults.filter(
          (result) =>
            result.status === "ABSTAINED",
        ).length,
      topTie,
      requiresHumanReview:
        topTie ||
        rankedResults.some(
          (result) =>
            result.requiresHumanReview,
        ),
      rankedResults:
        Object.freeze(rankedResults),
    });
  }
}
