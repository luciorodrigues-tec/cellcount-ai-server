import {
  assertPolicyStatus,
} from "./PolicyStatus.js";

export const CLINICAL_POLICY_SCHEMA_VERSION =
  "CGL-000003-S1-v1";

export class ClinicalPolicy {
  constructor({
    policyId,
    name,
    description = null,
    status = "DRAFT",
    scope,
    version,
    thresholds = [],
    rules = [],
    constraints = [],
    overrides = [],
    createdAt,
    updatedAt = null,
    metadata = {},
  } = {}) {
    if (!policyId) {
      throw new TypeError(
        "ClinicalPolicy.policyId is required.",
      );
    }

    if (!name || !String(name).trim()) {
      throw new TypeError(
        "ClinicalPolicy.name is required.",
      );
    }

    if (!scope) {
      throw new TypeError(
        "ClinicalPolicy.scope is required.",
      );
    }

    if (!version) {
      throw new TypeError(
        "ClinicalPolicy.version is required.",
      );
    }

    if (!createdAt) {
      throw new TypeError(
        "ClinicalPolicy.createdAt is required.",
      );
    }

    const ruleIds =
      rules.map((rule) => rule.ruleId);

    if (new Set(ruleIds).size !== ruleIds.length) {
      throw new Error(
        "ClinicalPolicy contains duplicate rule ids.",
      );
    }

    const thresholdKeys =
      thresholds.map(
        (threshold) => threshold.key,
      );

    if (
      new Set(thresholdKeys).size !==
      thresholdKeys.length
    ) {
      throw new Error(
        "ClinicalPolicy contains duplicate threshold keys.",
      );
    }

    this.schemaVersion =
      CLINICAL_POLICY_SCHEMA_VERSION;
    this.policyId = policyId;
    this.name = String(name).trim();
    this.description =
      description === null
        ? null
        : String(description).trim();
    this.status = assertPolicyStatus(status);
    this.scope = scope;
    this.version = version;
    this.thresholds =
      Object.freeze([...thresholds]);
    this.rules = Object.freeze(
      [...rules].sort(
        (a, b) => a.priority - b.priority,
      ),
    );
    this.constraints =
      Object.freeze([...constraints]);
    this.overrides =
      Object.freeze([...overrides]);
    this.createdAt = String(createdAt);
    this.updatedAt =
      updatedAt === null ? null : String(updatedAt);
    this.metadata = Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    });

    Object.freeze(this);
  }

  isActive() {
    return this.status === "ACTIVE";
  }
}
