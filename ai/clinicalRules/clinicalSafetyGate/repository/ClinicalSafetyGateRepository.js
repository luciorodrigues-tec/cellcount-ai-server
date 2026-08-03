export const CLINICAL_SAFETY_GATE_REPOSITORY_VERSION =
  "CRR-000034-v1.0.0";

export class ClinicalSafetyGateRepository {
  constructor({
    version =
      CLINICAL_SAFETY_GATE_REPOSITORY_VERSION,
  } = {}) {
    this.version = String(version);
    this._decisions = new Map();
  }

  save(
    decision,
    { replace = false } = {},
  ) {
    if (
      this._decisions.has(decision.caseId) &&
      !replace
    ) {
      throw new Error(
        `Clinical safety gate decision already exists for case: ${decision.caseId}`,
      );
    }

    this._decisions.set(
      decision.caseId,
      decision,
    );

    return decision;
  }

  get(caseId) {
    return (
      this._decisions.get(
        String(caseId),
      ) ||
      null
    );
  }

  list() {
    return Object.freeze([
      ...this._decisions.values(),
    ]);
  }
}
