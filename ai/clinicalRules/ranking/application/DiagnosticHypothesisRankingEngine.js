import {
  mergeDiagnosticRankingPolicy,
} from "../domain/DiagnosticRankingPolicy.js";

export const DIAGNOSTIC_HYPOTHESIS_RANKING_ENGINE_VERSION =
  "CRR-000010-v1.0.0";

function byId(results = [], idField) {
  return new Map(
    (Array.isArray(results) ? results : [])
      .map((item) => [item?.[idField], item])
      .filter(([id]) => Boolean(id)),
  );
}

function clamp01(value) {
  const number = Number(value || 0);
  return Math.max(0, Math.min(1, number));
}

function normalizedComponentScores({
  hypothesisId,
  fusionMap,
  bayesianMap,
  differentialMap,
  consensusMap,
}) {
  const fusion = fusionMap.get(hypothesisId);
  const bayesian = bayesianMap.get(hypothesisId);
  const differential =
    differentialMap.get(hypothesisId);
  const consensus =
    consensusMap.get(hypothesisId);

  return Object.freeze({
    FUSION:
      fusion?.status === "SUPPORTED"
        ? clamp01(fusion.supportRatio)
        : fusion?.status === "OPPOSED"
          ? 0
          : clamp01(
              Number(fusion?.supportRatio || 0),
            ),
    BAYESIAN:
      clamp01(
        Number(
          bayesian?.calibratedProbability ??
          bayesian?.posteriorProbability ??
          0,
        ),
      ),
    DIFFERENTIAL:
      clamp01(
        Number(
          differential?.normalizedScore ??
          0,
        ),
      ),
    CONSENSUS:
      clamp01(
        Number(
          consensus?.supportRatio ?? 0,
        ),
      ),
  });
}

export class DiagnosticHypothesisRankingEngine {
  constructor({
    hypothesisRepository,
    policy = {},
  } = {}) {
    if (!hypothesisRepository) {
      throw new TypeError(
        "DiagnosticHypothesisRankingEngine requires a hypothesis repository.",
      );
    }

    this.hypothesisRepository =
      hypothesisRepository;
    this.policy =
      mergeDiagnosticRankingPolicy(policy);
  }

  evaluateHypothesis({
    hypothesisId,
    fusionResults = [],
    bayesianResults = [],
    differentialResults = [],
    consensusResults = [],
  } = {}) {
    const hypothesis =
      this.hypothesisRepository.get(
        hypothesisId,
      );

    if (!hypothesis) {
      throw new Error(
        `Unknown ranking hypothesis: ${hypothesisId}`,
      );
    }

    const fusionMap =
      byId(fusionResults, "targetId");
    const bayesianMap =
      byId(bayesianResults, "hypothesisId");
    const differentialMap =
      byId(
        differentialResults,
        "candidateId",
      );
    const consensusMap =
      byId(
        consensusResults,
        "hypothesisId",
      );

    const components =
      normalizedComponentScores({
        hypothesisId,
        fusionMap,
        bayesianMap,
        differentialMap,
        consensusMap,
      });

    const availableSourceTypes = new Set();

    if (fusionMap.has(hypothesisId)) {
      availableSourceTypes.add("FUSION");
    }
    if (bayesianMap.has(hypothesisId)) {
      availableSourceTypes.add("BAYESIAN");
    }
    if (differentialMap.has(hypothesisId)) {
      availableSourceTypes.add(
        "DIFFERENTIAL",
      );
    }
    if (consensusMap.has(hypothesisId)) {
      availableSourceTypes.add(
        "CONSENSUS",
      );
    }

    const missingRequiredSourceTypes =
      hypothesis.requiredSourceTypes.filter(
        (sourceType) =>
          !availableSourceTypes.has(
            sourceType,
          ),
      );

    let compositeScore = Object.entries(
      components,
    ).reduce(
      (total, [component, score]) =>
        total +
        score *
          Number(
            this.policy.componentWeights[
              component
            ] || 0,
          ),
      0,
    );

    const fusion =
      fusionMap.get(hypothesisId);
    const bayesian =
      bayesianMap.get(hypothesisId);
    const differential =
      differentialMap.get(hypothesisId);
    const consensus =
      consensusMap.get(hypothesisId);

    const conflictDetected = [
      fusion?.status,
      differential?.status,
      consensus?.status,
    ].includes("CONFLICTED");

    const abstentionDetected = [
      fusion?.status,
      bayesian?.status,
      differential?.status,
      consensus?.status,
    ].includes("ABSTAINED");

    const exclusionDetected =
      differential?.status === "EXCLUDED" ||
      consensus?.status === "REJECTED" ||
      fusion?.status === "OPPOSED";

    if (conflictDetected) {
      compositeScore -=
        this.policy.conflictPenalty;
    }

    if (abstentionDetected) {
      compositeScore -=
        this.policy.abstentionPenalty;
    }

    if (exclusionDetected) {
      compositeScore -=
        this.policy.exclusionPenalty;
    }

    compositeScore -=
      missingRequiredSourceTypes.length *
      this.policy
        .missingRequiredSourcePenalty;

    let status = "INSUFFICIENT_EVIDENCE";
    let reason =
      "MINIMUM_RANKABLE_SCORE_NOT_MET";

    if (exclusionDetected) {
      status = "EXCLUDED";
      reason = "EXCLUSION_SIGNAL_PRESENT";
    } else if (abstentionDetected) {
      status = "ABSTAINED";
      reason =
        "ABSTENTION_SIGNAL_PRESENT";
    } else if (conflictDetected) {
      status = "CONFLICTED";
      reason = "CONFLICT_SIGNAL_PRESENT";
    } else if (
      compositeScore >=
      this.policy.minimumRankableScore
    ) {
      status = "RANKABLE";
      reason =
        "COMPOSITE_SCORE_THRESHOLD_MET";
    }

    return Object.freeze({
      engineVersion:
        DIAGNOSTIC_HYPOTHESIS_RANKING_ENGINE_VERSION,
      hypothesisId: hypothesis.id,
      hypothesisLabel: hypothesis.label,
      status,
      reason,
      compositeScore:
        Number(compositeScore.toFixed(8)),
      components,
      availableSourceTypes:
        Object.freeze([
          ...availableSourceTypes,
        ]),
      missingRequiredSourceTypes:
        Object.freeze(
          missingRequiredSourceTypes,
        ),
      conflictDetected,
      abstentionDetected,
      exclusionDetected,
      competingHypothesisIds:
        hypothesis.competingHypothesisIds,
      exclusionHypothesisIds:
        hypothesis.exclusionHypothesisIds,
      requiresHumanReview:
        conflictDetected ||
        abstentionDetected ||
        exclusionDetected,
      explanation: Object.freeze({
        summary:
          `Hypothesis ${hypothesis.id} evaluated as ${status}.`,
        rationale:
          `Composite score ${compositeScore.toFixed(4)} ` +
          `from fusion ${components.FUSION.toFixed(4)}, ` +
          `Bayesian ${components.BAYESIAN.toFixed(4)}, ` +
          `differential ${components.DIFFERENTIAL.toFixed(4)}, ` +
          `consensus ${components.CONSENSUS.toFixed(4)}.`,
        safetyStatement:
          "The ranking is clinical decision support, not a definitive diagnosis.",
      }),
    });
  }

