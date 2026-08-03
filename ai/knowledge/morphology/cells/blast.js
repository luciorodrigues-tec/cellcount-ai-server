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


export const blastKnowledge =
  createCellKnowledge({
    id: "CELL-BLAST",
    version: "1.0.0",
    displayName: "Blasto",
    aliases: [
      "blast",
      "célula blástica",
      "celula blastica"
],
    definition: "Célula hematopoética imatura cuja classificação exige integração de cromatina, nucléolos, relação núcleo/citoplasma, citoplasma, granulação e contexto do espécime.",
    specimenTypes: [
      MorphologySpecimen.peripheralBlood,
      MorphologySpecimen.boneMarrowAspirate,
      MorphologySpecimen.hemodilutedBoneMarrow
    ],
    lineage: "immature_hematopoietic",
    positiveCriteria: [
      positiveCriterion({
        id: "BLAST-POS-001",
        label: "Cromatina delicada",
        description: "Cromatina fina, aberta ou pouco condensada em comparação com células maduras.",
        weight: 2.0,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["fine_chromatin"],
      }),
      positiveCriterion({
        id: "BLAST-POS-002",
        label: "Nucléolos visíveis",
        description: "Um ou mais nucléolos podem sustentar imaturidade quando associados a outros critérios.",
        weight: 1.5,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["visible_nucleoli"],
      }),
      positiveCriterion({
        id: "BLAST-POS-003",
        label: "Alta relação núcleo/citoplasma",
        description: "Relação núcleo/citoplasma aumentada como evidência de suporte, nunca isoladamente decisiva.",
        weight: 1.25,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["high_nc_ratio"],
      }),
    ],
    negativeCriteria: [
      negativeCriterion({
        id: "BLAST-NEG-001",
        label: "Cromatina densamente condensada",
        description: "Cromatina muito condensada reduz a compatibilidade com blasto típico.",
        weight: 1.5,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["coarse_condensed_chromatin"],
      }),
    ],
    exclusionCriteria: [
      exclusionCriterion({
        id: "BLAST-EXC-001",
        label: "Granulação específica madura",
        description: "Granulação específica claramente madura favorece precursor granulocítico mais diferenciado.",
        weight: 1.5,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["specific_mature_granules"],
      }),
    ],
    limitationCriteria: [
      limitationCriterion({
        id: "BLAST-LIM-001",
        label: "Campo limitado",
        description: "Imagem isolada não permite excluir blastos globalmente.",
        featureKeys: ["limited_field"],
      }),
      limitationCriterion({
        id: "BLAST-LIM-002",
        label: "Degeneração celular",
        description: "Degeneração pode simular cromatina frouxa ou nucléolos.",
        featureKeys: ["cell_degeneration"],
      }),
    ],
    minimumPositiveCriteria:
      2,
    minimumWeightedScore:
      3.0,
    lookAlikes: [
      "CELL-PROMYELOCYTE",
      "CELL-REACTIVE-LYMPHOCYTE",
      "CELL-PLASMABLAST",
      "CELL-MONOCYTE"
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
      "immature",
      "blast",
      "anti-overcalling"
],
    metadata: {
      library: "CI-002B.1",
      clinicalUse: "educational_decision_support",
    },
  });
