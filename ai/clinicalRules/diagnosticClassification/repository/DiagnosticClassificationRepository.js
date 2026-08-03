export const DIAGNOSTIC_CLASSIFICATION_REPOSITORY_VERSION =
  "CRR-000020-v1.0.0";

export class DiagnosticClassificationRepository {
  constructor({
    version =
      DIAGNOSTIC_CLASSIFICATION_REPOSITORY_VERSION,
  } = {}) {
    this.version = String(version);
    this._candidates = new Map();
  }

  registerCandidate(
    candidate,
    { replace = false } = {},
  ) {
    if (
      this._candidates.has(candidate.id) &&
      !replace
    ) {
      throw new Error(
        `Diagnostic classification candidate already registered: ${candidate.id}`,
      );
    }

    this._candidates.set(
      candidate.id,
      candidate,
    );

    return candidate;
  }

  getCandidate(id) {
    return (
      this._candidates.get(String(id)) ||
      null
    );
  }

  listCandidates({
    classificationId = null,
    diseaseEntityId = null,
    status = null,
  } = {}) {
    return Object.freeze(
      [...this._candidates.values()].filter(
        (candidate) =>
          (!classificationId ||
            candidate.classificationId ===
              String(classificationId)) &&
          (!diseaseEntityId ||
            candidate.diseaseEntityId ===
              String(diseaseEntityId)) &&
          (!status ||
            candidate.status ===
              String(status).trim().toUpperCase()),
      ),
    );
  }
}
