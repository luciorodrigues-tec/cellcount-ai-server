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


export const myelocyteKnowledge =
  createCellKnowledge({
    id: "CELL-MYELOCYTE",
    version: "1.0.0",
    displayName: "Mielócito",
    aliases: [
      "myelocyte",
      "mielocito"
],
    definition: "Precursor granulocítico intermediário com núcleo arredondado ou oval, cromatina mais condensada e início de granulação específica.",
    specimenTypes: [
      MorphologySpecimen.boneMarrowAspirate,
      MorphologySpecimen.hemodilutedBoneMarrow,
      MorphologySpecimen.peripheralBlood
    ],
    lineage: "myeloid",
    positiveCriteria: [
      positiveCriterion({
        id: "MYE-POS-001",
        label: "Granulação específica inicial",
        description: "Aparecimento de granulação específica compatível com diferenciação granulocítica.",
        weight: 2.0,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["specific_granules"],
      }),
      positiveCriterion({
        id: "MYE-POS-002",
        label: "Núcleo arredondado ou oval",
        description: "Núcleo sem indentação significativa.",
        weight: 1.0,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["round_oval_nucleus"],
      }),
      positiveCriterion({
        id: "MYE-POS-003",
        label: "Cromatina intermediariamente condensada",
        description: "Cromatina mais condensada que no promielócito.",
        weight: 1.0,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["intermediate_chromatin"],
      }),
    ],
    negativeCriteria: [
      negativeCriterion({
        id: "MYE-NEG-001",
        label: "Indentação nuclear profunda",
        description: "Indentação nuclear profunda favorece metamielócito.",
        weight: 1.0,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["deep_nuclear_indent"],
      }),
    ],
    exclusionCriteria: [
      exclusionCriterion({
        id: "MYE-EXC-001",
        label: "Segmentação nuclear",
        description: "Segmentação nuclear exclui mielócito.",
        weight: 2.0,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["segmented_nucleus"],
      }),
    ],
    limitationCriteria: [
      limitationCriterion({
        id: "MYE-LIM-001",
        label: "Sobreposição celular",
        description: "Sobreposição pode simular indentação ou alterar a percepção do núcleo.",
        featureKeys: ["cell_overlap"],
      }),
    ],
    minimumPositiveCriteria:
      2,
    minimumWeightedScore:
      2.5,
    lookAlikes: [
      "CELL-PROMYELOCYTE",
      "CELL-METAMYELOCYTE"
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
