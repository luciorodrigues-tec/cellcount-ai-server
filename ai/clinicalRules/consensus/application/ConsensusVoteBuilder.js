import {
  createConsensusVote,
} from "../domain/ConsensusVote.js";

function directionForTrace(
  trace,
  hypothesis,
) {
  if (
    hypothesis.supportingRuleIds.includes(
      trace.ruleId,
    )
  ) {
    return "SUPPORT";
  }

  if (
    hypothesis.opposingRuleIds.includes(
      trace.ruleId,
    )
  ) {
    return "OPPOSE";
  }

  return "NEUTRAL";
}

export class ConsensusVoteBuilder {
  constructor({
    policy,
  } = {}) {
    if (!policy) {
      throw new TypeError(
        "ConsensusVoteBuilder requires a policy.",
      );
    }

    this.policy = policy;
  }

  fromExecution({
    execution,
    hypothesis,
  } = {}) {
    if (
      !execution ||
      !Array.isArray(execution.traces)
    ) {
      throw new TypeError(
        "ConsensusVoteBuilder requires a clinical rule execution.",
      );
    }

    if (!hypothesis) {
      throw new TypeError(
        "ConsensusVoteBuilder requires a hypothesis.",
      );
    }

    return Object.freeze(
      execution.traces
        .filter((trace) => trace.matched)
        .map((trace) => {
          const direction = directionForTrace(
            trace,
            hypothesis,
          );

          const evidenceLevel =
            trace.evidence?.level ||
            trace.evidenceLevel ||
            "UNSPECIFIED";

          const evidenceWeight =
            this.policy.evidenceWeights[
              evidenceLevel
            ] || 1;

          const confidence =
            trace.confidence ??
            trace.metadata?.confidence ??
            null;

          const effectiveConfidence =
            confidence === null
              ? 1
              : Number(confidence);

          return createConsensusVote({
            hypothesisId: hypothesis.id,
            sourceId: trace.traceId,
            sourceType: "CLINICAL_RULE_TRACE",
            direction,
            weight:
              Number(trace.weight || 1) *
              evidenceWeight *
              effectiveConfidence,
            confidence,
            ruleId: trace.ruleId,
            ruleVersion: trace.ruleVersion,
            rationale:
              trace.explanation?.rationale ||
              trace.reason ||
              "",
            evidenceLevel,
            requiresHumanReview:
              trace.explanation
                ?.requiresHumanReview === true,
            metadata: {
              traceId: trace.traceId,
              executionId: trace.executionId,
              severity: trace.severity,
            },
          });
        }),
    );
  }
}
