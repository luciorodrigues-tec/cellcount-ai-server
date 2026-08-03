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


export const plasmaCellKnowledge =
  createCellKnowledge({
    id: "CELL-PLASMA-CELL",
    version: "1.0.0",
    displayName: "Plasmócito",
    aliases: [
      "plasma cell",
      "plasmocito"
],
    definition: "Célula plasmocitária diferenciada com núcleo excêntrico, cromatina em roda de carro e halo perinuclear variável.",
    specimenTypes: [
      MorphologySpecimen.boneMarrowAspirate,
      MorphologySpecimen.hemodilutedBoneMarrow,
      MorphologySpecimen.peripheralBlood
    ],
    lineage: "plasmacytic",
    positiveCriteria: [
      positiveCriterion({
        id: "PC-POS-001",
        label: "Núcleo excêntrico",
        description: "Núcleo deslocado para a periferia celular.",
        weight: 1.5,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["eccentric_nucleus"],
      }),
      positiveCriterion({
        id: "PC-POS-002",
        label: "Cromatina em roda de carro",
        description: "Padrão grosseiramente radiado ou em blocos.",
        weight: 2.0,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["clock_face_chromatin"],
      }),
      positiveCriterion({
        id: "PC-POS-003",
        label: "Halo perinuclear",
        description: "Zona clara perinuclear compatível com aparelho de Golgi.",
        weight: 1.0,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["perinuclear_hof"],
      }),
    ],
    negativeCriteria: [
      negativeCriterion({
        id: "PC-NEG-001",
        label: "Núcleo central",
        description: "Núcleo central reduz compatibilidade com plasmócito típico.",
        weight: 1.0,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["central_nucleus"],
      }),
    ],
    exclusionCriteria: [
      exclusionCriterion({
        id: "PC-EXC-001",
        label: "Granulação específica granulocítica",
        description: "Granulação específica granulocítica exclui plasmócito.",
        weight: 1.5,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["specific_granules"],
      }),
    ],
    limitationCriteria: [
      limitationCriterion({
        id: "PC-LIM-001",
        label: "Plasmócitos reativos versus clonais",
        description: "Morfologia isolada não determina clonabilidade.",
        featureKeys: ["clonality_not_assessable"],
      }),
    ],
    minimumPositiveCriteria:
      2,
    minimumWeightedScore:
      3.0,
    lookAlikes: [
      "CELL-PLASMABLAST",
      "CELL-REACTIVE-LYMPHOCYTE"
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
      "plasmacytic",
      "plasma-cell"
],
    metadata: {
      library: "CI-002B.1",
      clinicalUse: "educational_decision_support",
    },
  });
