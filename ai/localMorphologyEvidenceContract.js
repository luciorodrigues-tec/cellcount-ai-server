import {
  evaluateMarrowPrecursorDiscrimination,
  MARROW_PRECURSOR_DISCRIMINATION_VERSION,
} from "./boneMarrow/marrowPrecursorDiscriminationEngine.js";

// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.16 — LME-1.0 BLAST ASSESSABILITY HARDENING
//
// Scientific invariant:
//   NEGATIVE BLAST MORPHOLOGY REQUIRES AN EVALUABLE FIELD.
//   NOT_ASSESSABLE != NOT_OBSERVED_IN_EVALUABLE_FIELD.
// ============================================================================

export const LOCAL_MORPHOLOGY_EVIDENCE_VERSION = "LME-1.0";
export const BLAST_ASSESSABILITY_LME_VERSION = "BE-FIX-005.16";
export const SINGLE_BLAST_CONFIRMATION_LME_VERSION = "BE-FIX-005.17";
export const HEMOPARASITE_HIGH_SALIENCE_LME_VERSION = "BE-FIX-005.23";
export const MARROW_POSITIVE_EVIDENCE_PROJECTION_VERSION = "BE-FIX-005.26";
export const MARROW_PRECURSOR_FALSE_POSITIVE_CONTAINMENT_LME_VERSION = MARROW_PRECURSOR_DISCRIMINATION_VERSION;
export const PERIPHERAL_POSITIVE_MORPHOLOGY_LME_VERSION = "BE-FIX-005.50.4";
export const PERIPHERAL_BLASTOID_CYTOLOGY_LME_VERSION = "BE-FIX-005.50.5";
export const PERIPHERAL_FOCAL_CELL_CYTOMORPHOLOGY_LME_VERSION = "BE-FIX-005.50.7";
export const PERIPHERAL_POLYCHROMASIA_LME_CONTRADICTION_GUARD_VERSION = "BE-FIX-005.50.10";

