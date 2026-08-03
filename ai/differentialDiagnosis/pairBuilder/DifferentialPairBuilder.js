import {
  DIFFERENTIAL_PAIR_BUILDER_VERSION,
  mergeDifferentialPairPolicy,
} from "./DifferentialPairPolicy.js";

import {
  createDifferentialPair,
} from "./DifferentialPair.js";

import {
  evaluateDifferentialPairEligibility,
} from "./DifferentialPairEligibility.js";

import {
  collectDifferentialAlternatives,
} from "./DifferentialPairSource.js";

function canonicalPairKey(
  first,
  second,
) {
  return [
    String(first),
    String(second),
  ].sort().join("::");
}

function resolveRule(
  repository,
  winnerCell,
  alternativeCell,
  allowReverseRuleLookup,
) {
  const rule =
    repository.getByPair(
      winnerCell,
      alternativeCell,
    );

  if (!rule) {
    return {
      rule: null,
      reverseOrientation: false,
    };
  }

  const reverseOrientation =
    allowReverseRuleLookup === true &&
    rule.primaryCell !==
      winnerCell;

  return {
    rule,
    reverseOrientation,
  };
}

export class DifferentialPairBuilder {
  constructor({
    ruleRepository,
    policy = {},
  } = {}) {
    if (!ruleRepository) {
      throw new TypeError(
        "ruleRepository is required.",
      );
    }

    this.ruleRepository =
      ruleRepository;

    this.policy =
      mergeDifferentialPairPolicy(
        policy,
      );
  }

  build({
    explanation,
    specimenType = null,
  } = {}) {
    if (
      !explanation ||
      typeof explanation !== "object"
    ) {
      throw new TypeError(
        "explanation is required.",
      );
    }

    const winner =
      explanation.winner || null;

    const alternatives =
      collectDifferentialAlternatives(
        explanation,
        this.policy,
      );

    const seenPairs =
      new Set();

    const pairs = [];

    for (
      const alternative
      of alternatives
    ) {
      const pairKey =
        canonicalPairKey(
          winner?.cellId || "",
          alternative?.cellId || "",
        );

      const duplicate =
        seenPairs.has(pairKey);

      seenPairs.add(pairKey);

      const {
        rule,
        reverseOrientation,
      } = resolveRule(
        this.ruleRepository,
        winner?.cellId,
        alternative?.cellId,
        this.policy
          .allowReverseRuleLookup,
      );

      const eligibility =
        evaluateDifferentialPairEligibility({
          winner,
          alternative,
          rule,
          specimenType,
          policy:
            this.policy,
          duplicate,
        });

      pairs.push(
        createDifferentialPair({
          id:
            `DIFF-PAIR-${winner?.cellId || "NONE"}-${alternative?.cellId || "NONE"}`,
          primaryCell:
            winner?.cellId ||
            "NO_WINNER",
          alternativeCell:
            alternative?.cellId ||
            "NO_ALTERNATIVE",
          primaryRank:
            winner?.rank || 1,
          alternativeRank:
            alternative?.rank ||
            null,
          primaryScore:
            winner?.score || 0,
          alternativeScore:
            alternative?.score || 0,
          primaryNormalizedScore:
            winner
              ?.normalizedScore || 0,
          alternativeNormalizedScore:
            alternative
              ?.normalizedScore || 0,
          marginFromWinner:
            alternative
              ?.marginFromWinner || 0,
          specimenType,
          ruleId:
            rule?.id || null,
          rule,
          registeredRule:
            Boolean(rule),
          reverseOrientation,
          eligible:
            eligibility.eligible,
          rejectionReasons:
            eligibility.reasons,
          source:
            alternative.source ||
            "RANKING",
          metadata: {
            builderVersion:
              DIFFERENTIAL_PAIR_BUILDER_VERSION,
          },
        }),
      );
    }

    const eligible =
      pairs.filter(
        (pair) =>
          pair.eligible,
      );

    const rejected =
      pairs.filter(
        (pair) =>
          !pair.eligible,
      );

    return Object.freeze({
      version:
        DIFFERENTIAL_PAIR_BUILDER_VERSION,
      specimenType,
      winner:
        winner || null,
      pairs:
        Object.freeze(pairs),
      eligiblePairs:
        Object.freeze(
          eligible,
        ),
      rejectedPairs:
        Object.freeze(
          rejected,
        ),
      statistics:
        Object.freeze({
          evaluated:
            pairs.length,
          eligible:
            eligible.length,
          rejected:
            rejected.length,
          withRegisteredRule:
            pairs.filter(
              (pair) =>
                pair.registeredRule,
            ).length,
          reverseOrientation:
            pairs.filter(
              (pair) =>
                pair
                  .reverseOrientation,
            ).length,
        }),
      policy:
        this.policy,
    });
  }
}
