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


export const eosinophilKnowledge =
  createCellKnowledge({
    id: "CELL-EOSINOPHIL",
    version: "1.0.0",
    displayName: "Eosinófilo",
    aliases: [
      "eosinophil",
      "eosinofilo"
],
    definition: "Granulócito caracterizado por granulação citoplasmática grosseira eosinofílica e núcleo geralmente bilobulado.",
    specimenTypes: [
      MorphologySpecimen.peripheralBlood,
      MorphologySpecimen.boneMarrowAspirate,
      MorphologySpecimen.hemodilutedBoneMarrow
    ],
    lineage: "eosinophilic",
    positiveCriteria: [
      positiveCriterion({
        id: "EOS-POS-001",
        label: "Granulação eosinofílica grosseira",
        description: "Grânulos grandes, refringentes e intensamente eosinofílicos.",
        weight: 2.0,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["coarse_eosinophilic_granules"],
      }),
      positiveCriterion({
        id: "EOS-POS-002",
        label: "Núcleo bilobulado",
        description: "Núcleo frequentemente bilobulado.",
        weight: 1.0,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["bilobed_nucleus"],
      }),
    ],
    negativeCriteria: [
      negativeCriterion({
        id: "EOS-NEG-001",
        label: "Granulação fina neutrofílica",
        description: "Granulação fina favorece neutrófilo.",
        weight: 1.0,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["fine_neutrophilic_granules"],
      }),
    ],
    exclusionCriteria: [
      exclusionCriterion({
        id: "EOS-EXC-001",
        label: "Grânulos basofílicos obscurecendo o núcleo",
        description: "Padrão favorece basófilo.",
        weight: 1.5,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["basophilic_granules_obscure_nucleus"],
      }),
    ],
    limitationCriteria: [
      limitationCriterion({
        id: "EOS-LIM-001",
        label: "Alteração de cor por técnica",
        description: "Coloração inadequada pode reduzir distinção eosinofílica.",
        featureKeys: ["stain_variation"],
      }),
    ],
    minimumPositiveCriteria:
      2,
    minimumWeightedScore:
      2.5,
    lookAlikes: [
      "CELL-SEGMENTED-NEUTROPHIL",
      "CELL-BASOPHIL"
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
      "eosinophilic",
      "granulocytic",
      "mature"
],
    metadata: {
      library: "CI-002B.1",
      clinicalUse: "educational_decision_support",
    },
  });
