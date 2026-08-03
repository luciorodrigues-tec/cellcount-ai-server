export const DifferentialPairRejectionReason =
  Object.freeze({
    missingWinner:
      "MISSING_WINNER",
    missingAlternative:
      "MISSING_ALTERNATIVE",
    sameCell:
      "SAME_CELL",
    ruleNotRegistered:
      "RULE_NOT_REGISTERED",
    specimenIncompatible:
      "SPECIMEN_INCOMPATIBLE",
    lowAlternativeScore:
      "ALTERNATIVE_BELOW_MINIMUM_NORMALIZED_SCORE",
    marginTooLarge:
      "MARGIN_FROM_WINNER_TOO_LARGE",
    duplicatePair:
      "DUPLICATE_PAIR",
  });

export function evaluateDifferentialPairEligibility({
  winner,
  alternative,
  rule,
  specimenType,
  policy,
  duplicate = false,
} = {}) {
  const reasons = [];

  if (!winner?.cellId) {
    reasons.push(
      DifferentialPairRejectionReason
        .missingWinner,
    );
  }

  if (!alternative?.cellId) {
    reasons.push(
      DifferentialPairRejectionReason
        .missingAlternative,
    );
  }

  if (
    winner?.cellId &&
    alternative?.cellId &&
    winner.cellId ===
      alternative.cellId
  ) {
    reasons.push(
      DifferentialPairRejectionReason
        .sameCell,
    );
  }

  if (
    policy.requireRegisteredRule ===
      true &&
    !rule
  ) {
    reasons.push(
      DifferentialPairRejectionReason
        .ruleNotRegistered,
    );
  }

  if (
    policy
      .requireSpecimenCompatibility ===
      true &&
    rule &&
    specimenType &&
    Array.isArray(
      rule.specimenTypes,
    ) &&
    rule.specimenTypes.length > 0 &&
    !rule.specimenTypes.includes(
      specimenType,
    )
  ) {
    reasons.push(
      DifferentialPairRejectionReason
        .specimenIncompatible,
    );
  }

  if (
    Number(
      alternative
        ?.normalizedScore || 0,
    ) <
    policy
      .minimumAlternativeNormalizedScore
  ) {
    reasons.push(
      DifferentialPairRejectionReason
        .lowAlternativeScore,
    );
  }

  if (
    Number(
      alternative
        ?.marginFromWinner || 0,
    ) >
    policy
      .maximumMarginFromWinner
  ) {
    reasons.push(
      DifferentialPairRejectionReason
        .marginTooLarge,
    );
  }

  if (duplicate) {
    reasons.push(
      DifferentialPairRejectionReason
        .duplicatePair,
    );
  }

  return Object.freeze({
    eligible:
      reasons.length === 0,
    reasons:
      Object.freeze(reasons),
  });
}
