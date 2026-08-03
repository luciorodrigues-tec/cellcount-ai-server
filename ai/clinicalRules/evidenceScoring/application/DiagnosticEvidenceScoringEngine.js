import {
  mergeDiagnosticEvidenceScoringPolicy,
} from "../domain/DiagnosticEvidenceScoringPolicy.js";

export const DIAGNOSTIC_EVIDENCE_SCORING_ENGINE_VERSION =
  "CRR-000021-v1.0.0";

function contribution(signal, policy) {
  const sourceWeight =
    Number(
      policy.sourceTypeWeights[
        signal.sourceType
      ] ?? 0,
    );

  const base =
    signal.strength *
    signal.confidence *
    signal.reliability *
    signal.weight *
    sourceWeight;

  if (signal.direction === "SUPPORT") {
    return base;
  }

  if (signal.direction === "OPPOSE") {
    return -base * policy.opposePenaltyMultiplier;
  }

  return 0;
}

export class DiagnosticEvidenceScoringEngine {
  constructor({ policy = {} } = {}) {
    this.policy =
      mergeDiagnosticEvidenceScoringPolicy(policy);
  }

  scoreHypothesis({
    hypothesisId,
    signals = [],
  } = {}) {
    if (!hypothesisId || !String(hypothesisId).trim()) {
      throw new TypeError(
        "DiagnosticEvidenceScoringEngine requires hypothesisId.",
      );
    }

    const selectedSignals = (
      Array.isArray(signals) ? signals : []
    )
      .filter(
        (signal) =>
          signal.hypothesisId ===
          String(hypothesisId),
      )
      .slice(
        0,
        this.policy.maximumSignalsPerHypothesis,
      );

    const seenIds = new Set();
    const uniqueSignals = [];

    for (const signal of selectedSignals) {
      if (!seenIds.has(signal.id)) {
        seenIds.add(signal.id);
        uniqueSignals.push(signal);
      }
    }

    const details = uniqueSignals.map((signal) => {
      const value =
        contribution(signal, this.policy);

      return Object.freeze({
        signalId: signal.id,
        sourceType: signal.sourceType,
        sourceId: signal.sourceId,
        direction: signal.direction,
        blocking: signal.blocking,
        contribution:
          Number(value.toFixed(8)),
        evidenceSourceIds:
          signal.evidenceSourceIds,
      });
    });

    const supportScore = details
      .filter(
        (item) =>
          item.direction === "SUPPORT",
      )
      .reduce(
        (total, item) =>
          total + item.contribution,
        0,
      );

    const opposeScore = Math.abs(
      details
        .filter(
          (item) =>
            item.direction === "OPPOSE",
        )
        .reduce(
          (total, item) =>
            total + item.contribution,
          0,
        ),
    );

    const abstentionDetected =
      uniqueSignals.some(
        (signal) =>
          signal.direction === "ABSTAIN" ||
          (
            signal.blocking &&
            this.policy.abstainOnBlockingSignal
          ),
      );

    const conflictScore =
      supportScore > 0 && opposeScore > 0
        ? Math.min(
            supportScore,
            opposeScore,
          ) /
          Math.max(
            supportScore,
            opposeScore,
          )
        : 0;

    const conflictDetected =
      conflictScore >=
      this.policy.conflictThreshold;

    const rawScore =
      supportScore - opposeScore;

    const denominator =
      supportScore + opposeScore;

    const normalizedScore =
      this.policy.normalizeFinalScore &&
      denominator > 0
        ? rawScore / denominator
        : rawScore;

    let status = "INSUFFICIENT_EVIDENCE";
    let reason = "MINIMUM_SUPPORT_NOT_MET";

    if (abstentionDetected) {
      status = "ABSTAINED";
      reason = "BLOCKING_OR_ABSTAIN_SIGNAL_PRESENT";
    } else if (conflictDetected) {
      status = "CONFLICTED";
      reason = "MATERIAL_SUPPORT_OPPOSITION_CONFLICT";
    } else if (
      normalizedScore >=
      this.policy.minimumSupportScore
    ) {
      status = "SUPPORTED";
      reason = "POSITIVE_EVIDENCE_SCORE";
    } else if (
      normalizedScore <=
      -this.policy.minimumSupportScore
    ) {
      status = "OPPOSED";
      reason = "NEGATIVE_EVIDENCE_SCORE";
    }

    return Object.freeze({
      engineVersion:
        DIAGNOSTIC_EVIDENCE_SCORING_ENGINE_VERSION,
      hypothesisId: String(hypothesisId),
      status,
      reason,
      supportScore:
        Number(supportScore.toFixed(8)),
      opposeScore:
        Number(opposeScore.toFixed(8)),
      rawScore:
        Number(rawScore.toFixed(8)),
      normalizedScore:
        Number(normalizedScore.toFixed(8)),
      conflictScore:
        Number(conflictScore.toFixed(8)),
      conflictDetected,
      abstentionDetected,
      signalCount: details.length,
      details: Object.freeze(details),
      requiresHumanReview:
        (
          conflictDetected &&
          this.policy.requireHumanReviewOnConflict
        ) ||
        (
          abstentionDetected &&
          this.policy.requireHumanReviewOnAbstention
        ),
      explanation: Object.freeze({
        summary:
          `Hypothesis ${hypothesisId} scored as ${status}.`,
        rationale:
          `Support ${supportScore.toFixed(4)}; opposition ${opposeScore.toFixed(4)}; normalized ${normalizedScore.toFixed(4)}; conflict ${conflictScore.toFixed(4)}.`,
        safetyStatement:
          "Evidence scoring is clinical decision support and not a definitive diagnosis.",
      }),
    });
  }

  scoreAll({ signals = [] } = {}) {
    const hypothesisIds = [
      ...new Set(
        (Array.isArray(signals) ? signals : [])
          .map((signal) => signal.hypothesisId)
          .filter(Boolean),
      ),
    ];

    const results = hypothesisIds.map(
      (hypothesisId) =>
        this.scoreHypothesis({
          hypothesisId,
          signals,
        }),
    );

    const rankedResults = [...results].sort(
      (a, b) =>
        b.normalizedScore -
          a.normalizedScore ||
        a.hypothesisId.localeCompare(
          b.hypothesisId,
        ),
    );

    return Object.freeze({
      engineVersion:
        DIAGNOSTIC_EVIDENCE_SCORING_ENGINE_VERSION,
      hypothesisCount: rankedResults.length,
      supportedCount:
        rankedResults.filter(
          (item) =>
            item.status === "SUPPORTED",
        ).length,
      opposedCount:
        rankedResults.filter(
          (item) =>
            item.status === "OPPOSED",
        ).length,
      conflictedCount:
        rankedResults.filter(
          (item) =>
            item.status === "CONFLICTED",
        ).length,
      abstainedCount:
        rankedResults.filter(
          (item) =>
            item.status === "ABSTAINED",
        ).length,
      requiresHumanReview:
        rankedResults.some(
          (item) =>
            item.requiresHumanReview,
        ),
      rankedResults:
        Object.freeze(rankedResults),
      safetyStatement:
        "Ranked evidence scores support expert review and are not definitive diagnoses.",
    });
  }
}
