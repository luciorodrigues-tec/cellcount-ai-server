export const QUALITY_ASSURANCE_REPOSITORY_VERSION =
  "CGL-000005-S3-v1.0.0";

export class QualityAssuranceRepository {
  constructor({
    version = QUALITY_ASSURANCE_REPOSITORY_VERSION,
  } = {}) {
    this.version = String(version);
    this._records = new Map();
  }

  save(record, { replace = false } = {}) {
    const key =
      record.qualityAssuranceId.toString();

    if (this._records.has(key) && !replace) {
      throw new Error(
        `Quality assurance record already exists: ${key}`,
      );
    }

    this._records.set(key, record);
    return record;
  }

  getByQualityAssuranceId(id) {
    const key =
      typeof id === "string"
        ? id
        : id.toString();

    return this._records.get(key) || null;
  }

  findByCaseId(caseId) {
    const normalized = String(caseId);

    return Object.freeze(
      [...this._records.values()].filter(
        (record) =>
          record.caseId === normalized,
      ),
    );
  }

  findByStatus(status) {
    const normalized =
      String(status).trim().toUpperCase();

    return Object.freeze(
      [...this._records.values()].filter(
        (record) =>
          record.evaluations.some(
            (evaluation) =>
              evaluation.status === normalized,
          ),
      ),
    );
  }

  findWithCriticalAlerts() {
    return Object.freeze(
      [...this._records.values()].filter(
        (record) =>
          record.hasCriticalAlert(),
      ),
    );
  }

  findByPeriod({
    startedAt,
    endedAt,
  } = {}) {
    if (!startedAt || !endedAt) {
      throw new TypeError(
        "QualityAssuranceRepository.findByPeriod requires startedAt and endedAt.",
      );
    }

    const start =
      new Date(startedAt);
    const end =
      new Date(endedAt);

    return Object.freeze(
      [...this._records.values()].filter(
        (record) => {
          const recordStart =
            new Date(record.period.startedAt);
          const recordEnd =
            new Date(record.period.endedAt);

          return (
            recordStart <= end &&
            recordEnd >= start
          );
        },
      ),
    );
  }

  list({
    limit = null,
    offset = 0,
  } = {}) {
    const values =
      [...this._records.values()];

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

  exists(id) {
    return (
      this.getByQualityAssuranceId(id) !== null
    );
  }

  delete(id) {
    const key =
      typeof id === "string"
        ? id
        : id.toString();

    const record =
      this._records.get(key);

    if (!record) {
      return false;
    }

    if (record.hasCriticalAlert()) {
      throw new Error(
        "Quality assurance records with active critical alerts cannot be deleted.",
      );
    }

    return this._records.delete(key);
  }

  count() {
    return this._records.size;
  }
}
