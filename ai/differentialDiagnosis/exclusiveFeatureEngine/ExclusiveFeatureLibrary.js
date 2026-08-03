function freezeEntry(
  featureId,
  specificity,
  sensitivity,
  crossLineagePenalty = 0,
  metadata = {},
) {
  return Object.freeze({
    featureId,
    specificity,
    sensitivity,
    crossLineagePenalty,
    metadata:
      Object.freeze({
        ...metadata,
      }),
  });
}

export const exclusiveFeatureLibrary =
  Object.freeze({
    perinuclear_hof:
      freezeEntry(
        "perinuclear_hof",
        0.97,
        0.88,
        0.03,
        { favoredLineage: "PLASMA_CELL" },
      ),
    eccentric_nucleus:
      freezeEntry(
        "eccentric_nucleus",
        0.82,
        0.84,
        0.10,
        { favoredLineage: "PLASMA_CELL" },
      ),
    abundant_basophilic_cytoplasm:
      freezeEntry(
        "abundant_basophilic_cytoplasm",
        0.78,
        0.86,
        0.12,
        { favoredLineage: "PLASMA_OR_REACTIVE" },
      ),
    scant_cytoplasm:
      freezeEntry(
        "scant_cytoplasm",
        0.72,
        0.81,
        0.18,
        { favoredLineage: "BLAST" },
      ),
    auer_rod:
      freezeEntry(
        "auer_rod",
        0.99,
        0.52,
        0.01,
        { favoredLineage: "MYELOID" },
      ),
    primary_azurophilic_granules:
      freezeEntry(
        "primary_azurophilic_granules",
        0.90,
        0.79,
        0.05,
        { favoredLineage: "PROMYELOCYTE" },
      ),
    visible_nucleoli:
      freezeEntry(
        "visible_nucleoli",
        0.45,
        0.83,
        0.40,
        { favoredLineage: "IMMATURE_CELL" },
      ),
    fine_chromatin:
      freezeEntry(
        "fine_chromatin",
        0.42,
        0.87,
        0.42,
        { favoredLineage: "IMMATURE_CELL" },
      ),
    high_nc_ratio:
      freezeEntry(
        "high_nc_ratio",
        0.40,
        0.88,
        0.45,
        { favoredLineage: "IMMATURE_CELL" },
      ),
    clock_face_chromatin:
      freezeEntry(
        "clock_face_chromatin",
        0.95,
        0.84,
        0.04,
        { favoredLineage: "PLASMA_CELL" },
      ),
    erythrocyte_skirting:
      freezeEntry(
        "erythrocyte_skirting",
        0.88,
        0.76,
        0.06,
        { favoredLineage: "REACTIVE_LYMPHOCYTE" },
      ),
    polymorphic_population:
      freezeEntry(
        "polymorphic_population",
        0.85,
        0.80,
        0.08,
        { favoredLineage: "REACTIVE" },
      ),
    monomorphic_population:
      freezeEntry(
        "monomorphic_population",
        0.74,
        0.82,
        0.16,
        { favoredLineage: "CLONAL_OR_BLAST" },
      ),
    band_shaped_nucleus:
      freezeEntry(
        "band_shaped_nucleus",
        0.94,
        0.89,
        0.02,
        { favoredLineage: "BAND_NEUTROPHIL" },
      ),
    segmented_nucleus:
      freezeEntry(
        "segmented_nucleus",
        0.96,
        0.93,
        0.02,
        { favoredLineage: "SEGMENTED_NEUTROPHIL" },
      ),
    nuclear_indent:
      freezeEntry(
        "nuclear_indent",
        0.82,
        0.85,
        0.10,
        { favoredLineage: "METAMYELOCYTE" },
      ),
    folded_kidney_nucleus:
      freezeEntry(
        "folded_kidney_nucleus",
        0.84,
        0.79,
        0.10,
        { favoredLineage: "MONOCYTE_OR_METAMYELOCYTE" },
      ),
    gray_blue_cytoplasm:
      freezeEntry(
        "gray_blue_cytoplasm",
        0.80,
        0.82,
        0.12,
        { favoredLineage: "MONOCYTE" },
      ),
    erythroid_cytoplasm:
      freezeEntry(
        "erythroid_cytoplasm",
        0.92,
        0.86,
        0.04,
        { favoredLineage: "ERYTHROID" },
      ),
    dense_clumped_chromatin:
      freezeEntry(
        "dense_clumped_chromatin",
        0.66,
        0.88,
        0.24,
        { favoredLineage: "MATURE_LYMPHOID" },
      ),
  });

export function getExclusiveFeatureProfile(
  featureId,
) {
  return (
    exclusiveFeatureLibrary[
      featureId
    ] ||
    Object.freeze({
      featureId,
      specificity: 0.50,
      sensitivity: 0.50,
      crossLineagePenalty: 0.25,
      metadata:
        Object.freeze({
          inferred: true,
        }),
    })
  );
}
