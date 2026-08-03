import {
  mergeMultiEvidenceFusionPolicy,
} from "../domain/MultiEvidenceFusionPolicy.js";

export const MULTI_EVIDENCE_FUSION_ENGINE_VERSION =
  "CRR-000009-v1.0.0";

function effectiveWeight(signal, policy) {
  const sourceWeight =
    policy.sourceWeights[signal.sourceType] || 1;
  const evidenceWeight =
    policy.evidenceWeights[
      signal.evidenceLevel
    ] || 1;

  return (
    signal.strength *
    signal.confidence *
    signal.reliability *
    sourceWeight *
    evidenceWeight
  );
}

export class MultiEvidenceFusionEngine {
  constructor({
    signalRepository,
    policy = {},
  } = {}) {
    if (!signalRepository) {
      throw new TypeError(
        "MultiEvidenceFusionEngine requires a signal repository.",
      );
    }

    this.signalRepository =
      signalRepository;
    this.policy =
      mergeMultiEvidenceFusionPolicy(policy);
  }

  fuseTarget({
    targetId,
    signals = null,
  } = {}) {
    if (!targetId) {
      throw new TypeError(
        "Fusion targetId is required.",
      );
    }

    let relevant =
      signals ||
      this.signalRepository.listByTarget(
        targetId,
      );

    relevant = (
      Array.isArray(relevant)
        ? relevant
        : []
    )
      .filter(
        (signal) =>
          signal.targetId === String(targetId),
      )
      .slice(
        0,
        this.policy.maximumSignalsPerTarget,
      );

    if (this.policy.deduplicateBySource) {
      const deduplicated = new Map();

      for (const signal of relevant) {
        const key =
          `${signal.sourceType}::${signal.sourceId}`;

        const current = deduplicated.get(key);

        if (
          !current ||
          effectiveWeight(signal, this.policy) >
            effectiveWeight(current, this.policy)
        ) {
          deduplicated.set(key, signal);
        }
      }

      relevant = [...deduplicated.values()];
    }

    const weightedSignals = relevant.map(
      (signal) =>
        Object.freeze({
          signal,
          effectiveWeight:
            Number(
              effectiveWeight(
                signal,
                this.policy,
              ).toFixed(8),
            ),
        }),
    );

    const sum = (direction) =>
      weightedSignals
        .filter(
          (item) =>
            item.signal.direction === direction,
        )
        .reduce(
          (total, item) =>
            total + item.effectiveWeight,
          0,
        );

    const supportWeight = sum("SUPPORT");
    const opposeWeight = sum("OPPOSE");
    const neutralWeight = sum("NEUTRAL");
    const abstainWeight = sum("ABSTAIN");
    const decisionWeight =
      supportWeight + opposeWeight;

    const supportRatio =
      decisionWeight === 0
        ? 0
        : supportWeight / decisionWeight;
    const opposeRatio =
      decisionWeight === 0
        ? 0
        : opposeWeight / decisionWeight;
    const conflictRatio =
      decisionWeight === 0
        ? 0
        : Math.min(
            supportWeight,
            opposeWeight,
          ) / decisionWeight;

    const blockingSignals = relevant.filter(
      (signal) => signal.blocking,
    );
    const humanReviewSignals = relevant.filter(
      (signal) =>
        signal.requiresHumanReview,
    );

    let status = "INSUFFICIENT_EVIDENCE";
    let reason = "MINIMUM_DECISION_WEIGHT_NOT_MET";

    if (
      this.policy.abstainOnBlockingSignal &&
      blockingSignals.length > 0
    ) {
      status = "ABSTAINED";
      reason = "BLOCKING_SIGNAL_PRESENT";
    } else if (
      this.policy
        .abstainOnHumanReviewSignal &&
      humanReviewSignals.length > 0
    ) {
      status = "ABSTAINED";
      reason =
        "HUMAN_REVIEW_SIGNAL_PRESENT";
    } else if (
      decisionWeight >=
        this.policy.minimumDecisionWeight &&
      conflictRatio >=
        this.policy.conflictThreshold
    ) {
      status = "CONFLICTED";
      reason = "MATERIAL_EVIDENCE_CONFLICT";
    } else if (
      decisionWeight >=
        this.policy.minimumDecisionWeight &&
      supportRatio >=
        this.policy.supportThreshold
    ) {
      status = "SUPPORTED";
      reason = "FUSION_SUPPORT_THRESHOLD_MET";
    } else if (
      decisionWeight >=
        this.policy.minimumDecisionWeight &&
      opposeRatio >=
        this.policy.opposeThreshold
    ) {
      status = "OPPOSED";
      reason = "FUSION_OPPOSE_THRESHOLD_MET";
    }

    return Object.freeze({
      engineVersion:
        MULTI_EVIDENCE_FUSION_ENGINE_VERSION,
      targetId: String(targetId),
      status,
      reason,
      supportWeight:
        Number(supportWeight.toFixed(8)),
      opposeWeight:
        Number(opposeWeight.toFixed(8)),
      neutralWeight:
        Number(neutralWeight.toFixed(8)),
      abstainWeight:
        Number(abstainWeight.toFixed(8)),
      decisionWeight:
        Number(decisionWeight.toFixed(8)),
      supportRatio:
        Number(supportRatio.toFixed(8)),
      opposeRatio:
        Number(opposeRatio.toFixed(8)),
      conflictRatio:
        Number(conflictRatio.toFixed(8)),
      signalCount: relevant.length,
      blockingSignalCount:
        blockingSignals.length,
      humanReviewSignalCount:
        humanReviewSignals.length,
      weightedSignals:
        Object.freeze(weightedSignals),
      provenance: Object.freeze(
        relevant.map((signal) =>
          Object.freeze({
            signalId: signal.id,
            sourceId: signal.sourceId,
            sourceType: signal.sourceType,
            direction: signal.direction,
            evidenceLevel:
              signal.evidenceLevel,
          }),
        ),
      ),
      requiresHumanReview:
        status === "ABSTAINED" ||
        status === "CONFLICTED" ||
        humanReviewSignals.length > 0,
      explanation: Object.freeze({
        summary:
          `Evidence fusion for ${targetId}: ${status}.`,
        rationale:
          `Support ${supportWeight.toFixed(4)}, ` +
          `oppose ${opposeWeight.toFixed(4)}, ` +
          `conflict ratio ${conflictRatio.toFixed(4)}.`,
        safetyStatement:
          "Fused evidence is decision support, not a definitive diagnosis.",
      }),
    });
  }

