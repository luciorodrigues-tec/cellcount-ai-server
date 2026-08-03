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


export const plasmablastKnowledge =
  createCellKnowledge({
    id: "CELL-PLASMABLAST",
    version: "1.0.0",
    displayName: "Plasmoblasto",
    aliases: [
      "plasmablast",
      "plasmoblasto"
],
    definition: "Célula plasmocitária imatura, maior, com cromatina mais aberta, nucléolo evidente e citoplasma basofílico.",
    specimenTypes: [
      MorphologySpecimen.boneMarrowAspirate,
      MorphologySpecimen.hemodilutedBoneMarrow,
      MorphologySpecimen.peripheralBlood
    ],
    lineage: "plasmacytic",
    positiveCriteria: [
      positiveCriterion({
        id: "PB-POS-001",
        label: "Nucléolo proeminente",
        description: "Nucléolo evidente em núcleo imaturo.",
        weight: 1.75,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["prominent_nucleolus"],
      }),
      positiveCriterion({
        id: "PB-POS-002",
        label: "Cromatina aberta",
        description: "Cromatina menos condensada que no plasmócito maduro.",
        weight: 1.5,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["open_chromatin"],
      }),
      positiveCriterion({
        id: "PB-POS-003",
        label: "Citoplasma basofílico abundante",
        description: "Citoplasma abundante e intensamente basofílico.",
        weight: 1.25,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["abundant_basophilic_cytoplasm"],
      }),
      positiveCriterion({
        id: "PB-POS-004",
        label: "Núcleo excêntrico",
        description: "Excentricidade nuclear sustenta diferenciação plasmocitária.",
        weight: 1.0,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["eccentric_nucleus"],
      }),
    ],
    negativeCriteria: [
      negativeCriterion({
        id: "PB-NEG-001",
        label: "Cromatina em roda de carro madura",
        description: "Padrão muito maduro favorece plasmócito.",
        weight: 1.0,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["clock_face_chromatin"],
      }),
    ],
    exclusionCriteria: [
      exclusionCriterion({
        id: "PB-EXC-001",
        label: "Auer rod",
        description: "Bastonete de Auer favorece linhagem mieloide e exclui plasmoblasto típico.",
        weight: 2.0,
        evidenceStrength: MorphologyEvidenceStrength.decisive,
        featureKeys: ["auer_rod"],
      }),
    ],
    limitationCriteria: [
      limitationCriterion({
        id: "PB-LIM-001",
        label: "Mimetismo com blastos e linfócitos reativos",
        description: "Distinção pode exigir contexto e múltiplos campos.",
        featureKeys: ["blast_reactive_mimic"],
      }),
    ],
    minimumPositiveCriteria:
      3,
    minimumWeightedScore:
      4.0,
    lookAlikes: [
      "CELL-BLAST",
      "CELL-PLASMA-CELL",
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
      "immature",
      "blast-mimic"
],
    metadata: {
      library: "CI-002B.1",
      clinicalUse: "educational_decision_support",
    },
  });
