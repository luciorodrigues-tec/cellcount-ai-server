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
export const SINGLE_BLAST_CONFIRMATION_ACQUISITION_VERSION = "BE-FIX-005.17";
export const HEMOPARASITE_HIGH_SALIENCE_ACQUISITION_VERSION = "BE-FIX-005.23";
export const VME_EFFECTIVE_REASONING_ZERO_EVIDENCE_VERSION = "BE-FIX-005.25";
export const MARROW_REPAIR_EVIDENCE_MERGE_VERSION = "BE-FIX-005.36";
export const MARROW_POSITIVE_CYTOLOGY_CARDINALITY_PRESERVATION_VERSION = "BE-FIX-005.36";
export const BONE_MARROW_COMPACT_ACQUISITION_VERSION = "BE-FIX-005.39";
export const BONE_MARROW_COMPLETE_LENGTH_RECOVERY_VERSION = "BE-FIX-005.39";

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



// ============================================================================
// BE-FIX-005.25 — BONE-MARROW VME / ZERO-EVIDENCE ASSESSMENT
// Bone marrow has a different acquisition contract from peripheral blood.
// It must not be rejected for lacking RBC/WBC/PLT peripheral-blood fields, but
// it must fail closed when the model returns no marrow morphology at all.
// ============================================================================

function hasObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0;
}

function hasSubstantiveMarrowField(raw = {}, key = "") {
  const value = asObject(raw[key]);
  if (!hasObject(value)) return false;

  const status = asText(value.status).toLowerCase();
  const texts = [
    value.summary, value.technicalQuality, value.representativity,
    value.maturation, value.dysplasia, value.estimate,
  ].map(asText).filter(Boolean);

  // A structurally present explicit NOT_ASSESSABLE is still valid acquisition
  // provenance. What is forbidden is an entirely absent marrow container.
  return Boolean(status) || texts.length > 0 ||
    value.observed !== undefined || value.suspected !== undefined ||
    value.estimatedPercentage !== undefined || value.evidenceState !== undefined;
}


function marrowImmatureCellCytologyRecoveryNeed(raw = {}) {
  const blast=asObject(raw.blastAssessment);
  const support=asObject(blast.morphologySupport);
  const subpopulation=asObject(blast.blastoidSubpopulationContext);
  const immatureCount=Number(blast.approximateImmatureCellCount);
  const burden=asText(blast.immatureCellBurden).toLowerCase();
  const distribution=asText(blast.spatialDistribution).toLowerCase();
  const multiple=(Number.isFinite(immatureCount)&&immatureCount>=3)||["multiple","numerous","increased"].includes(burden);
  const repeated=distribution.includes("repeated")||distribution.includes("across_field")||
    support.repeatedAcrossField===true||subpopulation.repeatedSubsetAcrossField===true;
  const cytology=[support.highNCRatio,support.openFineChromatin,support.nucleoli,support.scantBasophilicCytoplasm];
  const characterized=cytology.filter(v=>typeof v==="boolean").length;
  const positive=cytology.filter(v=>v===true).length;
  const state=asText(blast.evidenceState).toUpperCase();
  const positiveState=["OBSERVED_POPULATION","SUSPICIOUS_POPULATION","FOCAL_SUSPICION"].includes(state);
  const required=multiple&&repeated&&characterized<=1&&positive===0&&!positiveState&&blast.observed!==true;
  return {version:"BE-FIX-005.33",required,multipleImmatureCells:multiple,repeatedImmatureCells:repeated,
    characterizedBlastCytologyCount:characterized,positiveBlastCytologyCount:positive,
    approximateImmatureCellCount:Number.isFinite(immatureCount)?immatureCount:null};
}

