export function validateKnowledgePopulationBatch(
  batch,
  policy,
) {
  const errors = [];
  const warnings = [];

  const family =
    String(
      batch?.classification?.family || "",
    ).toUpperCase();

  if (!policy.allowedFamilies.includes(family)) {
    errors.push(
      `Unsupported classification family: ${family}`,
    );
  }

  if (!policy.allowedModes.includes(batch?.mode)) {
    errors.push(
      `Unsupported population mode: ${batch?.mode}`,
    );
  }

  if (
    policy.requireOfficialSource &&
    batch?.sourceManifest?.sourceType !==
      "OFFICIAL_CLASSIFICATION"
  ) {
    errors.push(
      "Official classification source is required.",
    );
  }

  if (
    batch?.mode === "COMMIT" &&
    policy.requireChecksumForCommit &&
    !batch?.sourceManifest?.checksum
  ) {
    errors.push(
      "Checksum is required for commit mode.",
    );
  }

  if (
    batch?.mode === "COMMIT" &&
    policy.requireApprovedStatusForCommit &&
    batch?.sourceManifest?.approvalStatus !==
      "APPROVED"
  ) {
    errors.push(
      "Approved source status is required for commit mode.",
    );
  }

  if (
    batch?.mode === "COMMIT" &&
    (
      batch?.sourceManifest?.reviewedBy?.length ||
      0
    ) < policy.requireIndependentReviewers
  ) {
    errors.push(
      `At least ${policy.requireIndependentReviewers} independent reviewers are required for commit mode.`,
    );
  }

  const ids = new Set();

  for (const entity of batch?.entities || []) {
    if (!entity?.id) {
      errors.push(
        "Every diagnostic knowledge entity requires an id.",
      );
      continue;
    }

    if (
      policy.rejectDuplicateEntityIds &&
      ids.has(entity.id)
    ) {
      errors.push(
        `Duplicated diagnostic knowledge entity id: ${entity.id}`,
      );
    }

    ids.add(entity.id);
  }

  if (policy.rejectUnknownParentReferences) {
    for (const entity of batch?.entities || []) {
      if (
        entity.parentEntityId &&
        !ids.has(entity.parentEntityId)
      ) {
        errors.push(
          `Unknown parent entity reference: ${entity.parentEntityId}`,
        );
      }
    }
  }

  if ((batch?.entities || []).length === 0) {
    warnings.push(
      "Population batch contains no entities.",
    );
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
  });
}
