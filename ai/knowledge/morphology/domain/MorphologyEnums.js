export const MorphologyEntityKind = Object.freeze({
  cell: "cell",
  lineage: "lineage",
  artifact: "artifact",
  pattern: "pattern",
});

export const MorphologySpecimen = Object.freeze({
  peripheralBlood: "PERIPHERAL_BLOOD",
  boneMarrowAspirate: "BONE_MARROW_ASPIRATE",
  boneMarrowBiopsy: "BONE_MARROW_BIOPSY",
  hemodilutedBoneMarrow: "HEMODILUTED_BONE_MARROW",
});

export const MorphologyCriterionPolarity = Object.freeze({
  positive: "positive",
  negative: "negative",
  exclusion: "exclusion",
  limitation: "limitation",
});

export const MorphologyEvidenceStrength = Object.freeze({
  weak: "weak",
  moderate: "moderate",
  strong: "strong",
  decisive: "decisive",
});

export const MorphologyConfidenceBand = Object.freeze({
  low: "low",
  moderate: "moderate",
  high: "high",
  blocked: "blocked",
});

export const MorphologyKnowledgeStatus = Object.freeze({
  draft: "draft",
  validated: "validated",
  deprecated: "deprecated",
});
