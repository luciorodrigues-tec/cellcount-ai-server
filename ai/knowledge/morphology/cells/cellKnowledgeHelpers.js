import {
  MorphologyCriterionPolarity,
  MorphologyEntityKind,
  MorphologyEvidenceStrength,
  MorphologyKnowledgeStatus,
  createMorphologyCriterion,
  createMorphologyKnowledgeEntity,
} from "../domain/index.js";

export function positiveCriterion({
  id,
  label,
  description,
  weight = 1,
  evidenceStrength =
    MorphologyEvidenceStrength.moderate,
  featureKeys = [],
  required = false,
  specimenTypes = [],
  notes = "",
}) {
  return createMorphologyCriterion({
    id,
    label,
    description,
    polarity:
      MorphologyCriterionPolarity.positive,
    weight,
    evidenceStrength,
    featureKeys,
    required,
    specimenTypes,
    notes,
  });
}

export function negativeCriterion({
  id,
  label,
  description,
  weight = 1,
  evidenceStrength =
    MorphologyEvidenceStrength.moderate,
  featureKeys = [],
  specimenTypes = [],
  notes = "",
}) {
  return createMorphologyCriterion({
    id,
    label,
    description,
    polarity:
      MorphologyCriterionPolarity.negative,
    weight,
    evidenceStrength,
    featureKeys,
    specimenTypes,
    notes,
  });
}

export function exclusionCriterion({
  id,
  label,
  description,
  weight = 1,
  evidenceStrength =
    MorphologyEvidenceStrength.strong,
  featureKeys = [],
  specimenTypes = [],
  notes = "",
}) {
  return createMorphologyCriterion({
    id,
    label,
    description,
    polarity:
      MorphologyCriterionPolarity.exclusion,
    weight,
    evidenceStrength,
    featureKeys,
    specimenTypes,
    notes,
  });
}

export function limitationCriterion({
  id,
  label,
  description,
  featureKeys = [],
  specimenTypes = [],
  notes = "",
}) {
  return createMorphologyCriterion({
    id,
    label,
    description,
    polarity:
      MorphologyCriterionPolarity.limitation,
    weight: 0,
    evidenceStrength:
      MorphologyEvidenceStrength.strong,
    featureKeys,
    specimenTypes,
    notes,
  });
}

export function createCellKnowledge({
  id,
  version = "1.0.0",
  displayName,
  aliases = [],
  definition,
  specimenTypes,
  lineage,
  positiveCriteria = [],
  negativeCriteria = [],
  exclusionCriteria = [],
  limitationCriteria = [],
  minimumPositiveCriteria = 1,
  minimumWeightedScore = 1,
  lookAlikes = [],
  confidenceModifiers = [],
  references = [],
  tags = [],
  metadata = {},
}) {
  return createMorphologyKnowledgeEntity({
    id,
    version,
    kind: MorphologyEntityKind.cell,
    status:
      MorphologyKnowledgeStatus.validated,
    displayName,
    aliases,
    definition,
    specimenTypes,
    lineage,
    positiveCriteria,
    negativeCriteria,
    exclusionCriteria,
    limitationCriteria,
    minimumEvidence: {
      minimumPositiveCriteria,
      minimumWeightedScore,
    },
    lookAlikes,
    confidenceModifiers,
    references,
    tags,
    metadata,
  });
}
