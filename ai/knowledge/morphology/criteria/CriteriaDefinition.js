export const CRITERIA_DEFINITION_VERSION =
  "CI-002C.1-v1";

export const CriteriaRole = Object.freeze({
  required: "required",
  supportive: "supportive",
  negative: "negative",
  exclusion: "exclusion",
  limitation: "limitation",
});

const ROLES =
  new Set(Object.values(CriteriaRole));

function freezeArray(value = []) {
  return Object.freeze([
    ...(Array.isArray(value) ? value : []),
  ]);
}

function normalizeFeatureRule(
  rule,
  defaultRole,
) {
  if (
    !rule ||
    typeof rule !== "object"
  ) {
    throw new TypeError(
      "Feature rule must be an object.",
    );
  }

  const featureId =
    String(
      rule.featureId ||
      rule.id ||
      "",
    ).trim();

  if (!featureId) {
    throw new TypeError(
      "Feature rule requires featureId.",
    );
  }

  const role =
    rule.role || defaultRole;

  if (!ROLES.has(role)) {
    throw new TypeError(
      `Invalid criteria role: ${role}`,
    );
  }

  const weight =
    Number(rule.weight ?? 1);

  if (
    !Number.isFinite(weight) ||
    weight < 0
  ) {
    throw new TypeError(
      "Criteria weight must be a non-negative number.",
    );
  }

  return Object.freeze({
    featureId,
    role,
    weight,
    required:
      rule.required === true ||
      role === CriteriaRole.required,
    label:
      String(rule.label || "").trim(),
    sourceCriterionId:
      String(
        rule.sourceCriterionId || "",
      ).trim(),
    evidenceStrength:
      String(
        rule.evidenceStrength || "",
      ).trim(),
    notes:
      String(rule.notes || "").trim(),
  });
}

export function createCriteriaDefinition({
  id,
  version = "1.0.0",
  cellId,
  specimenTypes = [],
  required = [],
  supportive = [],
  negative = [],
  exclusion = [],
  limitation = [],
  thresholds = {
    minimumRequiredMatches: 0,
    minimumPositiveMatches: 1,
    minimumWeightedScore: 1,
    exclusionBlockScore: 1,
    confidenceFloor: 0.15,
  },
  metadata = {},
} = {}) {
  if (!id || !String(id).trim()) {
    throw new TypeError(
      "CriteriaDefinition.id is required.",
    );
  }

  if (!cellId || !String(cellId).trim()) {
    throw new TypeError(
      "CriteriaDefinition.cellId is required.",
    );
  }

  const normalized = {
    required: required.map(
      (rule) =>
        normalizeFeatureRule(
          rule,
          CriteriaRole.required,
        ),
    ),
    supportive: supportive.map(
      (rule) =>
        normalizeFeatureRule(
          rule,
          CriteriaRole.supportive,
        ),
    ),
    negative: negative.map(
      (rule) =>
        normalizeFeatureRule(
          rule,
          CriteriaRole.negative,
        ),
    ),
    exclusion: exclusion.map(
      (rule) =>
        normalizeFeatureRule(
          rule,
          CriteriaRole.exclusion,
        ),
    ),
    limitation: limitation.map(
      (rule) =>
        normalizeFeatureRule(
          rule,
          CriteriaRole.limitation,
        ),
    ),
  };

  const safeThresholds = {
    minimumRequiredMatches:
      Number(
        thresholds.minimumRequiredMatches ?? 0,
      ),
    minimumPositiveMatches:
      Number(
        thresholds.minimumPositiveMatches ?? 1,
      ),
    minimumWeightedScore:
      Number(
        thresholds.minimumWeightedScore ?? 1,
      ),
    exclusionBlockScore:
      Number(
        thresholds.exclusionBlockScore ?? 1,
      ),
    confidenceFloor:
      Number(
        thresholds.confidenceFloor ?? 0.15,
      ),
  };

  for (
    const [key, value]
    of Object.entries(safeThresholds)
  ) {
    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      throw new TypeError(
        `Invalid threshold ${key}: ${value}`,
      );
    }
  }

  return Object.freeze({
    id: String(id).trim(),
    version: String(version).trim(),
    engineVersion:
      CRITERIA_DEFINITION_VERSION,
    cellId: String(cellId).trim(),
    specimenTypes: freezeArray(
      [...new Set(specimenTypes.map(String))],
    ),
    required: freezeArray(normalized.required),
    supportive:
      freezeArray(normalized.supportive),
    negative: freezeArray(normalized.negative),
    exclusion:
      freezeArray(normalized.exclusion),
    limitation:
      freezeArray(normalized.limitation),
    thresholds:
      Object.freeze(safeThresholds),
    metadata: Object.freeze({
      ...(metadata &&
      typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
