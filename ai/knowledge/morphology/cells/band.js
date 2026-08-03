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


export const bandKnowledge =
  createCellKnowledge({
    id: "CELL-BAND",
    version: "1.0.0",
    displayName: "Bastonete",
    aliases: [
      "band neutrophil",
      "neutrófilo bastonete",
      "neutrofilo bastonete"
],
    definition: "Neutrófilo imaturo pós-mitótico com núcleo contínuo em banda, sem filamentos segmentares completos.",
    specimenTypes: [
      MorphologySpecimen.peripheralBlood,
      MorphologySpecimen.boneMarrowAspirate,
      MorphologySpecimen.hemodilutedBoneMarrow
    ],
    lineage: "neutrophilic",
    positiveCriteria: [
      positiveCriterion({
        id: "BAND-POS-001",
        label: "Núcleo em banda contínua",
        description: "Núcleo alongado ou curvo, de espessura relativamente uniforme.",
        weight: 2.0,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["band_shaped_nucleus"],
      }),
      positiveCriterion({
        id: "BAND-POS-002",
        label: "Granulação neutrofílica",
        description: "Citoplasma com granulação específica neutrofílica.",
        weight: 1.5,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["neutrophilic_granules"],
      }),
    ],
    negativeCriteria: [
      negativeCriterion({
        id: "BAND-NEG-001",
        label: "Lobos claramente separados",
        description: "Lobos conectados por filamentos finos favorecem segmentado.",
        weight: 1.0,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["distinct_lobes"],
      }),
    ],
    exclusionCriteria: [
      exclusionCriterion({
        id: "BAND-EXC-001",
        label: "Núcleo arredondado",
        description: "Núcleo arredondado ou oval exclui bastonete típico.",
        weight: 1.5,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["round_oval_nucleus"],
      }),
    ],
    limitationCriteria: [
      limitationCriterion({
        id: "BAND-LIM-001",
        label: "Critério de segmentação dependente de convenção",
        description: "A distinção entre bastonete e segmentado depende de padronização morfológica.",
        featureKeys: ["classification_convention"],
      }),
    ],
    minimumPositiveCriteria:
      2,
    minimumWeightedScore:
      3.0,
    lookAlikes: [
      "CELL-METAMYELOCYTE",
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
      "neutrophilic",
      "granulocytic",
      "maturation"
],
    metadata: {
      library: "CI-002B.1",
      clinicalUse: "educational_decision_support",
    },
  });
