// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.50.4 — PERIPHERAL BLOOD POSITIVE MORPHOLOGY ACQUISITION &
//                   COMPETING SENTINEL ARBITRATION
// ============================================================================

export const PERIPHERAL_BLOOD_POSITIVE_MORPHOLOGY_ARBITRATION_VERSION =
  "BE-FIX-005.50.4";
export const PERIPHERAL_POLYCHROMASIA_PRESERVATION_VERSION =
  "BE-FIX-005.50.4";
export const PERIPHERAL_HEMATOPOIETIC_PARASITE_ARBITRATION_VERSION =
  "BE-FIX-005.50.4";
export const PERIPHERAL_LIMITED_FIELD_NON_SUPPRESSION_VERSION =
  "BE-FIX-005.50.4";

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function asArray(value) { return Array.isArray(value) ? value : []; }
function text(value) { return typeof value === "string" ? value.trim() : ""; }
function upper(value) { return text(value).toUpperCase(); }
function finite(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value); return Number.isFinite(n) ? n : null;
}
function norm(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function containsPositivePolychromasia(value) {
  const t = norm(value);
  if (!t) return false;
  if (/(nao|sem|ausencia|ausente|not observed|absent).{0,20}(policrom|polychrom)/.test(t)) return false;
  return /policrom|polychrom|policromatof|hemacias? azulad|hemacias? acinzentad|bluish erythro/.test(t);
}
function parasiteMorphologySignalCount(profile = {}) {
  return [
    profile.elongatedOrCurved,
    profile.undulatingMembraneLike,
    profile.flagellumLike,
    profile.kinetoplastLike,
    profile.intracellularForms,
  ].filter((v) => v === true).length;
}
function clearParasiteProjection(result = {}) {
  result.findings = asObject(result.findings);
  result.findings.parasiteSuspected = false;
  result.findings.unusualStructureSuspected = false;
  result.findings.parasiteType = "NONE";

  result.parasiteAnalysis = {
    ...asObject(result.parasiteAnalysis),
    suspected: false,
    parasiteType: "NONE",
    parasiteName: "",
    arbitrationVersion: PERIPHERAL_HEMATOPOIETIC_PARASITE_ARBITRATION_VERSION,
  };

  const parasiteClasses = new Set([
    "CLASS_1_LIMITED_FIELD_HEMOPARASITE_SUSPECT",
    "CLASS_2_UNUSUAL_HEMOPARASITE_STRUCTURE",
    "CLASS_2_HEMOPARASITE_SUSPICION",
  ]);
  if (parasiteClasses.has(result.finalClassification)) result.finalClassification = null;
  if (parasiteClasses.has(result.morphologicRiskClass)) result.morphologicRiskClass = null;
  if (parasiteClasses.has(asObject(result.overallAssessment).riskCategory)) {
    result.overallAssessment = asObject(result.overallAssessment);
    result.overallAssessment.riskCategory = null;
  }
  return result;
}

export function evaluatePeripheralPositiveMorphologyArbitration(result = {}) {
  const lme = asObject(result.localMorphologyEvidence);
  const rbc = asObject(lme.erythrocytes);
  const wbc = asObject(lme.leukocytes);
  const critical = asObject(lme.criticalMorphology);
  const parasite = asObject(critical.parasiteEvidence);
  const rawObserved = asObject(asObject(result.rawResponse).observedMorphology);
  const rawRbc = asObject(rawObserved.erythrocytes);
  const rawWbc = asObject(rawObserved.leukocytes);

  const rbcCorpus = [rbc.description, rbc.chromia, rbc.polychromasiaEvidence,
    rawRbc.description, rawRbc.chromia, rawRbc.polychromasiaEvidence,
    ...asArray(rbc.positiveFindings), ...asArray(lme.positiveEvidence)].join(" | ");
  const polychromasiaState = upper(rbc.polychromasiaState || rawRbc.polychromasiaState);
  const polychromasiaObserved = polychromasiaState === "OBSERVED" || containsPositivePolychromasia(rbcCorpus);

  const focalState = upper(wbc.focalImmatureCellState || rawWbc.focalImmatureCellState);
  const wbcCorpus = [wbc.description, wbc.nuclearMorphology, wbc.chromatin, wbc.nucleoli,
    wbc.cytoplasm, wbc.maturation, wbc.atypia, wbc.blastLikeFeatures,
    wbc.focalImmatureCellEvidence, rawWbc.description, rawWbc.focalImmatureCellEvidence].join(" | ");
  const observedCellCount = finite(wbc.observedCellCount ?? rawWbc.approximateVisibleCells);
  const hematopoieticCellCandidate =
    wbc.hematopoieticCellCandidate === true || rawWbc.hematopoieticCellCandidate === true ||
    ((observedCellCount ?? 0) >= 1 && /nucle|cromatin|citoplasm|mononuclear|leucoc|linfoc|blasto|imatur/.test(norm(wbcCorpus)));
  const focalImmatureObserved = focalState === "OBSERVED";
  const normalizedWbcCorpus = norm(wbcCorpus);
  const explicitNegativeImmaturity =
    /(sem|nao|ausencia|ausente).{0,28}(criter|sinal|traco|morfologia).{0,20}(blasto|imatur)/.test(normalizedWbcCorpus) ||
    /(sem|nao|ausencia|ausente).{0,20}(blasto|imatur)/.test(normalizedWbcCorpus);
  const focalImmatureSuspicious =
    focalState === "SUSPICIOUS_INDETERMINATE" ||
    (
      !focalImmatureObserved &&
      focalState !== "NOT_OBSERVED_IN_EVALUABLE_FIELD" &&
      !explicitNegativeImmaturity &&
      /imatur|blastoide|cromatina frouxa|nucleolo/.test(normalizedWbcCorpus)
    );

  const parasiteState = upper(parasite.evidenceState);
  const morphologySignals = parasiteMorphologySignalCount(parasite);
  const parasiteCount = finite(parasite.approximateVisibleForms);
  const strongIntraerythrocytic = parasite.intracellularForms === true &&
    ["INTRAERYTHROCYTIC_LIKE"].includes(upper(parasite.phenotype));
  const strongExtracellular = parasite.extracellular === true && morphologySignals >= 2;
  const repeatedStructuredParasite = (parasiteCount ?? 0) >= 2 && morphologySignals >= 1;
  const independentParasiteArchitecture = strongIntraerythrocytic || strongExtracellular || repeatedStructuredParasite;

  const competingWeakParasite =
    parasiteState === "OBSERVED" &&
    hematopoieticCellCandidate &&
    !independentParasiteArchitecture;

  return {
    version: PERIPHERAL_BLOOD_POSITIVE_MORPHOLOGY_ARBITRATION_VERSION,
    polychromasia: {
      observed: polychromasiaObserved,
      state: polychromasiaObserved ? "OBSERVED" : (polychromasiaState || "NOT_ASSESSABLE"),
      evidence: text(rbc.polychromasiaEvidence || rawRbc.polychromasiaEvidence),
      fieldScoped: true,
      globalExclusionAllowed: false,
    },
    focalHematopoieticCell: {
      observedCellCount,
      hematopoieticCellCandidate,
      immatureObserved: focalImmatureObserved,
      immatureSuspicious: focalImmatureSuspicious,
      state: focalImmatureObserved ? "OBSERVED" : focalImmatureSuspicious ? "SUSPICIOUS_INDETERMINATE" : (focalState || "NOT_ASSESSABLE"),
      evidence: text(wbc.focalImmatureCellEvidence || rawWbc.focalImmatureCellEvidence),
      populationInferenceAllowed: false,
    },
    parasiteArbitration: {
      priorEvidenceState: parasiteState || "NOT_ASSESSABLE",
      morphologySignalCount: morphologySignals,
      approximateVisibleForms: parasiteCount,
      independentParasiteArchitecture,
      competingWeakParasite,
      effectiveEvidenceState: competingWeakParasite ? "SUSPICIOUS_INDETERMINATE" : (parasiteState || "NOT_ASSESSABLE"),
      parasitePromotionAllowed: parasiteState === "OBSERVED" && !competingWeakParasite,
    },
  };
}

export function applyPeripheralPositiveMorphologyArbitration(result = {}) {
  if (!result || typeof result !== "object") return result;
  const decision = evaluatePeripheralPositiveMorphologyArbitration(result);
  result.peripheralPositiveMorphologyArbitration = decision;

  result.positiveMorphology = {
    ...asObject(result.positiveMorphology),
    version: PERIPHERAL_BLOOD_POSITIVE_MORPHOLOGY_ARBITRATION_VERSION,
    erythrocytes: {
      ...asObject(asObject(result.positiveMorphology).erythrocytes),
      polychromasia: decision.polychromasia,
    },
    leukocytes: {
      ...asObject(asObject(result.positiveMorphology).leukocytes),
      focalHematopoieticCell: decision.focalHematopoieticCell,
    },
  };

  if (decision.polychromasia.observed) {
    result.erythrocyteFindings = asObject(result.erythrocyteFindings);
    result.erythrocyteFindings.polychromasia = true;
    result.erythrocyteFindings.polychromasiaState = "OBSERVED";
    result.erythrocyteFindings.positiveMorphologyVersion = PERIPHERAL_POLYCHROMASIA_PRESERVATION_VERSION;
    result.morphologyAnalysis = asObject(result.morphologyAnalysis);
    const existing = text(result.morphologyAnalysis.erythrocyteReview);
    if (!containsPositivePolychromasia(existing)) {
      result.morphologyAnalysis.erythrocyteReview = [existing, "Policromasia presente no campo analisado."].filter(Boolean).join(" ");
    }
    result.positiveFindings = [...new Set([...asArray(result.positiveFindings), "Policromasia presente no campo analisado."])];
    result.normalityBlocked = true;
    result.requiresHumanReview = true;
  }

  if (decision.focalHematopoieticCell.hematopoieticCellCandidate) {
    result.findings = asObject(result.findings);
    result.findings.focalHematopoieticCellObserved = true;
    result.findings.focalImmatureCellState = decision.focalHematopoieticCell.state;
    if (decision.focalHematopoieticCell.immatureObserved || decision.focalHematopoieticCell.immatureSuspicious) {
      result.findings.immatureCells = true;
      result.findings.blastEvidenceState = decision.focalHematopoieticCell.state;
      result.findings.blastSuspicion = true;
      result.normalityBlocked = true;
      result.requiresHumanReview = true;
      // Focal evidence is not a population class.
      result.peripheralMorphologyClassification = "FOCAL_IMMATURE_OR_BLASTOID_CELL";
    }
  }

  if (decision.parasiteArbitration.competingWeakParasite) {
    clearParasiteProjection(result);
    const lme = asObject(result.localMorphologyEvidence);
    lme.criticalMorphology = asObject(lme.criticalMorphology);
    lme.criticalMorphology.parasites = "SUSPICIOUS_INDETERMINATE";
    lme.criticalMorphology.parasiteEvidence = {
      ...asObject(lme.criticalMorphology.parasiteEvidence),
      evidenceState: "SUSPICIOUS_INDETERMINATE",
      arbitrationVersion: PERIPHERAL_HEMATOPOIETIC_PARASITE_ARBITRATION_VERSION,
    };
    result.localMorphologyEvidence = lme;
  }

  result.adequacyMorphologyAxis = {
    ...asObject(result.adequacyMorphologyAxis),
    version: PERIPHERAL_LIMITED_FIELD_NON_SUPPRESSION_VERSION,
    adequacyClassification: result.fieldAdequacy?.limitedField === true ? "CLASS_1_LIMITED_FIELD" : null,
    positiveMorphologyPreserved: decision.polychromasia.observed || decision.focalHematopoieticCell.hematopoieticCellCandidate,
    limitedFieldDoesNotErasePositiveMorphology: true,
  };

  return result;
}

export default applyPeripheralPositiveMorphologyArbitration;
