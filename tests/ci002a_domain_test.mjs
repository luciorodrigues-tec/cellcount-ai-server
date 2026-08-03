import assert from "node:assert/strict";

import {
  MorphologyCriterionPolarity,
  MorphologyEntityKind,
  MorphologyEvidenceStrength,
  MorphologyKnowledgeStatus,
  MorphologySpecimen,
  createMorphologyCriterion,
  createMorphologyKnowledgeEntity,
} from "../ai/knowledge/morphology/index.js";

const criterion =
  createMorphologyCriterion({
    id: "TEST-POS-001",
    label: "Critério de teste",
    polarity:
      MorphologyCriterionPolarity.positive,
    evidenceStrength:
      MorphologyEvidenceStrength.strong,
    weight: 2,
  });

const entity =
  createMorphologyKnowledgeEntity({
    id: "CELL-TEST",
    version: "1.0.0",
    kind: MorphologyEntityKind.cell,
    status:
      MorphologyKnowledgeStatus.validated,
    displayName: "Célula teste",
    specimenTypes: [
      MorphologySpecimen.peripheralBlood,
    ],
    positiveCriteria: [criterion],
    minimumEvidence: {
      minimumPositiveCriteria: 1,
      minimumWeightedScore: 2,
    },
  });

assert.equal(entity.id, "CELL-TEST");
assert.equal(entity.positiveCriteria.length, 1);
assert.equal(Object.isFrozen(entity), true);

console.log(
  "CI-002A morphology domain passed.",
);
