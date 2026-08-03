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


export const promyelocyteKnowledge =
  createCellKnowledge({
    id: "CELL-PROMYELOCYTE",
    version: "1.0.0",
    displayName: "Promielócito",
    aliases: [
      "promyelocyte",
      "promielocito"
],
    definition: "Precursor granulocítico imaturo caracterizado por citoplasma basofílico e granulação primária azurófila, com núcleo ainda imaturo.",
    specimenTypes: [
      MorphologySpecimen.boneMarrowAspirate,
      MorphologySpecimen.hemodilutedBoneMarrow,
      MorphologySpecimen.peripheralBlood
    ],
    lineage: "myeloid",
    positiveCriteria: [
      positiveCriterion({
        id: "PROMY-POS-001",
        label: "Granulação primária azurófila",
        description: "Granulação primária geralmente abundante e relativamente grosseira.",
        weight: 2.0,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["primary_azurophilic_granules"],
      }),
      positiveCriterion({
        id: "PROMY-POS-002",
        label: "Citoplasma basofílico",
        description: "Citoplasma basofílico compatível com precursor granulocítico precoce.",
        weight: 1.0,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["basophilic_cytoplasm"],
      }),
      positiveCriterion({
        id: "PROMY-POS-003",
        label: "Núcleo imaturo",
        description: "Núcleo com cromatina ainda pouco condensada e possível nucléolo.",
        weight: 1.0,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["immature_nucleus"],
      }),
    ],
    negativeCriteria: [
      negativeCriterion({
        id: "PROMY-NEG-001",
        label: "Ausência de granulação primária",
        description: "Ausência de granulação primária reduz compatibilidade com promielócito.",
        weight: 1.5,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["no_primary_granules"],
      }),
    ],
    exclusionCriteria: [
      exclusionCriterion({
        id: "PROMY-EXC-001",
        label: "Granulação específica predominante",
        description: "Granulação específica predominante favorece mielócito.",
        weight: 1.25,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["specific_granules_predominate"],
      }),
    ],
    limitationCriteria: [
      limitationCriterion({
        id: "PROMY-LIM-001",
        label: "Baixa resolução",
        description: "Baixa resolução pode impedir distinção entre granulação primária e artefato.",
        featureKeys: ["low_resolution"],
      }),
    ],
    minimumPositiveCriteria:
      2,
    minimumWeightedScore:
      2.5,
    lookAlikes: [
      "CELL-BLAST",
      "CELL-MYELOCYTE",
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
      "myeloid",
      "immature",
      "granulocytic"
],
    metadata: {
      library: "CI-002B.1",
      clinicalUse: "educational_decision_support",
    },
  });
