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


export const monocyteKnowledge =
  createCellKnowledge({
    id: "CELL-MONOCYTE",
    version: "1.0.0",
    displayName: "Monócito",
    aliases: [
      "monocyte",
      "monocito"
],
    definition: "Célula monocítica madura, grande, com núcleo dobrado ou reniforme, cromatina frouxamente reticulada e citoplasma cinza-azulado.",
    specimenTypes: [
      MorphologySpecimen.peripheralBlood,
      MorphologySpecimen.boneMarrowAspirate,
      MorphologySpecimen.hemodilutedBoneMarrow
    ],
    lineage: "monocytic",
    positiveCriteria: [
      positiveCriterion({
        id: "MONO-POS-001",
        label: "Núcleo dobrado ou reniforme",
        description: "Núcleo irregular, dobrado ou em forma de rim.",
        weight: 1.5,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["folded_kidney_nucleus"],
      }),
      positiveCriterion({
        id: "MONO-POS-002",
        label: "Cromatina reticulada",
        description: "Cromatina frouxa e delicadamente reticulada.",
        weight: 1.5,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["reticular_chromatin"],
      }),
      positiveCriterion({
        id: "MONO-POS-003",
        label: "Citoplasma cinza-azulado",
        description: "Citoplasma abundante, cinza-azulado, por vezes vacuolizado.",
        weight: 1.0,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["gray_blue_cytoplasm"],
      }),
    ],
    negativeCriteria: [
      negativeCriterion({
        id: "MONO-NEG-001",
        label: "Cromatina densamente agregada",
        description: "Cromatina muito condensada favorece linfócito.",
        weight: 1.0,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["dense_clumped_chromatin"],
      }),
    ],
    exclusionCriteria: [
      exclusionCriterion({
        id: "MONO-EXC-001",
        label: "Granulação específica eosinofílica",
        description: "Granulação eosinofílica específica exclui monócito.",
        weight: 1.5,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["eosinophilic_granules"],
      }),
    ],
    limitationCriteria: [
      limitationCriterion({
        id: "MONO-LIM-001",
        label: "Monócito jovem versus blasto",
        description: "Monócitos jovens podem mimetizar blastos em campos limitados.",
        featureKeys: ["young_monocyte_blast_mimic"],
      }),
    ],
    minimumPositiveCriteria:
      2,
    minimumWeightedScore:
      2.5,
    lookAlikes: [
      "CELL-BLAST",
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
      "monocytic",
      "mature"
],
    metadata: {
      library: "CI-002B.1",
      clinicalUse: "educational_decision_support",
    },
  });