export function assessBoneMarrowVisualEvidenceAcquisition({
  visionResponse = {},
  analysisSource = "ai_visual",
} = {}) {
  if (analysisSource !== "ai_visual" && analysisSource !== "hybrid") {
    return {
      contractVersion: VISUAL_MORPHOLOGY_EVIDENCE_ACQUISITION_VERSION,
      productionEnforcementVersion: PRODUCTION_VME_ENFORCEMENT_VERSION,
      effectiveReasoningGovernanceVersion: VME_EFFECTIVE_REASONING_ZERO_EVIDENCE_VERSION,
      specimenScope: "BONE_MARROW",
      status: STATUS.NOT_APPLICABLE,
      complete: true,
      retryRecommended: false,
      zeroEvidence: false,
      missingRequirements: [],
      acquiredDomains: {},
    };
  }

  const raw = asObject(visionResponse);
  const required = [
    "specimenAssessment",
    "marrowAdequacy",
    "myeloidSeries",
    "erythroidSeries",
    "megakaryocyticSeries",
    "blastAssessment",
  ];

  const acquired = Object.fromEntries(
    required.map((key) => [key, hasSubstantiveMarrowField(raw, key)]),
  );

  const missingRequirements = required
    .filter((key) => acquired[key] !== true)
    .map((key) => `marrow_${key}`);

  const marrowContainersPresent = [
    ...required,
    "plasmaCellAssessment",
    "dysplasiaAssessment",
    "infiltrationAssessment",
    "hemodilutionAssessment",
    "spiculeAssessment",
    "cellularityAssessment",
  ].filter((key) => hasObject(raw[key])).length;

  const zeroEvidence = marrowContainersPresent === 0;
  const complete = missingRequirements.length === 0 && !zeroEvidence;

  const blastAssessment = asObject(raw.blastAssessment);
  const blastSummary = asText(blastAssessment.summary).toLowerCase();
  const marrowNarrative = [
    blastSummary,
    asText(asObject(raw.myeloidSeries).summary).toLowerCase(),
    asText(asObject(raw.whatAISees).leukocytes).toLowerCase(),
    asText(asObject(raw.morphologyAnalysis).leukocyteReview).toLowerCase(),
  ].join(" ");
  const narrativeMentionsRepeatedImmature =
    /(múltipl|multipl|divers|repetid).*(imatur|blasto)|(?:imatur|blasto).*(repetid|ao longo do campo)/i.test(marrowNarrative);
  const structuredRepeat =
    asObject(blastAssessment.morphologySupport).repeatedAcrossField === true ||
    ["repeated", "dominant"].includes(asText(blastAssessment.populationPattern).toLowerCase());
  const narrativeStructuredDiscordance =
    narrativeMentionsRepeatedImmature && structuredRepeat !== true;

  const immatureCellCytologyRecovery =
    marrowImmatureCellCytologyRecoveryNeed(raw);

  // BE-FIX-005.35 — a repeated immature population with at least one acquired
  // blast-associated cytologic feature and narrative/structured discordance is
  // not "complete" simply because the blast container exists. It requires one
  // focal discrimination pass, while remaining non-positive until architecture
  // is established.
  const positiveCytologyDiscordanceRecoveryRequired =
    immatureCellCytologyRecovery.multipleImmatureCells === true &&
    immatureCellCytologyRecovery.repeatedImmatureCells === true &&
    immatureCellCytologyRecovery.positiveBlastCytologyCount >= 1 &&
    narrativeStructuredDiscordance === true &&
    !["OBSERVED_POPULATION","SUSPICIOUS_POPULATION","FOCAL_SUSPICION"].includes(
      asText(blastAssessment.evidenceState).toUpperCase(),
    );

  immatureCellCytologyRecovery.positiveCytologyDiscordanceRecoveryRequired =
    positiveCytologyDiscordanceRecoveryRequired;
  immatureCellCytologyRecovery.required =
    immatureCellCytologyRecovery.required === true ||
    positiveCytologyDiscordanceRecoveryRequired;

  if (
    immatureCellCytologyRecovery.required &&
    !missingRequirements.includes("blastAssessment.immatureCellCytology")
  ) {
    missingRequirements.push("blastAssessment.immatureCellCytology");
  }
  const effectiveComplete =
    complete && immatureCellCytologyRecovery.required !== true;

  return {
    contractVersion: VISUAL_MORPHOLOGY_EVIDENCE_ACQUISITION_VERSION,
    productionEnforcementVersion: PRODUCTION_VME_ENFORCEMENT_VERSION,
    effectiveReasoningGovernanceVersion: VME_EFFECTIVE_REASONING_ZERO_EVIDENCE_VERSION,
    specimenScope: "BONE_MARROW",
    status: effectiveComplete ? STATUS.COMPLETE : STATUS.INCOMPLETE,
    complete: effectiveComplete,
    retryRecommended: !effectiveComplete,
    immatureCellCytologyRecoveryRequired:
      immatureCellCytologyRecovery.required === true,
    positiveCytologyConsistencyVersion: "BE-FIX-005.35",
    acquisitionDiscordanceRecoveryVersion: "BE-FIX-005.35",
    immatureCellCytologyRecovery,
    zeroEvidence,
    missingRequirements,
    acquiredDomains: {
      ...acquired,
      marrowContainersPresent,
      blastPopulationEvidenceState:
        asText(asObject(raw.blastAssessment).evidenceState) || null,
      narrativeMentionsRepeatedImmature,
      structuredRepeat,
      narrativeStructuredDiscordance,
    },
    invariants: {
      incompleteEvidenceIsNotNegativeMorphology: true,
      zeroEvidenceCannotGenerateNegativeFindings: true,
      limitedFieldDoesNotErasePositiveMarrowMorphology: true,
      morphologyRequiredBeforeInterpretation: true,
    },
  };
}

