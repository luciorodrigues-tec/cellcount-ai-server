import {
  createFusionSignal,
} from "../domain/FusionSignal.js";

export class MultiEvidenceSignalBuilder {
  fromConsensusResult(result) {
    if (!result?.hypothesisId) {
      throw new TypeError(
        "Consensus result is required.",
      );
    }

    const direction =
      result.status === "SUPPORTED"
        ? "SUPPORT"
        : result.status === "REJECTED"
          ? "OPPOSE"
          : result.status === "ABSTAINED"
            ? "ABSTAIN"
            : "NEUTRAL";

    return createFusionSignal({
      id:
        `CONSENSUS:${result.hypothesisId}:${result.status}`,
      targetId: result.hypothesisId,
      sourceId:
        result.engineVersion ||
        "CONSENSUS_DIAGNOSTIC_ENGINE",
      sourceType: "CONSENSUS",
      direction,
      strength:
        direction === "SUPPORT"
          ? Number(result.supportWeight || 1)
          : direction === "OPPOSE"
            ? Number(result.opposeWeight || 1)
            : 1,
      confidence:
        Number(result.supportRatio ?? 1),
      reliability: 1,
      rationale:
        result.explanation?.rationale ||
        result.reason ||
        "",
      requiresHumanReview:
        result.requiresHumanReview === true,
      blocking:
        result.status === "ABSTAINED",
      metadata: {
        status: result.status,
        conflictRatio:
          Number(result.conflictRatio || 0),
      },
    });
  }

  fromDifferentialCandidate(candidate) {
    if (!candidate?.candidateId) {
      throw new TypeError(
        "Differential candidate result is required.",
      );
    }

    const direction =
      candidate.status === "SUPPORTED" ||
      candidate.status === "POSSIBLE"
        ? "SUPPORT"
        : candidate.status === "EXCLUDED"
          ? "OPPOSE"
          : candidate.status === "ABSTAINED"
            ? "ABSTAIN"
            : "NEUTRAL";

    return createFusionSignal({
      id:
        `DIFFERENTIAL:${candidate.candidateId}:${candidate.status}`,
      targetId: candidate.candidateId,
      sourceId:
        candidate.engineVersion ||
        "DIFFERENTIAL_REASONING_ENGINE",
      sourceType: "DIFFERENTIAL",
      direction,
      strength:
        Math.max(
          Math.abs(
            Number(candidate.rawScore || 0),
          ),
          0.0001,
        ),
      confidence:
        Math.max(
          0,
          Math.min(
            1,
            Number(
              candidate.normalizedScore ?? 0,
            ),
          ),
        ),
      reliability: 1,
      rationale:
        `${candidate.status}: ${candidate.reason}`,
      requiresHumanReview:
        candidate.requiresHumanReview === true,
      blocking:
        candidate.status === "ABSTAINED",
      metadata: {
        status: candidate.status,
        rank: candidate.rank || null,
      },
    });
  }

  fromBayesianResult(result) {
    if (!result?.hypothesisId) {
      throw new TypeError(
        "Bayesian result is required.",
      );
    }

    const direction =
      result.status === "SUPPORTED"
        ? "SUPPORT"
        : result.status === "NOT_SUPPORTED"
          ? "OPPOSE"
          : result.status === "ABSTAINED"
            ? "ABSTAIN"
            : "NEUTRAL";

    return createFusionSignal({
      id:
        `BAYESIAN:${result.hypothesisId}:${result.status}`,
      targetId: result.hypothesisId,
      sourceId:
        result.engineVersion ||
        "BAYESIAN_CONFIDENCE_ENGINE",
      sourceType: "BAYESIAN",
      direction,
      strength: 1,
      confidence:
        Number(
          result.calibratedProbability ?? 0,
        ),
      reliability: 1,
      rationale:
        result.explanation?.rationale ||
        result.reason ||
        "",
      requiresHumanReview:
        result.requiresHumanReview === true,
      blocking:
        result.status === "ABSTAINED",
      metadata: {
        status: result.status,
        confidenceBand:
          result.confidenceBand || null,
      },
    });
  }
}
