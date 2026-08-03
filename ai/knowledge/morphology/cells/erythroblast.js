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


export const erythroblastKnowledge =
  createCellKnowledge({
    id: "CELL-ERYTHROBLAST",
    version: "1.0.0",
    displayName: "Eritroblasto",
    aliases: [
      "erythroblast",
      "nucleated red blood cell",
      "NRBC",
      "eritroblasto"
],
    definition: "Precursor eritroide nucleado cuja morfologia varia conforme o estágio de maturação eritroide.",
    specimenTypes: [
      MorphologySpecimen.boneMarrowAspirate,
      MorphologySpecimen.hemodilutedBoneMarrow,
      MorphologySpecimen.peripheralBlood
    ],
    lineage: "erythroid",
    positiveCriteria: [
      positiveCriterion({
        id: "ERY-POS-001",
        label: "Núcleo redondo e central",
        description: "Núcleo geralmente redondo, com progressiva condensação durante maturação.",
        weight: 1.5,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["round_central_nucleus"],
      }),
      positiveCriterion({
        id: "ERY-POS-002",
        label: "Citoplasma basofílico a policromático",
        description: "Citoplasma acompanha a maturação eritroide.",
        weight: 1.5,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["erythroid_cytoplasm"],
      }),
      positiveCriterion({
        id: "ERY-POS-003",
        label: "Cromatina condensada em estágios tardios",
        description: "Condensação progressiva da cromatina favorece maturação eritroide.",
        weight: 1.0,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["progressive_chromatin_condensation"],
      }),
    ],
    negativeCriteria: [
      negativeCriterion({
        id: "ERY-NEG-001",
        label: "Granulação específica granulocítica",
        description: "Granulação específica reduz compatibilidade com precursor eritroide.",
        weight: 1.0,
        evidenceStrength: MorphologyEvidenceStrength.moderate,
        featureKeys: ["specific_granules"],
      }),
    ],
    exclusionCriteria: [
      exclusionCriterion({
        id: "ERY-EXC-001",
        label: "Núcleo reniforme reticulado",
        description: "Núcleo reniforme com cromatina reticulada favorece monócito.",
        weight: 1.5,
        evidenceStrength: MorphologyEvidenceStrength.strong,
        featureKeys: ["folded_reticular_nucleus"],
      }),
    ],
    limitationCriteria: [
      limitationCriterion({
        id: "ERY-LIM-001",
        label: "Estágio eritroide não inferível por campo isolado",
        description: "A classificação fina exige correlação com padrão de maturação.",
        featureKeys: ["stage_uncertain"],
      }),
    ],
    minimumPositiveCriteria:
      2,
    minimumWeightedScore:
      2.5,
    lookAlikes: [
      "CELL-LYMPHOCYTE",
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
      "erythroid",
      "nrbc",
      "precursor"
],
    metadata: {
      library: "CI-002B.1",
      clinicalUse: "educational_decision_support",
    },
  });
