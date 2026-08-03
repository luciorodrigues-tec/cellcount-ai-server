import {
  mergeDiagnosticConsensusPolicy,
} from "../domain/DiagnosticConsensusPolicy.js";

export const DIAGNOSTIC_CONSENSUS_ENGINE_VERSION =
  "CRR-000029-v1.0.0";

function weightedValue(vote, policy) {
  const sourceWeight =
    Number(
      policy.sourceWeights[
        vote.sourceType
      ] ?? 0,
    );

  return (
    vote.confidence *
    vote.weight *
    sourceWeight
  );
}

export class DiagnosticConsensusEngine {
  constructor({ policy = {} } = {}) {
    this.policy =
      mergeDiagnosticConsensusPolicy(policy);
  }

  evaluate({ votes = [] } = {}) {
    const uniqueVotes = [];
    const seen = new Set();

    for (const vote of Array.isArray(votes) ? votes : []) {
      if (!seen.has(vote.id)) {
        seen.add(vote.id);
        uniqueVotes.push(vote);
      }
    }

    const grouped = new Map();

    for (const vote of uniqueVotes) {
      const id = vote.hypothesisId;
      if (!grouped.has(id)) {
        grouped.set(id, []);
      }
      grouped.get(id).push(vote);
    }

    const hypotheses = [];

    for (const [hypothesisId, hypothesisVotes] of grouped) {
      let support = 0;
      let oppose = 0;
      let abstain = 0;
      let supportCount = 0;
      let opposeCount = 0;
      let abstainCount = 0;

      for (const vote of hypothesisVotes) {
        const value = weightedValue(
          vote,
          this.policy,
        );

        if (vote.direction === "SUPPORT") {
          support += value;
          supportCount += 1;
        } else if (vote.direction === "OPPOSE") {
          oppose += value;
          opposeCount += 1;
        } else {
          abstain += value;
          abstainCount += 1;
        }
      }

      const totalDecisive =
        support + oppose;

      const consensusScore =
        totalDecisive > 0
          ? (support - oppose) /
            totalDecisive
          : 0;

      const agreementRatio =
        supportCount + opposeCount > 0
          ? supportCount /
            (supportCount + opposeCount)
          : 0;

      const divergenceScore =
        support > 0 && oppose > 0
          ? Math.min(support, oppose) /
            Math.max(support, oppose)
          : 0;

      const abstentionDetected =
        abstainCount > 0;

      const blockingVotePresent =
        hypothesisVotes.some(
          (vote) =>
            vote.blocking === true,
        );

      const divergenceDetected =
        divergenceScore >=
        this.policy.divergenceThreshold;

      const reachedConsensus =
        consensusScore >=
          this.policy.minimumConsensusScore &&
        agreementRatio >=
          this.policy.minimumAgreementRatio &&
        !blockingVotePresent;

      hypotheses.push(
        Object.freeze({
          hypothesisId,
          reachedConsensus,
          consensusScore:
            Number(consensusScore.toFixed(8)),
          agreementRatio:
            Number(agreementRatio.toFixed(8)),
          divergenceScore:
            Number(divergenceScore.toFixed(8)),
          divergenceDetected,
          abstentionDetected,
          blockingVotePresent,
          supportWeight:
            Number(support.toFixed(8)),
          opposeWeight:
            Number(oppose.toFixed(8)),
          abstainWeight:
            Number(abstain.toFixed(8)),
          supportCount,
          opposeCount,
          abstainCount,
          voteCount:
            hypothesisVotes.length,
          sourceTypes:
            Object.freeze([
              ...new Set(
                hypothesisVotes.map(
                  (vote) => vote.sourceType,
                ),
              ),
            ]),
          requiresHumanReview:
            (
              divergenceDetected &&
              this.policy
                .requireHumanReviewOnDivergence
            ) ||
            (
              abstentionDetected &&
              this.policy
                .requireHumanReviewOnAbstention
            ),
        }),
      );
    }

    const ranked = [...hypotheses].sort(
      (a, b) =>
        Number(b.reachedConsensus) -
          Number(a.reachedConsensus) ||
        b.consensusScore -
          a.consensusScore ||
        b.agreementRatio -
          a.agreementRatio ||
        a.hypothesisId.localeCompare(
          b.hypothesisId,
        ),
    );

    const consensusCandidates =
      ranked.filter(
        (item) =>
          item.reachedConsensus,
      );

    const top =
      consensusCandidates[0] || null;

    const topTie =
      consensusCandidates.length > 1 &&
      top &&
      consensusCandidates[1]
        .consensusScore ===
        top.consensusScore &&
      consensusCandidates[1]
        .agreementRatio ===
        top.agreementRatio;

    const divergenceDetected =
      ranked.some(
        (item) =>
          item.divergenceDetected,
      );

    const abstentionDetected =
      ranked.some(
        (item) =>
          item.abstentionDetected,
      );

    const blockingVotePresent =
      uniqueVotes.some(
        (vote) => vote.blocking,
      );

    return Object.freeze({
      engineVersion:
        DIAGNOSTIC_CONSENSUS_ENGINE_VERSION,
      voteCount: uniqueVotes.length,
      hypothesisCount:
        ranked.length,
      consensusCount:
        consensusCandidates.length,
      selectedConsensus: top,
      topTie,
      divergenceDetected,
      abstentionDetected,
      blockingVotePresent,
      rankedConsensus:
        Object.freeze(
          ranked.slice(
            0,
            this.policy.maximumHypotheses,
          ),
        ),
      requiresHumanReview:
        ranked.some(
          (item) =>
            item.requiresHumanReview,
        ) ||
        (
          topTie &&
          this.policy
            .requireHumanReviewOnTie
        ),
      automationBlocked:
        blockingVotePresent &&
        this.policy
          .blockAutomationOnBlockingVote,
      explanation: Object.freeze({
        summary:
          top
            ? `Consensus reached for ${top.hypothesisId}.`
            : "No diagnostic consensus was reached.",
        rationale:
          `Votes ${uniqueVotes.length}; hypotheses ${ranked.length}; consensus ${consensusCandidates.length}; divergence ${divergenceDetected}; abstention ${abstentionDetected}.`,
        safetyStatement:
          "Diagnostic consensus is clinical decision support and does not establish a definitive diagnosis.",
      }),
    });
  }
}
