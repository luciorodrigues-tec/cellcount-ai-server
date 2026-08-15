// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.27.2 — DUAL-AXIS MARROW BLAST SCORING
// & CALIBRATED SUBPOPULATION ESCALATION
// ============================================================================

export const MARROW_DUAL_AXIS_BLAST_SCORING_VERSION = "BE-FIX-005.27.2";

function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function b(value) {
  return value === true ? 1 : 0;
}

export function scoreMarrowBlastAxes({
  physiologicSignals = {},
  blastSpecificSignals = {},
  blastoidSubpopulationSignals = {},
  approximateBlastLikeCells = null,
  evidenceState = "NOT_ASSESSABLE",
  populationPattern = "indeterminate",
} = {}) {
  // Physiologic maturation axis: weighted toward true continuity/order rather
  // than simple heterogeneity. A heterogeneous pathologic marrow may still
  // contain a distinct blastoid subset.
  const physiologicRaw =
    0.20 * b(physiologicSignals.maturationHeterogeneity) +
    0.25 * b(physiologicSignals.maturationContinuum) +
    0.15 * b(physiologicSignals.matureFormsPresent) +
    0.15 * b(physiologicSignals.lineageDiversity) +
    0.20 * b(physiologicSignals.orderlyGranulocyticMaturation) +
    0.05 * b(physiologicSignals.nonMonomorphicBackground);

  // Blastoid axis: architecture/subpopulation identity carries more weight
  // than isolated cytologic traits such as high N:C ratio.
  let blastoidRaw =
    0.12 * b(blastSpecificSignals.highNCRatio) +
    0.14 * b(blastSpecificSignals.openFineChromatin) +
    0.10 * b(blastSpecificSignals.nucleoli) +
    0.08 * b(blastSpecificSignals.scantBasophilicCytoplasm) +
    0.12 * b(blastSpecificSignals.monomorphism) +
    0.12 * b(blastSpecificSignals.repeatedAcrossField) +
    0.08 * b(blastSpecificSignals.dominantOrRepeatedPattern) +
    0.08 * b(blastoidSubpopulationSignals.distinctFromMaturationContinuum) +
    0.07 * b(blastoidSubpopulationSignals.morphologicallyCoherent) +
    0.05 * b(blastoidSubpopulationSignals.repeatedSubsetAcrossField) +
    0.04 * b(blastoidSubpopulationSignals.disproportionateImmatureSubset);

  const count = Number(approximateBlastLikeCells);
  if (Number.isFinite(count)) {
    if (count >= 10) blastoidRaw += 0.08;
    else if (count >= 6) blastoidRaw += 0.05;
    else if (count >= 3) blastoidRaw += 0.02;
  }

  if (String(evidenceState).toUpperCase() === "OBSERVED_POPULATION") {
    blastoidRaw += 0.08;
  } else if (String(evidenceState).toUpperCase() === "SUSPICIOUS_POPULATION") {
    blastoidRaw += 0.04;
  }

  if (["dominant", "repeated"].includes(String(populationPattern).toLowerCase())) {
    blastoidRaw += 0.03;
  }

  const physiologicScore = clamp01(physiologicRaw);
  const blastoidScore = clamp01(blastoidRaw);

  const subpopulationCore =
    blastoidSubpopulationSignals.distinctFromMaturationContinuum === true &&
    blastoidSubpopulationSignals.morphologicallyCoherent === true &&
    blastoidSubpopulationSignals.repeatedSubsetAcrossField === true;

  const cytologyCoreCount = [
    blastSpecificSignals.highNCRatio,
    blastSpecificSignals.openFineChromatin,
    blastSpecificSignals.nucleoli,
    blastSpecificSignals.scantBasophilicCytoplasm,
  ].filter((v) => v === true).length;

  const architectureCoreCount = [
    blastSpecificSignals.monomorphism,
    blastSpecificSignals.repeatedAcrossField,
    blastSpecificSignals.dominantOrRepeatedPattern,
    blastoidSubpopulationSignals.distinctFromMaturationContinuum,
    blastoidSubpopulationSignals.morphologicallyCoherent,
    blastoidSubpopulationSignals.repeatedSubsetAcrossField,
    blastoidSubpopulationSignals.disproportionateImmatureSubset,
  ].filter((v) => v === true).length;

  // Calibrated escalation rule: physiologic maturation does not veto a strong
  // blastoid axis. It only lowers certainty unless the suspicious subset itself
  // is not separable from the maturation continuum.
  const suspiciousEscalation =
    blastoidScore >= 0.53 &&
    cytologyCoreCount >= 2 &&
    architectureCoreCount >= 2 &&
    (
      subpopulationCore ||
      blastSpecificSignals.repeatedAcrossField === true ||
      ["dominant", "repeated"].includes(String(populationPattern).toLowerCase())
    );

  const observedEscalation =
    String(evidenceState).toUpperCase() === "OBSERVED_POPULATION" &&
    blastoidScore >= 0.62 &&
    cytologyCoreCount >= 2 &&
    architectureCoreCount >= 2;

  const physiologicDominance =
    physiologicScore >= 0.67 &&
    blastoidScore < 0.46 &&
    subpopulationCore === false;

  const indeterminateZone =
    !observedEscalation &&
    !suspiciousEscalation &&
    !physiologicDominance &&
    (
      blastoidScore >= 0.34 ||
      ["SUSPICIOUS_POPULATION", "FOCAL_SUSPICION"].includes(String(evidenceState).toUpperCase())
    );

  const confidenceMargin = Math.abs(blastoidScore - physiologicScore);

  return {
    version: MARROW_DUAL_AXIS_BLAST_SCORING_VERSION,
    physiologicScore,
    blastoidScore,
    confidenceMargin,
    cytologyCoreCount,
    architectureCoreCount,
    subpopulationCore,
    observedEscalation,
    suspiciousEscalation,
    physiologicDominance,
    indeterminateZone,
  };
}

export default scoreMarrowBlastAxes;
