const SEMVER_PATTERN =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

const ALLOWED_SEVERITIES = new Set([
  "info",
  "low",
  "moderate",
  "warning",
  "blocking",
  "high",
  "critical",
]);

export function validateClinicalRule(rule) {
  const errors = [];
  const warnings = [];

  if (!rule || typeof rule !== "object") {
    return {
      valid: false,
      errors: ["Rule must be an object."],
      warnings,
    };
  }

  if (!rule.id) {
    errors.push("Rule id is required.");
  }

  if (!SEMVER_PATTERN.test(String(rule.version || ""))) {
    errors.push("Rule version must use semantic versioning.");
  }

  if (!rule.title) {
    errors.push("Rule title is required.");
  }

  if (!rule.category) {
    errors.push("Rule category is required.");
  }

  if (!ALLOWED_SEVERITIES.has(String(rule.severity || ""))) {
    errors.push(
      `Unsupported rule severity: ${String(rule.severity || "")}`,
    );
  }

  if (typeof rule.applies !== "function") {
    errors.push("Rule applies must be a function.");
  }

  if (typeof rule.apply !== "function") {
    errors.push("Rule apply must be a function.");
  }

  if (!Array.isArray(rule.specimenTypes)) {
    errors.push("Rule specimenTypes must be an array.");
  }

  if (!Array.isArray(rule.references)) {
    errors.push("Rule references must be an array.");
  }

  if (
    rule.references.length === 0 &&
    String(rule.evidenceLevel || "") !== "UNSPECIFIED"
  ) {
    warnings.push(
      "Evidence level is declared but no references are registered.",
    );
  }

  return {
    valid: errors.length === 0,
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
  };
}

export function assertValidClinicalRule(rule) {
  const validation = validateClinicalRule(rule);

  if (!validation.valid) {
    throw new TypeError(
      `Invalid clinical rule: ${validation.errors.join(" | ")}`,
    );
  }

  return validation;
}
