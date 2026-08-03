import {
  MorphologyEvidenceStrength,
  MorphologySpecimen,
} from "../domain/index.js";

import {
  createCellKnowledge,
  exclusionCriterion,
  limitationCriterion,
  negativeCriterion,
  positiveCriterion,
} from "./cellKnowledgeHelpers.js";

import {
  morphologyReferences,
} from "./references.js";


export const basophilKnowledge =
  createCellKnowledge({
    id: "CELL-BASOPHIL",
    version: "1.0.0",
    displayName: "Basófilo",
    aliases: [
      "basophil",
      "basofilo"
],
    definition: "Granulócito com grânulos citoplasmáticos basofílicos escuros que podem obscurecer parcialmente o núcleo.",
    specimenTypes: [
      MorphologySpecimen.peripheralBlood,
      MorphologySpecimen.boneMarrowAspirate,
      MorphologySpecimen.hemodilutedBoneMarrow
    ],
    lineage: "basophilic",
    positiveCriteria: [
      positiveCriterion({
        id: "BASO-POS-001",
        label: "Granulação basofílica escura",
        description: "Grânulos grosseiros azul-escuros a violáceos.",
        weight: 2.0,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["coarse_basophilic_granules"],
      }),
      positiveCriterion({
        id: "BASO-POS-002",
        label: "Núcleo parcialmente obscurecido",
        description: "Grânulos podem obscurecer a visualização nuclear.",
        weight: 1.0,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["nucleus_partially_obscured"],
      }),
    ],
    negativeCriteria: [
      negativeCriterion({
        id: "BASO-NEG-001",
        label: "Granulação eosinofílica uniforme",
        description: "Granulação eosinofílica uniforme favorece eosinófilo.",
        weight: 1.0,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["uniform_eosinophilic_granules"],
      }),
    ],
    exclusionCriteria: [
      exclusionCriterion({
        id: "BASO-EXC-001",
        label: "Ausência de granulação específica",
        description: "Ausência de granulação reduz fortemente compatibilidade com basófilo.",
        weight: 1.5,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["no_specific_granules"],
      }),
    ],
    limitationCriteria: [
      limitationCriterion({
        id: "BASO-LIM-001",
        label: "Degranulação",
        description: "Degranulação pode dificultar reconhecimento.",
        featureKeys: ["degranulation"],
      }),
    ],
    minimumPositiveCriteria:
      2,
    minimumWeightedScore:
      2.5,
    lookAlikes: [
      "CELL-EOSINOPHIL",
      "CELL-SEGMENTED-NEUTROPHIL"
],
    confidenceModifiers: [
      "A qualidade de imagem e a representatividade do campo modificam a confiança.",
      "Critérios isolados não devem ser usados como classificação definitiva.",
    ],
    references: [
      morphologyReferences.bain,
      morphologyReferences.dacie,
      morphologyReferences.icsH,
      morphologyReferences.internalSafety,
    ],
    tags: [
      "basophilic",
      "granulocytic",
      "mature"
],
    metadata: {
      library: "CI-002B.1",
      clinicalUse: "educational_decision_support",
    },
  });
