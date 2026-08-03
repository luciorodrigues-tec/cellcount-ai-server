import {
  assertValidDifferentialRule,
  canonicalPairKey,
} from "./DifferentialRuleValidator.js";

export const DIFFERENTIAL_REPOSITORY_VERSION =
  "CI-002D.1-v1";

export class DifferentialRuleRepository {
  constructor({
    cellRegistry,
    featureCatalog,
    version =
      DIFFERENTIAL_REPOSITORY_VERSION,
  } = {}) {
    this.version = version;
    this.cellRegistry =
      cellRegistry || null;
    this.featureCatalog =
      featureCatalog || null;
    this._rules =
      new Map();
    this._pairs =
      new Map();
  }

  register(
    rule,
    {
      replace = false,
    } = {},
  ) {
    assertValidDifferentialRule(
      rule,
      {
        cellRegistry:
          this.cellRegistry,
        featureCatalog:
          this.featureCatalog,
      },
    );

    const pairKey =
      canonicalPairKey(
        rule.primaryCell,
        rule.differentialCell,
      );

    if (
      this._rules.has(rule.id) &&
      !replace
    ) {
      throw new Error(
        `Differential rule already registered: ${rule.id}`,
      );
    }

    const existingPairId =
      this._pairs.get(pairKey);

    if (
      existingPairId &&
      existingPairId !== rule.id &&
      !replace
    ) {
      throw new Error(
        `Differential pair already registered: ${pairKey}`,
      );
    }

    this._rules.set(
      rule.id,
      rule,
    );

    this._pairs.set(
      pairKey,
      rule.id,
    );

    return rule;
  }

  registerMany(
    rules = [],
    options = {},
  ) {
    return rules.map(
      (rule) =>
        this.register(
          rule,
          options,
        ),
    );
  }

  get(id) {
    return (
      this._rules.get(id) ||
      null
    );
  }

  getByPair(
    firstCell,
    secondCell,
  ) {
    const id =
      this._pairs.get(
        canonicalPairKey(
          firstCell,
          secondCell,
        ),
      );

    return id
      ? this.get(id)
      : null;
  }

  getByPrimaryCell(
    cellId,
  ) {
    return [
      ...this._rules.values(),
    ].filter(
      (rule) =>
        rule.primaryCell === cellId,
    );
  }

  getByDifferentialCell(
    cellId,
  ) {
    return [
      ...this._rules.values(),
    ].filter(
      (rule) =>
        rule.differentialCell ===
        cellId,
    );
  }

  getByCell(
    cellId,
  ) {
    return [
      ...this._rules.values(),
    ].filter(
      (rule) =>
        rule.primaryCell === cellId ||
        rule.differentialCell ===
          cellId,
    );
  }

  findSimilar(
    minimumSimilarity = 0.5,
  ) {
    return [
      ...this._rules.values(),
    ]
      .filter(
        (rule) =>
          rule.similarity >=
          minimumSimilarity,
      )
      .sort(
        (first, second) =>
          second.similarity -
          first.similarity,
      );
  }

  findRecommendations(
    firstCell,
    secondCell,
  ) {
    return (
      this.getByPair(
        firstCell,
        secondCell,
      )?.recommendedTests || []
    );
  }

  list() {
    return [
      ...this._rules.values(),
    ];
  }

  snapshot() {
    return Object.freeze({
      version:
        this.version,
      size:
        this._rules.size,
      rules:
        Object.freeze(
          this.list(),
        ),
    });
  }
}