export function buildBoneMarrowCompactAcquisitionPrompt() {
  return `CELLCOUNT BE-FIX-005.39 — COMPACT BONE MARROW ACQUISITION

Você é um observador citomorfológico de aspirado de medula óssea.
Sua tarefa é ADQUIRIR EVIDÊNCIA ESTRUTURADA, não escrever relatório clínico.
Responda SOMENTE JSON válido, curto e objetivo.

REGRAS ABSOLUTAS:
- Nunca diagnosticar LMA, LLA, LMC, MPN, SMD, mieloma, linfoma ou BCR::ABL1.
- Nunca usar ausência de avaliação como ausência morfológica.
- Campo único limita inferência global, mas não apaga achado positivo local.
- Use null ou status="notAssessable" quando não avaliável.
- Não produzir interpretação educacional longa, diferenciais, recomendações ou narrativa clínica extensa.
- Preencha primeiro os 6 DOMÍNIOS OBRIGATÓRIOS abaixo. Os demais são opcionais.

JSON OBRIGATÓRIO:
{
  "specimenAssessment":{"status":"present|notObserved|notAssessable|indeterminate","summary":"","specimenType":"BONE_MARROW_ASPIRATE|HEMODILUTED_BONE_MARROW|BONE_MARROW_BIOPSY|indeterminate"},
  "marrowAdequacy":{"status":"present|notObserved|notAssessable|indeterminate","technicalQuality":"","representativity":"","summary":""},
  "myeloidSeries":{"status":"present|notObserved|notAssessable|indeterminate","maturation":"","dysplasia":"","summary":"","expansionContext":{"relativeMyeloidPredominance":null,"broadMaturationSpectrum":null,"numerousGranulocyticPrecursors":null,"matureNeutrophilicFormsPresent":null,"leftShiftedMaturationSpectrum":null,"basophilEosinophilEnrichment":null,"erythroidRelativeReduction":null,"disproportionateMyeloidRepresentation":null,"denseMyeloidField":null}},
  "erythroidSeries":{"status":"present|notObserved|notAssessable|indeterminate","maturation":"","dysplasia":"","summary":""},
  "megakaryocyticSeries":{"status":"present|notObserved|notAssessable|indeterminate","maturation":"","dysplasia":"","summary":""},
  "blastAssessment":{"status":"present|notObserved|notAssessable|indeterminate","observed":null,"estimatedPercentage":null,"globalAbsenceAllowed":false,"evidenceState":"OBSERVED_POPULATION|SUSPICIOUS_POPULATION|FOCAL_SUSPICION|NOT_OBSERVED_IN_EVALUABLE_FIELD|NOT_ASSESSABLE","approximateBlastLikeCells":null,"approximateImmatureCellCount":null,"immatureCellBurden":"none|few|multiple|numerous|dominant|indeterminate","spatialDistribution":"isolated|focal|repeated_across_field|diffuse|indeterminate","morphologicFeatureCount":null,"populationPattern":"dominant|repeated|focal|heterogeneous|indeterminate","morphologySupport":{"highNCRatio":null,"openFineChromatin":null,"nucleoli":null,"scantBasophilicCytoplasm":null,"monomorphism":null,"repeatedAcrossField":null},"immatureCellCytology":{"highNCRatio":null,"openFineChromatin":null,"nucleoli":null,"scantBasophilicCytoplasm":null,"morphologicallyCoherent":null,"repeatedSubsetAcrossField":null,"distinctFromMaturationContinuum":null},"precursorContext":{"maturationHeterogeneity":null,"maturationContinuum":null,"matureFormsPresent":null,"lineageDiversity":null,"orderlyGranulocyticMaturation":null,"nonMonomorphicBackground":null},"blastoidSubpopulationContext":{"distinctFromMaturationContinuum":null,"morphologicallyCoherent":null,"repeatedSubsetAcrossField":null,"disproportionateImmatureSubset":null,"matureFormsCoexist":null},"lineageAssignable":false,"lineage":"indeterminate","summary":""},
  "spiculeAssessment":{"status":"present|notObserved|notAssessable|indeterminate","observed":null,"summary":""},
  "hemodilutionAssessment":{"status":"present|notObserved|notAssessable|indeterminate","suspected":null,"summary":""},
  "cellularityAssessment":{"status":"present|notObserved|notAssessable|indeterminate","scope":"field_limited","globalEstimateAllowed":false,"estimate":null,"summary":""},
  "plasmaCellAssessment":{"status":"present|notObserved|notAssessable|indeterminate","estimatedPercentage":null,"summary":""},
  "dysplasiaAssessment":{"status":"present|notObserved|notAssessable|indeterminate","globalExclusionAllowed":false,"summary":""},
  "infiltrationAssessment":{"status":"present|notObserved|notAssessable|indeterminate","globalExclusionAllowed":false,"summary":""},
  "marrowLimitations":[]
}

DISCRIMINAÇÃO BLASTO/PRECURSOR:
- Imaturidade medular não é sinônimo de blasto.
- Preserve continuum maturativo, heterogeneidade e formas maduras quando observados.
- SUSPICIOUS/OBSERVED exige subpopulação distinta/coerente/repetida + citologia sustentada.
- N:C, cromatina, nucléolo ou citoplasma isolados não bastam.

EXPANSÃO MIELOIDE COM MATURAÇÃO — BE-FIX-005.38:
- Preencha expansionContext separadamente da pesquisa de blastos.
- Continuidade maturativa não significa automaticamente fisiológico.
- Registre predomínio/expansão mieloide somente quando visualmente sustentado.

Mantenha cada summary em no máximo 240 caracteres. Não acrescente campos narrativos longos.`;
}

