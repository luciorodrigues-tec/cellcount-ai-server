export const RANKING_HYPOTHESIS_REPOSITORY_VERSION =
  "CRR-000010-v1.0.0";

export class RankingHypothesisRepository {
  constructor({
    version =
      RANKING_HYPOTHESIS_REPOSITORY_VERSION,
  } = {}) {
    this.version = String(version);
    this._hypotheses = new Map();
  }

  register(hypothesis, { replace = false } = {}) {
    if (!hypothesis?.id) {
      throw new TypeError(
        "Ranking hypothesis with id is required.",
      );
    }

    if (
      this._hypotheses.has(hypothesis.id) &&
      !replace
    ) {
      throw new Error(
        `Ranking hypothesis already registered: ${hypothesis.id}`,
      );
    }

    this._hypotheses.set(
      hypothesis.id,
      hypothesis,
    );

    return hypothesis;
  }

  get(id) {
    return (
      this._hypotheses.get(String(id)) ||
      null
    );
  }

  list() {
    return Object.freeze([
      ...this._hypotheses.values(),
    ]);
  }
}
