// ============================================================================
// CELLCOUNT AI
// HEMATOLOGY KNOWLEDGE BASE
// ============================================================================

export const RBC_MORPHOLOGY = {

  anisocytosis: {

    keywords: [
      "anisocytosis",
      "size variation",
      "variable erythrocyte size",
    ],

    severity: "medium",

    grading: [
      "discreta",
      "leve",
      "moderada",
      "acentuada",
    ],
  },

  poikilocytosis: {

    keywords: [
      "poikilocytosis",
      "abnormal shape",
      "irregular erythrocytes",
    ],

    severity: "medium",
  },

  schistocyte: {

    keywords: [
      "schistocyte",
      "fragmented",
      "helmet cell",
      "triangular cell",
    ],

    severity: "high",

    correlations: [
      "TTP",
      "HUS",
      "DIC",
      "Microangiopathic hemolysis",
    ],
  },

  rouleaux: {

    keywords: [
      "rouleaux",
      "coin stacking",
      "stacking erythrocytes",
    ],

    severity: "medium",

    correlations: [
      "Inflammation",
      "Myeloma",
      "Hyperproteinemia",
    ],
  },

  targetCell: {

    keywords: [
      "target cell",
      "codocyte",
      "bullseye erythrocyte",
    ],

    severity: "medium",
  },

  acanthocyte: {

    keywords: [
      "acanthocyte",
      "spur cell",
      "spiculated erythrocyte",
    ],

    severity: "high",
  },

  sickleCell: {

    keywords: [
      "sickle cell",
      "drepanocyte",
      "crescent erythrocyte",
    ],

    severity: "high",
  },
};

// ============================================================================

export const WBC_MORPHOLOGY = {

  blast: {

    keywords: [
      "blast",
      "immature cell",
      "high nucleus cytoplasm ratio",
      "nucleoli",
    ],

    severity: "critical",

    correlations: [
      "Acute leukemia",
      "Myelodysplastic syndrome",
    ],
  },

  leftShift: {

    keywords: [
      "left shift",
      "band neutrophils",
      "immature granulocytes",
    ],

    severity: "high",
  },

  hypersegmentedNeutrophil: {

    keywords: [
      "hypersegmented neutrophil",
      "more than 5 lobes",
    ],

    severity: "medium",

    correlations: [
      "Megaloblastic anemia",
      "Vitamin B12 deficiency",
      "Folate deficiency",
    ],
  },
};

// ============================================================================

export const PLATELET_MORPHOLOGY = {

  giantPlatelets: {

    keywords: [
      "giant platelets",
      "macroplatelets",
    ],

    severity: "medium",
  },

  plateletAggregation: {

    keywords: [
      "platelet aggregation",
      "platelet clumps",
    ],

    severity: "medium",
  },
};