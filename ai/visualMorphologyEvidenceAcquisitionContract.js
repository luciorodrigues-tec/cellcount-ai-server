// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.7 — VISUAL MORPHOLOGY EVIDENCE ACQUISITION CONTRACT (VME-1.0)
//
// Purpose
// -------
// Validate that an ai_visual model response actually contains morphology
// evidence before normalization/governors are allowed to interpret it.
// A response containing only boolean visual flags is NOT a complete visual
// morphology acquisition.
//
// Scientific invariant
// --------------------
// INCOMPLETE_VISUAL_EVIDENCE != NEGATIVE_MORPHOLOGY
// LIMITED_FIELD != NO_MORPHOLOGY
// ============================================================================

export const VISUAL_MORPHOLOGY_EVIDENCE_ACQUISITION_VERSION = "VME-1.0";
export const PRODUCTION_VME_ENFORCEMENT_VERSION = "BE-FIX-005.8";
export const LOCAL_MORPHOLOGY_ACQUISITION_RECOVERY_VERSION = "BE-FIX-005.9";

const STATUS = Object.freeze({
  COMPLETE: "COMPLETE",
  INCOMPLETE: "INCOMPLETE_VISUAL_EVIDENCE",
  NOT_APPLICABLE: "NOT_APPLICABLE",
});

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function finiteNumber(value) {
  // BE-FIX-005.8: null/undefined/blank are UNKNOWN, never numeric zero.
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function nonEmptyArray(value) {
  return Array.isArray(value) && value.some((item) => {
    if (typeof item === "string") return item.trim().length > 0;
    return item && typeof item === "object";
  });
}

function fieldText(raw = {}) {
  const observed = asObject(raw.observedMorphology);
  const lme = asObject(raw.localMorphologyEvidence);
  const seeing = asObject(raw.whatAISees);
  const morphology = asObject(raw.morphologyAnalysis);
  const visual = asObject(morphology.visualMorphologyDescription);

  return asText(observed.globalField) ||
    asText(lme?.field?.description) ||
    asText(seeing.globalField) ||
    asText(visual.globalView);
}

function domainDescription(raw = {}, domain) {
  const observed = asObject(raw.observedMorphology);
  const lme = asObject(raw.localMorphologyEvidence);
  const seeing = asObject(raw.whatAISees);
  const morphology = asObject(raw.morphologyAnalysis);

  if (domain === "erythrocytes") {
    return asText(observed?.erythrocytes?.description) ||
      asText(lme?.erythrocytes?.description) ||
      asText(seeing.erythrocytes) ||
      asText(morphology.erythrocyteReview);
  }

  if (domain === "leukocytes") {
    return asText(observed?.leukocytes?.description) ||
      asText(lme?.leukocytes?.description) ||
      asText(seeing.leukocytes) ||
      asText(morphology.leukocyteReview);
  }

  return asText(observed?.platelets?.description) ||
    asText(lme?.platelets?.description) ||
    asText(seeing.platelets) ||
    asText(morphology.plateletReview);
}

function visibleLeukocyteCount(raw = {}) {
  const observed = asObject(raw.observedMorphology);
  const lme = asObject(raw.localMorphologyEvidence);
  const fieldAdequacy = asObject(raw.fieldAdequacy);
  const extraction = asObject(raw.visualExtraction);

  return finiteNumber(observed?.leukocytes?.approximateVisibleCells) ??
    finiteNumber(lme?.leukocytes?.observedCellCount) ??
    finiteNumber(lme?.leukocytes?.approximateVisibleCells) ??
    finiteNumber(fieldAdequacy.visibleLeukocytes) ??
    finiteNumber(extraction.visibleLeukocytes);
}

function detailedLeukocyteEvidence(raw = {}) {
  const observed = asObject(raw.observedMorphology);
  const lme = asObject(raw.localMorphologyEvidence);
  const morphology = asObject(raw.morphologyAnalysis);
  const visual = asObject(morphology.visualMorphologyDescription);
  const cell = asObject(morphology.cellMorphology);

  const values = [
    observed?.leukocytes?.heterogeneity,
    observed?.leukocytes?.nuclearMorphology,
    observed?.leukocytes?.chromatin,
    observed?.leukocytes?.nucleoli,
    observed?.leukocytes?.cytoplasm,
    observed?.leukocytes?.maturation,
    observed?.leukocytes?.atypia,
    observed?.leukocytes?.blastLikeFeatures,
    lme?.leukocytes?.heterogeneity,
    lme?.leukocytes?.nuclearMorphology,
    lme?.leukocytes?.chromatin,
    lme?.leukocytes?.nucleoli,
    lme?.leukocytes?.cytoplasm,
    lme?.leukocytes?.maturation,
    visual.nuclearFeatures,
    visual.cytoplasmicFeatures,
    cell.nuclearMorphology,
    cell.chromatin,
    cell.cytoplasm,
    cell.maturation,
  ];

  return values.some((value) => asText(value).length > 0);
}

function hasMorphologyContainer(raw = {}) {
  const observed = asObject(raw.observedMorphology);
  const lme = asObject(raw.localMorphologyEvidence);
  const morphology = asObject(raw.morphologyAnalysis);

  return Object.keys(observed).length > 0 ||
    Object.keys(lme).length > 0 ||
    Object.keys(morphology).length > 0;
}

export function assessVisualMorphologyEvidenceAcquisition({
  visionResponse = {},
  analysisSource = "ai_visual",
} = {}) {
  if (analysisSource !== "ai_visual" && analysisSource !== "hybrid") {
    return {
      contractVersion: VISUAL_MORPHOLOGY_EVIDENCE_ACQUISITION_VERSION,
      productionEnforcementVersion: PRODUCTION_VME_ENFORCEMENT_VERSION,
      status: STATUS.NOT_APPLICABLE,
      complete: true,
      retryRecommended: false,
      missingRequirements: [],
      acquiredDomains: {},
    };
  }

  const raw = asObject(visionResponse);
  const missingRequirements = [];

  const field = fieldText(raw);
  const erythrocytes = domainDescription(raw, "erythrocytes");
  const leukocytes = domainDescription(raw, "leukocytes");
  const platelets = domainDescription(raw, "platelets");
  const visibleLeukocytes = visibleLeukocyteCount(raw);
  const leukocyteDetail = detailedLeukocyteEvidence(raw);
  const morphologyContainer = hasMorphologyContainer(raw);

  if (!morphologyContainer) missingRequirements.push("morphology_container");
  if (!field) missingRequirements.push("field_description");
  if (!erythrocytes) missingRequirements.push("erythrocyte_description");
  if (!leukocytes) missingRequirements.push("leukocyte_description");
  if (!platelets) missingRequirements.push("platelet_description");
  if (visibleLeukocytes === null) missingRequirements.push("visible_leukocyte_count");
  if (!leukocyteDetail) missingRequirements.push("leukocyte_morphology_detail");

  // Positive/negative arrays are useful provenance. They are not mandatory if
  // morphology is otherwise complete, because a truly bland field can have no
  // positive findings.
  const hasPositiveEvidence =
    nonEmptyArray(raw.positiveFindings) ||
    nonEmptyArray(raw?.observedMorphology?.positiveEvidence) ||
    nonEmptyArray(raw?.localMorphologyEvidence?.positiveEvidence);

  const complete = missingRequirements.length === 0;

  return {
    contractVersion: VISUAL_MORPHOLOGY_EVIDENCE_ACQUISITION_VERSION,
    productionEnforcementVersion: PRODUCTION_VME_ENFORCEMENT_VERSION,
    status: complete ? STATUS.COMPLETE : STATUS.INCOMPLETE,
    complete,
    retryRecommended: !complete,
    missingRequirements,
    acquiredDomains: {
      field: Boolean(field),
      erythrocytes: Boolean(erythrocytes),
      leukocytes: Boolean(leukocytes),
      platelets: Boolean(platelets),
      leukocyteMorphologyDetail: leukocyteDetail,
      visibleLeukocyteCount: visibleLeukocytes,
      positiveEvidence: hasPositiveEvidence,
    },
    invariants: {
      incompleteEvidenceIsNotNegativeMorphology: true,
      limitedFieldDoesNotEraseMorphology: true,
      morphologyRequiredBeforeInterpretation: true,
    },
  };
}

export function mergeVisualMorphologyRepair(
  originalResponse = {},
  repairResponse = {},
) {
  const original = asObject(originalResponse);
  const repair = asObject(repairResponse);

  const merged = {
    ...original,
    ...repair,
  };

  // Do not let a repair response erase useful first-pass structures.
  const objectKeys = [
    "imageQuality",
    "visualExtraction",
    "whatAISees",
    "fieldAdequacy",
    "observedMorphology",
    "academicInterpretation",
    "morphologyAnalysis",
    "visualEvidence",
  ];

  for (const key of objectKeys) {
    merged[key] = {
      ...asObject(original[key]),
      ...asObject(repair[key]),
    };
  }

  const arrayKeys = [
    "positiveFindings",
    "negativeFindingsStructured",
    "heatmapRegions",
  ];

  for (const key of arrayKeys) {
    if (Array.isArray(repair[key])) merged[key] = repair[key];
    else if (Array.isArray(original[key])) merged[key] = original[key];
  }

  return merged;
}


// ============================================================================
// BE-FIX-005.8 — PRODUCTION ACQUISITION PROFILE
// One compact, schema-constrained visual pass. The downstream LME/AMR engines
// perform interpretation, so the vision model is not asked to write the whole
// clinical report. This reduces prompt/output load and prevents boolean-only
// JSON from satisfying the acquisition contract.
// ============================================================================

export function buildPrimaryVisualMorphologyAcquisitionPrompt() {
  return `
CELLCOUNT VME-1.0 — AQUISIÇÃO MORFOLÓGICA VISUAL

Você é um observador citomorfológico. Analise SOMENTE o que é diretamente
visível nas imagens de sangue periférico. Sua tarefa é ADQUIRIR EVIDÊNCIA,
não produzir diagnóstico nem relatório clínico final.

REGRAS OBRIGATÓRIAS:
- Descreva hemácias, células nucleadas/leucócitos e plaquetas visíveis.
- Conte aproximadamente as células nucleadas VISÍVEIS. Se a contagem não puder
  ser feita com segurança, use null e countStatus="NOT_ASSESSABLE". Nunca use 0
  para significar desconhecido.
- Campo limitado restringe inferência populacional, mas NÃO apaga morfologia
  local diretamente observada.
- Separe representatividade de morfologia.
- Para núcleo/cromatina/nucléolos/citoplasma/maturação, descreva o observável;
  quando não avaliável, escreva explicitamente "não avaliável".
- Achado não observado deve ser restrito ao campo; não faça exclusão global.
- Não invente contagens diferenciais, índices hematimétricos ou diagnóstico.
- Não conclua leucemia, linfoma, neoplasia, malignidade ou parasitemia.
- Responda somente no formato JSON exigido pelo schema.

Prioridade: descrição concreta das células > frases genéricas de segurança.
`;
}

function nullableIntegerSchema() {
  return {
    anyOf: [
      { type: "integer", minimum: 0 },
      { type: "null" },
    ],
  };
}

function stringArraySchema() {
  return { type: "array", items: { type: "string" } };
}

export function buildVisualMorphologyAcquisitionResponseFormat() {
  return {
    type: "json_schema",
    json_schema: {
      name: "cellcount_visual_morphology_acquisition_vme_1_0",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          observedMorphology: {
            type: "object",
            additionalProperties: false,
            properties: {
              globalField: { type: "string" },
              technicalQuality: { type: "string" },
              representativity: { type: "string" },
              erythrocytes: {
                type: "object",
                additionalProperties: false,
                properties: {
                  description: { type: "string" },
                  size: { type: "string" },
                  chromia: { type: "string" },
                  anisocytosis: { type: "string" },
                  poikilocytosis: { type: "string" },
                  specificForms: stringArraySchema(),
                  artifactConsiderations: { type: "string" },
                },
                required: ["description", "size", "chromia", "anisocytosis", "poikilocytosis", "specificForms", "artifactConsiderations"],
              },
              leukocytes: {
                type: "object",
                additionalProperties: false,
                properties: {
                  description: { type: "string" },
                  approximateVisibleCells: nullableIntegerSchema(),
                  countStatus: { type: "string", enum: ["OBSERVED_COUNT", "NOT_ASSESSABLE"] },
                  heterogeneity: { type: "string" },
                  nuclearMorphology: { type: "string" },
                  chromatin: { type: "string" },
                  nucleoli: { type: "string" },
                  cytoplasm: { type: "string" },
                  maturation: { type: "string" },
                  atypia: { type: "string" },
                  blastLikeFeatures: { type: "string" },
                },
                required: ["description", "approximateVisibleCells", "countStatus", "heterogeneity", "nuclearMorphology", "chromatin", "nucleoli", "cytoplasm", "maturation", "atypia", "blastLikeFeatures"],
              },
              platelets: {
                type: "object",
                additionalProperties: false,
                properties: {
                  description: { type: "string" },
                  distribution: { type: "string" },
                  size: { type: "string" },
                  aggregates: { type: "string" },
                },
                required: ["description", "distribution", "size", "aggregates"],
              },
              artifacts: stringArraySchema(),
              positiveEvidence: stringArraySchema(),
              uncertainty: stringArraySchema(),
            },
            required: ["globalField", "technicalQuality", "representativity", "erythrocytes", "leukocytes", "platelets", "artifacts", "positiveEvidence", "uncertainty"],
          },
          fieldAdequacy: {
            type: "object",
            additionalProperties: false,
            properties: {
              visibleLeukocytes: nullableIntegerSchema(),
              adequateForLeukocyteAnalysis: { type: "boolean" },
              adequateForBlastScreening: { type: "boolean" },
              adequateForPopulationAssessment: { type: "boolean" },
              limitedField: { type: "boolean" },
              limitationReason: { type: "string" },
            },
            required: ["visibleLeukocytes", "adequateForLeukocyteAnalysis", "adequateForBlastScreening", "adequateForPopulationAssessment", "limitedField", "limitationReason"],
          },
          imageQuality: {
            type: "object",
            additionalProperties: false,
            properties: {
              classification: { type: "string" },
              description: { type: "string" },
              limitations: stringArraySchema(),
            },
            required: ["classification", "description", "limitations"],
          },
          findings: {
            type: "object",
            additionalProperties: false,
            properties: {
              reactiveLymphocytes: { type: "boolean" },
              largeMononuclearCells: { type: "boolean" },
              plasmacytoidCells: { type: "boolean" },
              plasmocytes: { type: "boolean" },
              plasmablasts: { type: "boolean" },
              atypicalLymphocytes: { type: "boolean" },
              monomorphicPopulation: { type: "boolean" },
              immatureCells: { type: "boolean" },
              blastSuspicion: { type: "boolean" },
            },
            required: ["reactiveLymphocytes", "largeMononuclearCells", "plasmacytoidCells", "plasmocytes", "plasmablasts", "atypicalLymphocytes", "monomorphicPopulation", "immatureCells", "blastSuspicion"],
          },
          visualEvidence: {
            type: "object",
            additionalProperties: false,
            properties: {
              cellSizeIncrease: { type: "boolean" },
              abundantBasophilicCytoplasm: { type: "boolean" },
              erythrocyteMolding: { type: "boolean" },
              irregularCellBorders: { type: "boolean" },
              eccentricNucleus: { type: "boolean" },
              prominentNucleolus: { type: "boolean" },
            },
            required: ["cellSizeIncrease", "abundantBasophilicCytoplasm", "erythrocyteMolding", "irregularCellBorders", "eccentricNucleus", "prominentNucleolus"],
          },
          positiveFindings: stringArraySchema(),
          negativeFindingsStructured: stringArraySchema(),
          heatmapRegions: { type: "array", items: { type: "object", properties: {}, additionalProperties: false }, maxItems: 0 },
        },
        required: ["observedMorphology", "fieldAdequacy", "imageQuality", "findings", "visualEvidence", "positiveFindings", "negativeFindingsStructured", "heatmapRegions"],
      },
    },
  };
}

