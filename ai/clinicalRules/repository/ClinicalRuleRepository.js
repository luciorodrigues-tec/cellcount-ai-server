import {
  assertValidClinicalRule,
} from "../domain/ClinicalRuleValidator.js";

export const CLINICAL_RULE_REPOSITORY_VERSION =
  "CRR-000001-v1.0.0";

function normalize(value) {
  return String(value ?? "").trim().toUpperCase();
}

export class ClinicalRuleRepository {
  constructor({
    version = CLINICAL_RULE_REPOSITORY_VERSION,
  } = {}) {
    this.version = String(version);
    this._rules = new Map();
  }

  register(rule, { replace = false } = {}) {
    assertValidClinicalRule(rule);

    if (this._rules.has(rule.id) && !replace) {
      throw new Error(
        `Clinical rule already registered: ${rule.id}`,
      );
    }

    this._rules.set(rule.id, rule);
    return rule;
  }

  registerMany(rules = [], options = {}) {
    return rules.map((rule) => this.register(rule, options));
  }

  has(id) {
    return this._rules.has(String(id));
  }

  get(id) {
    return this._rules.get(String(id)) || null;
  }

  list({ activeOnly = true } = {}) {
    return Object.freeze(
      [...this._rules.values()].filter(
        (rule) => !activeOnly || rule.active,
      ),
    );
  }

  getByCategory(category, options = {}) {
    const expected = normalize(category);
    return Object.freeze(
      this.list(options).filter(
        (rule) => normalize(rule.category) === expected,
      ),
    );
  }

  getBySeverity(severity, options = {}) {
    const expected = String(severity ?? "")
      .trim()
      .toLowerCase();

    return Object.freeze(
      this.list(options).filter(
        (rule) => rule.severity === expected,
      ),
    );
  }

  getBySpecimenType(specimenType, options = {}) {
    const expected = normalize(specimenType);

    return Object.freeze(
      this.list(options).filter(
        (rule) =>
          rule.specimenTypes.length === 0 ||
          rule.specimenTypes.some(
            (value) => normalize(value) === expected,
          ),
      ),
    );
  }

  query({
    category,
    severity,
    specimenType,
    tags = [],
    activeOnly = true,
  } = {}) {
    const expectedTags = new Set(
      (Array.isArray(tags) ? tags : [])
        .map(normalize)
        .filter(Boolean),
    );

    return Object.freeze(
      this.list({ activeOnly }).filter((rule) => {
        if (
          category &&
          normalize(rule.category) !== normalize(category)
        ) {
          return false;
        }

        if (
          severity &&
          rule.severity !==
            String(severity).trim().toLowerCase()
        ) {
          return false;
        }

        if (
          specimenType &&
          rule.specimenTypes.length > 0 &&
          !rule.specimenTypes.some(
            (value) =>
              normalize(value) === normalize(specimenType),
          )
        ) {
          return false;
        }

        if (
          expectedTags.size > 0 &&
          ![...expectedTags].every((tag) =>
            rule.tags.some(
              (ruleTag) => normalize(ruleTag) === tag,
            ),
          )
        ) {
          return false;
        }

        return true;
      }),
    );
  }

  evaluate(input, query = {}) {
    const evaluations = [];

    for (const rule of this.query(query)) {
      let matched = false;
      let error = null;

      try {
        matched = Boolean(rule.applies(input));
      } catch (cause) {
        error = cause instanceof Error
          ? cause.message
          : String(cause);
      }

      evaluations.push(
        Object.freeze({
          ruleId: rule.id,
          ruleVersion: rule.version,
          category: rule.category,
          severity: rule.severity,
          matched,
          error,
        }),
      );
    }

    return Object.freeze(evaluations);
  }

  applyMatched(input, query = {}) {
    let output = input;
    const applied = [];

    for (const rule of this.query(query)) {
      if (!rule.applies(output)) {
        continue;
      }

      output = rule.apply(output);
      applied.push(
        Object.freeze({
          ruleId: rule.id,
          ruleVersion: rule.version,
          severity: rule.severity,
        }),
      );
    }

    return Object.freeze({
      output,
      applied: Object.freeze(applied),
    });
  }

  summary() {
    const rules = this.list({ activeOnly: false });
    const byCategory = {};
    const bySeverity = {};

    for (const rule of rules) {
      byCategory[rule.category] =
        (byCategory[rule.category] || 0) + 1;
      bySeverity[rule.severity] =
        (bySeverity[rule.severity] || 0) + 1;
    }

    return Object.freeze({
      version: this.version,
      total: rules.length,
      active: rules.filter((rule) => rule.active).length,
      inactive: rules.filter((rule) => !rule.active).length,
      byCategory: Object.freeze(byCategory),
      bySeverity: Object.freeze(bySeverity),
    });
  }
}
