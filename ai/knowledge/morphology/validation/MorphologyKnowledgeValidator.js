const SEMVER_PATTERN =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

function duplicateIds(items = []) {
  const seen = new Set();
  const duplicates = new Set();

  for (const item of items) {
    const id = item?.id;
    if (!id) continue;

    if (seen.has(id)) {
      duplicates.add(id);
    }

    seen.add(id);
  }

  return [...duplicates];
}

export function validateMorphologyKnowledgeEntity(
  entity,
) {
  const errors = [];
  const warnings = [];

  if (!entity || typeof entity !== "object") {
    return {
      valid: false,
      errors: ["Entity must be an object."],
      warnings,
    };
  }

  if (!entity.id) {
    errors.push("id is required.");
  }

  if (!entity.displayName) {
    errors.push("displayName is required.");
  }

  if (!SEMVER_PATTERN.test(String(entity.version || ""))) {
    errors.push("version must use semantic versioning.");
  }

  if (
    !Array.isArray(entity.specimenTypes) ||
    entity.specimenTypes.length === 0
  ) {
    warnings.push(
      "specimenTypes is empty; entity will not be specimen-aware.",
    );
  }

  const allCriteria = [
    ...(entity.positiveCriteria || []),
    ...(entity.negativeCriteria || []),
    ...(entity.exclusionCriteria || []),
    ...(entity.limitationCriteria || []),
  ];

  const duplicates = duplicateIds(allCriteria);

  if (duplicates.length > 0) {
    errors.push(
      `Duplicate criterion ids: ${duplicates.join(", ")}`,
    );
  }

  if (
    Number(entity.minimumEvidence?.minimumPositiveCriteria || 0) >
    (entity.positiveCriteria || []).length
  ) {
    errors.push(
      "minimumPositiveCriteria exceeds available positive criteria.",
    );
  }

  if (
    !Array.isArray(entity.references) ||
    entity.references.length === 0
  ) {
    warnings.push(
      "No references registered for this entity.",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function assertValidMorphologyKnowledgeEntity(
  entity,
) {
  const validation =
    validateMorphologyKnowledgeEntity(entity);

  if (!validation.valid) {
    throw new Error(
      `Invalid morphology knowledge entity ${entity?.id || "<unknown>"}: ` +
      validation.errors.join(" "),
    );
  }

  return entity;
}