  fuseAll({
    signals = null,
  } = {}) {
    const source =
      signals || this.signalRepository.list();

    const targetIds = [
      ...new Set(
        source.map(
          (signal) => signal.targetId,
        ),
      ),
    ];

    const results = targetIds.map(
      (targetId) =>
        this.fuseTarget({
          targetId,
          signals: source,
        }),
    );

    const rankedResults =
      [...results].sort(
        (a, b) =>
          b.supportRatio -
            a.supportRatio ||
          b.decisionWeight -
            a.decisionWeight ||
          a.targetId.localeCompare(
            b.targetId,
          ),
      );

    return Object.freeze({
      engineVersion:
        MULTI_EVIDENCE_FUSION_ENGINE_VERSION,
      totalTargets: rankedResults.length,
      supportedCount:
        rankedResults.filter(
          (result) =>
            result.status === "SUPPORTED",
        ).length,
      conflictedCount:
        rankedResults.filter(
          (result) =>
            result.status === "CONFLICTED",
        ).length,
      abstainedCount:
        rankedResults.filter(
          (result) =>
            result.status === "ABSTAINED",
        ).length,
      requiresHumanReview:
        rankedResults.some(
          (result) =>
            result.requiresHumanReview,
        ),
      rankedResults:
        Object.freeze(rankedResults),
    });
  }
}
