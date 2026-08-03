export const DIAGNOSTIC_UNCERTAINTY_REPOSITORY_VERSION =
  "CRR-000031-v1.0.0";

export class DiagnosticUncertaintyRepository {
  constructor({
    version =
      DIAGNOSTIC_UNCERTAINTY_REPOSITORY_VERSION,
  } = {}) {
    this.version = String(version);
    this._results = new Map();
  }

  save(
    result,
    { replace = false } = {},
  ) {
    if (
      this._results.has(result.caseId) &&
      !replace
    ) {
      throw new Error(
        `Diagnostic uncertainty result already exists for case: ${result.caseId}`,
      );
    }

    this._results.set(
      result.caseId,
      result,
    );

    return result;
  }

  get(caseId) {
    return (
      this._results.get(
        String(caseId),
      ) ||
      null
    );
  }

  list() {
    return Object.freeze([
      ...this._results.values(),
    ]);
  }
}