export function buildBoneMarrowLengthRecoveryPrompt({
  missingRequirements = [],
} = {}) {
  const missing = Array.isArray(missingRequirements) && missingRequirements.length
    ? missingRequirements.join(", ")
    : "all required marrow acquisition domains";

  return `CELLCOUNT BE-FIX-005.39 — COMPLETE LENGTH-RECOVERY REPAIR

A resposta anterior foi truncada por limite de saída. Isto é falha de transporte,
não ausência de morfologia. Reanalise as MESMAS imagens e devolva SOMENTE JSON
válido e COMPACTO. Não escreva relatório clínico.

RECUPERE OBRIGATORIAMENTE ESTES 6 DOMÍNIOS:
1. specimenAssessment
2. marrowAdequacy
3. myeloidSeries
4. erythroidSeries
5. megakaryocyticSeries
6. blastAssessment

Itens que estavam ausentes: ${missing}.

Use a MESMA estrutura dos 6 domínios do contrato compacto 005.39.
Para myeloidSeries, inclua expansionContext.
Para blastAssessment, inclua evidenceState, cardinalidade aproximada, carga,
distribuição, morphologySupport, immatureCellCytology, precursorContext e
blastoidSubpopulationContext.

REGRAS:
- status="notAssessable" e null quando realmente não avaliável.
- Nunca use false/0 como sinônimo de desconhecido.
- Preserve achado positivo local mesmo em campo limitado.
- Não diagnostique doença ou linhagem.
- Não inclua differentialDiagnosis, clinicalMeaning, interpretiveSynthesis,
  hematologicReasoning, educationalImpact ou structuredReport.
- Cada summary deve ter no máximo 180 caracteres.
- O JSON deve terminar completo dentro do orçamento.`;
}