export function shouldAttemptVisualMorphologyRepair({
  acquisition = {},
  primaryElapsedMs = Infinity,
  repairEnabled = false,
  latencyBudgetMs = 45000,
} = {}) {
  if (acquisition?.retryRecommended !== true) return false;
  if (repairEnabled !== true) return false;
  const elapsed = Number(primaryElapsedMs);
  if (!Number.isFinite(elapsed)) return false;
  return elapsed < Math.max(0, Number(latencyBudgetMs) || 0);
}

export function buildVisualMorphologyRepairPrompt({
  missingRequirements = [],
} = {}) {
  const missing = Array.isArray(missingRequirements)
    ? missingRequirements.join(", ")
    : "morphology evidence";

  return `${buildPrimaryVisualMorphologyAcquisitionPrompt()}

VME-1.0 REPAIR PASS
A aquisição anterior ficou incompleta. Itens ausentes: ${missing}.
Preencha o schema obrigatório com morfologia concreta diretamente observável.
Se uma característica não puder ser avaliada, escreva "não avaliável".
Não transformar "não observado neste campo" em ausência global na lâmina.
Não substitua descrição morfológica por frases genéricas de campo limitado.
`;
}

export function visualMorphologyEvidenceAcquisitionContractStatus(value = {}) {
  const contract = asObject(value);
  const problems = [];

  if (
    contract.contractVersion !==
    VISUAL_MORPHOLOGY_EVIDENCE_ACQUISITION_VERSION
  ) {
    problems.push("invalid_contract_version");
  }

  if (contract.complete === true && contract.status !== STATUS.COMPLETE &&
      contract.status !== STATUS.NOT_APPLICABLE) {
    problems.push("complete_status_mismatch");
  }

  if (contract.complete === false && contract.status !== STATUS.INCOMPLETE) {
    problems.push("incomplete_status_mismatch");
  }

  if (!Array.isArray(contract.missingRequirements)) {
    problems.push("missing_requirements_not_array");
  }

  return {
    valid: problems.length === 0,
    problems,
  };
}

export default assessVisualMorphologyEvidenceAcquisition;


// ============================================================================
// BE-FIX-005.9 — SAFE INCOMPLETE ACQUISITION RESPONSE
// ============================================================================
export function buildIncompleteVisualAcquisitionResponse({
  acquisition = {},
  primaryElapsedMs = null,
  requestId = "",
} = {}) {
  return {
    success: false,
    errorCode: "INCOMPLETE_VISUAL_EVIDENCE",
    error:
      "A aquisição morfológica visual não produziu evidência suficiente para um relatório confiável.",
    requiresRetry: true,
    requiresHumanReview: true,
    visualMorphologyEvidenceAcquisition: {
      ...asObject(acquisition),
      contractVersion: VISUAL_MORPHOLOGY_EVIDENCE_ACQUISITION_VERSION,
      productionEnforcementVersion: PRODUCTION_VME_ENFORCEMENT_VERSION,
    },
    metadata: {
      requestId,
      primaryElapsedMs: finiteNumber(primaryElapsedMs),
      safeFailureMode: true,
      reportSuppressed: true,
    },
  };
}
