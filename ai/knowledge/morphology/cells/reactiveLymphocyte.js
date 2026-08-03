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


export const reactiveLymphocyteKnowledge =
  createCellKnowledge({
    id: "CELL-REACTIVE-LYMPHOCYTE",
    version: "1.0.0",
    displayName: "Linfócito reativo",
    aliases: [
      "reactive lymphocyte",
      "atypical reactive lymphocyte",
      "linfócito ativado",
      "linfocito ativado"
],
    definition: "Linfócito ativado com citoplasma aumentado, basofilia variável e possível moldagem ao redor de hemácias.",
    specimenTypes: [
      MorphologySpecimen.peripheralBlood
    ],
    lineage: "lymphoid",
    positiveCriteria: [
      positiveCriterion({
        id: "RL-POS-001",
        label: "Citoplasma amplo e basofílico",
        description: "Citoplasma aumentado, frequentemente mais basofílico na periferia.",
        weight: 2.0,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["abundant_basophilic_cytoplasm"],
      }),
      positiveCriterion({
        id: "RL-POS-002",
        label: "Moldagem às hemácias",
        description: "Citoplasma pode contornar hemácias adjacentes.",
        weight: 1.25,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["erythrocyte_skirting"],
      }),
      positiveCriterion({
        id: "RL-POS-003",
        label: "Polimorfismo populacional",
        description: "Variação morfológica entre células favorece padrão reacional.",
        weight: 1.25,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["polymorphic_population"],
      }),
    ],
    negativeCriteria: [
      negativeCriterion({
        id: "RL-NEG-001",
        label: "População monomórfica",
        description: "Monomorfismo reduz compatibilidade com padrão reacional puro.",
        weight: 1.5,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["monomorphic_population"],
      }),
    ],
    exclusionCriteria: [
      exclusionCriterion({
        id: "RL-EXC-001",
        label: "Auer rod",
        description: "Bastonete de Auer exclui linfócito reativo.",
        weight: 2.0,
        evidenceStrength: MorphologyEvidenceStrength.decisive,
        featureKeys: ["auer_rod"],
      }),
    ],
    limitationCriteria: [
      limitationCriterion({
        id: "RL-LIM-001",
        label: "Sobreposição com blastos e plasmoblastos",
        description: "Campos isolados podem não permitir distinção segura.",
        featureKeys: ["blast_mimic"],
      }),
    ],
    minimumPositiveCriteria:
      2,
    minimumWeightedScore:
      3.0,
    lookAlikes: [
      "CELL-BLAST",
      "CELL-PLASMABLAST",
      "CELL-LYMPHOCYTE"
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
      "reactive",
      "blast-mimic"
],
    metadata: {
      library: "CI-002B.1",
      clinicalUse: "educational_decision_support",
    },
  });