export function buildBoneMarrowVisualRepairPrompt({
  missingRequirements = [],
} = {}) {
  const missing = Array.isArray(missingRequirements)
    ? missingRequirements.join(", ")
    : "marrow morphology";

  return `CELLCOUNT BE-FIX-005.25 — REPARO DE AQUISIÇÃO MEDULAR

Reanalise as imagens de aspirado/medula e devolva SOMENTE JSON válido.
A resposta anterior ficou sem evidência medular suficiente.
Itens ausentes: ${missing}.

Prioridade absoluta:
1. specimenAssessment e marrowAdequacy;
2. myeloidSeries, erythroidSeries e megakaryocyticSeries;
3. blastAssessment com evidenceState, approximateBlastLikeCells,
   approximateImmatureCellCount, immatureCellBurden, spatialDistribution,
   morphologicFeatureCount, populationPattern, morphologySupport,
   precursorContext e blastoidSubpopulationContext;
4. plasmaCellAssessment, dysplasiaAssessment e infiltrationAssessment.

Use status=notAssessable quando realmente não avaliável.
NÃO use ausência de evidência como achado negativo.
NÃO escreva relatório longo. NÃO diagnostique LLA/LMA.
Campo limitado não pode apagar população blastoide positivamente observada.
Se a narrativa disser múltiplas/repetidas células imaturas/blastoides e descrever
N:C/cromatina/nucléolos/citoplasma, os campos estruturados correspondentes devem
ser coerentes; use null quando não avaliável, nunca false por simples incerteza.

BE-FIX-005.33 — DISCRIMINAÇÃO FOCAL DE CÉLULAS IMATURAS:
Se houver múltiplas células imaturas repetidas, faça uma segunda leitura focal.
Preencha explicitamente highNCRatio, openFineChromatin, nucleoli,
scantBasophilicCytoplasm, monomorphism, distinctFromMaturationContinuum,
morphologicallyCoherent e repeatedSubsetAcrossField quando avaliáveis.
Não use coexistência de células maduras como evidência negativa suficiente
contra uma subpopulação blastoide concomitante.
Se a citologia continuar insuficiente, preserve null/indeterminado; não converta para zero.`;
}

