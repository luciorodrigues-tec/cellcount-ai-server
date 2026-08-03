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


export const lymphocyteKnowledge =
  createCellKnowledge({
    id: "CELL-LYMPHOCYTE",
    version: "1.0.0",
    displayName: "Linfócito",
    aliases: [
      "lymphocyte",
      "linfocito"
],
    definition: "Célula linfoide madura geralmente pequena a média, com cromatina condensada e citoplasma escasso a moderado.",
    specimenTypes: [
      MorphologySpecimen.peripheralBlood,
      MorphologySpecimen.boneMarrowAspirate,
      MorphologySpecimen.hemodilutedBoneMarrow
    ],
    lineage: "lymphoid",
    positiveCriteria: [
      positiveCriterion({
        id: "LYM-POS-001",
        label: "Cromatina condensada",
        description: "Cromatina densa e agregada típica de linfócito maduro.",
        weight: 2.0,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["condensed_chromatin"],
      }),
      positiveCriterion({
        id: "LYM-POS-002",
        label: "Citoplasma escasso",
        description: "Citoplasma geralmente escasso e basofílico.",
        weight: 1.0,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["scant_cytoplasm"],
      }),
    ],
    negativeCriteria: [
      negativeCriterion({
        id: "LYM-NEG-001",
        label: "Nucléolos proeminentes",
        description: "Nucléolos proeminentes reduzem compatibilidade com linfócito maduro típico.",
        weight: 1.0,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["prominent_nucleoli"],
      }),
    ],
    exclusionCriteria: [
      exclusionCriterion({
        id: "LYM-EXC-001",
        label: "Citoplasma amplamente reativo",
        description: "Citoplasma amplo e moldado às hemácias favorece linfócito reativo.",
        weight: 1.25,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["abundant_reactive_cytoplasm"],
      }),
    ],
    limitationCriteria: [
      limitationCriterion({
        id: "LYM-LIM-001",
        label: "Tamanho variável",
        description: "Tamanho isolado não diferencia com segurança linfócito maduro de outras células mononucleares.",
        featureKeys: ["size_only"],
      }),
    ],
    minimumPositiveCriteria:
      2,
    minimumWeightedScore:
      2.5,
    lookAlikes: [
      "CELL-REACTIVE-LYMPHOCYTE",
      "CELL-BLAST",
      "CELL-PLASMA-CELL"
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
      "lymphoid",
      "mature"
],
    metadata: {
      library: "CI-002B.1",
      clinicalUse: "educational_decision_support",
    },
  });
