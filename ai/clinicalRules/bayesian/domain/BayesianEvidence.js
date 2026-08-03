export const BAYESIAN_EVIDENCE_SCHEMA_VERSION =
  "CRR-000008-v1";

export const BAYESIAN_EVIDENCE_DIRECTIONS =
  Object.freeze([
    "SUPPORT",
    "OPPOSE",
    "NEUTRAL",
  ]);

function finiteNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(`${field} must be a finite number.`);
  }
  return number;
}

export function createBayesianEvidence({
  id,
  hypothesisId,
  sourceId,
  direction,
  likelihoodRatio,
  confidence = 1,
  evidenceLevel = "UNSPECIFIED",
  rationale = "",
  requiresHumanReview = false,
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    hypothesisId,
    sourceId,
    direction,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(`BayesianEvidence.${field} is required.`);
    }
  }

  const normalizedDirection = String(direction)
    .trim()
    .toUpperCase();

  if (
    !BAYESIAN_EVIDENCE_DIRECTIONS.includes(
      normalizedDirection,
    )
  ) {
    throw new TypeError(
      `Unsupported Bayesian evidence direction: ${normalizedDirection}`,
    );
  }

  const lr = finiteNumber(
    likelihoodRatio,
    "BayesianEvidence.likelihoodRatio",
  );

  if (lr <= 0) {
    throw new TypeError(
      "BayesianEvidence.likelihoodRatio must be greater than zero.",
    );
  }

  const normalizedConfidence = finiteNumber(
    confidence,
    "BayesianEvidence.confidence",
  );

  if (
    normalizedConfidence < 0 ||
    normalizedConfidence > 1
  ) {
    throw new TypeError(
      "BayesianEvidence.confidence must be between 0 and 1.",
    );
  }

  return Object.freeze({
    schemaVersion: BAYESIAN_EVIDENCE_SCHEMA_VERSION,
    id: String(id).trim(),
    hypothesisId: String(hypothesisId).trim(),
    sourceId: String(sourceId).trim(),
    direction: normalizedDirection,
    likelihoodRatio: lr,
    confidence: normalizedConfidence,
    evidenceLevel: String(evidenceLevel)
      .trim()
      .toUpperCase(),
    rationale: String(rationale || "").trim(),
    requiresHumanReview: Boolean(
      requiresHumanReview,
    ),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}

export function createBayesianHypothesisProfile({
  hypothesisId,
  label,
  priorProbability,
  minimumEvidenceCount = 1,
  minimumPosteriorProbability = 0.5,
  metadata = {},
} = {}) {
  if (!hypothesisId || !String(hypothesisId).trim()) {
    throw new TypeError(
      "BayesianHypothesisProfile.hypothesisId is required.",
    );
  }

  if (!label || !String(label).trim()) {
    throw new TypeError(
      "BayesianHypothesisProfile.label is required.",
    );
  }

  const prior = finiteNumber(
    priorProbability,
    "BayesianHypothesisProfile.priorProbability",
  );

  if (prior <= 0 || prior >= 1) {
    throw new TypeError(
      "BayesianHypothesisProfile.priorProbability must be greater than 0 and less than 1.",
    );
  }

  const threshold = finiteNumber(
    minimumPosteriorProbability,
    "BayesianHypothesisProfile.minimumPosteriorProbability",
  );

  if (threshold < 0 || threshold > 1) {
    throw new TypeError(
      "BayesianHypothesisProfile.minimumPosteriorProbability must be between 0 and 1.",
    );
  }

  const evidenceCount = Number(minimumEvidenceCount);

  if (
    !Number.isInteger(evidenceCount) ||
    evidenceCount < 0
  ) {
    throw new TypeError(
      "BayesianHypothesisProfile.minimumEvidenceCount must be a non-negative integer.",
    );
  }

  return Object.freeze({
    schemaVersion: BAYESIAN_EVIDENCE_SCHEMA_VERSION,
    hypothesisId: String(hypothesisId).trim(),
    label: String(label).trim(),
    priorProbability: prior,
    minimumEvidenceCount: evidenceCount,
    minimumPosteriorProbability: threshold,
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
