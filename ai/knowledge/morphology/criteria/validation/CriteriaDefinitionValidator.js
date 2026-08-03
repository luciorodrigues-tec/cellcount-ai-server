const SEMVER_PATTERN =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

function allRules(definition) {
  return [
    ...(definition.required || []),
    ...(definition.supportive || []),
    ...(definition.negative || []),
    ...(definition.exclusion || []),
    ...(definition.limitation || []),
  ];
}

export function validateCriteriaDefinition(
  definition,
  {
    cellRegistry,
    featureCatalog,
  } = {},
) {
  const errors = [];
  const warnings = [];

  if (
    !definition ||
    typeof definition !== "object"
  ) {
    return {
      valid: false,
      errors: [
        "Definition must be an object.",
      ],
      warnings,
    };
  }

  if (!definition.id) {
    errors.push("id is required.");
  }

  if (!definition.cellId) {
    errors.push("cellId is required.");
  }

  if (
    !SEMVER_PATTERN.test(
      String(definition.version || ""),
    )
  ) {
    errors.push(
      "version must use semantic versioning.",
    );
  }

  if (
    cellRegistry &&
    !cellRegistry.has(definition.cellId)
  ) {
    errors.push(
      `Unknown cellId: ${definition.cellId}`,
    );
  }

  const rules =
    allRules(definition);

  if (rules.length === 0) {
    errors.push(
      "At least one feature rule is required.",
    );
  }

  const seen =
    new Map();

  for (const rule of rules) {
    if (!rule.featureId) {
      errors.push(
        "Feature rule without featureId.",
      );
      continue;
    }

    const previous =
      seen.get(rule.featureId);

    if (previous) {
      warnings.push(
        `Feature ${rule.featureId} is used in both ${previous} and ${rule.role}.`,
      );
    } else {
      seen.set(
        rule.featureId,
        rule.role,
      );
    }

    if (
      featureCatalog &&
      !featureCatalog.has(
        rule.featureId,
      )
    ) {
      errors.push(
        `Unknown featureId: ${rule.featureId}`,
      );
    }

    if (
      !Number.isFinite(rule.weight) ||
      rule.weight < 0
    ) {
      errors.push(
        `Invalid weight for ${rule.featureId}.`,
      );
    }
  }

  if (
    definition.thresholds
      ?.minimumRequiredMatches >
    (definition.required || []).length
  ) {
    errors.push(
      "minimumRequiredMatches exceeds required rules.",
    );
  }

  const positiveWeight =
    [
      ...(definition.required || []),
      ...(definition.supportive || []),
    ]
      .reduce(
        (sum, rule) =>
          sum + rule.weight,
        0,
      );

  if (
    definition.thresholds
      ?.minimumWeightedScore >
    positiveWeight
  ) {
    errors.push(
      "minimumWeightedScore exceeds available positive weight.",
    );
  }

  if (
    !Array.isArray(
      definition.specimenTypes,
    ) ||
    definition.specimenTypes.length === 0
  ) {
    warnings.push(
      "No specimen types registered.",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function assertValidCriteriaDefinition(
  definition,
  context = {},
) {
  const validation =
    validateCriteriaDefinition(
      definition,
      context,
    );

  if (!validation.valid) {
    throw new Error(
      `Invalid criteria definition ${definition?.id || "<unknown>"}: ` +
      validation.errors.join(" "),
    );
  }

  return definition;
}