const GENERIC_LIMITATION_PATTERNS = [
  /campo microsc[oó]pico limitado/i,
  /avalia[cç][aã]o .* limitada pela representatividade/i,
  /n[aã]o permite caracteriza[cç][aã]o populacional confi[aá]vel/i,
  /baixa representatividade celular/i,
  /n[aã]o permite conclus[aã]o hematol[oó]gica global/i,
  /recomenda-se avalia[cç][aã]o de m[uú]ltiplos campos/i,
];

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function asArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => typeof item === "string" ? item.trim() : item)
    .filter((item) => item !== "" && item !== null && item !== undefined);
}
function asText(value) { return typeof value === "string" ? value.trim() : ""; }
function normalizeMorphologySemanticText(value = "") {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function polychromasiaEvidenceContradictsObserved(value = "") {
  const t = normalizeMorphologySemanticText(value);
  if (!t) return false;
  return (
    /(?:nao|sem|ausencia|ausente)[\s\S]{0,120}(?:policrom|polychrom|policromatof)/.test(t) ||
    /nao se identificam[\s\S]{0,140}(?:policrom|polychrom|policromatof)/.test(t) ||
    (/(?:policrom|polychrom|policromatof)/.test(t) && /(?:borda|iluminacao|balanco de branco|artefat|precipitado)/.test(t))
  );
}

function firstText(...values) {
  for (const value of values) { const text = asText(value); if (text) return text; }
  return "";
}
function finiteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function genericLimitationOnly(text) {
  const clean = asText(text);
  if (!clean) return false;
  return GENERIC_LIMITATION_PATTERNS.filter((pattern) => pattern.test(clean)).length >= 2;
}
function safeObservation(...values) {
  for (const value of values) {
    const text = asText(value);
    if (text && !genericLimitationOnly(text)) return text;
  }
  return "";
}
function normalizeTriState(value) {
  if (value === true) return "OBSERVED";
  if (value === false) return "NOT_OBSERVED_IN_EVALUABLE_FIELD";
  const text = asText(value).toLowerCase();
  if (!text) return "NOT_ASSESSABLE";
  if (/presente|observad|identificad|evidente/.test(text) &&
      !/n[aã]o|nao|ausente|sem/.test(text)) return "OBSERVED";
  if (/n[aã]o evid|nao evid|n[aã]o observ|nao observ|ausente/.test(text))
    return "NOT_OBSERVED_IN_EVALUABLE_FIELD";
  return "NOT_ASSESSABLE";
}
function blastAssessabilityOf(raw = {}, explicit = {}) {
  const field = asObject(raw.fieldAdequacy);
  const gate = asObject(field.blastAssessability);
  const explicitGate = asObject(explicit.blastAssessability);

  const declaredAdequacy =
    explicitGate.adequateForBlastScreening ??
    gate.adequateForBlastScreening ??
    field.adequateForBlastScreening;

  // BE-FIX-005.17.2 — restore the 005.16 assessability contract.
  // An explicit FALSE is authoritative and can never be overridden by cell count.
  // When no gate was projected yet, detailed evaluable nuclear morphology may
  // authorize a field-scoped negative. Visible leukocytes alone never do.
  const local = asObject(raw.localMorphologyEvidence);
  const wbc = asObject(local.leukocytes);
  const nuclearText = [
    asText(wbc.nuclearMorphology),
    asText(wbc.chromatin),
    asText(wbc.nucleoli),
    asText(wbc.ncRatio),
    asText(wbc.blastLikeFeatures),
  ].filter(Boolean).join(" ");

  const nuclearDetailPresent =
    wbc.evaluable === true &&
    nuclearText.length >= 12 &&
    !/n[aã]o avali[aá]vel|nao avaliavel|n[aã]o suficientemente|nao suficientemente|indeterminad|limitad|n[aã]o permite|nao permite/i.test(nuclearText);

  const adequate =
    declaredAdequacy === false
      ? false
      : declaredAdequacy === true
        ? true
        : nuclearDetailPresent;

  return {
    version: BLAST_ASSESSABILITY_LME_VERSION,
    adequateForBlastScreening: adequate === true,
    state: adequate === true ? "EVALUABLE" : "NOT_ASSESSABLE",
    negativeBlastConclusionAllowed: adequate === true,
    source:
      declaredAdequacy === true
        ? "DECLARED_GATE"
        : declaredAdequacy === false
          ? "DECLARED_NOT_ASSESSABLE"
          : nuclearDetailPresent
            ? "DETAILED_NUCLEAR_MORPHOLOGY"
            : "INSUFFICIENT_BLAST_MORPHOLOGY",
  };
}
function normalizeCriticalMorphology(explicit = {}, raw = {}) {
  const findings = asObject(raw.findings);
  const marrowBlast = normalizeMarrowBlastEvidence(raw);
  const visual = asObject(raw.visualEvidence);
  const assessability = blastAssessabilityOf(raw, explicit);

  // BE-FIX-005.17: suspicion and observation are different evidence states.
  // A generic blastSuspicion=true must NEVER be promoted to OBSERVED.
  const explicitState = asText(
    explicit.blastEvidenceState ??
      explicit.blastLikeMorphology ??
      explicit.blastLikeMorphologyObserved ??
      findings.blastEvidenceState,
  ).toUpperCase();

  const observedBlastLikeCount =
    finiteNumber(explicit.observedBlastLikeCount) ??
    finiteNumber(explicit.blastLikeCellCount) ??
    finiteNumber(findings.observedBlastLikeCount) ??
    finiteNumber(findings.blastLikeCellCount);

  let blastLikeMorphology;

  if (
    explicitState === "OBSERVED" ||
    (observedBlastLikeCount !== null && observedBlastLikeCount >= 1)
  ) {
    blastLikeMorphology = "OBSERVED";
  } else if (
    explicitState === "SUSPICIOUS_INDETERMINATE" ||
    findings.blastSuspicion === true
  ) {
    blastLikeMorphology = "SUSPICIOUS_INDETERMINATE";
  } else if (
    explicitState === "NOT_OBSERVED_IN_EVALUABLE_FIELD"
  ) {
    blastLikeMorphology = "NOT_OBSERVED_IN_EVALUABLE_FIELD";
  } else if (explicitState === "NOT_ASSESSABLE") {
    blastLikeMorphology = "NOT_ASSESSABLE";
  } else if (
    findings.blastSuspicion === false &&
    assessability.negativeBlastConclusionAllowed === true
  ) {
    // BE-FIX-005.17.5 — explicit negative blast screening is legally
    // projectable only when the blast-assessability gate is open.
    blastLikeMorphology = "NOT_OBSERVED_IN_EVALUABLE_FIELD";
  } else {
    blastLikeMorphology = normalizeTriState(
      explicit.blastLikeMorphology ?? explicit.blastLikeMorphologyObserved,
    );
  }

  // Positive evidence is immutable. A negative, however, is only legal when
  // the field is actually assessable for blast morphology.
  if (
    blastLikeMorphology === "NOT_OBSERVED_IN_EVALUABLE_FIELD" &&
    assessability.negativeBlastConclusionAllowed !== true
  ) {
    blastLikeMorphology = "NOT_ASSESSABLE";
  }

  if (marrowBlast.positive) {
    blastLikeMorphology =
      marrowBlast.evidenceState === "OBSERVED_POPULATION"
        ? "OBSERVED"
        : "SUSPICIOUS_INDETERMINATE";
  }

  // BE-FIX-005.27 — physiologic marrow precursors must not leak into the
  // generic single-blast sentinel as suspicious blast morphology.
  // BE-FIX-005.29 — precursor/assessability logic is negative-only once
  // structured positive marrow blast evidence exists. A positive population
  // state must never be rewritten to NOT_ASSESSABLE by a later ambiguity gate.
  if (
    marrowBlast.positive !== true &&
    (
      marrowBlast.precursorDiscrimination?.strongPhysiologicPattern === true ||
      marrowBlast.precursorDiscrimination?.ambiguousPrecursorVsBlast === true
    )
  ) {
    blastLikeMorphology = "NOT_ASSESSABLE";
  }

  return {
    blastLikeMorphology,
    blastEvidenceGovernanceVersion: SINGLE_BLAST_CONFIRMATION_LME_VERSION,
    observedBlastLikeCount:
      observedBlastLikeCount !== null ? Math.max(0, Math.trunc(observedBlastLikeCount)) : null,
    blastAssessability: assessability,
    auerRod: normalizeTriState(
      explicit.auerRod ?? explicit.auerRodObserved ?? findings.auerRods,
    ),
    schistocytes: normalizeTriState(
      explicit.schistocytes ?? explicit.schistocytesObserved ?? findings.schistocytes,
    ),
    parasites: (() => {
      const parasiteEvidence = asObject(asObject(raw.observedMorphology).parasites);
      const parasiteState = asText(parasiteEvidence.evidenceState).toUpperCase();
      if (["OBSERVED", "SUSPICIOUS_INDETERMINATE", "NOT_OBSERVED_IN_EVALUABLE_FIELD", "NOT_ASSESSABLE"].includes(parasiteState)) {
        return parasiteState;
      }
      return normalizeTriState(
        explicit.parasites ?? explicit.parasitesObserved ?? findings.parasiteSuspected,
      );
    })(),
    parasiteEvidence: (() => {
      const parasite = asObject(asObject(raw.observedMorphology).parasites);
      return {
        version: HEMOPARASITE_HIGH_SALIENCE_LME_VERSION,
        evidenceState: asText(parasite.evidenceState).toUpperCase() || "NOT_ASSESSABLE",
        approximateVisibleForms: finiteNumber(parasite.approximateVisibleForms),
        phenotype: asText(parasite.phenotype).toUpperCase() || "INDETERMINATE",
        morphology: asText(parasite.morphology),
        extracellular: parasite.extracellular === true,
        elongatedOrCurved: parasite.elongatedOrCurved === true,
        undulatingMembraneLike: parasite.undulatingMembraneLike === true,
        flagellumLike: parasite.flagellumLike === true,
        kinetoplastLike: parasite.kinetoplastLike === true,
        intracellularForms: parasite.intracellularForms === true,
        artifactDifferential: asText(parasite.artifactDifferential),
        confidence: asText(parasite.confidence).toLowerCase() || "low",
      };
    })(),
    supportingBlastFeatures: {
      prominentNucleolus: visual.prominentNucleolus === true ? true : null,
      cellSizeIncrease: visual.cellSizeIncrease === true ? true : null,
      highNucleusCytoplasmRatio:
        visual.highNucleusCytoplasmRatio === true ? true : null,
      openOrFineChromatin:
        visual.openChromatin === true || visual.fineChromatin === true ? true : null,
    },
  };
}

function normalizeMarrowBlastEvidence(raw = {}) {
  const specimen = asObject(raw.specimenAssessment);
  const blast = asObject(raw.blastAssessment);
  const support = asObject(blast.morphologySupport);
  const specimenType = asText(specimen.specimenType).toUpperCase();
  const marrowLike =
    specimenType.includes("BONE_MARROW") ||
    Object.keys(asObject(raw.marrowAdequacy)).length > 0 ||
    Object.keys(blast).length > 0 && (
      Object.keys(asObject(raw.myeloidSeries)).length > 0 ||
      Object.keys(asObject(raw.erythroidSeries)).length > 0 ||
      Object.keys(asObject(raw.megakaryocyticSeries)).length > 0
    );

  const state = asText(blast.evidenceState).toUpperCase();
  const precursorDiscrimination =
    evaluateMarrowPrecursorDiscrimination({
      specimenType: specimenType || asText(asObject(raw.specimenAssessment).specimenType).toUpperCase(),
      blastAssessment: blast,
      rawResponse: raw,
      myeloidSeries: asObject(raw.myeloidSeries),
      erythroidSeries: asObject(raw.erythroidSeries),
    });
  const positiveState =
    ["OBSERVED_POPULATION", "SUSPICIOUS_POPULATION", "FOCAL_SUSPICION"].includes(state) &&
    precursorDiscrimination.suppressBlastPromotion !== true &&
    precursorDiscrimination.capBlastPromotionAtIndeterminate !== true;
  const repeated =
    blast.populationPattern === "repeated" ||
    blast.populationPattern === "dominant" ||
    support.repeatedAcrossField === true ||
    (finiteNumber(blast.approximateBlastLikeCells) ?? 0) >= 3;

  const supportCount = [
    support.highNCRatio,
    support.openFineChromatin,
    support.nucleoli,
    support.scantBasophilicCytoplasm,
    support.monomorphism,
    support.repeatedAcrossField,
  ].filter((value) => value === true).length;

  return {
    version: MARROW_POSITIVE_EVIDENCE_PROJECTION_VERSION,
    marrowLike,
    evidenceState: state || "NOT_ASSESSABLE",
    positive: marrowLike && positiveState,
    repeated,
    supportCount,
    approximateBlastLikeCells: finiteNumber(blast.approximateBlastLikeCells),
    populationPattern: asText(blast.populationPattern).toLowerCase() || "indeterminate",
    summary: asText(blast.summary),
    morphologySupport: {
      highNCRatio: support.highNCRatio === true,
      openFineChromatin: support.openFineChromatin === true,
      nucleoli: support.nucleoli === true,
      scantBasophilicCytoplasm: support.scantBasophilicCytoplasm === true,
      monomorphism: support.monomorphism === true,
      repeatedAcrossField: support.repeatedAcrossField === true,
    },
    precursorDiscrimination,
  };
}

export function createLocalMorphologyEvidence({
  visionResponse = {},
  analysisSource = "ai_visual",
} = {}) {
  const raw = asObject(visionResponse);
  const explicit = asObject(raw.localMorphologyEvidence);
  const legacy = asObject(raw.observedMorphology);
  const morphology = asObject(raw.morphologyAnalysis);
  const seeing = asObject(raw.whatAISees);
  const fieldAdequacy = asObject(raw.fieldAdequacy);
  const marrowBlastEvidence = normalizeMarrowBlastEvidence(raw);
  const marrowMyeloid = asObject(raw.myeloidSeries);
  const marrowErythroid = asObject(raw.erythroidSeries);
  const marrowMegakaryocytic = asObject(raw.megakaryocyticSeries);

  const explicitField = asObject(explicit.field);
  const explicitRbc = asObject(explicit.erythrocytes);
  const explicitWbc = asObject(explicit.leukocytes);
  const explicitPlt = asObject(explicit.platelets);
  const explicitAcademic = asObject(explicit.academicReasoning);
  const legacyRbc = asObject(legacy.erythrocytes);
  const legacyWbc = asObject(legacy.leukocytes);
  const legacyPlt = asObject(legacy.platelets);
  const legacyAcademic = asObject(raw.academicInterpretation);
  const hematologicReasoning = asObject(raw.hematologicReasoning);

  const fieldDescription = safeObservation(
    explicitField.description, legacy.globalField, seeing.globalField, morphology.overview,
    asObject(raw.marrowAdequacy).summary, asObject(raw.specimenAssessment).summary,
  );
  const erythrocyteDescription = safeObservation(
    explicitRbc.description, legacyRbc.description, seeing.erythrocytes, morphology.erythrocyteReview,
    marrowErythroid.summary,
  );
  const leukocyteDescription = safeObservation(
    explicitWbc.description, legacyWbc.description, seeing.leukocytes, morphology.leukocyteReview,
    marrowBlastEvidence.summary, marrowMyeloid.summary,
  );
  const plateletDescription = safeObservation(
    explicitPlt.description, legacyPlt.description, seeing.platelets, morphology.plateletReview,
    marrowMegakaryocytic.summary,
  );

  const positiveEvidence = [
    ...asArray(explicit.positiveEvidence),
    ...asArray(legacy.positiveEvidence),
    ...asArray(raw.positiveFindings),
    ...asArray(seeing.positiveFindings),
  ];
  const uncertainties = [
    ...asArray(explicit.uncertainties),
    ...asArray(explicit.uncertainty),
    ...asArray(legacy.uncertainty),
  ];
  const evidenceAvailable = Boolean(
    fieldDescription || erythrocyteDescription || leukocyteDescription ||
    plateletDescription || positiveEvidence.length > 0 || marrowBlastEvidence.positive,
  );
  const observedCellCount =
    finiteNumber(explicitWbc.observedCellCount) ??
    finiteNumber(explicitWbc.approximateVisibleCells) ??
    finiteNumber(legacyWbc.approximateVisibleCells) ??
    finiteNumber(fieldAdequacy.visibleLeukocytes);

  return {
    contractVersion: LOCAL_MORPHOLOGY_EVIDENCE_VERSION,
    capturedBeforeGovernors: true,
    analysisSource,
    evidenceAvailable,
    provenance: {
      source: "vision_model_direct_observation",
      interpretationSeparated: true,
      representativitySeparated: true,
    },
    field: {
      description: fieldDescription,
      observableCellularity: firstText(explicitField.observableCellularity, seeing.cellularity),
      distribution: firstText(explicitField.distribution),
      background: firstText(explicitField.background),
      technicalQuality: firstText(
        explicitField.technicalQuality, legacy.technicalQuality,
        raw.imageQuality?.description, raw.imageQuality?.summary,
      ),
      artifacts: [
        ...asArray(explicitField.artifacts),
        ...asArray(explicit.artifacts),
        ...asArray(legacy.artifacts),
      ],
      technicalLimitations: [
        ...asArray(explicitField.technicalLimitations),
        ...asArray(explicit.technicalLimitations),
      ],
    },
    erythrocytes: {
      evaluable: explicitRbc.evaluable ?? Boolean(erythrocyteDescription),
      description: erythrocyteDescription,
      observations: asArray(explicitRbc.observations),
      size: firstText(explicitRbc.size, legacyRbc.size),
      shape: firstText(explicitRbc.shape),
      chromia: firstText(explicitRbc.chromia, legacyRbc.chromia),
      polychromasiaState: guardedPolychromasiaState,
      polychromasiaEvidence: rawPolychromasiaEvidence,
      polychromasiaContradictionGuard: {
        version: "BE-FIX-005.50.10",
        contradictionDetected: polychromasiaContradiction,
        originalState: rawPolychromasiaState,
      },
      positiveMorphologyVersion: PERIPHERAL_POSITIVE_MORPHOLOGY_LME_VERSION,
      distribution: firstText(explicitRbc.distribution),
      anisocytosis: firstText(explicitRbc.anisocytosis, legacyRbc.anisocytosis),
      poikilocytosis: firstText(explicitRbc.poikilocytosis, legacyRbc.poikilocytosis),
      specificForms: [...asArray(explicitRbc.specificForms), ...asArray(legacyRbc.specificForms)],
      inclusions: asArray(explicitRbc.inclusions),
      artifactConsiderations: firstText(explicitRbc.artifactConsiderations, legacyRbc.artifactConsiderations),
      positiveFindings: asArray(explicitRbc.positiveFindings),
      uncertainties: asArray(explicitRbc.uncertainties),
    },
    leukocytes: {
      evaluable: explicitWbc.evaluable ?? Boolean(leukocyteDescription),
      observedCellCount,
      description: leukocyteDescription,
      observations: asArray(explicitWbc.observations),
      heterogeneity: firstText(explicitWbc.heterogeneity, legacyWbc.heterogeneity),
      nuclearMorphology: firstText(explicitWbc.nuclearMorphology, legacyWbc.nuclearMorphology),
      chromatin: firstText(explicitWbc.chromatin, legacyWbc.chromatin),
      nucleoli: firstText(explicitWbc.nucleoli, legacyWbc.nucleoli),
      ncRatio: firstText(explicitWbc.ncRatio, explicitWbc.ncRatioFeatures),
      cytoplasm: firstText(explicitWbc.cytoplasm, legacyWbc.cytoplasm),
      granulation: firstText(explicitWbc.granulation),
      inclusions: asArray(explicitWbc.inclusions),
      maturation: firstText(explicitWbc.maturation, legacyWbc.maturation),
      atypia: firstText(explicitWbc.atypia, legacyWbc.atypia),
      blastLikeFeatures: firstText(explicitWbc.blastLikeFeatures, legacyWbc.blastLikeFeatures),
      hematopoieticCellCandidate: explicitWbc.hematopoieticCellCandidate === true || legacyWbc.hematopoieticCellCandidate === true,
      focalImmatureCellState: firstText(explicitWbc.focalImmatureCellState, legacyWbc.focalImmatureCellState).toUpperCase() || "NOT_ASSESSABLE",
      focalImmatureCellEvidence: firstText(explicitWbc.focalImmatureCellEvidence, legacyWbc.focalImmatureCellEvidence),
      focalCellCytomorphology: {
        ...asObject(legacyWbc.focalCellCytomorphology),
        ...asObject(explicitWbc.focalCellCytomorphology),
        version: PERIPHERAL_FOCAL_CELL_CYTOMORPHOLOGY_LME_VERSION,
      },
      focalBlastoidCytology: {
        ...asObject(legacyWbc.focalBlastoidCytology),
        ...asObject(explicitWbc.focalBlastoidCytology),
        version: PERIPHERAL_BLASTOID_CYTOLOGY_LME_VERSION,
      },
      positiveMorphologyVersion: PERIPHERAL_POSITIVE_MORPHOLOGY_LME_VERSION,
      blastoidCytologyVersion: PERIPHERAL_BLASTOID_CYTOLOGY_LME_VERSION,
      focalCellCytomorphologyVersion: PERIPHERAL_FOCAL_CELL_CYTOMORPHOLOGY_LME_VERSION,
      positiveFindings: asArray(explicitWbc.positiveFindings),
      uncertainties: asArray(explicitWbc.uncertainties),
    },
    platelets: {
      evaluable: explicitPlt.evaluable ?? Boolean(plateletDescription),
      description: plateletDescription,
      observations: asArray(explicitPlt.observations),
      distribution: firstText(explicitPlt.distribution, legacyPlt.distribution),
      size: firstText(explicitPlt.size, legacyPlt.size),
      aggregates: firstText(explicitPlt.aggregates, legacyPlt.aggregates),
      morphology: firstText(explicitPlt.morphology),
      positiveFindings: asArray(explicitPlt.positiveFindings),
      uncertainties: asArray(explicitPlt.uncertainties),
    },
    marrow: {
      projectionVersion: MARROW_POSITIVE_EVIDENCE_PROJECTION_VERSION,
      blastPopulationEvidence: marrowBlastEvidence,
      precursorDiscrimination: marrowBlastEvidence.precursorDiscrimination,
      myeloidSummary: asText(marrowMyeloid.summary),
      erythroidSummary: asText(marrowErythroid.summary),
      megakaryocyticSummary: asText(marrowMegakaryocytic.summary),
    },
    criticalMorphology: normalizeCriticalMorphology(
      asObject(explicit.criticalMorphology), raw,
    ),
    positiveEvidence: [...new Set(positiveEvidence)],
    uncertainties: [...new Set(uncertainties)],
    academicReasoning: {
      whatISee: asArray(explicitAcademic.whatISee).length
        ? asArray(explicitAcademic.whatISee)
        : [fieldDescription, erythrocyteDescription, leukocyteDescription, plateletDescription].filter(Boolean),
      whatItResembles: asArray(explicitAcademic.whatItResembles),
      evidenceFor: asArray(explicitAcademic.evidenceFor),
      evidenceAgainst: asArray(explicitAcademic.evidenceAgainst),
      differentialMorphology: asArray(explicitAcademic.differentialMorphology).length
        ? asArray(explicitAcademic.differentialMorphology)
        : asArray(legacyAcademic.differentialConsiderations),
      cannotConfirm: asArray(explicitAcademic.cannotConfirm).length
        ? asArray(explicitAcademic.cannotConfirm)
        : [asText(hematologicReasoning.whatICannotConfirm), ...asArray(legacyAcademic.confirmationNeeds)].filter(Boolean),
      teachingPoints: asArray(explicitAcademic.teachingPoints).length
        ? asArray(explicitAcademic.teachingPoints)
        : asArray(legacyAcademic.teachingPoints),
    },
    engineEvidence: { erythrocyte: null, leukocyte: null, platelet: null },
  };
}

export function enrichLocalMorphologyEvidenceWithEngines(
  evidence = {},
  { erythrocyteAnalysis = {}, leukocyteAnalysis = {}, plateletAnalysis = {} } = {},
) {
  const base = asObject(evidence);
  return {
    ...base,
    engineEvidence: {
      erythrocyte: {
        findings: asArray(erythrocyteAnalysis.erythrocyteFindings),
        reasoning: asArray(erythrocyteAnalysis.erythrocyteReasoning),
        summary: asText(erythrocyteAnalysis.erythrocyteSummary),
        dominantMorphology: erythrocyteAnalysis.dominantMorphology ?? null,
        morphologicRisk: erythrocyteAnalysis.morphologicRisk ?? null,
      },
      leukocyte: {
        findings: asArray(leukocyteAnalysis.leukocyteFindings),
        reasoning: asArray(leukocyteAnalysis.leukocyteReasoning),
        summary: asText(leukocyteAnalysis.leukocyteSummary),
        primaryPattern: leukocyteAnalysis.primaryPattern ?? null,
        secondaryPattern: leukocyteAnalysis.secondaryPattern ?? null,
        blastRisk: leukocyteAnalysis.blastRisk ?? null,
      },
      platelet: {
        findings: asArray(plateletAnalysis.plateletFindings),
        reasoning: asArray(plateletAnalysis.plateletReasoning),
        summary: asText(plateletAnalysis.plateletSummary),
        dominantPattern: plateletAnalysis.dominantPlateletPattern ?? null,
        emergencyLevel: plateletAnalysis.emergencyLevel ?? null,
      },
    },
  };
}
export function attachLocalMorphologyEvidence(result = {}, evidence = {}) {
  if (!result || typeof result !== "object") return result;
  return { ...result, localMorphologyEvidence: evidence };
}
export function localMorphologyEvidenceContractStatus(evidence = {}) {
  const value = asObject(evidence);
  const problems = [];
  if (value.contractVersion !== LOCAL_MORPHOLOGY_EVIDENCE_VERSION)
    problems.push("invalid_contract_version");
  if (value.evidenceAvailable === true) {
    const hasSeriesObservation = Boolean(
      asText(value.erythrocytes?.description) ||
      asText(value.leukocytes?.description) ||
      asText(value.platelets?.description),
    );
    if (!hasSeriesObservation) problems.push("evidence_available_without_series_observation");
  }
  if (
    genericLimitationOnly(value.erythrocytes?.description) ||
    genericLimitationOnly(value.leukocytes?.description) ||
    genericLimitationOnly(value.platelets?.description)
  ) problems.push("adequacy_narrative_used_as_morphology");
  return { valid: problems.length === 0, problems };
}
