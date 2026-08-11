// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.5.1 — ACADEMIC MORPHOLOGY REASONING CONTRACT (AMR-1.0)
//
// Purpose
// -------
// Derive an academic/teaching representation from LME-1.0 without inventing
// morphology, changing clinical classification, or allowing field adequacy to
// erase directly observed evidence.
//
// Invariants
// ----------
// 1. AMR derives from localMorphologyEvidence (LME-1.0).
// 2. AMR never creates a new visual finding.
// 3. Hypothesis != diagnosis.
// 4. LIMITED_FIELD restricts inference, not description.
// 5. NOT_OBSERVED_IN_EVALUABLE_FIELD != ABSENT_IN_SPECIMEN.
// ============================================================================

export const ACADEMIC_MORPHOLOGY_REASONING_VERSION = "AMR-1.0";

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function asArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : item))
    .filter((item) => item !== "" && item !== null && item !== undefined);
}

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueStrings(values = []) {
  return [
    ...new Set(
      values
        .filter((value) => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
}

function pushFeature(target, domain, feature, value, sourcePath) {
  const text = asText(value);
  if (!text) return;

  target.push({
    domain,
    feature,
    observation: text,
    sourcePath,
  });
}

function deriveMorphologicFeatures(lme = {}) {
  const features = [];
  const rbc = asObject(lme.erythrocytes);
  const wbc = asObject(lme.leukocytes);
  const plt = asObject(lme.platelets);

  pushFeature(features, "erythrocyte", "size", rbc.size,
    "localMorphologyEvidence.erythrocytes.size");
  pushFeature(features, "erythrocyte", "shape", rbc.shape,
    "localMorphologyEvidence.erythrocytes.shape");
  pushFeature(features, "erythrocyte", "chromia", rbc.chromia,
    "localMorphologyEvidence.erythrocytes.chromia");
  pushFeature(features, "erythrocyte", "distribution", rbc.distribution,
    "localMorphologyEvidence.erythrocytes.distribution");
  pushFeature(features, "erythrocyte", "anisocytosis", rbc.anisocytosis,
    "localMorphologyEvidence.erythrocytes.anisocytosis");
  pushFeature(features, "erythrocyte", "poikilocytosis", rbc.poikilocytosis,
    "localMorphologyEvidence.erythrocytes.poikilocytosis");

  for (const value of asArray(rbc.specificForms)) {
    pushFeature(features, "erythrocyte", "specificForm", value,
      "localMorphologyEvidence.erythrocytes.specificForms");
  }
  for (const value of asArray(rbc.inclusions)) {
    pushFeature(features, "erythrocyte", "inclusion", value,
      "localMorphologyEvidence.erythrocytes.inclusions");
  }

  pushFeature(features, "leukocyte", "heterogeneity", wbc.heterogeneity,
    "localMorphologyEvidence.leukocytes.heterogeneity");
  pushFeature(features, "leukocyte", "nuclearMorphology", wbc.nuclearMorphology,
    "localMorphologyEvidence.leukocytes.nuclearMorphology");
  pushFeature(features, "leukocyte", "chromatin", wbc.chromatin,
    "localMorphologyEvidence.leukocytes.chromatin");
  pushFeature(features, "leukocyte", "nucleoli", wbc.nucleoli,
    "localMorphologyEvidence.leukocytes.nucleoli");
  pushFeature(features, "leukocyte", "ncRatio", wbc.ncRatio,
    "localMorphologyEvidence.leukocytes.ncRatio");
  pushFeature(features, "leukocyte", "cytoplasm", wbc.cytoplasm,
    "localMorphologyEvidence.leukocytes.cytoplasm");
  pushFeature(features, "leukocyte", "granulation", wbc.granulation,
    "localMorphologyEvidence.leukocytes.granulation");
  pushFeature(features, "leukocyte", "maturation", wbc.maturation,
    "localMorphologyEvidence.leukocytes.maturation");
  pushFeature(features, "leukocyte", "atypia", wbc.atypia,
    "localMorphologyEvidence.leukocytes.atypia");
  pushFeature(features, "leukocyte", "blastLikeFeatures", wbc.blastLikeFeatures,
    "localMorphologyEvidence.leukocytes.blastLikeFeatures");

  for (const value of asArray(wbc.inclusions)) {
    pushFeature(features, "leukocyte", "inclusion", value,
      "localMorphologyEvidence.leukocytes.inclusions");
  }

  pushFeature(features, "platelet", "distribution", plt.distribution,
    "localMorphologyEvidence.platelets.distribution");
  pushFeature(features, "platelet", "size", plt.size,
    "localMorphologyEvidence.platelets.size");
  pushFeature(features, "platelet", "aggregates", plt.aggregates,
    "localMorphologyEvidence.platelets.aggregates");
  pushFeature(features, "platelet", "morphology", plt.morphology,
    "localMorphologyEvidence.platelets.morphology");

  return features;
}

function deriveWhatISee(lme = {}) {
  const academic = asObject(lme.academicReasoning);
  const field = asObject(lme.field);
  const rbc = asObject(lme.erythrocytes);
  const wbc = asObject(lme.leukocytes);
  const plt = asObject(lme.platelets);

  const explicit = asArray(academic.whatISee);
  if (explicit.length) return uniqueStrings(explicit);

  return uniqueStrings([
    asText(field.description),
    asText(rbc.description),
    asText(wbc.description),
    asText(plt.description),
    ...asArray(rbc.observations),
    ...asArray(wbc.observations),
    ...asArray(plt.observations),
    ...asArray(lme.positiveEvidence),
  ]);
}

function deriveCannotConfirm(lme = {}, limitedField = false) {
  const academic = asObject(lme.academicReasoning);

  const limitations = [
    ...asArray(academic.cannotConfirm),
    ...asArray(lme.uncertainties),
    ...asArray(lme.field?.technicalLimitations),
    ...asArray(lme.erythrocytes?.uncertainties),
    ...asArray(lme.leukocytes?.uncertainties),
    ...asArray(lme.platelets?.uncertainties),
  ];

  if (limitedField) {
    limitations.push(
      "A frequência populacional dos achados não pode ser inferida com segurança a partir deste campo isolado.",
      "A distribuição dos achados em toda a lâmina não pode ser confirmada neste campo.",
      "A não visualização de uma estrutura neste campo não permite afirmar sua ausência global na lâmina.",
    );
  }

  return uniqueStrings(limitations);
}

function deriveTeachingPoints(lme = {}, limitedField = false) {
  const academic = asObject(lme.academicReasoning);
  const points = [...asArray(academic.teachingPoints)];

  if (limitedField) {
    points.push(
      "Separar descrição morfológica local de representatividade: um campo limitado pode conter células morfologicamente avaliáveis.",
      "Achado negativo em campo limitado deve ser expresso como não observado entre os elementos avaliáveis, e não como ausência na lâmina.",
    );
  }

  if (lme.criticalMorphology?.blastLikeMorphology ===
      "NOT_OBSERVED_IN_EVALUABLE_FIELD") {
    points.push(
      "A ausência de morfologia blastoide inequívoca nas células avaliáveis não exclui células imaturas em outros campos.",
    );
  }

  return uniqueStrings(points);
}

function resolveLimitedField({ fieldAdequacy = {}, evidenceGovernance = {} } = {}) {
  const field = asObject(fieldAdequacy);
  const governance = asObject(evidenceGovernance);

  return (
    field.limitedField === true ||
    field.adequateForPopulationAssessment === false ||
    field.populationInferenceAllowed === false ||
    governance.limitedField === true ||
    governance.populationInferenceAllowed === false
  );
}

export function createAcademicMorphologyReasoning({
  localMorphologyEvidence = {},
  fieldAdequacy = {},
  evidenceGovernance = {},
} = {}) {
  const lme = asObject(localMorphologyEvidence);
  const academic = asObject(lme.academicReasoning);
  const evidenceAvailable = lme.evidenceAvailable === true;
  const limitedField = resolveLimitedField({
    fieldAdequacy,
    evidenceGovernance,
  });

  const whatISee = deriveWhatISee(lme);
  const morphologicFeatures = deriveMorphologicFeatures(lme);

  return {
    contractVersion: ACADEMIC_MORPHOLOGY_REASONING_VERSION,
    evidenceSource: lme.contractVersion || "LME-UNKNOWN",
    evidenceAvailable,
    reasoningScope: limitedField ? "FIELD_SCOPED" : "OBSERVED_MATERIAL",

    whatISee,
    morphologicFeatures,

    // These sections are preserved only when already supplied by the
    // evidence contract. This module does not invent a differential.
    whatItResembles: uniqueStrings(asArray(academic.whatItResembles)),
    evidenceFor: uniqueStrings([
      ...asArray(academic.evidenceFor),
      ...asArray(lme.positiveEvidence),
    ]),
    evidenceAgainst: uniqueStrings(asArray(academic.evidenceAgainst)),
    differentialMorphology: uniqueStrings(
      asArray(academic.differentialMorphology),
    ),

    cannotConfirm: deriveCannotConfirm(lme, limitedField),
    hematologicMeaning: [],

    teachingPoints: deriveTeachingPoints(lme, limitedField),

    reasoningTrace: [
      {
        step: "OBSERVATION",
        source: "localMorphologyEvidence",
        statement:
          "A descrição acadêmica foi derivada da evidência morfológica local preservada.",
      },
      {
        step: "REPRESENTATIVITY",
        source: "fieldAdequacy",
        statement: limitedField
          ? "A representatividade limita inferências populacionais, mas não apaga a morfologia local."
          : "O escopo de raciocínio permanece restrito ao material efetivamente observado.",
      },
      {
        step: "DIAGNOSTIC_BOUNDARY",
        source: "AMR-1.0",
        statement:
          "Semelhança morfológica e hipótese diferencial não equivalem a diagnóstico.",
      },
    ],

    provenance: {
      derivedFromLocalEvidence: true,
      diagnosisIndependent: true,
      governorIndependent: true,
      fieldAdequacyDoesNotReplaceMorphology: true,
      syntheticMorphologyForbidden: true,
    },
  };
}

export function attachAcademicMorphologyReasoning(
  result = {},
  reasoning = {},
) {
  if (!result || typeof result !== "object") return result;

  return {
    ...result,
    academicMorphologyReasoning: reasoning,
  };
}

export function academicMorphologyReasoningContractStatus(reasoning = {}) {
  const value = asObject(reasoning);
  const problems = [];

  if (value.contractVersion !== ACADEMIC_MORPHOLOGY_REASONING_VERSION) {
    problems.push("invalid_contract_version");
  }

  if (value.evidenceAvailable === true && asArray(value.whatISee).length === 0) {
    problems.push("evidence_available_without_what_i_see");
  }

  if (value.provenance?.derivedFromLocalEvidence !== true) {
    problems.push("reasoning_not_marked_as_lme_derived");
  }

  if (value.provenance?.syntheticMorphologyForbidden !== true) {
    problems.push("synthetic_morphology_guard_missing");
  }

  return {
    valid: problems.length === 0,
    problems,
  };
}

export default createAcademicMorphologyReasoning;
