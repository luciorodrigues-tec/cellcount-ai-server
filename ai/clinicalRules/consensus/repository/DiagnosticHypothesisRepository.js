export const DIAGNOSTIC_HYPOTHESIS_REPOSITORY_VERSION =
  "CRR-000006-v1.0.0";

export class DiagnosticHypothesisRepository {
  constructor({
    version =
      DIAGNOSTIC_HYPOTHESIS_REPOSITORY_VERSION,
  } = {}) {
    this.version = String(version);
    this._hypotheses = new Map();
  }

  register(hypothesis, { replace = false } = {}) {
    if (!hypothesis?.id) {
      throw new TypeError(
        "Diagnostic hypothesis with id is required.",
      );
    }

    if (
      this._hypotheses.has(hypothesis.id) &&
      !replace
    ) {
      throw new Error(
        `Diagnostic hypothesis already registered: ${hypothesis.id}`,
      );
    }

    this._hypotheses.set(hypothesis.id, hypothesis);
    return hypothesis;
  }

  get(id) {
    return this._hypotheses.get(String(id)) || null;
  }

  list() {
    return Object.freeze([
      ...this._hypotheses.values(),
    ]);
  }
}
