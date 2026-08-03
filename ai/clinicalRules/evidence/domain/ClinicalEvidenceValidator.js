import {
  EVIDENCE_LEVELS,
  EVIDENCE_STATUSES,
} from "./ClinicalEvidence.js";

export function validateEvidenceSource(source) {
  const errors = [];

  if (!source || typeof source !== "object") {
    return {
      valid: false,
      errors: Object.freeze([
        "Evidence source must be an object.",
      ]),
    };
  }

  for (const field of [
    "id",
    "title",
    "sourceType",
    "citation",
  ]) {
    if (!source[field]) {
      errors.push(`Evidence source ${field} is required.`);
    }
  }

  if (!EVIDENCE_STATUSES.includes(source.status)) {
    errors.push(
      `Unsupported evidence status: ${source.status}`,
    );
  }

  return {
    valid: errors.length === 0,
    errors: Object.freeze(errors),
  };
}

export function validateRuleEvidenceBinding(binding) {
  const errors = [];
  const warnings = [];

  if (!binding || typeof binding !== "object") {
    return {
      valid: false,
      errors: Object.freeze([
        "Rule evidence binding must be an object.",
      ]),
      warnings: Object.freeze(warnings),
    };
  }

  if (!binding.ruleId) {
    errors.push("Binding ruleId is required.");
  }

  if (!binding.ruleVersion) {
    errors.push("Binding ruleVersion is required.");
  }

  if (!EVIDENCE_LEVELS.includes(binding.evidenceLevel)) {
    errors.push(
      `Unsupported evidence level: ${binding.evidenceLevel}`,
    );
  }

  if (!EVIDENCE_STATUSES.includes(binding.status)) {
    errors.push(
      `Unsupported evidence status: ${binding.status}`,
    );
  }

  if (
    binding.evidenceLevel !== "UNSPECIFIED" &&
    binding.sourceIds.length === 0
  ) {
    warnings.push(
      "Evidence level is specified without registered sources.",
    );
  }

  if (
    binding.sourceIds.length > 0 &&
    !binding.rationale
  ) {
    warnings.push(
      "Evidence sources are linked without a rationale.",
    );
  }

  return {
    valid: errors.length === 0,
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
  };
}
