function safeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? Math.max(0, number)
    : 0;
}

function sumPenalty(
  value,
  factor,
) {
  return safeNumber(value) *
    safeNumber(factor);
}

export function calculateConfidencePenalties(
  rankingResult,
  policy,
) {
  const winner =
    rankingResult?.winner || null;

  const sourceScore =
    winner?.candidate?.sourceScore || {};

  const penalties = [];

  function add(
    code,
    amount,
    reason,
  ) {
    const numeric =
      safeNumber(amount);

    if (numeric <= 0) {
      return;
    }

    penalties.push(
      Object.freeze({
        code,
        amount: numeric,
        reason,
      }),
    );
  }

  if (
    rankingResult
      ?.summary
      ?.ambiguous === true
  ) {
    add(
      "AMBIGUITY_PENALTY",
      policy.ambiguityPenalty,
      "Top candidates are within the ambiguity threshold.",
    );
  }

  if (
    rankingResult
      ?.summary
      ?.tie === true
  ) {
    add(
      "TIE_PENALTY",
      policy.tiePenalty,
      "Winner and runner-up are tied.",
    );
  }

  if (
    rankingResult
      ?.summary
      ?.dominance === "LOW"
  ) {
    add(
      "LOW_DOMINANCE_PENALTY",
      policy.lowDominancePenalty,
      "Winner has low dominance over the runner-up.",
    );
  }

  add(
    "LIMITATION_PENALTY",
    sumPenalty(
      sourceScore.limitationPenalty,
      policy.limitationPenaltyFactor,
    ),
    "Image or field limitations reduced confidence.",
  );

  add(
    "NEGATIVE_EVIDENCE_PENALTY",
    sumPenalty(
      sourceScore.negativePenalty,
      policy.negativePenaltyFactor,
    ),
    "Negative evidence reduced confidence.",
  );

  add(
    "EXCLUSION_EVIDENCE_PENALTY",
    sumPenalty(
      sourceScore.exclusionPenalty,
      policy.exclusionPenaltyFactor,
    ),
    "Exclusion evidence reduced confidence.",
  );

  add(
    "MISSING_REQUIRED_PENALTY",
    sumPenalty(
      sourceScore.requiredPenalty,
      policy.requiredPenaltyFactor,
    ),
    "Missing required evidence reduced confidence.",
  );

  if (
    rankingResult
      ?.summary
      ?.winnerStrength
      ?.strongEnough === false
  ) {
    add(
      "WEAK_WINNER_PENALTY",
      policy.weakWinnerPenalty,
      "Winner did not meet minimum strength policy.",
    );
  }

  if (
    rankingResult
      ?.summary
      ?.humanReviewRecommended === true
  ) {
    add(
      "RANKING_REVIEW_PENALTY",
      policy.rankingReviewPenalty,
      "Ranking engine already recommended human review.",
    );
  }

  const totalPenalty =
    penalties.reduce(
      (sum, item) =>
        sum + item.amount,
      0,
    );

  return Object.freeze({
    penalties:
      Object.freeze(penalties),
    totalPenalty,
  });
}
