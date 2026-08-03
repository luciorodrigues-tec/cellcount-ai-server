const SEMVER_PATTERN =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

function featureGroups(rule) {
  return {
    shared:
      rule.sharedFeatures || [],
    primaryExclusive:
      rule.primaryExclusiveFeatures || [],
    differentialExclusive:
      rule.differentialExclusiveFeatures || [],
    primaryExclusion:
      rule.primaryExclusionFeatures || [],
    differentialExclusion:
      rule.differentialExclusionFeatures || [],
  };
}

export function canonicalPairKey(
  first,
  second,
) {
  return [
    String(first),
    String(second),
  ].sort().join("::");
}

export function validateDifferentialRule(
  rule,
  {
    cellRegistry,
    featureCatalog,
  } = {},
) {
  const errors = [];
  const warnings = [];

  if (
    !rule ||
    typeof rule !== "object"
  ) {
    return {
      valid: false,
      errors: [
        "Rule must be an object.",
      ],
      warnings,
    };
  }

  if (!rule.id) {
    errors.push(
      "Rule id is required.",
    );
  }

  if (
    !SEMVER_PATTERN.test(
      String(rule.version || ""),
    )
  ) {
    errors.push(
      "Rule version must use semantic versioning.",
    );
  }

  if (
    !rule.primaryCell ||
    !rule.differentialCell
  ) {
    errors.push(
      "Both cells are required.",
    );
  }

  if (
    rule.primaryCell ===
    rule.differentialCell
  ) {
    errors.push(
      "Cells must be different.",
    );
  }

  if (
    cellRegistry &&
    !cellRegistry.has(
      rule.primaryCell,
    )
  ) {
    errors.push(
      `Unknown primaryCell: ${rule.primaryCell}`,
    );
  }

  if (
    cellRegistry &&
    !cellRegistry.has(
      rule.differentialCell,
    )
  ) {
    errors.push(
      `Unknown differentialCell: ${rule.differentialCell}`,
    );
  }

  if (
    !Number.isFinite(
      Number(rule.similarity),
    ) ||
    Number(rule.similarity) < 0 ||
    Number(rule.similarity) > 1
  ) {
    errors.push(
      "Similarity must be between 0 and 1.",
    );
  }

  const groups =
    featureGroups(rule);

  const shared =
    new Set(groups.shared);

  const primarySide =
    new Set([
      ...groups.primaryExclusive,
      ...groups.differentialExclusion,
    ]);

  const differentialSide =
    new Set([
      ...groups.differentialExclusive,
      ...groups.primaryExclusion,
    ]);

  for (
    const [groupName, features]
    of Object.entries(groups)
  ) {
    if (
      new Set(features).size !==
      features.length
    ) {
      errors.push(
        `Duplicate feature inside ${groupName}.`,
      );
    }

    for (const featureId of features) {
      if (
        featureCatalog &&
        !featureCatalog.has(featureId)
      ) {
        errors.push(
          `Unknown featureId: ${featureId}`,
        );
      }
    }
  }

  for (const featureId of shared) {
    if (
      primarySide.has(featureId) ||
      differentialSide.has(featureId)
    ) {
      errors.push(
        `Shared feature ${featureId} cannot also be distinguishing or exclusion evidence.`,
      );
    }
  }

  for (const featureId of primarySide) {
    if (
      differentialSide.has(featureId)
    ) {
      errors.push(
        `Feature ${featureId} supports both sides of the same differential pair.`,
      );
    }
  }

  if (
    (
      rule.sharedFeatures || []
    ).length === 0
  ) {
    warnings.push(
      "Rule has no shared features.",
    );
  }

  if (
    (
      rule.primaryExclusiveFeatures || []
    ).length === 0 &&
    (
      rule.differentialExclusiveFeatures || []
    ).length === 0
  ) {
    warnings.push(
      "Rule has no distinguishing features.",
    );
  }

  if (
    !Array.isArray(
      rule.recommendedTests,
    )
  ) {
    errors.push(
      "recommendedTests must be an array.",
    );
  }

  return {
    valid:
      errors.length === 0,
    errors,
    warnings,
  };
}

export function assertValidDifferentialRule(
  rule,
  context = {},
) {
  const validation =
    validateDifferentialRule(
      rule,
      context,
    );

  if (!validation.valid) {
    throw new Error(
      `Invalid differential rule ${rule?.id || "<unknown>"}: ${validation.errors.join(" ")}`,
    );
  }

  return rule;
}
