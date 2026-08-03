export const CLINICAL_GUIDELINE_REPOSITORY_VERSION =
  "CGL-000004-S3-v1.0.0";

export class ClinicalGuidelineRepository {
  constructor({
    version = CLINICAL_GUIDELINE_REPOSITORY_VERSION,
  } = {}) {
    this.version = String(version);
    this._guidelines = new Map();
  }

  #key(guidelineId, version) {
    const id =
      typeof guidelineId === "string"
        ? guidelineId
        : guidelineId.toString();

    return `${id}::${String(version)}`;
  }

  save(guideline, { replace = false } = {}) {
    const key = this.#key(
      guideline.guidelineId,
      guideline.version.version,
    );

    if (this._guidelines.has(key) && !replace) {
      throw new Error(
        `Clinical guideline already exists: ${key}`,
      );
    }

    this._guidelines.set(key, guideline);
    return guideline;
  }

  update(guideline) {
    const key = this.#key(
      guideline.guidelineId,
      guideline.version.version,
    );

    if (!this._guidelines.has(key)) {
      throw new Error(
        `Clinical guideline not found: ${key}`,
      );
    }

    this._guidelines.set(key, guideline);
    return guideline;
  }

  getByVersion(guidelineId, version) {
    return (
      this._guidelines.get(
        this.#key(guidelineId, version),
      ) || null
    );
  }

  getByGuidelineId(guidelineId) {
    const id =
      typeof guidelineId === "string"
        ? guidelineId
        : guidelineId.toString();

    return Object.freeze(
      [...this._guidelines.values()]
        .filter(
          (guideline) =>
            guideline.guidelineId.toString() === id,
        )
        .sort((a, b) =>
          String(b.version.version).localeCompare(
            String(a.version.version),
          ),
        ),
    );
  }

  findActive({
    at = new Date(),
    scopeType = null,
    targetId = null,
  } = {}) {
    const instant =
      at instanceof Date
        ? at
        : new Date(at);

    return Object.freeze(
      [...this._guidelines.values()].filter(
        (guideline) => {
          if (guideline.status !== "ACTIVE") {
            return false;
          }

          const from =
            new Date(
              guideline.version.effectiveFrom,
            );

          const until =
            guideline.version.effectiveUntil
              ? new Date(
                  guideline.version.effectiveUntil,
                )
              : null;

          if (from > instant) {
            return false;
          }

          if (until && until < instant) {
            return false;
          }

          if (
            scopeType &&
            guideline.scope.type !==
              String(scopeType).toUpperCase()
          ) {
            return false;
          }

          if (
            targetId !== null &&
            String(guideline.scope.targetId || "") !==
              String(targetId)
          ) {
            return false;
          }

          return true;
        },
      ),
    );
  }

  findByScope(type, targetId = null) {
    const normalized =
      String(type).trim().toUpperCase();

    return Object.freeze(
      [...this._guidelines.values()].filter(
        (guideline) =>
          guideline.scope.type === normalized &&
          (
            normalized === "GLOBAL" ||
            String(guideline.scope.targetId) ===
              String(targetId)
          ),
      ),
    );
  }

  findByOutcomeType(type) {
    const normalized =
      String(type).trim().toUpperCase();

    return Object.freeze(
      [...this._guidelines.values()].filter(
        (guideline) =>
          guideline.outcomes.some(
            (outcome) =>
              outcome.type === normalized,
          ),
      ),
    );
  }

  exists(guidelineId, version) {
    return (
      this.getByVersion(
        guidelineId,
        version,
      ) !== null
    );
  }

  delete(guidelineId, version) {
    const guideline =
      this.getByVersion(
        guidelineId,
        version,
      );

    if (!guideline) {
      return false;
    }

    if (guideline.status === "ACTIVE") {
      throw new Error(
        "Active clinical guidelines cannot be deleted.",
      );
    }

    return this._guidelines.delete(
      this.#key(
        guidelineId,
        version,
      ),
    );
  }

  list({
    status = null,
    limit = null,
    offset = 0,
  } = {}) {
    let values =
      [...this._guidelines.values()];

    if (status !== null) {
      const normalized =
        String(status).trim().toUpperCase();

      values = values.filter(
        (guideline) =>
          guideline.status === normalized,
      );
    }

    const start =
      Math.max(0, Number(offset) || 0);

    const end =
      limit === null
        ? undefined
        : start +
          Math.max(0, Number(limit) || 0);

    return Object.freeze(
      values.slice(start, end),
    );
  }

  count() {
    return this._guidelines.size;
  }
}
