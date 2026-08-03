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


export const segmentedNeutrophilKnowledge =
  createCellKnowledge({
    id: "CELL-SEGMENTED-NEUTROPHIL",
    version: "1.0.0",
    displayName: "Neutrófilo segmentado",
    aliases: [
      "segmented neutrophil",
      "neutrófilo maduro",
      "neutrofilo maduro"
],
    definition: "Neutrófilo maduro com núcleo segmentado em lobos conectados por filamentos finos e granulação neutrofílica específica.",
    specimenTypes: [
      MorphologySpecimen.peripheralBlood,
      MorphologySpecimen.boneMarrowAspirate,
      MorphologySpecimen.hemodilutedBoneMarrow
    ],
    lineage: "neutrophilic",
    positiveCriteria: [
      positiveCriterion({
        id: "SEG-POS-001",
        label: "Núcleo multilobulado",
        description: "Dois ou mais lobos conectados por filamentos finos.",
        weight: 2.0,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["multilobed_nucleus"],
      }),
      positiveCriterion({
        id: "SEG-POS-002",
        label: "Granulação neutrofílica específica",
        description: "Granulação fina e específica em citoplasma relativamente pálido.",
        weight: 1.5,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["neutrophilic_granules"],
      }),
    ],
    negativeCriteria: [
      negativeCriterion({
        id: "SEG-NEG-001",
        label: "Núcleo contínuo em banda",
        description: "Núcleo contínuo sem filamento favorece bastonete.",
        weight: 1.0,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["band_shaped_nucleus"],
      }),
    ],
    exclusionCriteria: [
      exclusionCriterion({
        id: "SEG-EXC-001",
        label: "Granulação eosinofílica grosseira",
        description: "Granulação eosinofílica grosseira favorece eosinófilo.",
        weight: 1.5,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["coarse_eosinophilic_granules"],
      }),
    ],
    limitationCriteria: [
      limitationCriterion({
        id: "SEG-LIM-001",
        label: "Hipossegmentação artefactual",
        description: "Orientação e esmagamento podem simular hipossegmentação.",
        featureKeys: ["artifact_hyposegmentation"],
      }),
    ],
    minimumPositiveCriteria:
      2,
    minimumWeightedScore:
      3.0,
    lookAlikes: [
      "CELL-BAND",
      "CELL-EOSINOPHIL",
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
      "neutrophilic",
      "mature",
      "granulocytic"
],
    metadata: {
      library: "CI-002B.1",
      clinicalUse: "educational_decision_support",
    },
  });
