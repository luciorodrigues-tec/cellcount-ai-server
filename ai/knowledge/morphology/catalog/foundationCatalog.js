import {
  MorphologyCriterionPolarity,
  MorphologyEntityKind,
  MorphologyEvidenceStrength,
  MorphologyKnowledgeStatus,
  MorphologySpecimen,
  createMorphologyCriterion,
  createMorphologyKnowledgeEntity,
  createMorphologyReference,
} from "../domain/index.js";

const reference = createMorphologyReference({
  id: "REF-FOUNDATION-001",
  title:
    "CellCount Morphologic Knowledge Foundation — internal structured reference",
  organization: "CellCount",
  edition: "CI-002A",
  year: 2026,
  note:
    "Foundation placeholder. Clinical guideline references will be expanded in CI-002G.",
});

const blastCriteria = [
  createMorphologyCriterion({
    id: "BLAST-POS-001",
    label: "Alta relação núcleo/citoplasma",
    description:
      "Relação núcleo/citoplasma elevada como elemento de suporte, nunca isoladamente decisivo.",
    polarity:
      MorphologyCriterionPolarity.positive,
    weight: 1.5,
    evidenceStrength:
      MorphologyEvidenceStrength.moderate,
    featureKeys: ["high_nc_ratio"],
  }),
  createMorphologyCriterion({
    id: "BLAST-POS-002",
    label: "Cromatina delicada ou frouxa",
    description:
      "Cromatina menos condensada que em células maduras.",
    polarity:
      MorphologyCriterionPolarity.positive,
    weight: 2,
    evidenceStrength:
      MorphologyEvidenceStrength.strong,
    featureKeys: ["fine_chromatin"],
  }),
  createMorphologyCriterion({
    id: "BLAST-LIM-001",
    label: "Campo limitado",
    description:
      "Imagem isolada não permite estimativa global ou exclusão de blastos.",
    polarity:
      MorphologyCriterionPolarity.limitation,
    weight: 0,
    evidenceStrength:
      MorphologyEvidenceStrength.strong,
    featureKeys: ["limited_field"],
  }),
];

export const foundationMorphologyCatalog = Object.freeze([
  createMorphologyKnowledgeEntity({
    id: "CELL-BLAST",
    version: "1.0.0",
    kind: MorphologyEntityKind.cell,
    status: MorphologyKnowledgeStatus.draft,
    displayName: "Blasto",
    aliases: ["blast", "célula blástica"],
    definition:
      "Célula hematopoética imatura cuja classificação exige integração de múltiplos critérios morfológicos e revisão especializada.",
    specimenTypes: [
      MorphologySpecimen.peripheralBlood,
      MorphologySpecimen.boneMarrowAspirate,
      MorphologySpecimen.hemodilutedBoneMarrow,
    ],
    lineage: "immature_hematopoietic",
    positiveCriteria:
      blastCriteria.filter(
        (criterion) =>
          criterion.polarity ===
          MorphologyCriterionPolarity.positive,
      ),
    limitationCriteria:
      blastCriteria.filter(
        (criterion) =>
          criterion.polarity ===
          MorphologyCriterionPolarity.limitation,
      ),
    minimumEvidence: {
      minimumPositiveCriteria: 2,
      minimumWeightedScore: 3,
    },
    lookAlikes: [
      "CELL-PROMYELOCYTE",
      "CELL-REACTIVE-LYMPHOCYTE",
      "CELL-PLASMABLAST",
      "CELL-YOUNG-MONOCYTE",
    ],
    references: [reference],
    tags: [
      "immature",
      "blast",
      "anti-overcalling",
    ],
  }),

  createMorphologyKnowledgeEntity({
    id: "CELL-REACTIVE-LYMPHOCYTE",
    version: "1.0.0",
    kind: MorphologyEntityKind.cell,
    status: MorphologyKnowledgeStatus.draft,
    displayName: "Linfócito reativo",
    aliases: [
      "atypical reactive lymphocyte",
      "linfócito ativado",
    ],
    definition:
      "Linfócito com alterações morfológicas de ativação, potencial mimetizador de células imaturas.",
    specimenTypes: [
      MorphologySpecimen.peripheralBlood,
    ],
    lineage: "lymphoid",
    positiveCriteria: [
      createMorphologyCriterion({
        id: "RL-POS-001",
        label: "Citoplasma amplo e basofílico",
        description:
          "Citoplasma aumentado, frequentemente moldando-se às hemácias adjacentes.",
        polarity:
          MorphologyCriterionPolarity.positive,
        weight: 1.5,
        evidenceStrength:
          MorphologyEvidenceStrength.moderate,
        featureKeys: [
          "abundant_basophilic_cytoplasm",
        ],
      }),
    ],
    minimumEvidence: {
      minimumPositiveCriteria: 1,
      minimumWeightedScore: 1,
    },
    lookAlikes: [
      "CELL-BLAST",
      "CELL-PLASMABLAST",
    ],
    references: [reference],
    tags: [
      "reactive",
      "lymphoid",
      "blast-mimic",
    ],
  }),

  createMorphologyKnowledgeEntity({
    id: "CELL-PLASMA-CELL",
    version: "1.0.0",
    kind: MorphologyEntityKind.cell,
    status: MorphologyKnowledgeStatus.draft,
    displayName: "Plasmócito",
    aliases: ["plasma cell"],
    definition:
      "Célula da linhagem plasmocitária com núcleo excêntrico e diferenciação citoplasmática característica.",
    specimenTypes: [
      MorphologySpecimen.peripheralBlood,
      MorphologySpecimen.boneMarrowAspirate,
      MorphologySpecimen.hemodilutedBoneMarrow,
    ],
    lineage: "plasmacytic",
    positiveCriteria: [
      createMorphologyCriterion({
        id: "PC-POS-001",
        label: "Núcleo excêntrico",
        description:
          "Núcleo deslocado para a periferia celular.",
        polarity:
          MorphologyCriterionPolarity.positive,
        weight: 1.5,
        evidenceStrength:
          MorphologyEvidenceStrength.moderate,
        featureKeys: ["eccentric_nucleus"],
      }),
    ],
    minimumEvidence: {
      minimumPositiveCriteria: 1,
      minimumWeightedScore: 1,
    },
    lookAlikes: [
      "CELL-PLASMABLAST",
      "CELL-REACTIVE-LYMPHOCYTE",
    ],
    references: [reference],
    tags: [
      "plasmacytic",
      "plasma-cell",
    ],
  }),
]);
