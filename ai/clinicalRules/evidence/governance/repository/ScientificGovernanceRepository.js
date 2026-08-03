function governanceKey(ruleId, ruleVersion) {
  return `${String(ruleId)}@${String(ruleVersion)}`;
}

export const SCIENTIFIC_GOVERNANCE_REPOSITORY_VERSION =
  "CRR-000004-v1.0.0";

export class ScientificGovernanceRepository {
  constructor({
    version =
      SCIENTIFIC_GOVERNANCE_REPOSITORY_VERSION,
  } = {}) {
    this.version = String(version);
    this._reviewers = new Map();
    this._records = new Map();
    this._recordsByRule = new Map();
  }

  registerReviewer(reviewer, { replace = false } = {}) {
    if (!reviewer?.id) {
      throw new TypeError(
        "Scientific reviewer with id is required.",
      );
    }

    if (this._reviewers.has(reviewer.id) && !replace) {
      throw new Error(
        `Scientific reviewer already registered: ${reviewer.id}`,
      );
    }

    this._reviewers.set(reviewer.id, reviewer);
    return reviewer;
  }

  registerRecord(record, { replace = false } = {}) {
    if (!record?.id) {
      throw new TypeError(
        "Governance record with id is required.",
      );
    }

    if (this._records.has(record.id) && !replace) {
      throw new Error(
        `Governance record already registered: ${record.id}`,
      );
    }

    this._records.set(record.id, record);

    const key = governanceKey(
      record.ruleId,
      record.ruleVersion,
    );

    const ids = this._recordsByRule.get(key) || [];
    if (!ids.includes(record.id)) {
      ids.push(record.id);
    }
    this._recordsByRule.set(key, ids);

    return record;
  }

  getReviewer(id) {
    return this._reviewers.get(String(id)) || null;
  }

  getRecord(id) {
    return this._records.get(String(id)) || null;
  }

  listReviewers({ activeOnly = true } = {}) {
    return Object.freeze(
      [...this._reviewers.values()].filter(
        (reviewer) =>
          !activeOnly || reviewer.active,
      ),
    );
  }

  listRecords({ status = null } = {}) {
    return Object.freeze(
      [...this._records.values()].filter(
        (record) =>
          !status ||
          record.status ===
            String(status).trim().toUpperCase(),
      ),
    );
  }

  historyForRule(ruleId, ruleVersion) {
    const key = governanceKey(ruleId, ruleVersion);
    const ids = this._recordsByRule.get(key) || [];

    return Object.freeze(
      ids
        .map((id) => this.getRecord(id))
        .filter(Boolean),
    );
  }

  latestForRule(ruleId, ruleVersion) {
    const history = this.historyForRule(
      ruleId,
      ruleVersion,
    );

    return history.at(-1) || null;
  }
}
