export const CLINICAL_PROVENANCE_REPOSITORY_VERSION =
  "CGL-000002-S3-v1.0.0";

export class ClinicalProvenanceRepository {
  constructor({
    version = CLINICAL_PROVENANCE_REPOSITORY_VERSION,
  } = {}) {
    this.version = String(version);
    this._records = new Map();
  }

  save(record, { replace = false } = {}) {
    const key = record.provenanceId.toString();

    if (this._records.has(key) && !replace) {
      throw new Error(
        `Clinical provenance record already exists: ${key}`,
      );
    }

    this._records.set(key, record);
    return record;
  }

  getByProvenanceId(provenanceId) {
    const key =
      typeof provenanceId === "string"
        ? provenanceId
        : provenanceId.toString();

    return this._records.get(key) || null;
  }

  findByCaseId(caseId) {
    const normalized = String(caseId);

    return Object.freeze(
      [...this._records.values()].filter(
        (record) => record.caseId === normalized,
      ),
    );
  }

  findByNodeId(nodeId) {
    const normalized = String(nodeId);

    return Object.freeze(
      [...this._records.values()].filter(
        (record) =>
          record.graph.nodes.some(
            (node) => node.nodeId === normalized,
          ),
      ),
    );
  }

  findByOriginId(originId) {
    const normalized = String(originId);

    return Object.freeze(
      [...this._records.values()].filter(
        (record) =>
          record.graph.nodes.some(
            (node) =>
              node.origin?.originId === normalized,
          ),
      ),
    );
  }

  findByHypothesisId(hypothesisId) {
    const normalized = String(hypothesisId);

    return Object.freeze(
      [...this._records.values()].filter(
        (record) =>
          record.graph.nodes.some(
            (node) =>
              node.type === "HYPOTHESIS" &&
              (
                node.nodeId === normalized ||
                node.metadata?.hypothesisId === normalized
              ),
          ),
      ),
    );
  }

  list({ limit = null, offset = 0 } = {}) {
    const records = [...this._records.values()];
    const normalizedOffset = Math.max(0, Number(offset) || 0);
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

  exists(provenanceId) {
    return this.getByProvenanceId(provenanceId) !== null;
  }

  delete(provenanceId) {
    const key =
      typeof provenanceId === "string"
        ? provenanceId
        : provenanceId.toString();

    return this._records.delete(key);
  }

  count() {
    return this._records.size;
  }
}
