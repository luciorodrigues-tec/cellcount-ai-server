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


export const metamyelocyteKnowledge =
  createCellKnowledge({
    id: "CELL-METAMYELOCYTE",
    version: "1.0.0",
    displayName: "Metamielócito",
    aliases: [
      "metamyelocyte",
      "metamielocito"
],
    definition: "Precursor granulocítico pós-mitótico com indentação nuclear evidente, sem segmentação completa.",
    specimenTypes: [
      MorphologySpecimen.boneMarrowAspirate,
      MorphologySpecimen.hemodilutedBoneMarrow,
      MorphologySpecimen.peripheralBlood
    ],
    lineage: "myeloid",
    positiveCriteria: [
      positiveCriterion({
        id: "META-POS-001",
        label: "Indentação nuclear evidente",
        description: "Indentação nuclear maior que no mielócito, sem atingir segmentação completa.",
        weight: 2.0,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["nuclear_indent"],
      }),
      positiveCriterion({
        id: "META-POS-002",
        label: "Granulação específica",
        description: "Granulação específica compatível com linhagem granulocítica.",
        weight: 1.5,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["specific_granules"],
      }),
    ],
    negativeCriteria: [
      negativeCriterion({
        id: "META-NEG-001",
        label: "Núcleo totalmente arredondado",
        description: "Núcleo totalmente arredondado favorece mielócito.",
        weight: 1.0,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["round_nucleus"],
      }),
    ],
    exclusionCriteria: [
      exclusionCriterion({
        id: "META-EXC-001",
        label: "Segmentação completa",
        description: "Segmentação em lobos definidos exclui metamielócito.",
        weight: 2.0,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["fully_segmented_nucleus"],
      }),
    ],
    limitationCriteria: [
      limitationCriterion({
        id: "META-LIM-001",
        label: "Orientação celular",
        description: "Orientação ou dobra nuclear pode simular indentação.",
        featureKeys: ["cell_orientation"],
      }),
    ],
    minimumPositiveCriteria:
      2,
    minimumWeightedScore:
      3.0,
    lookAlikes: [
      "CELL-MYELOCYTE",
      "CELL-BAND"
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
      "myeloid",
      "granulocytic",
      "maturation"
],
    metadata: {
      library: "CI-002B.1",
      clinicalUse: "educational_decision_support",
    },
  });
