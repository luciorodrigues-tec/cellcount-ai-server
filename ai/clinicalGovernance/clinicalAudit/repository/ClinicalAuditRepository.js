export const CLINICAL_AUDIT_REPOSITORY_VERSION =
  "CGL-000001-S3-v1.0.0";

export class ClinicalAuditRepository {
  constructor({
    version = CLINICAL_AUDIT_REPOSITORY_VERSION,
  } = {}) {
    this.version = String(version);
    this._records = new Map();
  }

  save(record, { replace = false } = {}) {
    const key = record.auditId.toString();

    if (this._records.has(key) && !replace) {
      throw new Error(
        `Clinical audit record already exists: ${key}`,
      );
    }

    this._records.set(key, record);
    return record;
  }

  getByAuditId(auditId) {
    const key =
      typeof auditId === "string"
        ? auditId
        : auditId.toString();

    return this._records.get(key) || null;
  }

  findByCaseId(caseId) {
    const normalized = String(caseId);

    return Object.freeze(
      [...this._records.values()].filter(
        (record) =>
          record.caseReference.caseId === normalized,
      ),
    );
  }

  list({
    status = null,
    limit = null,
    offset = 0,
  } = {}) {
    let records = [...this._records.values()];

    if (status !== null) {
      const normalizedStatus =
        String(status).trim().toUpperCase();

      records = records.filter(
        (record) =>
          record.status === normalizedStatus,
      );
    }

    const normalizedOffset =
      Math.max(0, Number(offset) || 0);

    const normalizedLimit =
      limit === null
        ? null
        : Math.max(0, Number(limit) || 0);

    const sliced =
      normalizedLimit === null
        ? records.slice(normalizedOffset)
        : records.slice(
            normalizedOffset,
            normalizedOffset + normalizedLimit,
          );

    return Object.freeze(sliced);
  }

  exists(auditId) {
    return this.getByAuditId(auditId) !== null;
  }

  delete(auditId) {
    const key =
      typeof auditId === "string"
        ? auditId
        : auditId.toString();

    const record = this._records.get(key) || null;

    if (!record) {
      return false;
    }

    if (record.status === "SEALED") {
      throw new Error(
        "Sealed clinical audit records cannot be deleted.",
      );
    }

    return this._records.delete(key);
  }

  count() {
    return this._records.size;
  }
}
