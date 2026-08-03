export class FeatureSimilarity {
  constructor({
    aliasRegistry,
    groups = [],
  } = {}) {
    this.aliasRegistry =
      aliasRegistry || null;
    this._weights =
      new Map();

    for (const group of groups) {
      this.registerGroup(group);
    }
  }

  _key(a, b) {
    return [
      a,
      b,
    ].sort().join("::");
  }

  register(
    first,
    second,
    weight = 0.9,
  ) {
    const a =
      this.aliasRegistry
        ?.resolve(first) ||
      String(first);

    const b =
      this.aliasRegistry
        ?.resolve(second) ||
      String(second);

    const numeric =
      Number(weight);

    if (
      !Number.isFinite(numeric) ||
      numeric < 0 ||
      numeric > 1
    ) {
      throw new TypeError(
        "Similarity weight must be between 0 and 1.",
      );
    }

    this._weights.set(
      this._key(a, b),
      numeric,
    );
  }

  registerGroup({
    canonical,
    equivalents = [],
    weight = 0.9,
  }) {
    for (
      const equivalent
      of equivalents
    ) {
      this.register(
        canonical,
        equivalent,
        weight,
      );
    }
  }

  score(first, second) {
    const a =
      this.aliasRegistry
        ?.resolve(first) ||
      String(first);

    const b =
      this.aliasRegistry
        ?.resolve(second) ||
      String(second);

    if (a === b) {
      return 1;
    }

    return (
      this._weights.get(
        this._key(a, b),
      ) || 0
    );
  }
}

export function createDefaultFeatureSimilarity(
  aliasRegistry,
) {
  return new FeatureSimilarity({
    aliasRegistry,
    groups: [
      {
        canonical:
          "fine_chromatin",
        equivalents: [
          "open_chromatin",
          "delicate_chromatin",
        ],
        weight: 0.9,
      },
      {
        canonical:
          "visible_nucleoli",
        equivalents: [
          "prominent_nucleolus",
          "prominent_nucleoli",
        ],
        weight: 0.9,
      },
      {
        canonical:
          "high_nc_ratio",
        equivalents: [
          "very_high_nc_ratio",
        ],
        weight: 0.92,
      },
      {
        canonical:
          "specific_granules",
        equivalents: [
          "specific_mature_granules",
          "specific_granules_predominate",
        ],
        weight: 0.85,
      },
    ],
  });
}
