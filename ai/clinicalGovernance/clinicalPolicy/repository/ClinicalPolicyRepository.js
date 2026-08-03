export const CLINICAL_POLICY_REPOSITORY_VERSION =
  "CGL-000003-S3-v1.0.0";

export class ClinicalPolicyRepository {
  constructor({
    version = CLINICAL_POLICY_REPOSITORY_VERSION,
  } = {}) {
    this.version = String(version);
    this._policies = new Map();
  }

  #key(policyId, version) {
    const id =
      typeof policyId === "string"
        ? policyId
        : policyId.toString();

    return `${id}::${String(version)}`;
  }

  save(policy, { replace = false } = {}) {
    const key = this.#key(
      policy.policyId,
      policy.version.version,
    );

    if (this._policies.has(key) && !replace) {
      throw new Error(
        `Clinical policy already exists: ${key}`,
      );
    }

    this._policies.set(key, policy);
    return policy;
  }

  update(policy) {
    const key = this.#key(
      policy.policyId,
      policy.version.version,
    );

    if (!this._policies.has(key)) {
      throw new Error(
        `Clinical policy not found: ${key}`,
      );
    }

    this._policies.set(key, policy);
    return policy;
  }

  getByPolicyId(policyId) {
    const id =
      typeof policyId === "string"
        ? policyId
        : policyId.toString();

    const matches =
      [...this._policies.values()].filter(
        (policy) =>
          policy.policyId.toString() === id,
      );

    return Object.freeze(
      matches.sort((a, b) =>
        String(b.version.version).localeCompare(
          String(a.version.version),
        ),
      ),
    );
  }

  getByVersion(policyId, version) {
    return (
      this._policies.get(
        this.#key(policyId, version),
      ) || null
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
      [...this._policies.values()].filter(
        (policy) => {
          if (policy.status !== "ACTIVE") {
            return false;
          }

          const from =
            new Date(
              policy.version.effectiveFrom,
            );

          const until =
            policy.version.effectiveUntil
              ? new Date(
                  policy.version.effectiveUntil,
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
            policy.scope.type !==
              String(scopeType).toUpperCase()
          ) {
            return false;
          }

          if (
            targetId !== null &&
            String(policy.scope.targetId || "") !==
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
      [...this._policies.values()].filter(
        (policy) =>
          policy.scope.type === normalized &&
          (
            normalized === "GLOBAL" ||
            String(policy.scope.targetId) ===
              String(targetId)
          ),
      ),
    );
  }

  findByOrganization(id) {
    return this.findByScope(
      "ORGANIZATION",
      id,
    );
  }

  findByLaboratory(id) {
    return this.findByScope(
      "LABORATORY",
      id,
    );
  }

  findByDepartment(id) {
    return this.findByScope(
      "DEPARTMENT",
      id,
    );
  }

  findByWorkflow(id) {
    return this.findByScope(
      "WORKFLOW",
      id,
    );
  }

  findByEngine(id) {
    return this.findByScope(
      "ENGINE",
      id,
    );
  }

  exists(policyId, version) {
    return (
      this.getByVersion(
        policyId,
        version,
      ) !== null
    );
  }

  delete(policyId, version) {
    const policy =
      this.getByVersion(
        policyId,
        version,
      );

    if (!policy) {
      return false;
    }

    if (policy.status === "ACTIVE") {
      throw new Error(
        "Active clinical policies cannot be deleted.",
      );
    }

    return this._policies.delete(
      this.#key(
        policyId,
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
      [...this._policies.values()];

    if (status !== null) {
      const normalized =
        String(status).trim().toUpperCase();

      values = values.filter(
        (policy) =>
          policy.status === normalized,
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
    return this._policies.size;
  }
}
