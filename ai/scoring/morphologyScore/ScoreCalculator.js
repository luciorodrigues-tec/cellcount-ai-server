import {
  createScoreContribution,
} from "./ScoreContribution.js";

import {
  createScoreResult,
} from "./ScoreResult.js";

import {
  mergeScorePolicy,
} from "./ScorePolicy.js";

function clamp01(value) {
  const number = Number(value);

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

function roleMultiplier(
  role,
  policy,
) {
  if (role === "required") {
    return policy.requiredMultiplier;
  }

  if (role === "supportive") {
    return policy.supportiveMultiplier;
  }

  if (role === "negative") {
    return policy.negativePenaltyMultiplier;
  }

  if (role === "exclusion") {
    return policy.exclusionPenaltyMultiplier;
  }

  if (role === "limitation") {
    return policy.limitationPenaltyMultiplier;
  }

  return 1;
}

function buildContribution(
  evidence,
  policy,
) {
  const confidence =
    clamp01(
      evidence.confidence,
    );

  const similarity =
    clamp01(
      evidence.similarity,
    );

  const declaredWeight =
    Math.max(
      0,
      Number(
        evidence.weight || 0,
      ),
    );

  const weight =
    evidence.role === "limitation" &&
    declaredWeight === 0
      ? Number(
          policy.limitationBaseWeight || 1,
        )
      : declaredWeight;

  const matched =
    evidence.matched === true;

  const effectiveEvidence =
    matched
      ? confidence *
        similarity
      : 0;

  const multiplier =
    roleMultiplier(
      evidence.role,
      policy,
    );

  const rawContribution =
    effectiveEvidence *
    weight;

  let appliedContribution = 0;
  let penalty = 0;
  let reason = "";

  if (
    evidence.role === "required" ||
    evidence.role === "supportive"
  ) {
    appliedContribution =
      rawContribution *
      multiplier;

    reason = matched
      ? "Positive evidence contribution."
      : "Positive criterion not matched.";
  } else if (
    evidence.role === "negative" ||
    evidence.role === "exclusion" ||
    evidence.role === "limitation"
  ) {
    penalty =
      rawContribution *
      multiplier;

    reason = matched
      ? "Penalty applied."
      : "Penalty criterion not matched.";
  }

  return createScoreContribution({
    cellId:
      evidence.cellId,
    featureId:
      evidence.featureId,
    role:
      evidence.role,
    matched,
    confidence,
    similarity,
    weight,
    rawContribution:
      round(rawContribution),
    appliedContribution:
      round(
        appliedContribution,
      ),
    penalty:
      round(penalty),
    sourceCriterionId:
      evidence.sourceCriterionId,
    label:
      evidence.label,
    reason,
  });
}

function maximumPositiveScore(
  matchResult,
  policy,
) {
  return round(
    matchResult.evidence
      .filter(
        (item) =>
          item.role === "required" ||
          item.role === "supportive",
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(item.weight || 0) *
          roleMultiplier(
            item.role,
            policy,
          ),
        0,
      ),
  );
}

export class ScoreCalculator {
  constructor({
    policy = {},
  } = {}) {
    this.policy =
      mergeScorePolicy(policy);
  }

  calculate(
    matchResult,
    criteriaDefinition,
  ) {
    if (
      !matchResult ||
      typeof matchResult !== "object"
    ) {
      throw new TypeError(
        "matchResult is required.",
      );
    }

    if (
      !criteriaDefinition ||
      typeof criteriaDefinition !== "object"
    ) {
      throw new TypeError(
        "criteriaDefinition is required.",
      );
    }

    const contributions =
      matchResult.evidence.map(
        (evidence) =>
          buildContribution(
            evidence,
            this.policy,
          ),
      );

    const positiveScore =
      round(
        contributions
          .reduce(
            (sum, item) =>
              sum +
              item.appliedContribution,
            0,
          ),
      );

    const negativePenalty =
      round(
        contributions
          .filter(
            (item) =>
              item.role === "negative",
          )
          .reduce(
            (sum, item) =>
              sum + item.penalty,
            0,
          ),
      );

    const exclusionPenalty =
      round(
        contributions
          .filter(
            (item) =>
              item.role === "exclusion",
          )
          .reduce(
            (sum, item) =>
              sum + item.penalty,
            0,
          ),
      );

    const limitationPenalty =
      round(
        contributions
          .filter(
            (item) =>
              item.role === "limitation",
          )
          .reduce(
            (sum, item) =>
              sum + item.penalty,
            0,
          ),
      );

    const missingRequired =
      Math.max(
        0,
        matchResult.requiredTotal -
        matchResult.requiredMatched,
      );

    const requiredPenalty =
      round(
        missingRequired *
        this.policy
          .missingRequiredPenaltyMultiplier,
      );

    const rawScore =
      round(
        positiveScore -
        negativePenalty -
        exclusionPenalty -
        limitationPenalty -
        requiredPenalty,
      );

    const excluded =
      matchResult.excluded === true ||
      exclusionPenalty >=
        Number(
          criteriaDefinition
            .thresholds
            ?.exclusionBlockScore || 1,
        );

    const blocked =
      this.policy.exclusionBlocks &&
      excluded;

    const finalScore =
      round(
        blocked
          ? Math.min(rawScore, 0)
          : rawScore,
      );

    const maxPositive =
      maximumPositiveScore(
        matchResult,
        this.policy,
      );

    let normalizedScore =
      maxPositive > 0
        ? finalScore /
          maxPositive
        : 0;

    if (
      this.policy
        .clampNormalizedScore
    ) {
      normalizedScore =
        clamp01(normalizedScore);
    }

    const minimumRequired =
      Number(
        criteriaDefinition
          .thresholds
          ?.minimumRequiredMatches || 0,
      );

    const minimumWeightedScore =
      Number(
        criteriaDefinition
          .thresholds
          ?.minimumWeightedScore || 0,
      );

    const requiredSatisfied =
      matchResult.requiredMatched >=
      minimumRequired;

    const minimumScoreSatisfied =
      finalScore >=
      minimumWeightedScore;

    return createScoreResult({
      cellId:
        matchResult.cellId,
      criteriaId:
        matchResult.criteriaId,
      positiveScore,
      negativePenalty,
      exclusionPenalty,
      limitationPenalty,
      requiredPenalty,
      rawScore,
      finalScore,
      normalizedScore:
        round(normalizedScore),
      maximumPositiveScore:
        maxPositive,
      requiredSatisfied,
      minimumScoreSatisfied,
      excluded,
      blocked,
      contributions,
      summary: {
        requiredMatched:
          matchResult.requiredMatched,
        requiredTotal:
          matchResult.requiredTotal,
        supportiveMatched:
          matchResult.supportiveMatched,
        supportiveTotal:
          matchResult.supportiveTotal,
        negativeMatched:
          matchResult.negativeMatched,
        exclusionMatched:
          matchResult.exclusionMatched,
        limitationMatched:
          matchResult.limitationMatched,
        overallCoverage:
          matchResult.coverage
            ?.overallCoverage || 0,
      },
    });
  }

  calculateMany(
    matchResults = [],
    criteriaRegistry,
  ) {
    if (!criteriaRegistry) {
      throw new TypeError(
        "criteriaRegistry is required.",
      );
    }

    return matchResults.map(
      (matchResult) => {
        const definition =
          criteriaRegistry
            .get(
              matchResult.criteriaId,
            ) ||
          criteriaRegistry
            .getByCellId(
              matchResult.cellId,
            );

        if (!definition) {
          throw new Error(
            `Criteria definition not found for ${matchResult.cellId}`,
          );
        }

        return this.calculate(
          matchResult,
          definition,
        );
      },
    );
  }
}
