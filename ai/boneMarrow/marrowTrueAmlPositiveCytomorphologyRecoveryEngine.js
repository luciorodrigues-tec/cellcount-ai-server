// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.50.18 — TRUE AML POSITIVE CYTOMORPHOLOGY RECOVERY & UNDER-CALL
// PREVENTION
//
// This engine does NOT diagnose AML and does NOT manufacture a blast
// population. It restores cell-level blastoid cytomorphology when the visual
// acquisition explicitly sampled cells with concordant blast-associated
// features. Population architecture remains governed by 005.50.15.5.
// ============================================================================

export const MARROW_TRUE_AML_POSITIVE_CYTOMORPHOLOGY_RECOVERY_VERSION =
  "BE-FIX-005.50.18";
export const MARROW_BLASTOID_CELL_SAMPLING_AUTHORITY_VERSION =
  "BE-FIX-005.50.18";
export const MARROW_MATURATION_COEXISTENCE_NON_SUPPRESSION_VERSION =
  "BE-FIX-005.50.18";
export const MARROW_POSITIVE_CYTOLOGY_POPULATION_SEPARATION_VERSION =
  "BE-FIX-005.50.18";

function obj(v) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}
function arr(v) {
  return Array.isArray(v) ? v : [];
}
function text(v) {
  return typeof v === "string" ? v.trim() : "";
}
function upper(v) {
  return text(v).toUpperCase();
}
function num(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function countTrue(values = []) {
  return values.filter((v) => v === true).length;
}
function marrowScope(result = {}) {
  const raw = obj(result.rawResponse);
  const specimen = upper(
    result.specimenType ||
      obj(result.specimenAssessment).specimenType ||
      obj(raw.specimenAssessment).specimenType,
  );
  return (
    specimen.includes("BONE_MARROW") ||
    specimen.includes("MEDULA") ||
    Object.keys(obj(result.marrowAdequacy)).length > 0 ||
    Object.keys(obj(raw.marrowAdequacy)).length > 0
  );
}

function classifySampleCell(cell = {}) {
  const c = obj(cell);
  const traits = [
    c.highNCRatio,
    c.openFineChromatin,
    c.nucleoli,
    c.scantBasophilicCytoplasm,
  ];
  const characterized = traits.filter((v) => typeof v === "boolean").length;
  const positive = countTrue(traits);
  const independentlyBlastoid =
    positive >= 3 ||
    (positive >= 2 && c.distinctFromMaturationContinuum === true);

  return {
    characterized,
    positive,
    independentlyBlastoid,
    coherentWithBlastoidSubset: c.morphologicallyCoherent === true,
    repeatedSupport: c.repeatedWithSimilarCells === true,
  };
}

export function evaluateMarrowTrueAmlPositiveCytomorphologyRecovery(
  result = {},
) {
  const raw = obj(result.rawResponse);
  const blast = {
    ...obj(raw.blastAssessment),
    ...obj(result.blastAssessment),
  };
  const sampling = {
    ...obj(obj(raw.blastAssessment).blastoidCellSampling),
    ...obj(blast.blastoidCellSampling),
  };
  const cells = arr(sampling.assessedCells).slice(0, 8);
  const classified = cells.map(classifySampleCell);

  const independentlyBlastoidCells = classified.filter(
    (cell) => cell.independentlyBlastoid,
  ).length;
  const cellsWithTwoOrMoreTraits = classified.filter(
    (cell) => cell.positive >= 2,
  ).length;
  const characterizedCells = classified.filter(
    (cell) => cell.characterized >= 2,
  ).length;

  const explicitQualifiedCount = num(sampling.blastoidQualifiedCellCount);
  const sampledBlastoidCount = Math.max(
    independentlyBlastoidCells,
    explicitQualifiedCount ?? 0,
  );

  const support = obj(blast.morphologySupport);
  const cyt = obj(blast.immatureCellCytology);
  const sub = obj(blast.blastoidSubpopulationContext);

  const aggregatePositiveTraits = countTrue([
    cyt.highNCRatio === true || support.highNCRatio === true,
    cyt.openFineChromatin === true || support.openFineChromatin === true,
    cyt.nucleoli === true || support.nucleoli === true,
    cyt.scantBasophilicCytoplasm === true ||
      support.scantBasophilicCytoplasm === true,
  ]);

  const aggregateBlastoidSupport =
    aggregatePositiveTraits >= 3 ||
    (aggregatePositiveTraits >= 2 && cyt.distinctFromMaturationContinuum === true);

  const existingState = upper(blast.evidenceState);
  const existingPopulationPositive =
    existingState === "OBSERVED_POPULATION" ||
    existingState === "SUSPICIOUS_POPULATION";

  const directCellLevelPositive =
    sampledBlastoidCount >= 1 || aggregateBlastoidSupport;

  const repeatedCellLevelPositive =
    sampledBlastoidCount >= 2 ||
    classified.filter(
      (cell) =>
        cell.independentlyBlastoid &&
        (cell.repeatedSupport || cell.coherentWithBlastoidSubset),
    ).length >= 2;

  // Architecture is deliberately independent. This engine may recover
  // POSITIVE BLASTOID CYTOLOGY / FOCAL_SUSPICION, but never creates a
  // SUSPICIOUS/OBSERVED population from cell-level sampling alone.
  const preExistingArchitectureQualified =
    existingPopulationPositive ||
    (
      sub.distinctFromMaturationContinuum === true &&
      sub.morphologicallyCoherent === true &&
      sub.repeatedSubsetAcrossField === true
    );

  const active =
    marrowScope(result) &&
    !existingPopulationPositive &&
    directCellLevelPositive;

  return {
    version: MARROW_TRUE_AML_POSITIVE_CYTOMORPHOLOGY_RECOVERY_VERSION,
    blastoidCellSamplingAuthorityVersion:
      MARROW_BLASTOID_CELL_SAMPLING_AUTHORITY_VERSION,
    maturationCoexistenceNonSuppressionVersion:
      MARROW_MATURATION_COEXISTENCE_NON_SUPPRESSION_VERSION,
    positiveCytologyPopulationSeparationVersion:
      MARROW_POSITIVE_CYTOLOGY_POPULATION_SEPARATION_VERSION,
    marrow: marrowScope(result),
    active,
    priorEvidenceState: existingState || null,
    assessedCellCount: cells.length,
    characterizedCellCount: characterizedCells,
    independentlyBlastoidCellCount: independentlyBlastoidCells,
    sampledBlastoidCellCount: sampledBlastoidCount,
    cellsWithTwoOrMoreBlastoidTraits: cellsWithTwoOrMoreTraits,
    aggregatePositiveTraits,
    directCellLevelPositive,
    repeatedCellLevelPositive,
    preExistingArchitectureQualified,
    recoveredEvidenceState: active ? "FOCAL_SUSPICION" : existingState || null,
    cellLevelPositiveCytology: active,
    populationPositiveFabricated: false,
    populationPromotionAllowedByThisEngine: false,
    diagnosisAllowedByThisEngine: false,
    reason: active
      ? "Concordant blast-associated cytomorphology is preserved at cell level despite coexistence of maturing myeloid forms; population architecture remains independently gated."
      : "No independently qualified positive blastoid cytomorphology was recovered.",
  };
}

export function applyMarrowTrueAmlPositiveCytomorphologyRecovery(result = {}) {
  if (!result || typeof result !== "object") return result;

  const decision = evaluateMarrowTrueAmlPositiveCytomorphologyRecovery(result);
  const out = {
    ...result,
    marrowTrueAmlPositiveCytomorphologyRecovery: decision,
  };

  if (!decision.marrow || !decision.active) return out;

  const blast = { ...obj(out.blastAssessment) };
  const sampling = obj(blast.blastoidCellSampling);
  const cells = arr(sampling.assessedCells);

  const traitVotes = (key) => {
    const values = cells.map((cell) => obj(cell)[key]).filter((v) => typeof v === "boolean");
    if (!values.length) return null;
    const yes = values.filter((v) => v === true).length;
    return yes >= Math.ceil(values.length / 2);
  };

  blast.evidenceState = "FOCAL_SUSPICION";
  blast.observed = false;
  blast.globalAbsenceAllowed = false;
  blast.estimatedPercentage = null;
  blast.approximateBlastLikeCells =
    decision.sampledBlastoidCellCount > 0
      ? decision.sampledBlastoidCellCount
      : blast.approximateBlastLikeCells ?? null;
  blast.morphologySupport = {
    ...obj(blast.morphologySupport),
    highNCRatio:
      traitVotes("highNCRatio") ?? obj(blast.morphologySupport).highNCRatio ?? null,
    openFineChromatin:
      traitVotes("openFineChromatin") ?? obj(blast.morphologySupport).openFineChromatin ?? null,
    nucleoli:
      traitVotes("nucleoli") ?? obj(blast.morphologySupport).nucleoli ?? null,
    scantBasophilicCytoplasm:
      traitVotes("scantBasophilicCytoplasm") ??
      obj(blast.morphologySupport).scantBasophilicCytoplasm ??
      null,
  };
  blast.immatureCellCytology = {
    ...obj(blast.immatureCellCytology),
    highNCRatio:
      traitVotes("highNCRatio") ?? obj(blast.immatureCellCytology).highNCRatio ?? null,
    openFineChromatin:
      traitVotes("openFineChromatin") ?? obj(blast.immatureCellCytology).openFineChromatin ?? null,
    nucleoli:
      traitVotes("nucleoli") ?? obj(blast.immatureCellCytology).nucleoli ?? null,
    scantBasophilicCytoplasm:
      traitVotes("scantBasophilicCytoplasm") ??
      obj(blast.immatureCellCytology).scantBasophilicCytoplasm ??
      null,
    morphologicallyCoherent:
      cells.some((cell) => obj(cell).morphologicallyCoherent === true)
        ? true
        : obj(blast.immatureCellCytology).morphologicallyCoherent ?? null,
    repeatedSubsetAcrossField:
      decision.repeatedCellLevelPositive
        ? true
        : obj(blast.immatureCellCytology).repeatedSubsetAcrossField ?? null,
    distinctFromMaturationContinuum:
      cells.some((cell) => obj(cell).distinctFromMaturationContinuum === true)
        ? true
        : obj(blast.immatureCellCytology).distinctFromMaturationContinuum ?? null,
  };
  blast.candidateEvidenceState =
    "POSITIVE_BLASTOID_CYTOLOGY_REQUIRES_POPULATION_DISCRIMINATION";
  blast.positiveEvidenceLock = {
    ...obj(blast.positiveEvidenceLock),
    active: true,
    focalOnly: true,
    cellLevelPositiveCytology: true,
    populationPositiveAllowed: false,
    blastPercentageInferenceAllowed: false,
    maturationCoexistenceCannotSuppress: true,
    preservedBy: MARROW_TRUE_AML_POSITIVE_CYTOMORPHOLOGY_RECOVERY_VERSION,
  };

  out.blastAssessment = blast;
  out.findings = {
    ...obj(out.findings),
    immatureCells: true,
    blastSuspicion: true,
    blastEvidenceState: "FOCAL_SUSPICION",
  };
  out.normalityBlocked = true;
  out.requiresHumanReview = true;
  out.evidenceGovernance = {
    ...obj(out.evidenceGovernance),
    blastPercentageInferenceAllowed: false,
    cellLevelPositiveBlastoidCytology: true,
    populationPositiveAllowed: false,
    trueAmlPositiveCytomorphologyRecoveryVersion:
      MARROW_TRUE_AML_POSITIVE_CYTOMORPHOLOGY_RECOVERY_VERSION,
  };

  return out;
}

export default applyMarrowTrueAmlPositiveCytomorphologyRecovery;
