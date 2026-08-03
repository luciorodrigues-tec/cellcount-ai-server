import {
  createBayesianEvidence,
} from "../domain/BayesianEvidence.js";

export class BayesianEvidenceBuilder {
  fromConsensusResult(
    result,
    {
      likelihoodRatioByStatus = {},
    } = {},
  ) {
    if (!result?.hypothesisId) {
      throw new TypeError(
        "Consensus result is required.",
      );
    }

    const defaultMap = {
      SUPPORTED: 2,
      CONFLICTED: 1,
      REJECTED: 0.5,
      ABSTAINED: 1,
      INSUFFICIENT_EVIDENCE: 1,
    };

    const map = {
      ...defaultMap,
      ...(likelihoodRatioByStatus || {}),
    };

    const lr = Number(
      map[result.status] ?? 1,
    );

    return createBayesianEvidence({
      id:
        `CONSENSUS:${result.hypothesisId}:${result.status}`,
      hypothesisId: result.hypothesisId,
      sourceId:
        result.engineVersion ||
        "CONSENSUS_DIAGNOSTIC_ENGINE",
      direction:
        lr > 1
          ? "SUPPORT"
          : lr < 1
            ? "OPPOSE"
            : "NEUTRAL",
      likelihoodRatio: lr,
      confidence:
        result.status === "SUPPORTED"
          ? Number(result.supportRatio || 0)
          : 1,
      rationale:
        result.explanation?.rationale ||
        result.reason ||
        "",
      requiresHumanReview:
        result.requiresHumanReview === true,
      metadata: {
        consensusStatus: result.status,
        supportWeight:
          Number(result.supportWeight || 0),
        opposeWeight:
          Number(result.opposeWeight || 0),
      },
    });
  }

  fromDifferentialCandidate(
    candidate,
    {
      likelihoodRatioScale = 2,
    } = {},
  ) {
    if (!candidate?.candidateId) {
      throw new TypeError(
        "Differential candidate result is required.",
      );
    }

    const score = Number(
      candidate.normalizedScore ?? 0,
    );

    const lr = score > 0
      ? 1 + score * Number(likelihoodRatioScale)
      : 1;

    return createBayesianEvidence({
      id:
        `DIFFERENTIAL:${candidate.candidateId}`,
      hypothesisId:
        candidate.candidateId,
      sourceId:
        candidate.engineVersion ||
        "DIFFERENTIAL_REASONING_ENGINE",
      direction:
        lr > 1 ? "SUPPORT" : "NEUTRAL",
      likelihoodRatio: lr,
      confidence:
        candidate.status === "SUPPORTED"
          ? 1
          : candidate.status === "POSSIBLE"
            ? 0.5
            : 0,
      rationale:
        `${candidate.status}: ${candidate.reason}`,
      requiresHumanReview:
        candidate.requiresHumanReview === true,
      metadata: {
        rawScore:
          Number(candidate.rawScore || 0),
        normalizedScore: score,
        candidateStatus: candidate.status,
      },
    });
  }
}
