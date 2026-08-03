import {
  MorphologyCriterionPolarity,
  MorphologyEvidenceStrength,
} from "./MorphologyEnums.js";

const POLARITIES =
  new Set(Object.values(MorphologyCriterionPolarity));

const STRENGTHS =
  new Set(Object.values(MorphologyEvidenceStrength));

export function createMorphologyCriterion({
  id,
  label,
  description,
  polarity = MorphologyCriterionPolarity.positive,
  weight = 1,
  evidenceStrength = MorphologyEvidenceStrength.moderate,
  required = false,
  specimenTypes = [],
  featureKeys = [],
  notes = "",
} = {}) {
  if (!id || !String(id).trim()) {
    throw new TypeError("MorphologyCriterion.id is required.");
  }

  if (!label || !String(label).trim()) {
    throw new TypeError("MorphologyCriterion.label is required.");
  }

  if (!POLARITIES.has(polarity)) {
    throw new TypeError(
      `Invalid criterion polarity: ${polarity}`,
    );
  }

  if (!STRENGTHS.has(evidenceStrength)) {
    throw new TypeError(
      `Invalid evidence strength: ${evidenceStrength}`,
    );
  }

  const numericWeight = Number(weight);

  if (
    !Number.isFinite(numericWeight) ||
    numericWeight < 0
  ) {
    throw new TypeError(
      "MorphologyCriterion.weight must be a non-negative number.",
    );
  }

  return Object.freeze({
    id: String(id).trim(),
    label: String(label).trim(),
    description: String(description || "").trim(),
    polarity,
    weight: numericWeight,
    evidenceStrength,
    required: required === true,
    specimenTypes: Object.freeze(
      [...new Set(specimenTypes.map(String))],
    ),
    featureKeys: Object.freeze(
      [...new Set(featureKeys.map(String))],
    ),
    notes: String(notes || "").trim(),
  });
}
