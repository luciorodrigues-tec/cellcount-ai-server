// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.11 — EVIDENCE-CONSISTENT FINAL MORPHOLOGY SYNTHESIS
// ============================================================================
// Final compatibility projection from canonical LME-1.0 into morphologyAnalysis.
// This module does not create new visual findings and does not convert
// LIMITED_FIELD into NO_MORPHOLOGY.
// ============================================================================

export const EVIDENCE_CONSISTENT_MORPHOLOGY_SYNTHESIS_VERSION = "BE-FIX-005.11";
export const SINGLE_BLAST_PRESENTATION_GOVERNANCE_VERSION = "BE-FIX-005.17";

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asArray(value) {
  return Array.isArray(value) ? value.filter((v) => v !== null && v !== undefined) : [];
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function joinObserved(values = []) {
  return [...new Set(values.map(text).filter(Boolean))].join(" ");
}

function parasiteObserved(lme = {}) {
  return asObject(lme.criticalMorphology).parasites === "OBSERVED";
}

function localAtypicalMorphology(result = {}, lme = {}) {
  const findings = asObject(result.findings);
  const wbc = asObject(lme.leukocytes);

  return (
    findings.largeMononuclearCells === true ||
    findings.atypicalLymphocytes === true ||
    findings.reactiveLymphocytes === true ||
    findings.monomorphicPopulation === true ||
    Boolean(text(wbc.atypia)) ||
    Boolean(text(wbc.blastLikeFeatures))
  );
}

export function applyEvidenceConsistentFinalMorphologySynthesis(result = {}) {
  if (!result || typeof result !== "object") return result;

  const lme = asObject(result.localMorphologyEvidence);
  if (lme.contractVersion !== "LME-1.0" || lme.evidenceAvailable !== true) {
    return result;
  }

  const rbc = asObject(lme.erythrocytes);
  const wbc = asObject(lme.leukocytes);
  const plt = asObject(lme.platelets);
  const field = asObject(lme.field);

  result.morphologyAnalysis = asObject(result.morphologyAnalysis);
  const morphology = result.morphologyAnalysis;
  const existing = asObject(morphology.visualMorphologyDescription);

  const nuclearFeatures = joinObserved([
    wbc.nuclearMorphology,
    wbc.chromatin,
    wbc.nucleoli,
    wbc.ncRatio,
  ]);

  const cytoplasmicFeatures = joinObserved([
    wbc.cytoplasm,
    wbc.granulation,
    ...asArray(wbc.inclusions),
  ]);

  const erythrocyteBackground = joinObserved([
    rbc.description,
    rbc.size,
    rbc.shape,
    rbc.chromia,
    rbc.distribution,
    rbc.anisocytosis,
    rbc.poikilocytosis,
    ...asArray(rbc.specificForms),
  ]);

  const plateletBackground = joinObserved([
    plt.description,
    plt.distribution,
    plt.size,
    plt.aggregates,
    plt.morphology,
  ]);

  morphology.visualMorphologyDescription = {
    ...existing,
    globalView:
      text(existing.globalView) ||
      text(field.description) ||
      text(result.whatAISees?.globalField),
    dominantPopulation:
      text(existing.dominantPopulation) ||
      text(wbc.description) ||
      text(result.whatAISees?.dominantFinding),
    cellularity:
      text(existing.cellularity) ||
      text(field.observableCellularity) ||
      text(result.whatAISees?.cellularity),
    nuclearFeatures:
      text(existing.nuclearFeatures) || nuclearFeatures,
    cytoplasmicFeatures:
      text(existing.cytoplasmicFeatures) || cytoplasmicFeatures,
    populationHeterogeneity:
      text(existing.populationHeterogeneity) || text(wbc.heterogeneity),
    erythrocyteBackground:
      text(existing.erythrocyteBackground) || erythrocyteBackground,
    plateletBackground:
      text(existing.plateletBackground) || plateletBackground,
    criticalNegativeFindings:
      text(existing.criticalNegativeFindings) ||
      text(result.whatAISees?.negativeFindings),
    overallImpression:
      text(existing.overallImpression) ||
      text(wbc.description) ||
      text(field.description),
  };

  morphology.cellMorphology = {
    ...asObject(morphology.cellMorphology),
    leukocyte: {
      ...asObject(asObject(morphology.cellMorphology).leukocyte),
      nuclearMorphology: text(wbc.nuclearMorphology),
      chromatin: text(wbc.chromatin),
      nucleoli: text(wbc.nucleoli),
      ncRatio: text(wbc.ncRatio),
      cytoplasm: text(wbc.cytoplasm),
      granulation: text(wbc.granulation),
      maturation: text(wbc.maturation),
      atypia: text(wbc.atypia),
      blastLikeFeatures: text(wbc.blastLikeFeatures),
    },
    erythrocyte: {
      ...asObject(asObject(morphology.cellMorphology).erythrocyte),
      size: text(rbc.size),
      shape: text(rbc.shape),
      chromia: text(rbc.chromia),
      anisocytosis: text(rbc.anisocytosis),
      poikilocytosis: text(rbc.poikilocytosis),
    },
    platelet: {
      ...asObject(asObject(morphology.cellMorphology).platelet),
      distribution: text(plt.distribution),
      size: text(plt.size),
      aggregates: text(plt.aggregates),
      morphology: text(plt.morphology),
    },
  };

  morphology.populationPatternAnalysis = {
    ...asObject(morphology.populationPatternAnalysis),
    observedCellCount: wbc.observedCellCount ?? null,
    heterogeneity: text(wbc.heterogeneity),
    localMorphologyOnly: result.fieldAdequacy?.limitedField === true,
    populationInferenceAllowed:
      result.fieldAdequacy?.populationInferenceAllowed !== false,
  };

  // Canonical LME tri-state is authoritative for parasite projection.
  result.findings = asObject(result.findings);
  if (!parasiteObserved(lme)) {
    result.findings.parasiteSuspected = false;
    if (result.fieldAdequacy && typeof result.fieldAdequacy === "object") {
      result.fieldAdequacy.parasiteSignal = false;
    }
  }

  // LIMITED_FIELD is scope metadata; retain a positive local morphology class.
  if (
    result.fieldAdequacy?.limitedField === true &&
    localAtypicalMorphology(result, lme)
  ) {
    const current = text(result.finalClassification);
    if (!current || current === "CLASS_0_NORMAL" || current === "CLASS_1_LIMITED_FIELD") {
      result.finalClassification = "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL";
    }

    const risk = text(result.morphologicRiskClass);
    if (!risk || risk === "CLASS_0_NORMAL" || risk === "CLASS_1_LIMITED_FIELD") {
      result.morphologicRiskClass = "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL";
    }

    if (!text(result.riskLevel) || /campo limitado$/i.test(text(result.riskLevel))) {
      result.riskLevel = "Campo limitado contendo morfologia local atípica/reacional";
    }
  }


  const criticalMorphology = asObject(lme.criticalMorphology);
  const blastEvidenceState = text(criticalMorphology.blastLikeMorphology);
  const blastPositive =
    blastEvidenceState === "OBSERVED" ||
    blastEvidenceState === "SUSPICIOUS_INDETERMINATE";

  if (blastPositive) {
    result.findings = asObject(result.findings);
    result.findings.blastSuspicion = true;
    result.findings.blastEvidenceState = blastEvidenceState;
    if (blastEvidenceState === "OBSERVED") {
      result.findings.observedBlastLikeCount =
        Math.max(1, Number(criticalMorphology.observedBlastLikeCount || 1));
    }
    result.requiresHumanReview = true;
    result.normalityBlocked = true;
  }

  result.evidenceConsistentMorphologySynthesis = {
    version: EVIDENCE_CONSISTENT_MORPHOLOGY_SYNTHESIS_VERSION,
    singleBlastPresentationGovernanceVersion:
      SINGLE_BLAST_PRESENTATION_GOVERNANCE_VERSION,
    blastEvidenceState: blastEvidenceState || null,
    blastPositiveEvidencePreserved: blastPositive,
    source: "LME-1.0",
    parasitePositiveEvidence: parasiteObserved(lme),
    localMorphologyProjected: true,
    limitedFieldPreserved:
      result.fieldAdequacy?.limitedField === true,
  };

  return result;
}

export default applyEvidenceConsistentFinalMorphologySynthesis;
