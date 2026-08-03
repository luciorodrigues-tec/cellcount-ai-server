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


export const megakaryocyteKnowledge =
  createCellKnowledge({
    id: "CELL-MEGAKARYOCYTE",
    version: "1.0.0",
    displayName: "Megacariócito",
    aliases: [
      "megakaryocyte",
      "megacariocito"
],
    definition: "Grande célula medular da linhagem megacariocítica, com citoplasma abundante e núcleo multilobulado ou hiperlobulado.",
    specimenTypes: [
      MorphologySpecimen.boneMarrowAspirate,
      MorphologySpecimen.hemodilutedBoneMarrow
    ],
    lineage: "megakaryocytic",
    positiveCriteria: [
      positiveCriterion({
        id: "MEGA-POS-001",
        label: "Tamanho celular muito aumentado",
        description: "Dimensão muito superior à maioria das células hematopoéticas.",
        weight: 2.0,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["very_large_cell"],
      }),
      positiveCriterion({
        id: "MEGA-POS-002",
        label: "Núcleo multilobulado",
        description: "Núcleo grande e multilobulado ou hiperlobulado.",
        weight: 2.0,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["large_multilobulated_nucleus"],
      }),
      positiveCriterion({
        id: "MEGA-POS-003",
        label: "Citoplasma abundante granular",
        description: "Citoplasma abundante, granular, com possibilidade de brotamento plaquetário.",
        weight: 1.5,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["abundant_granular_cytoplasm"],
      }),
    ],
    negativeCriteria: [
      negativeCriterion({
        id: "MEGA-NEG-001",
        label: "Tamanho celular comum",
        description: "Tamanho semelhante a leucócitos comuns reduz compatibilidade.",
        weight: 1.0,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["ordinary_cell_size"],
      }),
    ],
    exclusionCriteria: [
      exclusionCriterion({
        id: "MEGA-EXC-001",
        label: "Ausência de estrutura nuclear megacariocítica",
        description: "Núcleo pequeno e simples exclui megacariócito maduro.",
        weight: 1.5,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["small_simple_nucleus"],
      }),
    ],
    limitationCriteria: [
      limitationCriterion({
        id: "MEGA-LIM-001",
        label: "Fragmentação e campo parcial",
        description: "Célula parcial ou fragmentada pode impedir classificação segura.",
        featureKeys: ["partial_cell"],
      }),
    ],
    minimumPositiveCriteria:
      2,
    minimumWeightedScore:
      3.5,
    lookAlikes: [
      "CELL-BLAST",
      "CELL-PLASMABLAST"
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
      "megakaryocytic",
      "marrow",
      "large-cell"
],
    metadata: {
      library: "CI-002B.1",
      clinicalUse: "educational_decision_support",
    },
  });
