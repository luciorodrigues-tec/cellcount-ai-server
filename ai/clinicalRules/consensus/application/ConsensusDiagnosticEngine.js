import {
  mergeConsensusPolicy,
} from "../domain/ConsensusPolicy.js";

import {
  ConsensusVoteBuilder,
} from "./ConsensusVoteBuilder.js";

export const CONSENSUS_DIAGNOSTIC_ENGINE_VERSION =
  "CRR-000006-v1.0.0";

function sumWeight(votes, direction) {
  return votes
    .filter((vote) => vote.direction === direction)
    .reduce(
      (total, vote) => total + vote.weight,
      0,
    );
}

export class ConsensusDiagnosticEngine {
  constructor({
    hypothesisRepository,
    policy = {},
  } = {}) {
    if (!hypothesisRepository) {
      throw new TypeError(
        "ConsensusDiagnosticEngine requires a hypothesis repository.",
      );
    }

    this.hypothesisRepository =
      hypothesisRepository;
    this.policy = mergeConsensusPolicy(policy);
    this.voteBuilder =
      new ConsensusVoteBuilder({
        policy: this.policy,
      });
  }

  evaluateHypothesis({
    hypothesisId,
    execution,
  } = {}) {
    const hypothesis =
      this.hypothesisRepository.get(
        hypothesisId,
      );

    if (!hypothesis) {
      throw new Error(
        `Unknown diagnostic hypothesis: ${hypothesisId}`,
      );
    }

    const votes =
      this.voteBuilder.fromExecution({
        execution,
        hypothesis,
      });

    const matchedRuleIds = new Set(
      execution.traces
        .filter((trace) => trace.matched)
        .map((trace) => trace.ruleId),
    );

    const missingRequiredRules =
      hypothesis.requiredRuleIds.filter(
        (ruleId) =>
          !matchedRuleIds.has(ruleId),
      );

    const matchedExcludedRules =
      hypothesis.excludedRuleIds.filter(
        (ruleId) =>
          matchedRuleIds.has(ruleId),
      );

    const supportWeight = sumWeight(
      votes,
      "SUPPORT",
    );
    const opposeWeight = sumWeight(
      votes,
      "OPPOSE",
    );
    const abstainWeight = sumWeight(
      votes,
      "ABSTAIN",
    );
    const neutralWeight = sumWeight(
      votes,
      "NEUTRAL",
    );

    const decisionWeight =
      supportWeight + opposeWeight;

    const supportRatio =
      decisionWeight === 0
        ? 0
        : supportWeight / decisionWeight;

    const conflictRatio =
      decisionWeight === 0
        ? 0
        : Math.min(
            supportWeight,
            opposeWeight,
          ) / decisionWeight;

    const blockingVotes = votes.filter(
      (vote) =>
        vote.requiresHumanReview ||
        vote.metadata?.severity === "blocking" ||
        vote.metadata?.severity === "critical",
    );

    let status = "INSUFFICIENT_EVIDENCE";
    let reason = "INSUFFICIENT_WEIGHT";

    if (
      this.policy.abstainOnBlockingVote &&
      blockingVotes.length > 0
    ) {
      status = "ABSTAINED";
      reason = "BLOCKING_OR_CRITICAL_VOTE";
    } else if (
      this.policy.abstainOnMissingRequiredRules &&
      missingRequiredRules.length > 0
    ) {
      status = "ABSTAINED";
      reason = "MISSING_REQUIRED_RULES";
    } else if (
      matchedExcludedRules.length > 0
    ) {
      status = "REJECTED";
      reason = "EXCLUDED_RULE_MATCHED";
    } else if (
      conflictRatio >=
      this.policy.conflictRatioThreshold
    ) {
      status = "CONFLICTED";
      reason = "MATERIAL_RULE_CONFLICT";
    } else if (
      supportWeight >=
        this.policy.minimumSupportWeight &&
      decisionWeight >=
        this.policy.minimumTotalWeight &&
      supportRatio >=
        this.policy.minimumSupportRatio &&
      (
        !this.policy.requireAtLeastOneSupportingVote ||
        supportWeight > 0
      )
    ) {
      status = "SUPPORTED";
      reason = "CONSENSUS_THRESHOLD_MET";
    }

    return Object.freeze({
      engineVersion:
        CONSENSUS_DIAGNOSTIC_ENGINE_VERSION,
      hypothesisId: hypothesis.id,
      hypothesisLabel: hypothesis.label,
      status,
      reason,
      supportWeight,
      opposeWeight,
      abstainWeight,
      neutralWeight,
      decisionWeight,
      supportRatio: Number(
        supportRatio.toFixed(4),
      ),
      conflictRatio: Number(
        conflictRatio.toFixed(4),
      ),
      matchedRuleIds: Object.freeze([
        ...matchedRuleIds,
      ]),
      missingRequiredRules:
        Object.freeze(
          missingRequiredRules,
        ),
      matchedExcludedRules:
        Object.freeze(
          matchedExcludedRules,
        ),
      blockingVoteCount:
        blockingVotes.length,
      votes,
      requiresHumanReview:
        status === "ABSTAINED" ||
        status === "CONFLICTED" ||
        blockingVotes.length > 0,
      explanation: Object.freeze({
        summary:
          `Hypothesis ${hypothesis.id} concluded as ${status}.`,
        rationale:
          `Support weight ${supportWeight.toFixed(4)}, ` +
          `oppose weight ${opposeWeight.toFixed(4)}, ` +
          `support ratio ${supportRatio.toFixed(4)}, ` +
          `conflict ratio ${conflictRatio.toFixed(4)}.`,
        safetyStatement:
          status === "SUPPORTED"
            ? "Consensus support is not a diagnosis and requires clinical correlation."
            : "The engine did not establish sufficient safe consensus.",
      }),
    });
  }

  evaluateAll({ execution } = {}) {
    const results =
      this.hypothesisRepository
        .list()
        .map((hypothesis) =>
          this.evaluateHypothesis({
            hypothesisId: hypothesis.id,
            execution,
          }),
        );

    const supported = results.filter(
      (result) =>
        result.status === "SUPPORTED",
    );
    const conflicted = results.filter(
      (result) =>
        result.status === "CONFLICTED",
    );
    const abstained = results.filter(
      (result) =>
        result.status === "ABSTAINED",
    );

    return Object.freeze({
      engineVersion:
        CONSENSUS_DIAGNOSTIC_ENGINE_VERSION,
      executionId:
        execution?.executionId || null,
      totalHypotheses: results.length,
      supportedCount: supported.length,
      conflictedCount: conflicted.length,
      abstainedCount: abstained.length,
      requiresHumanReview:
        conflicted.length > 0 ||
        abstained.length > 0,
      results: Object.freeze(results),
    });
  }
}
