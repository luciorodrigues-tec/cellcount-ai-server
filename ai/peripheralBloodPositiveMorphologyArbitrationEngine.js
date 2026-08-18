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
export const PERIPHERAL_POLYCHROMASIA_CONTRADICTION_GUARD_VERSION =
  "BE-FIX-005.50.10";
export const PERIPHERAL_FOCAL_CARDINALITY_SIGNAL_VERSION =
  "BE-FIX-005.50.9";

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
function evaluatePolychromasiaText(value) {
  const t = norm(value);
  if (!t) return { positive: false, explicitNegative: false, artifactOnly: false };

  const mentions = /policrom|polychrom|policromatof|hemacias? azulad|hemacias? acinzentad|bluish erythro/.test(t);
  const explicitNegative =
    /(?:nao|sem|ausencia|ausente|not observed|absent)[\s\S]{0,120}(?:policrom|polychrom|policromatof|hemacias? azulad|hemacias? acinzentad)/.test(t) ||
    /(?:policrom|polychrom|policromatof)[\s\S]{0,80}(?:nao identific|nao observ|ausent|not observed|absent)/.test(t) ||
    /nao se identificam[\s\S]{0,140}(?:policrom|polychrom|policromatof)/.test(t);
  const artifactOnly =
    mentions && /(?:borda|iluminacao|balanco de branco|white balance|artefat|precipitado|sobreposicao)/.test(t) &&
    /(?:concentrad|atribu|explic|relacionad|provavel|favorec)/.test(t);

  return {
    positive: mentions && !explicitNegative && !artifactOnly,
    explicitNegative,
    artifactOnly,
  };
}
function containsPositivePolychromasia(value) {
  return evaluatePolychromasiaText(value).positive;
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
  const polychromasiaTextAssessment = evaluatePolychromasiaText(rbcCorpus);
  const polychromasiaContradiction =
    polychromasiaState === "OBSERVED" &&
    (polychromasiaTextAssessment.explicitNegative || polychromasiaTextAssessment.artifactOnly);
  const polychromasiaObserved =
    !polychromasiaContradiction &&
    (polychromasiaState === "OBSERVED" || polychromasiaTextAssessment.positive);

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
      state: polychromasiaObserved
        ? "OBSERVED"
        : polychromasiaContradiction
          ? "NOT_ASSESSABLE"
          : (polychromasiaState || "NOT_ASSESSABLE"),
      evidence: text(rbc.polychromasiaEvidence || rawRbc.polychromasiaEvidence),
      fieldScoped: true,
      globalExclusionAllowed: false,
      contradictionGuardVersion: PERIPHERAL_POLYCHROMASIA_CONTRADICTION_GUARD_VERSION,
      contradictionDetected: polychromasiaContradiction,
      explicitNegativeEvidence: polychromasiaTextAssessment.explicitNegative,
      artifactOnlyColorSignal: polychromasiaTextAssessment.artifactOnly,
    },
    focalHematopoieticCell: {
      observedCellCount,
      hematopoieticCellCandidate,
      immatureObserved: focalImmatureObserved,
      immatureSuspicious: focalImmatureSuspicious,
      state: focalImmatureObserved ? "OBSERVED" : focalImmatureSuspicious ? "SUSPICIOUS_INDETERMINATE" : (focalState || "NOT_ASSESSABLE"),
      evidence: text(wbc.focalImmatureCellEvidence || rawWbc.focalImmatureCellEvidence),
      cardinality: "FOCAL_CELL",
      cardinalityVersion: PERIPHERAL_FOCAL_CARDINALITY_SIGNAL_VERSION,
      populationInferenceAllowed: false,
      populationEvidenceEstablished: false,
      blastPercentageInferenceAllowed: false,
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

  if (decision.polychromasia.contradictionDetected) {
    result.erythrocyteFindings = asObject(result.erythrocyteFindings);
    result.erythrocyteFindings.polychromasia = false;
    result.erythrocyteFindings.polychromasiaState = "NOT_ASSESSABLE";
    result.positiveFindings = asArray(result.positiveFindings).filter(
      (item) => !/policrom|polychrom/i.test(String(item || "")),
    );
  }

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
