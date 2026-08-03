import {
  createDifferentialRule,
} from "../DifferentialRule.js";

function test(
  id,
  label,
  rationale,
) {
  return Object.freeze({
    id,
    label,
    rationale,
  });
}

export const coreDifferentialRules =
  Object.freeze([
    createDifferentialRule({
      id:
        "DIFF-CELL-BLAST-CELL-PLASMABLAST",
      primaryCell:
        "CELL-BLAST",
      differentialCell:
        "CELL-PLASMABLAST",
      similarity: 0.90,
      specimenTypes: [
        "PERIPHERAL_BLOOD",
        "BONE_MARROW_ASPIRATE",
      ],
      sharedFeatures: [
        "fine_chromatin",
        "visible_nucleoli",
        "high_nc_ratio",
      ],
      primaryExclusiveFeatures: [
        "scant_cytoplasm",
      ],
      differentialExclusiveFeatures: [
        "eccentric_nucleus",
        "perinuclear_hof",
        "abundant_basophilic_cytoplasm",
      ],
      primaryExclusionFeatures: [
        "clock_face_chromatin",
      ],
      differentialExclusionFeatures: [
        "auer_rod",
      ],
      recommendedTests: [
        test(
          "FLOW_CYTOMETRY",
          "Citometria de fluxo",
          "Diferenciar fenótipo blástico de diferenciação plasmocitária.",
        ),
        test(
          "IMMUNOPHENOTYPING",
          "Imunofenotipagem",
          "Confirmar linhagem e estágio de maturação.",
        ),
      ],
      narrative:
        "Blastos e plasmoblastos podem compartilhar cromatina fina, nucléolos e elevada relação núcleo/citoplasma. Núcleo excêntrico, hof perinuclear e citoplasma basofílico abundante favorecem plasmoblasto.",
    }),

    createDifferentialRule({
      id:
        "DIFF-CELL-BLAST-CELL-PROMYELOCYTE",
      primaryCell:
        "CELL-BLAST",
      differentialCell:
        "CELL-PROMYELOCYTE",
      similarity: 0.82,
      specimenTypes: [
        "PERIPHERAL_BLOOD",
        "BONE_MARROW_ASPIRATE",
      ],
      sharedFeatures: [
        "fine_chromatin",
        "visible_nucleoli",
        "high_nc_ratio",
      ],
      primaryExclusiveFeatures: [
        "scant_cytoplasm",
      ],
      differentialExclusiveFeatures: [
        "primary_azurophilic_granules",
        "auer_rod",
      ],
      primaryExclusionFeatures: [
        "specific_granules",
      ],
      differentialExclusionFeatures: [
        "segmented_nucleus",
      ],
      recommendedTests: [
        test(
          "FLOW_CYTOMETRY",
          "Citometria de fluxo",
          "Definir linhagem e maturação mieloide.",
        ),
        test(
          "CYTOCHEMISTRY",
          "Citoquímica",
          "Avaliar diferenciação mieloide quando disponível.",
        ),
      ],
      narrative:
        "Granulação azurófila primária e bastonetes de Auer favorecem promielócito, enquanto citoplasma escasso e ausência de diferenciação granular sustentam blasto.",
    }),

    createDifferentialRule({
      id:
        "DIFF-CELL-BLAST-CELL-REACTIVE-LYMPHOCYTE",
      primaryCell:
        "CELL-BLAST",
      differentialCell:
        "CELL-REACTIVE-LYMPHOCYTE",
      similarity: 0.68,
      specimenTypes: [
        "PERIPHERAL_BLOOD",
      ],
      sharedFeatures: [
        "high_nc_ratio",
        "visible_nucleoli",
      ],
      primaryExclusiveFeatures: [
        "fine_chromatin",
        "scant_cytoplasm",
        "monomorphic_population",
      ],
      differentialExclusiveFeatures: [
        "abundant_basophilic_cytoplasm",
        "erythrocyte_skirting",
        "polymorphic_population",
      ],
      primaryExclusionFeatures: [
        "erythrocyte_skirting",
      ],
      differentialExclusionFeatures: [
        "auer_rod",
      ],
      recommendedTests: [
        test(
          "PERIPHERAL_SMEAR_REVIEW",
          "Revisão do esfregaço",
          "Avaliar heterogeneidade populacional e contexto reativo.",
        ),
        test(
          "FLOW_CYTOMETRY",
          "Citometria de fluxo",
          "Investigar clonalidade quando persistir dúvida.",
        ),
      ],
      narrative:
        "População monomórfica, cromatina fina e citoplasma escasso favorecem blasto; heterogeneidade, citoplasma abundante e contorno adaptado às hemácias favorecem linfócito reativo.",
    }),

    createDifferentialRule({
      id:
        "DIFF-CELL-BLAST-CELL-MONOCYTE",
      primaryCell:
        "CELL-BLAST",
      differentialCell:
        "CELL-MONOCYTE",
      similarity: 0.58,
      specimenTypes: [
        "PERIPHERAL_BLOOD",
        "BONE_MARROW_ASPIRATE",
      ],
      sharedFeatures: [
        "visible_nucleoli",
      ],
      primaryExclusiveFeatures: [
        "fine_chromatin",
        "high_nc_ratio",
        "scant_cytoplasm",
      ],
      differentialExclusiveFeatures: [
        "folded_kidney_nucleus",
        "gray_blue_cytoplasm",
              ],
      primaryExclusionFeatures: [
        "folded_kidney_nucleus",
      ],
      differentialExclusionFeatures: [
        "auer_rod",
      ],
      recommendedTests: [
        test(
          "FLOW_CYTOMETRY",
          "Citometria de fluxo",
          "Confirmar diferenciação monocítica ou blástica.",
        ),
      ],
      narrative:
        "Cromatina fina uniforme e relação núcleo/citoplasma elevada favorecem blasto; núcleo pregueado ou reniforme, citoplasma cinza e vacúolos favorecem monócito.",
    }),

    createDifferentialRule({
      id:
        "DIFF-CELL-PROMYELOCYTE-CELL-MYELOCYTE",
      primaryCell:
        "CELL-PROMYELOCYTE",
      differentialCell:
        "CELL-MYELOCYTE",
      similarity: 0.80,
      specimenTypes: [
        "BONE_MARROW_ASPIRATE",
        "PERIPHERAL_BLOOD",
      ],
      sharedFeatures: [
        "round_oval_nucleus",
        "abundant_granular_cytoplasm",
      ],
      primaryExclusiveFeatures: [
        "primary_azurophilic_granules",
        "visible_nucleoli",
        "auer_rod",
      ],
      differentialExclusiveFeatures: [
        "specific_granules",
        "eccentric_nucleus",
              ],
      primaryExclusionFeatures: [
        "segmented_nucleus",
      ],
      differentialExclusionFeatures: [
        "auer_rod",
      ],
      recommendedTests: [
        test(
          "MARROW_REVIEW",
          "Revisão do mielograma",
          "Avaliar sequência maturativa granulocítica.",
        ),
      ],
      narrative:
        "Nucléolos e granulação primária abundante favorecem promielócito; granulações específicas e início de condensação cromatínica favorecem mielócito.",
    }),

    createDifferentialRule({
      id:
        "DIFF-CELL-MYELOCYTE-CELL-METAMYELOCYTE",
      primaryCell:
        "CELL-MYELOCYTE",
      differentialCell:
        "CELL-METAMYELOCYTE",
      similarity: 0.86,
      specimenTypes: [
        "BONE_MARROW_ASPIRATE",
        "PERIPHERAL_BLOOD",
      ],
      sharedFeatures: [
        "specific_granules",
        "condensed_chromatin",
      ],
      primaryExclusiveFeatures: [
        "round_oval_nucleus",
      ],
      differentialExclusiveFeatures: [
        "nuclear_indent",
        "folded_kidney_nucleus",
      ],
      primaryExclusionFeatures: [
        "deep_nuclear_indent",
      ],
      differentialExclusionFeatures: [
        "visible_nucleoli",
      ],
      recommendedTests: [
        test(
          "MARROW_REVIEW",
          "Revisão do mielograma",
          "Confirmar estágio de maturação pelo contorno nuclear.",
        ),
      ],
      narrative:
        "Núcleo arredondado ou oval favorece mielócito; indentação nuclear progressiva ou formato reniforme favorece metamielócito.",
    }),

    createDifferentialRule({
      id:
        "DIFF-CELL-BAND-CELL-SEGMENTED-NEUTROPHIL",
      primaryCell:
        "CELL-BAND",
      differentialCell:
        "CELL-SEGMENTED-NEUTROPHIL",
      similarity: 0.88,
      specimenTypes: [
        "PERIPHERAL_BLOOD",
        "BONE_MARROW_ASPIRATE",
      ],
      sharedFeatures: [
        "specific_granules",
        "condensed_chromatin",
      ],
      primaryExclusiveFeatures: [
        "band_shaped_nucleus",
      ],
      differentialExclusiveFeatures: [
        "segmented_nucleus",
      ],
      primaryExclusionFeatures: [
        "distinct_lobes",
      ],
      differentialExclusionFeatures: [
        "band_shaped_nucleus",
      ],
      recommendedTests: [
        test(
          "MANUAL_DIFFERENTIAL",
          "Contagem diferencial manual",
          "Aplicar critério institucional para bastonete versus segmentado.",
        ),
      ],
      narrative:
        "Núcleo contínuo em faixa favorece bastonete; lóbulos separados por filamento fino favorecem neutrófilo segmentado.",
    }),

    createDifferentialRule({
      id:
        "DIFF-CELL-LYMPHOCYTE-CELL-REACTIVE-LYMPHOCYTE",
      primaryCell:
        "CELL-LYMPHOCYTE",
      differentialCell:
        "CELL-REACTIVE-LYMPHOCYTE",
      similarity: 0.78,
      specimenTypes: [
        "PERIPHERAL_BLOOD",
      ],
      sharedFeatures: [
        "round_nucleus",
        "basophilic_cytoplasm",
      ],
      primaryExclusiveFeatures: [
        "dense_clumped_chromatin",
        "scant_cytoplasm",
      ],
      differentialExclusiveFeatures: [
        "abundant_basophilic_cytoplasm",
        "erythrocyte_skirting",
        "polymorphic_population",
      ],
      primaryExclusionFeatures: [
        "prominent_nucleoli",
      ],
      differentialExclusionFeatures: [
        "monomorphic_population",
      ],
      recommendedTests: [
        test(
          "CLINICAL_CORRELATION",
          "Correlação clínica",
          "Correlacionar com síndrome viral, sorologia e hemograma.",
        ),
      ],
      narrative:
        "Cromatina densa e citoplasma escasso favorecem linfócito maduro; citoplasma amplo, basofilia variável e adaptação às hemácias favorecem linfócito reativo.",
    }),

    createDifferentialRule({
      id:
        "DIFF-CELL-REACTIVE-LYMPHOCYTE-CELL-PLASMABLAST",
      primaryCell:
        "CELL-REACTIVE-LYMPHOCYTE",
      differentialCell:
        "CELL-PLASMABLAST",
      similarity: 0.76,
      specimenTypes: [
        "PERIPHERAL_BLOOD",
        "BONE_MARROW_ASPIRATE",
      ],
      sharedFeatures: [
        "abundant_basophilic_cytoplasm",
        "visible_nucleoli",
      ],
      primaryExclusiveFeatures: [
        "erythrocyte_skirting",
        "polymorphic_population",
      ],
      differentialExclusiveFeatures: [
        "eccentric_nucleus",
        "perinuclear_hof",
        "monomorphic_population",
      ],
      primaryExclusionFeatures: [
        "clock_face_chromatin",
      ],
      differentialExclusionFeatures: [
        "erythrocyte_skirting",
      ],
      recommendedTests: [
        test(
          "FLOW_CYTOMETRY",
          "Citometria de fluxo",
          "Avaliar clonalidade e diferenciação plasmocitária.",
        ),
        test(
          "SERUM_PROTEIN_STUDIES",
          "Estudos de proteínas séricas",
          "Correlacionar com componente monoclonal quando indicado.",
        ),
      ],
      narrative:
        "Heterogeneidade e contorno adaptado às hemácias favorecem reatividade; núcleo excêntrico, hof perinuclear e população monomórfica favorecem plasmoblasto.",
    }),

    createDifferentialRule({
      id:
        "DIFF-CELL-PLASMA-CELL-CELL-PLASMABLAST",
      primaryCell:
        "CELL-PLASMA-CELL",
      differentialCell:
        "CELL-PLASMABLAST",
      similarity: 0.84,
      specimenTypes: [
        "BONE_MARROW_ASPIRATE",
        "PERIPHERAL_BLOOD",
      ],
      sharedFeatures: [
        "eccentric_nucleus",
        "perinuclear_hof",
        "abundant_basophilic_cytoplasm",
      ],
      primaryExclusiveFeatures: [
        "clock_face_chromatin",
              ],
      differentialExclusiveFeatures: [
        "fine_chromatin",
        "visible_nucleoli",
        "high_nc_ratio",
      ],
      primaryExclusionFeatures: [
        "fine_chromatin",
      ],
      differentialExclusionFeatures: [
        "clock_face_chromatin",
      ],
      recommendedTests: [
        test(
          "FLOW_CYTOMETRY",
          "Citometria de fluxo",
          "Caracterizar maturação e clonalidade plasmocitária.",
        ),
        test(
          "BONE_MARROW_CORRELATION",
          "Correlação medular",
          "Integrar percentual plasmocitário e padrão de infiltração.",
        ),
      ],
      narrative:
        "Cromatina em roda de carro e ausência de nucléolos favorecem plasmócito maduro; cromatina fina, nucléolos e relação núcleo/citoplasma elevada favorecem plasmoblasto.",
    }),

    createDifferentialRule({
      id:
        "DIFF-CELL-ERYTHROBLAST-CELL-LYMPHOCYTE",
      primaryCell:
        "CELL-ERYTHROBLAST",
      differentialCell:
        "CELL-LYMPHOCYTE",
      similarity: 0.66,
      specimenTypes: [
        "PERIPHERAL_BLOOD",
        "BONE_MARROW_ASPIRATE",
      ],
      sharedFeatures: [
        "round_nucleus",
        "high_nc_ratio",
      ],
      primaryExclusiveFeatures: [
        "coarse_condensed_chromatin",
        "erythroid_cytoplasm",
      ],
      differentialExclusiveFeatures: [
        "dense_clumped_chromatin",
        "scant_cytoplasm",
      ],
      primaryExclusionFeatures: [
        "segmented_nucleus",
      ],
      differentialExclusionFeatures: [
        "erythroid_cytoplasm",
      ],
      recommendedTests: [
        test(
          "MARROW_REVIEW",
          "Revisão morfológica",
          "Avaliar maturação eritroide e tonalidade citoplasmática.",
        ),
      ],
      narrative:
        "Citoplasma progressivamente hemoglobinizado e núcleo picnótico favorecem eritroblasto; cromatina linfocitária e citoplasma escasso basofílico favorecem linfócito.",
    }),

    createDifferentialRule({
      id:
        "DIFF-CELL-ERYTHROBLAST-CELL-PLASMA-CELL",
      primaryCell:
        "CELL-ERYTHROBLAST",
      differentialCell:
        "CELL-PLASMA-CELL",
      similarity: 0.54,
      specimenTypes: [
        "BONE_MARROW_ASPIRATE",
      ],
      sharedFeatures: [
        "eccentric_nucleus",
        "basophilic_cytoplasm",
      ],
      primaryExclusiveFeatures: [
        "coarse_condensed_chromatin",
        "erythroid_cytoplasm",
      ],
      differentialExclusiveFeatures: [
        "clock_face_chromatin",
        "perinuclear_hof",
      ],
      primaryExclusionFeatures: [
        "perinuclear_hof",
      ],
      differentialExclusionFeatures: [
        "erythroid_cytoplasm",
      ],
      recommendedTests: [
        test(
          "BONE_MARROW_REVIEW",
          "Revisão do mielograma",
          "Correlacionar com maturação eritroide e plasmocitária.",
        ),
      ],
      narrative:
        "Hemoglobinização citoplasmática e picnose favorecem eritroblasto; cromatina em roda de carro e hof perinuclear favorecem plasmócito.",
    }),
  ]);