export function mergeVisualMorphologyRepair(
  originalResponse = {},
  repairResponse = {},
) {
  const original = asObject(originalResponse);
  const repair = asObject(repairResponse);

  const meaningful = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  };

  const choose = (repairValue, originalValue) =>
    meaningful(repairValue) ? repairValue : originalValue;

  const positiveBoolean = (repairValue, originalValue) =>
    repairValue === true || originalValue === true
      ? true
      : (
          typeof repairValue === "boolean"
            ? repairValue
            : originalValue
        );

  const preserveCount = (repairValue, originalValue, { preferMax = false } = {}) => {
    const r = Number(repairValue);
    const o = Number(originalValue);
    const rValid = Number.isFinite(r);
    const oValid = Number.isFinite(o);

    if (preferMax && rValid && oValid) return Math.max(r, o);
    if (rValid && r > 0) return r;
    if (oValid && o > 0) return o;
    if (rValid) return r;
    if (oValid) return o;
    return null;
  };

  const mergeNestedObject = (originalValue, repairValue) => ({
    ...asObject(originalValue),
    ...Object.fromEntries(
      Object.entries(asObject(repairValue))
        .filter(([, value]) => meaningful(value)),
    ),
  });

  const merged = {
    ...original,
    ...Object.fromEntries(
      Object.entries(repair)
        .filter(([, value]) => meaningful(value)),
    ),
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
    "specimenAssessment",
    "marrowAdequacy",
    "spiculeAssessment",
    "hemodilutionAssessment",
    "cellularityAssessment",
    "myeloidSeries",
    "erythroidSeries",
    "megakaryocyticSeries",
    "plasmaCellAssessment",
    "dysplasiaAssessment",
    "infiltrationAssessment",
  ];

  for (const key of objectKeys) {
    merged[key] = mergeNestedObject(original[key], repair[key]);
  }

  // BE-FIX-005.39 — nested marrow acquisition domains are monotonic too.
  // A compact length-recovery pass may provide only part of expansionContext;
  // never let that shallow replacement erase valid first-pass signals.
  merged.myeloidSeries = {
    ...asObject(merged.myeloidSeries),
    expansionContext: mergeNestedObject(
      asObject(asObject(original.myeloidSeries).expansionContext),
      asObject(asObject(repair.myeloidSeries).expansionContext),
    ),
  };

  // BE-FIX-005.36 — marrow blast evidence is additive across acquisition
  // passes. The repair may enrich cytology/architecture, but it must not erase
  // first-pass cardinality, repetition or specimen context with null/false.
  const originalBlast = asObject(original.blastAssessment);
  const repairBlast = asObject(repair.blastAssessment);
  const blast = mergeNestedObject(originalBlast, repairBlast);

  blast.approximateImmatureCellCount = preserveCount(
    repairBlast.approximateImmatureCellCount ??
      repairBlast.approximateImmatureCellCountInProvidedFields,
    originalBlast.approximateImmatureCellCount ??
      originalBlast.approximateImmatureCellCountInProvidedFields,
    { preferMax: true },
  );

  blast.approximateBlastLikeCells = preserveCount(
    repairBlast.approximateBlastLikeCells ??
      repairBlast.approximateBlastLikeCellCountInProvidedFields,
    originalBlast.approximateBlastLikeCells ??
      originalBlast.approximateBlastLikeCellCountInProvidedFields,
    { preferMax: true },
  );

  blast.morphologicFeatureCount = preserveCount(
    repairBlast.morphologicFeatureCount,
    originalBlast.morphologicFeatureCount,
    { preferMax: true },
  );

  const originalSupport = asObject(originalBlast.morphologySupport);
  const repairSupport = asObject(repairBlast.morphologySupport);
  blast.morphologySupport = mergeNestedObject(originalSupport, repairSupport);

  for (const key of [
    "highNCRatio",
    "openFineChromatin",
    "nucleoli",
    "scantBasophilicCytoplasm",
    "repeatedAcrossField",
  ]) {
    blast.morphologySupport[key] = positiveBoolean(
      repairSupport[key],
      originalSupport[key],
    );
  }

  const originalCytology = asObject(originalBlast.immatureCellCytology);
  const repairCytology = asObject(repairBlast.immatureCellCytology);
  blast.immatureCellCytology = mergeNestedObject(
    originalCytology,
    repairCytology,
  );

  for (const key of [
    "highNCRatio",
    "openFineChromatin",
    "nucleoli",
    "scantBasophilicCytoplasm",
    "morphologicallyCoherent",
    "repeatedSubsetAcrossField",
    "distinctFromMaturationContinuum",
  ]) {
    blast.immatureCellCytology[key] = positiveBoolean(
      repairCytology[key],
      originalCytology[key],
    );
  }

  const originalSub = asObject(originalBlast.blastoidSubpopulationContext);
  const repairSub = asObject(repairBlast.blastoidSubpopulationContext);
  blast.blastoidSubpopulationContext = mergeNestedObject(
    originalSub,
    repairSub,
  );

  for (const key of [
    "morphologicallyCoherent",
    "repeatedSubsetAcrossField",
    "repeatedCellsWithSimilarFeatures",
    "coherentBlastoidSubsetObserved",
    "distinctFromMaturationContinuum",
  ]) {
    blast.blastoidSubpopulationContext[key] = positiveBoolean(
      repairSub[key],
      originalSub[key],
    );
  }

  // Preserve repeated/multiple immature evidence even when the repair focuses
  // on cytology and omits or nulls population cardinality.
  const originalImmatureBurden = asText(originalBlast.immatureCellBurden).toLowerCase();
  const repairImmatureBurden = asText(repairBlast.immatureCellBurden).toLowerCase();
  const originalSpatial = asText(originalBlast.spatialDistribution).toLowerCase();
  const repairSpatial = asText(repairBlast.spatialDistribution).toLowerCase();

  const multipleImmaturePreserved =
    blast.approximateImmatureCellCount >= 3 ||
    originalImmatureBurden === "multiple" ||
    repairImmatureBurden === "multiple";

  const repeatedImmaturePreserved =
    originalSpatial.includes("repeated") ||
    repairSpatial.includes("repeated") ||
    originalSupport.repeatedAcrossField === true ||
    repairSupport.repeatedAcrossField === true ||
    originalCytology.repeatedSubsetAcrossField === true ||
    repairCytology.repeatedSubsetAcrossField === true ||
    originalSub.repeatedSubsetAcrossField === true ||
    repairSub.repeatedSubsetAcrossField === true ||
    originalSub.repeatedCellsWithSimilarFeatures === true ||
    repairSub.repeatedCellsWithSimilarFeatures === true;

  if (multipleImmaturePreserved) {
    blast.immatureCellBurden = "multiple";
  }

  if (repeatedImmaturePreserved) {
    blast.spatialDistribution =
      choose(repairBlast.spatialDistribution, originalBlast.spatialDistribution) ||
      "repeated_across_field";
  }

  // A positive repair evidence state must outrank an indeterminate first pass.
  const repairEvidenceState = asText(repairBlast.evidenceState);
  const originalEvidenceState = asText(originalBlast.evidenceState);
  blast.evidenceState =
    repairEvidenceState || originalEvidenceState || null;

  merged.blastAssessment = blast;

  const arrayKeys = [
    "positiveFindings",
    "negativeFindingsStructured",
    "heatmapRegions",
  ];

  for (const key of arrayKeys) {
    if (Array.isArray(repair[key]) && repair[key].length > 0) {
      merged[key] = repair[key];
    } else if (Array.isArray(original[key])) {
      merged[key] = original[key];
    }
  }

  merged.marrowRepairEvidenceMerge = {
    version: MARROW_REPAIR_EVIDENCE_MERGE_VERSION,
    positiveCytologyCardinalityPreservationVersion:
      MARROW_POSITIVE_CYTOLOGY_CARDINALITY_PRESERVATION_VERSION,
    originalImmatureCellCount:
      preserveCount(originalBlast.approximateImmatureCellCount, null),
    repairImmatureCellCount:
      preserveCount(repairBlast.approximateImmatureCellCount, null),
    finalImmatureCellCount:
      preserveCount(blast.approximateImmatureCellCount, null),
    multipleImmaturePreserved,
    repeatedImmaturePreserved,
    specimenAssessmentPreserved:
      meaningful(merged.specimenAssessment),
    originalEvidenceState: originalEvidenceState || null,
    repairEvidenceState: repairEvidenceState || null,
    finalEvidenceState: blast.evidenceState || null,
    compactAcquisitionVersion: BONE_MARROW_COMPACT_ACQUISITION_VERSION,
    completeLengthRecoveryVersion: BONE_MARROW_COMPLETE_LENGTH_RECOVERY_VERSION,
  };

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
- Para blastos/blastoides, diferencie obrigatoriamente: OBSERVED (célula realmente observada), SUSPICIOUS_INDETERMINATE (suspeita sem confirmação), NOT_OBSERVED_IN_EVALUABLE_FIELD (somente se o campo for avaliável) e NOT_ASSESSABLE.
- Se pelo menos uma célula blastoide for diretamente observada, informe observedBlastLikeCount >= 1. Nunca use blastSuspicion=true como sinônimo de confirmação.
- Faça varredura obrigatória de ALTA SALIÊNCIA para estruturas hemoparasitárias em todo o campo, inclusive extracelulares.
- Para formas alongadas/curvas, descreva separadamente: corpo alongado ou serpiginoso, membrana ondulante aparente, flagelo aparente e estrutura cromatínica/kinetoplasto-like.
- Múltiplas formas extracelulares com combinação coerente desses atributos devem ser registradas como parasiteEvidenceState=OBSERVED, sem exigir identificação de espécie.
- Fibra, precipitado, risco, dobra, debris ou artefato óptico NÃO são parasitas: registre o diferencial artefatual e use SUSPICIOUS_INDETERMINATE ou NOT_ASSESSABLE quando a morfologia não for suficiente.
- Nunca conclua Trypanosoma cruzi por imagem isolada. Quando a morfologia for compatível, use apenas phenotype=TRYPANOSOMATID_LIKE e preserve necessidade de confirmação.
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
              parasites: {
                type: "object",
                additionalProperties: false,
                properties: {
                  evidenceState: { type: "string", enum: ["OBSERVED", "SUSPICIOUS_INDETERMINATE", "NOT_OBSERVED_IN_EVALUABLE_FIELD", "NOT_ASSESSABLE"] },
                  approximateVisibleForms: nullableIntegerSchema(),
                  phenotype: { type: "string", enum: ["TRYPANOSOMATID_LIKE", "INTRAERYTHROCYTIC_LIKE", "MICROFILARIAL_LIKE", "OTHER_PARASITE_LIKE", "NONE", "INDETERMINATE"] },
                  morphology: { type: "string" },
                  extracellular: { type: "boolean" },
                  elongatedOrCurved: { type: "boolean" },
                  undulatingMembraneLike: { type: "boolean" },
                  flagellumLike: { type: "boolean" },
                  kinetoplastLike: { type: "boolean" },
                  intracellularForms: { type: "boolean" },
                  artifactDifferential: { type: "string" },
                  confidence: { type: "string", enum: ["low", "moderate", "high"] }
                },
                required: ["evidenceState", "approximateVisibleForms", "phenotype", "morphology", "extracellular", "elongatedOrCurved", "undulatingMembraneLike", "flagellumLike", "kinetoplastLike", "intracellularForms", "artifactDifferential", "confidence"]
              },
              artifacts: stringArraySchema(),
              positiveEvidence: stringArraySchema(),
              uncertainty: stringArraySchema(),
            },
            required: ["globalField", "technicalQuality", "representativity", "erythrocytes", "leukocytes", "platelets", "parasites", "artifacts", "positiveEvidence", "uncertainty"],
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
              blastEvidenceState: {
                type: "string",
                enum: [
                  "OBSERVED",
                  "SUSPICIOUS_INDETERMINATE",
                  "NOT_OBSERVED_IN_EVALUABLE_FIELD",
                  "NOT_ASSESSABLE"
                ],
              },
              observedBlastLikeCount: nullableIntegerSchema(),
            },
            required: ["reactiveLymphocytes", "largeMononuclearCells", "plasmacytoidCells", "plasmocytes", "plasmablasts", "atypicalLymphocytes", "monomorphicPopulation", "immatureCells", "blastSuspicion", "blastEvidenceState", "observedBlastLikeCount"],
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