  rank({
    fusionResults = [],
    bayesianResults = [],
    differentialResults = [],
    consensusResults = [],
  } = {}) {
    const evaluated =
      this.hypothesisRepository
        .list()
        .map((hypothesis) =>
          this.evaluateHypothesis({
            hypothesisId: hypothesis.id,
            fusionResults,
            bayesianResults,
            differentialResults,
            consensusResults,
          }),
        );

    const ranked = [...evaluated].sort(
      (a, b) =>
        b.compositeScore -
          a.compositeScore ||
        a.hypothesisId.localeCompare(
          b.hypothesisId,
        ),
    );

    const competitionConflicts = [];

    for (const item of ranked) {
      if (item.status !== "RANKABLE") {
        continue;
      }

      for (
        const competitorId of
        item.competingHypothesisIds
      ) {
        const competitor = ranked.find(
          (entry) =>
            entry.hypothesisId ===
              competitorId &&
            entry.status === "RANKABLE",
        );

        if (!competitor) {
          continue;
        }

        const pair = [
          item.hypothesisId,
          competitor.hypothesisId,
        ].sort();

        const key = pair.join("::");

        if (
          !competitionConflicts.some(
            (entry) => entry.key === key,
          )
        ) {
          competitionConflicts.push(
            Object.freeze({
              key,
              hypothesisIds:
                Object.freeze(pair),
            }),
          );
        }
      }
    }

    const positiveTotal = ranked
      .filter(
        (item) =>
          item.compositeScore > 0 &&
          item.status === "RANKABLE",
      )
      .reduce(
        (total, item) =>
          total + item.compositeScore,
        0,
      );

    const rankedHypotheses = ranked
      .slice(
        0,
        this.policy.maximumHypotheses,
      )
      .map((item, index) =>
        Object.freeze({
          ...item,
          rank: index + 1,
          normalizedScore:
            this.policy.normalizeScores &&
            positiveTotal > 0 &&
            item.compositeScore > 0 &&
            item.status === "RANKABLE"
              ? Number(
                  (
                    item.compositeScore /
                    positiveTotal
                  ).toFixed(8),
                )
              : 0,
        }),
      );

    const topTie =
      rankedHypotheses.length > 1 &&
      rankedHypotheses[0]
        .compositeScore ===
        rankedHypotheses[1]
          .compositeScore;

    return Object.freeze({
      engineVersion:
        DIAGNOSTIC_HYPOTHESIS_RANKING_ENGINE_VERSION,
      totalHypotheses:
        rankedHypotheses.length,
      rankableCount:
        rankedHypotheses.filter(
          (item) =>
            item.status === "RANKABLE",
        ).length,
      conflictedCount:
        rankedHypotheses.filter(
          (item) =>
            item.status === "CONFLICTED",
        ).length,
      abstainedCount:
        rankedHypotheses.filter(
          (item) =>
            item.status === "ABSTAINED",
        ).length,
      excludedCount:
        rankedHypotheses.filter(
          (item) =>
            item.status === "EXCLUDED",
        ).length,
      topTie,
      competitionConflicts:
        Object.freeze(
          competitionConflicts,
        ),
      requiresHumanReview:
        rankedHypotheses.some(
          (item) =>
            item.requiresHumanReview,
        ) ||
        competitionConflicts.length > 0 ||
        (
          this.policy
            .requireHumanReviewOnTopTie &&
          topTie
        ),
      rankedHypotheses:
        Object.freeze(rankedHypotheses),
      synthesis: Object.freeze({
        leadingHypothesis:
          rankedHypotheses[0] || null,
        safetyStatement:
          "The ranked list supports expert review and is not a definitive diagnosis.",
      }),
    });
  }
}
