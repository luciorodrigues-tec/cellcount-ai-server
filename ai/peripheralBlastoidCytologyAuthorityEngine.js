// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.50.6 — FOCAL-CELL NEGATIVE BLAST AUTHORITY GATE &
//                   PERIPHERAL BLASTOID CYTOLOGY PRESERVATION
// ============================================================================

export const PERIPHERAL_BLASTOID_CYTOLOGY_AUTHORITY_VERSION = "BE-FIX-005.50.6";
export const PERIPHERAL_NEGATIVE_FINDING_AUTHORITY_CONTROL_VERSION = "BE-FIX-005.50.6";
export const PERIPHERAL_FOCAL_VS_POPULATION_SEPARATION_VERSION = "BE-FIX-005.50.6";
export const PERIPHERAL_FOCAL_BLASTOID_CARDINALITY_AUTHORITY_VERSION = "BE-FIX-005.50.9";
export const PERIPHERAL_FOCAL_BLASTOID_PRESENTATION_LOCK_VERSION = "BE/FE-FIX-005.50.9";

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function asArray(value) {
  return Array.isArray(value) ? value : [];
}
function text(value) {
  return typeof value === "string" ? value.trim() : "";
}
function upper(value) {
  return text(value).toUpperCase();
}
function finite(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function isObserved(value) {
  return upper(value) === "OBSERVED";
}
function unique(values = []) {
  return [...new Set(values.map((v) => text(v)).filter(Boolean))];
}

function cytologyOf(result = {}) {
  const lme = asObject(result.localMorphologyEvidence);
  const wbc = asObject(lme.leukocytes);
  const rawWbc = asObject(asObject(asObject(result.rawResponse).observedMorphology).leukocytes);

  return {
    lme,
    wbc,
    rawWbc,
    structured: {
      ...asObject(rawWbc.focalBlastoidCytology),
      ...asObject(wbc.focalBlastoidCytology),
    },
  };
}

function observedFeatureCount(cytology = {}) {
  return [
    cytology.highNCRatio,
    cytology.openFineChromatin,
    cytology.nucleoli,
    cytology.scantBasophilicCytoplasm,
    cytology.largeCellSize,
  ].filter(isObserved).length;
}

export function evaluatePeripheralBlastoidCytologyAuthority(result = {}) {
  const { wbc, rawWbc, structured } = cytologyOf(result);

  const hematopoieticCandidate =
    wbc.hematopoieticCellCandidate === true ||
    rawWbc.hematopoieticCellCandidate === true;

  const declaredState = upper(
    structured.state ||
    wbc.focalImmatureCellState ||
    rawWbc.focalImmatureCellState,
  ) || "NOT_ASSESSABLE";

  const calculatedFeatureCount = observedFeatureCount(structured);
  const declaredFeatureCount = finite(structured.featureCount);
  const featureCount = Math.max(
    calculatedFeatureCount,
    declaredFeatureCount ?? 0,
  );

  const cellCount =
    finite(structured.cellCount) ??
    finite(wbc.observedCellCount) ??
    finite(rawWbc.approximateVisibleCells);

  // A focal cell can be morphologically meaningful without establishing a
  // population. 005.50.6 never converts one cell into blastosis/AML.
  const enoughForSuspicion =
    hematopoieticCandidate &&
    (cellCount === null || cellCount >= 1) &&
    featureCount >= 2;

  const enoughForObservedBlastoid =
    hematopoieticCandidate &&
    (cellCount === null || cellCount >= 1) &&
    declaredState === "OBSERVED" &&
    featureCount >= 3;

  let effectiveState = declaredState;

  // Narrative/structure contradiction recovery:
  // >=2 independent blastoid features cannot coexist with a hard negative.
  if (
    enoughForSuspicion &&
    ["NOT_OBSERVED_IN_EVALUABLE_FIELD", "NOT_ASSESSABLE"].includes(effectiveState)
  ) {
    effectiveState = "SUSPICIOUS_INDETERMINATE";
  }

  if (enoughForObservedBlastoid) {
    effectiveState = "OBSERVED";
  } else if (
    effectiveState === "OBSERVED" &&
    featureCount < 3
  ) {
    // Avoid overcalling an unsupported OBSERVED state.
    effectiveState = featureCount >= 2
      ? "SUSPICIOUS_INDETERMINATE"
      : "NOT_ASSESSABLE";
  } else if (
    effectiveState === "SUSPICIOUS_INDETERMINATE" &&
    !enoughForSuspicion
  ) {
    // Preserve model suspicion only if at least one concrete cytologic feature
    // or explicit focal evidence exists; otherwise remain indeterminate.
    const focalEvidence = text(
      wbc.focalImmatureCellEvidence ||
      rawWbc.focalImmatureCellEvidence ||
      structured.evidence,
    );
    if (featureCount < 1 && !focalEvidence) {
      effectiveState = "NOT_ASSESSABLE";
    }
  }

  const active = ["OBSERVED", "SUSPICIOUS_INDETERMINATE"].includes(effectiveState);

  // BE-FIX-005.50.6 — a sparse field containing only one recognized
  // hematopoietic cell cannot carry a hard field-level negative blast
  // conclusion. The cell may be described as mature, but that is not the same
  // as an adequate blast screen of the peripheral smear. This specifically
  // separates CELL-LEVEL cytology from FIELD-LEVEL negative authority.
  const focalOnlyField =
    hematopoieticCandidate &&
    cellCount !== null &&
    cellCount <= 1;

  const hardNegativeDeclared =
    effectiveState === "NOT_OBSERVED_IN_EVALUABLE_FIELD";

  const focalNegativeAuthorityBlocked =
    focalOnlyField && hardNegativeDeclared && !active;

  if (focalNegativeAuthorityBlocked) {
    effectiveState = "NOT_ASSESSABLE";
  }

  const effectiveActive =
    ["OBSERVED", "SUSPICIOUS_INDETERMINATE"].includes(effectiveState);

  return {
    version: PERIPHERAL_BLASTOID_CYTOLOGY_AUTHORITY_VERSION,
    active: effectiveActive,
    declaredState,
    effectiveState,
    hematopoieticCandidate,
    cellCount,
    featureCount,
    featureStates: {
      highNCRatio: upper(structured.highNCRatio) || "NOT_ASSESSABLE",
      openFineChromatin: upper(structured.openFineChromatin) || "NOT_ASSESSABLE",
      nucleoli: upper(structured.nucleoli) || "NOT_ASSESSABLE",
      scantBasophilicCytoplasm: upper(structured.scantBasophilicCytoplasm) || "NOT_ASSESSABLE",
      largeCellSize: upper(structured.largeCellSize) || "NOT_ASSESSABLE",
    },
    evidence: text(
      structured.evidence ||
      wbc.focalImmatureCellEvidence ||
      rawWbc.focalImmatureCellEvidence,
    ),
    reactiveMimicFeatures: text(structured.reactiveMimicFeatures),
    cardinality: "FOCAL_CELL",
    populationInferenceAllowed: false,
    populationEvidenceEstablished: false,
    blastPercentageInferenceAllowed: false,
    amlDiagnosisAllowed: false,
    focalOnlyField,
    focalNegativeAuthorityBlocked,
    negativeBlastAuthorityAllowed: !effectiveActive && !focalNegativeAuthorityBlocked,
  };
}

function promoteIntoLme(result, decision) {
  const lme = asObject(result.localMorphologyEvidence);
  lme.leukocytes = asObject(lme.leukocytes);
  lme.criticalMorphology = asObject(lme.criticalMorphology);

  lme.leukocytes.focalBlastoidCytology = {
    ...asObject(lme.leukocytes.focalBlastoidCytology),
    version: PERIPHERAL_BLASTOID_CYTOLOGY_AUTHORITY_VERSION,
    effectiveState: decision.effectiveState,
    featureCount: decision.featureCount,
    evidence: decision.evidence,
    populationInferenceAllowed: false,
  };

  if (decision.active) {
    lme.criticalMorphology.blastLikeMorphology = decision.effectiveState;
    if (decision.effectiveState === "OBSERVED") {
      lme.criticalMorphology.observedBlastLikeCount = Math.max(
        1,
        finite(decision.cellCount) ?? 1,
      );
    }
  }

  result.localMorphologyEvidence = lme;
  return result;
}

export function applyPeripheralBlastoidCytologyAuthority(result = {}) {
  if (!result || typeof result !== "object") return result;

  const decision = evaluatePeripheralBlastoidCytologyAuthority(result);
  result.peripheralBlastoidCytologyAuthority = decision;

  promoteIntoLme(result, decision);

  result.findings = asObject(result.findings);
  result.positiveMorphology = asObject(result.positiveMorphology);
  result.positiveMorphology.leukocytes = asObject(result.positiveMorphology.leukocytes);

  result.positiveMorphology.leukocytes.focalBlastoidCytology = {
    state: decision.effectiveState,
    featureCount: decision.featureCount,
    evidence: decision.evidence,
    fieldScoped: true,
    cardinality: "FOCAL_CELL",
    populationInferenceAllowed: false,
    populationEvidenceEstablished: false,
    blastPercentageInferenceAllowed: false,
    version: PERIPHERAL_BLASTOID_CYTOLOGY_AUTHORITY_VERSION,
  };

  if (decision.focalNegativeAuthorityBlocked) {
    // Do not fabricate suspicion. Only revoke an unsupported hard negative.
    result.findings.focalHematopoieticCellObserved = true;
    result.findings.focalImmatureCellState = "NOT_ASSESSABLE";
    result.findings.blastEvidenceState = "NOT_ASSESSABLE";
    result.findings.blastSuspicion = false;
    result.normalityBlocked = true;
    result.requiresHumanReview = true;

    result.blockNormalReason = unique([
      ...asArray(result.blockNormalReason),
      "Campo com célula hematopoiética focal isolada: insuficiente para conclusão negativa de blastos.",
    ]);
  }

  if (decision.active) {
    result.findings.focalHematopoieticCellObserved = true;
    result.findings.focalImmatureCellState = decision.effectiveState;
    result.findings.immatureCells = true;
    result.findings.blastSuspicion = true;
    result.findings.blastEvidenceState = decision.effectiveState;

    if (decision.effectiveState === "OBSERVED") {
      result.findings.observedBlastLikeCount = Math.max(
        1,
        finite(decision.cellCount) ?? 1,
      );
    }

    result.normalityBlocked = true;
    result.requiresHumanReview = true;
    result.peripheralMorphologyClassification = "FOCAL_IMMATURE_OR_BLASTOID_CELL";

    const positiveText =
      decision.effectiveState === "OBSERVED"
        ? "Célula hematopoiética focal com morfologia blastoide diretamente sustentada no campo."
        : "Célula hematopoiética focal com traços de imaturidade/blastoidia; distinção morfológica permanece indeterminada.";

    result.positiveFindings = unique([
      ...asArray(result.positiveFindings),
      positiveText,
    ]);

    result.morphologyAnalysis = asObject(result.morphologyAnalysis);
    const current = text(result.morphologyAnalysis.leukocyteReview);
    if (!current.includes(positiveText)) {
      result.morphologyAnalysis.leukocyteReview =
        [current, positiveText].filter(Boolean).join(" ");
    }
  }

  return result;
}

export function applyPeripheralNegativeFindingAuthorityControl(result = {}) {
  if (!result || typeof result !== "object") return result;

  const authority = asObject(result.peripheralBlastoidCytologyAuthority);
  const blastPositive = authority.active === true ||
    result.findings?.blastSuspicion === true ||
    ["OBSERVED", "SUSPICIOUS_INDETERMINATE"].includes(
      upper(result.findings?.blastEvidenceState),
    );

  const scope = asObject(result.negativeFindingScope);
  const items = asArray(scope.items);

  const focalNegativeAuthorityBlocked =
    authority.focalNegativeAuthorityBlocked === true;

  const secondaryKeys = new Set([
    "auerRods",
    "schistocytes",
    "plateletAggregates",
  ]);

  const primaryItems = [];
  const secondaryItems = [];

  for (const item of items) {
    const key = text(item?.key);
    if (blastPositive && secondaryKeys.has(key)) {
      secondaryItems.push({
        ...item,
        presentationAuthority: "SECONDARY_DETAIL",
      });
    } else {
      primaryItems.push({
        ...item,
        presentationAuthority:
          item?.status === "OBSERVED_OR_SUSPECTED"
            ? "PRIMARY_POSITIVE"
            : "PRIMARY_CONTEXT",
      });
    }
  }

  result.negativeFindingAuthority = {
    version: PERIPHERAL_NEGATIVE_FINDING_AUTHORITY_CONTROL_VERSION,
    blastPositive,
    focalNegativeAuthorityBlocked,
    principle: "POSITIVE_MORPHOLOGY_OUTRANKS_NEGATIVE_OR_INDETERMINATE_DETAIL",
    primaryItems,
    secondaryItems,
    secondarySuppressedFromExecutiveNarrative:
      blastPositive && secondaryItems.length > 0,
  };

  // Keep all domain states in negativeFindingScope for auditability, but do not
  // allow secondary negative/indeterminate items to dominate the canonical
  // primary narrative when focal blastoid morphology is positive.
  if (blastPositive) {
    const allowedPrimaryStatements = new Set(
      primaryItems
        .filter((item) =>
          item.status === "NOT_OBSERVED_IN_EVALUABLE_FIELD" ||
          item.status === "NOT_ASSESSABLE"
        )
        .map((item) => text(item.statement))
        .filter(Boolean),
    );

    result.negativeFindingsStructured = asArray(result.negativeFindingsStructured)
      .filter((statement) => allowedPrimaryStatements.has(text(statement)));

    result.morphologyAnalysis = asObject(result.morphologyAnalysis);
    result.whatAISees = asObject(result.whatAISees);
    result.morphologyAnalysis.negativeFindings = [...result.negativeFindingsStructured];
    result.morphologyAnalysis.absentFindings =
      result.negativeFindingsStructured.join("\n");
    result.whatAISees.negativeFindingsStructured =
      [...result.negativeFindingsStructured];
    result.whatAISees.negativeFindings =
      result.negativeFindingsStructured.join("\n");
  }

  return result;
}


function explicitPeripheralBlastoidPopulationEvidence(result = {}) {
  const morphology = asObject(result.morphologyAnalysis);
  const population = asObject(morphology.populationPatternAnalysis);
  const direct = asObject(result.populationMorphologyEvidence);

  const explicitBoolean = [
    population.populationInferenceSupported,
    population.populationEstablished,
    population.sustainedPopulation,
    population.repeatedPopulation,
    population.coherentPopulation,
    population.monomorphicPopulationObserved,
    population.blastoidPopulationObserved,
    direct.populationEstablished,
    direct.blastoidPopulationObserved,
  ].some((value) => value === true);

  const state = upper(
    population.blastoidPopulationState ||
    population.state ||
    direct.blastoidPopulationState ||
    direct.state,
  );

  const count =
    finite(population.blastoidCellCount) ??
    finite(population.observedCellCount) ??
    finite(direct.blastoidCellCount) ??
    finite(direct.observedCellCount);

  const repeatedStructuredEvidence =
    count !== null &&
    count >= 2 &&
    ["OBSERVED", "SUSPICIOUS_INDETERMINATE"].includes(state);

  return {
    established: explicitBoolean || repeatedStructuredEvidence,
    explicitBoolean,
    repeatedStructuredEvidence,
    state: state || "NOT_ASSESSABLE",
    observedCellCount: count,
  };
}

function focalBlastoidPresentationText(state) {
  if (state === "OBSERVED") {
    return "Elemento hematopoiético focal com morfologia blástica/blastoide diretamente sustentada no campo avaliado. O achado é celular e focal; não estabelece população blástica, percentual de blastos ou diagnóstico pela imagem isolada.";
  }

  return "Célula hematopoiética focal com características morfológicas suspeitas para blasto/blastoide no campo avaliado. O achado é celular e focal; não estabelece população blástica, percentual de blastos ou diagnóstico pela imagem isolada.";
}

function focalBlastoidClinicalMeaning(state) {
  return state === "OBSERVED"
    ? "Achado morfológico focal de alta relevância: há um elemento com morfologia blástica/blastoide diretamente sustentada. A cardinalidade permanece focal e não autoriza inferência de população, blastose ou percentual; requer revisão microscópica especializada e correlação com hemograma."
    : "Achado morfológico focal de alta relevância: há uma célula hematopoiética com características suspeitas para blasto/blastoide. A cardinalidade permanece focal e não autoriza inferência de população, blastose ou percentual; requer revisão microscópica especializada e correlação com hemograma.";
}

export function evaluatePeripheralFocalBlastoidCardinalityAuthority(result = {}) {
  const authority = asObject(result.peripheralBlastoidCytologyAuthority);
  const deep = asObject(result.peripheralFocalHematopoieticCytomorphology);
  const focalPositive =
    authority.active === true &&
    ["OBSERVED", "SUSPICIOUS_INDETERMINATE"].includes(upper(authority.effectiveState));

  const state = upper(authority.effectiveState) || "NOT_ASSESSABLE";
  const hematopoieticCandidate =
    authority.hematopoieticCandidate === true ||
    deep.hematopoieticCandidate === true ||
    result.findings?.focalHematopoieticCellObserved === true;

  const population = explicitPeripheralBlastoidPopulationEvidence(result);
  const focalOnly = focalPositive && hematopoieticCandidate && !population.established;

  return {
    version: PERIPHERAL_FOCAL_BLASTOID_CARDINALITY_AUTHORITY_VERSION,
    presentationLockVersion: PERIPHERAL_FOCAL_BLASTOID_PRESENTATION_LOCK_VERSION,
    active: focalPositive,
    state,
    cardinality: focalOnly ? "FOCAL_CELL_ONLY" : population.established ? "POPULATION_EVIDENCE_PRESENT" : "UNRESOLVED",
    focalOnly,
    hematopoieticCandidate,
    observedCellCount: finite(authority.cellCount) ?? finite(deep.cellCount),
    populationEvidenceEstablished: population.established,
    populationEvidence: population,
    populationInferenceAllowed: population.established,
    blastPercentageInferenceAllowed: population.established,
    diagnosticInferenceAllowed: false,
    amlDiagnosisAllowed: false,
    presentationText: focalOnly ? focalBlastoidPresentationText(state) : "",
    clinicalMeaning: focalOnly ? focalBlastoidClinicalMeaning(state) : "",
    principle: "FOCAL_BLASTOID_CELL_DOES_NOT_ESTABLISH_BLAST_POPULATION",
  };
}

export function applyPeripheralFocalBlastoidCardinalityAuthority(result = {}) {
  if (!result || typeof result !== "object") return result;

  const decision = evaluatePeripheralFocalBlastoidCardinalityAuthority(result);
  result.peripheralFocalBlastoidCardinalityAuthority = decision;

  if (!decision.focalOnly) return result;

  result.findings = asObject(result.findings);
  result.findings.focalHematopoieticCellObserved = true;
  result.findings.focalImmatureCellState = decision.state;
  result.findings.blastEvidenceState = decision.state;
  result.findings.blastSuspicion = true;
  result.findings.immatureCells = true;
  result.findings.blastCardinality = "FOCAL_CELL_ONLY";
  result.findings.blastPopulationEstablished = false;

  // A legacy boolean cannot, by itself, convert one focal cell into a
  // monomorphic/blast population. Genuine structured population evidence is
  // protected above and bypasses this lock.
  result.findings.monomorphicPopulation = false;

  result.peripheralMorphologyClassification =
    decision.state === "OBSERVED"
      ? "FOCAL_BLASTOID_CELL_OBSERVED"
      : "FOCAL_BLASTOID_CELL_SUSPECTED";

  result.normalityBlocked = true;
  result.requiresHumanReview = true;

  result.mainFinding = decision.presentationText;
  result.primaryFinding = decision.presentationText;
  result.finalConclusion = decision.presentationText;
  result.interpretiveSynthesis = decision.presentationText;
  result.clinicalMeaning = decision.clinicalMeaning;

  result.overallAssessment = asObject(result.overallAssessment);
  result.overallAssessment.requiresHumanReview = true;
  result.overallAssessment.mainImpression = decision.presentationText;

  result.structuredReport = asObject(result.structuredReport);
  result.structuredReport.conclusion = decision.presentationText;
  result.structuredReport.hematologicMeaning = decision.clinicalMeaning;
  result.structuredReport.recommendation =
    "Revisão microscópica especializada de múltiplos campos e correlação com hemograma e dados clínicos. Não inferir percentual ou população blástica a partir do achado focal isolado.";

  result.morphologyAnalysis = asObject(result.morphologyAnalysis);
  result.morphologyAnalysis.summary = decision.presentationText;
  result.morphologyAnalysis.overview = decision.presentationText;
  const currentLeukocyteReview = text(result.morphologyAnalysis.leukocyteReview);
  if (!currentLeukocyteReview.includes(decision.presentationText)) {
    result.morphologyAnalysis.leukocyteReview =
      [currentLeukocyteReview, decision.presentationText]
        .filter(Boolean)
        .join(" ");
  }

  result.whatAISees = asObject(result.whatAISees);
  result.whatAISees.dominantFinding = decision.presentationText;

  result.positiveFindings = unique([
    ...asArray(result.positiveFindings),
    decision.presentationText,
  ]);

  result.blockNormalReason = unique([
    ...asArray(result.blockNormalReason),
    "Achado blástico/blastoide focal requer revisão especializada; cardinalidade populacional não estabelecida.",
  ]);

  return result;
}

export default applyPeripheralBlastoidCytologyAuthority;
