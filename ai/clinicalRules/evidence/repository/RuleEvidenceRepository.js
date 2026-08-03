import {
  validateEvidenceSource,
  validateRuleEvidenceBinding,
} from "../domain/ClinicalEvidenceValidator.js";

function bindingKey(ruleId, ruleVersion) {
  return `${String(ruleId)}@${String(ruleVersion)}`;
}

export const RULE_EVIDENCE_REPOSITORY_VERSION =
  "CRR-000003-v1.0.0";

export class RuleEvidenceRepository {
  constructor({
    version = RULE_EVIDENCE_REPOSITORY_VERSION,
  } = {}) {
    this.version = String(version);
    this._sources = new Map();
    this._bindings = new Map();
  }

  registerSource(source, { replace = false } = {}) {
    const validation = validateEvidenceSource(source);

    if (!validation.valid) {
      throw new TypeError(
        `Invalid evidence source: ${validation.errors.join(" | ")}`,
      );
    }

    if (this._sources.has(source.id) && !replace) {
      throw new Error(
        `Evidence source already registered: ${source.id}`,
      );
    }

    this._sources.set(source.id, source);
    return source;
  }

  registerBinding(binding, { replace = false } = {}) {
    const validation =
      validateRuleEvidenceBinding(binding);

    if (!validation.valid) {
      throw new TypeError(
        `Invalid rule evidence binding: ${validation.errors.join(" | ")}`,
      );
    }

    const key = bindingKey(
      binding.ruleId,
      binding.ruleVersion,
    );

    if (this._bindings.has(key) && !replace) {
      throw new Error(
        `Rule evidence binding already registered: ${key}`,
      );
    }

    for (const sourceId of binding.sourceIds) {
      if (!this._sources.has(sourceId)) {
        throw new Error(
          `Unknown evidence source: ${sourceId}`,
        );
      }
    }

    this._bindings.set(key, binding);
    return binding;
  }

  getSource(id) {
    return this._sources.get(String(id)) || null;
  }

  getBinding(ruleId, ruleVersion) {
    return (
      this._bindings.get(
        bindingKey(ruleId, ruleVersion),
      ) || null
    );
  }

  listSources({ activeOnly = true } = {}) {
    return Object.freeze(
      [...this._sources.values()].filter(
        (source) =>
          !activeOnly || source.status === "ACTIVE",
      ),
    );
  }

  listBindings({ activeOnly = true } = {}) {
    return Object.freeze(
      [...this._bindings.values()].filter(
        (binding) =>
          !activeOnly || binding.status === "ACTIVE",
      ),
    );
  }

  resolve(ruleId, ruleVersion) {
    const binding = this.getBinding(
      ruleId,
      ruleVersion,
    );

    if (!binding) {
      return Object.freeze({
        repositoryVersion: this.version,
        ruleId: String(ruleId),
        ruleVersion: String(ruleVersion),
        evidenceLevel: "UNSPECIFIED",
        status: "UNSPECIFIED",
        rationale: "",
        limitations: Object.freeze([]),
        sources: Object.freeze([]),
        completeness: "MISSING",
      });
    }

    const sources = binding.sourceIds
      .map((sourceId) => this.getSource(sourceId))
      .filter(Boolean);

    const completeness =
      binding.evidenceLevel === "UNSPECIFIED"
        ? "UNSPECIFIED"
        : sources.length > 0
          ? "COMPLETE"
          : "INCOMPLETE";

    return Object.freeze({
      repositoryVersion: this.version,
      ruleId: binding.ruleId,
      ruleVersion: binding.ruleVersion,
      evidenceLevel: binding.evidenceLevel,
      status: binding.status,
      rationale: binding.rationale,
      limitations: binding.limitations,
      validFrom: binding.validFrom,
      validUntil: binding.validUntil,
      reviewedBy: binding.reviewedBy,
      reviewedAt: binding.reviewedAt,
      sources: Object.freeze(sources),
      completeness,
    });
  }

  coverageForRules(rules = []) {
    const items = rules.map((rule) => {
      const resolved = this.resolve(
        rule.id,
        rule.version,
      );

      return Object.freeze({
        ruleId: rule.id,
        ruleVersion: rule.version,
        evidenceLevel: resolved.evidenceLevel,
        completeness: resolved.completeness,
        sourceCount: resolved.sources.length,
      });
    });

    const complete = items.filter(
      (item) => item.completeness === "COMPLETE",
    ).length;
    const unspecified = items.filter(
      (item) =>
        item.completeness === "UNSPECIFIED" ||
        item.completeness === "MISSING",
    ).length;
    const incomplete = items.filter(
      (item) => item.completeness === "INCOMPLETE",
    ).length;

    return Object.freeze({
      repositoryVersion: this.version,
      totalRules: items.length,
      complete,
      incomplete,
      unspecified,
      coveragePercent:
        items.length === 0
          ? 100
          : Number(
              ((complete / items.length) * 100).toFixed(2),
            ),
      items: Object.freeze(items),
    });
  }
}
