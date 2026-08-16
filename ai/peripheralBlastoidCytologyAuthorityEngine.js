// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.50.5 — PERIPHERAL BLASTOID CYTOLOGY ACQUISITION &
//                   NEGATIVE-FINDING AUTHORITY CONTROL
// ============================================================================

export const PERIPHERAL_BLASTOID_CYTOLOGY_AUTHORITY_VERSION = "BE-FIX-005.50.5";
export const PERIPHERAL_NEGATIVE_FINDING_AUTHORITY_CONTROL_VERSION = "BE-FIX-005.50.5";
export const PERIPHERAL_FOCAL_VS_POPULATION_SEPARATION_VERSION = "BE-FIX-005.50.5";

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
  // population. 005.50.5 never converts one cell into blastosis/AML.
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

  return {
    version: PERIPHERAL_BLASTOID_CYTOLOGY_AUTHORITY_VERSION,
    active,
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
    populationInferenceAllowed: false,
    amlDiagnosisAllowed: false,
    negativeBlastAuthorityAllowed: !active,
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
    populationInferenceAllowed: false,
    version: PERIPHERAL_BLASTOID_CYTOLOGY_AUTHORITY_VERSION,
  };

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

export default applyPeripheralBlastoidCytologyAuthority;
