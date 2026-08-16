import {
  MARROW_DUAL_AXIS_BLAST_SCORING_VERSION,
  scoreMarrowBlastAxes,
} from "./marrowBlastScoringEngine.js";

// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.27.2 — DUAL-AXIS MARROW BLAST SCORING
// & CALIBRATED SUBPOPULATION ESCALATION
//
// Scientific invariants:
//   1. Immaturity is physiologic in marrow and is not synonymous with blast.
//   2. Heterogeneous orderly maturation is evidence AGAINST promotion of a
//      blastoid population when blast morphology is not otherwise compelling.
//   3. A truly OBSERVED blastoid population is never erased by precursor logic.
//   4. Ambiguity remains indeterminate; it is not converted into reassurance.
//   5. Morphology alone never assigns lineage or diagnoses ALL/AML/leukemia.
// ============================================================================

export const MARROW_PRECURSOR_DISCRIMINATION_VERSION = "BE-FIX-005.27";
export const MARROW_PRECURSOR_REBALANCING_VERSION = "BE-FIX-005.27.1";
export const MARROW_DUAL_AXIS_SCORING_VERSION = MARROW_DUAL_AXIS_BLAST_SCORING_VERSION;

const MARROW_TYPES = new Set([
  "BONE_MARROW_ASPIRATE",
  "BONE_MARROW_BIOPSY",
  "HEMODILUTED_BONE_MARROW",
]);

function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function text(value) {
  return typeof value === "string" ? value.trim() : "";
}
function norm(value) {
  return text(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function finite(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function bool(value) {
  return value === true;
}
function countTrue(values) {
  return values.filter((v) => v === true).length;
}

function structuredPrecursorContext(result = {}) {
  const assessment = obj(result.blastAssessment);
  const raw = obj(result.rawResponse);
  const rawAssessment = obj(raw.blastAssessment);
  const context = {
    ...obj(rawAssessment.precursorContext),
    ...obj(assessment.precursorContext),
  };
  return context;
}

function fallbackMaturationSignals(result = {}) {
  const myeloid = obj(result.myeloidSeries);
  const rawMyeloid = obj(obj(result.rawResponse).myeloidSeries);
  const erythroid = obj(result.erythroidSeries);
  const rawErythroid = obj(obj(result.rawResponse).erythroidSeries);
  const combined = norm([
    myeloid.maturation,
    myeloid.summary,
    rawMyeloid.maturation,
    rawMyeloid.summary,
    erythroid.maturation,
    erythroid.summary,
    rawErythroid.maturation,
    rawErythroid.summary,
  ].filter(Boolean).join(" "));

  const orderly = /maturacao preservada|maturacao progressiva|continuum maturativo|diversidade maturativa|diferentes estagios|varios estagios|heterogeneidade maturativa/.test(combined);
  const matureForms = /segmentad|metamieloc|mieloc|neutrofil|formas maduras|granulocit/.test(combined);
  return { orderly, matureForms };
}

export function evaluateMarrowPrecursorDiscrimination(result = {}) {
  const specimenType = text(
    result.specimenType ||
    obj(result.specimenAssessment).specimenType ||
    obj(result.rawResponse).specimenAssessment?.specimenType
  ).toUpperCase();
  const marrow = MARROW_TYPES.has(specimenType) || specimenType.includes("BONE_MARROW");
  const assessment = obj(result.blastAssessment);
  const rawAssessment = obj(obj(result.rawResponse).blastAssessment);
  const support = { ...obj(rawAssessment.morphologySupport), ...obj(assessment.morphologySupport) };
  const context = structuredPrecursorContext(result);
  const raw = obj(result.rawResponse);
  const subpopulation = {
    ...obj(obj(raw.blastAssessment).blastoidSubpopulationContext),
    ...obj(obj(result.blastAssessment).blastoidSubpopulationContext),
  };
  const fallback = fallbackMaturationSignals(result);

  const evidenceState = text(assessment.evidenceState || rawAssessment.evidenceState || "NOT_ASSESSABLE").toUpperCase();
  const populationPattern = text(assessment.populationPattern || rawAssessment.populationPattern || "indeterminate").toLowerCase();
  const count = finite(assessment.approximateBlastLikeCells ?? rawAssessment.approximateBlastLikeCells);
  const immatureCandidateState = text(
    assessment.candidateEvidenceState ||
    rawAssessment.candidateEvidenceState ||
    assessment.evidenceState ||
    rawAssessment.evidenceState
  ).toUpperCase();
  const maturationContinuumLock = obj(result.marrowPhysiologicMaturationContinuumLock);
  const physiologicContinuumProtected =
    maturationContinuumLock.active === true;
  const pathologicMaturationContinuumLock = {
    ...obj(obj(result.rawResponse).marrowPathologicMaturationContinuumLock),
    ...obj(result.marrowPathologicMaturationContinuumLock),
  };
  const pathologicMyeloidExpansionProtected =
    pathologicMaturationContinuumLock.active === true;
  const positiveCytologyConsistency = obj(result.marrowPositiveCytologyConsistency);
  const unresolvedPositiveCytology =
    positiveCytologyConsistency.unresolvedPositiveCytology === true ||
    positiveCytologyConsistency.active === true ||
    immatureCandidateState === "UNRESOLVED_BLASTOID_CYTOLOGY" ||
    assessment.cytologyResolutionRequired === true ||
    rawAssessment.cytologyResolutionRequired === true;
  const unresolvedImmatureCandidate =
    immatureCandidateState === "IMMATURE_POPULATION_REQUIRES_DISCRIMINATION" ||
    unresolvedPositiveCytology ||
    assessment.cytologyRecoveryRequired === true ||
    rawAssessment.cytologyRecoveryRequired === true;

  const chooseBoolean = (value, fallbackValue = false) =>
    typeof value === "boolean" ? value : fallbackValue;

  const physiologicSignals = {
    maturationHeterogeneity:
      chooseBoolean(context.maturationHeterogeneity, populationPattern === "heterogeneous"),
    maturationContinuum:
      chooseBoolean(context.maturationContinuum, fallback.orderly),
    matureFormsPresent:
      chooseBoolean(context.matureFormsPresent, fallback.matureForms),
    lineageDiversity:
      chooseBoolean(context.lineageDiversity, false),
    orderlyGranulocyticMaturation:
      chooseBoolean(context.orderlyGranulocyticMaturation, fallback.orderly),
    nonMonomorphicBackground:
      chooseBoolean(context.nonMonomorphicBackground, support.monomorphism === false),
  };

  const blastSpecificSignals = {
    monomorphism: support.monomorphism === true,
    repeatedAcrossField: support.repeatedAcrossField === true,
    dominantOrRepeatedPattern: populationPattern === "dominant" || populationPattern === "repeated",
    highNCRatio: support.highNCRatio === true,
    openFineChromatin: support.openFineChromatin === true,
    nucleoli: support.nucleoli === true,
    scantBasophilicCytoplasm: support.scantBasophilicCytoplasm === true,
  };

  // BE-FIX-005.27.1 — whole-field heterogeneity and a pathologic blastoid
  // subpopulation are independent axes. A heterogeneous marrow can contain a
  // repeated coherent blastoid subset and must not be downgraded merely because
  // mature cells/other lineages coexist in the same field.
  const blastoidSubpopulationSignals = {
    distinctFromMaturationContinuum:
      subpopulation.distinctFromMaturationContinuum === true,
    morphologicallyCoherent:
      subpopulation.morphologicallyCoherent === true,
    repeatedSubsetAcrossField:
      subpopulation.repeatedSubsetAcrossField === true,
    disproportionateImmatureSubset:
      subpopulation.disproportionateImmatureSubset === true,
    matureFormsCoexist:
      subpopulation.matureFormsCoexist === true,
  };

  const blastoidSubpopulationScore = countTrue([
    blastoidSubpopulationSignals.distinctFromMaturationContinuum,
    blastoidSubpopulationSignals.morphologicallyCoherent,
    blastoidSubpopulationSignals.repeatedSubsetAcrossField,
    blastoidSubpopulationSignals.disproportionateImmatureSubset,
  ]);

  const hasStructuredBlastoidSubpopulationContext =
    Object.keys(subpopulation).length > 0;

  const physiologicScore = countTrue(Object.values(physiologicSignals));
  const blastArchitectureScore = countTrue([
    blastSpecificSignals.monomorphism,
    blastSpecificSignals.repeatedAcrossField,
    blastSpecificSignals.dominantOrRepeatedPattern,
  ]);
  const blastFeatureScore = countTrue([
    blastSpecificSignals.highNCRatio,
    blastSpecificSignals.openFineChromatin,
    blastSpecificSignals.nucleoli,
    blastSpecificSignals.scantBasophilicCytoplasm,
  ]);

  const explicitObserved =
    assessment.observed === true || rawAssessment.observed === true || evidenceState === "OBSERVED_POPULATION";

  const dualAxis = scoreMarrowBlastAxes({
    physiologicSignals,
    blastSpecificSignals,
    blastoidSubpopulationSignals,
    approximateBlastLikeCells: count,
    evidenceState,
    populationPattern,
  });

  // 005.27.2 replaces boolean-veto behavior with calibrated independent axes.
  // A strong physiologic axis cannot erase a simultaneously strong, repeated
  // blastoid subpopulation. Conversely, isolated immature cytology cannot beat
  // a strong maturation continuum without architecture.
  const explicitlyNotDistinctFromContinuum =
    hasStructuredBlastoidSubpopulationContext &&
    subpopulation.distinctFromMaturationContinuum === false;

  const protectedObservedBlastoid = marrow && dualAxis.observedEscalation;
  const protectedSuspiciousBlastoid =
    marrow &&
    dualAxis.suspiciousEscalation &&
    !explicitlyNotDistinctFromContinuum;

  const strongPhysiologicPattern =
    marrow &&
    !pathologicMyeloidExpansionProtected &&
    (physiologicContinuumProtected || !unresolvedImmatureCandidate) &&
    !protectedObservedBlastoid &&
    !protectedSuspiciousBlastoid &&
    dualAxis.physiologicDominance;

  const strongBlastoidPattern =
    marrow && (protectedObservedBlastoid || protectedSuspiciousBlastoid);

  const ambiguousPrecursorVsBlast =
    marrow &&
    !strongPhysiologicPattern &&
    !strongBlastoidPattern &&
    (dualAxis.indeterminateZone || unresolvedImmatureCandidate);

  const coherentBlastoidSubpopulation = dualAxis.subpopulationCore;
  const legacyStructuredSuspiciousSubset =
    !hasStructuredBlastoidSubpopulationContext &&
    protectedSuspiciousBlastoid;

  let classification = "NOT_APPLICABLE";
  if (protectedObservedBlastoid || strongBlastoidPattern) classification = "BLASTOID_PATTERN_SUPPORTED";
  else if (pathologicMyeloidExpansionProtected) classification = "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION";
  else if (strongPhysiologicPattern) classification = "PHYSIOLOGIC_PRECURSOR_PATTERN";
  else if (ambiguousPrecursorVsBlast) classification = "INDETERMINATE_PRECURSOR_VS_BLAST";

  return {
    version: MARROW_PRECURSOR_DISCRIMINATION_VERSION,
    rebalancingVersion: MARROW_PRECURSOR_REBALANCING_VERSION,
    dualAxisScoringVersion: MARROW_DUAL_AXIS_SCORING_VERSION,
    marrow,
    classification,
    evidenceState,
    populationPattern,
    approximateBlastLikeCells: count,
    unresolvedImmatureCandidate,
    immatureCandidateState: unresolvedImmatureCandidate
      ? (unresolvedPositiveCytology
          ? "UNRESOLVED_BLASTOID_CYTOLOGY"
          : "IMMATURE_POPULATION_REQUIRES_DISCRIMINATION")
      : null,
    immatureCellCytologyRecoveryVersion: "BE-FIX-005.33",
    positiveCytologyConsistencyVersion: "BE-FIX-005.35",
    maturationContinuumDiscriminationVersion: "BE-FIX-005.37",
    myeloidExpansionDiscriminationVersion: "BE-FIX-005.38",
    physiologicContinuumProtected,
    pathologicMyeloidExpansionProtected,
    unresolvedPositiveCytology,
    physiologicSignals,
    blastSpecificSignals,
    blastoidSubpopulationSignals,
    blastoidSubpopulationScore,
    hasStructuredBlastoidSubpopulationContext,
    coherentBlastoidSubpopulation,
    legacyStructuredSuspiciousSubset,
    protectedSuspiciousBlastoid,
    physiologicScore: dualAxis.physiologicScore,
    blastArchitectureScore,
    blastFeatureScore,
    blastoidScore: dualAxis.blastoidScore,
    dualAxis,
    explicitlyNotDistinctFromContinuum,
    protectedObservedBlastoid,
    strongPhysiologicPattern,
    strongBlastoidPattern,
    ambiguousPrecursorVsBlast,
    suppressBlastPromotion: strongPhysiologicPattern,
    capBlastPromotionAtIndeterminate: ambiguousPrecursorVsBlast,
  };
}

export function applyMarrowPrecursorDiscrimination(result = {}) {
  if (!result || typeof result !== "object") return result;
  const discrimination = evaluateMarrowPrecursorDiscrimination(result);
  if (!discrimination.marrow) return result;

  const output = {
    ...result,
    marrowPrecursorDiscrimination: discrimination,
    blastAssessment: {
      ...obj(result.blastAssessment),
      dualAxisBlastScoring: discrimination.dualAxis || {},
      dualAxisBlastScoringVersion: MARROW_DUAL_AXIS_SCORING_VERSION,
    },
    findings: { ...obj(result.findings) },
    overallAssessment: { ...obj(result.overallAssessment) },
    structuredReport: { ...obj(result.structuredReport) },
    morphologyAnalysis: { ...obj(result.morphologyAnalysis) },
    hematologicReasoning: { ...obj(result.hematologicReasoning) },
    whatAISees: { ...obj(result.whatAISees) },
  };

  if (discrimination.pathologicMyeloidExpansionProtected) {
    output.findings.blastSuspicion = false;
    output.findings.monomorphicPopulation = false;
    output.findings.immatureCells = false;
    output.findings.myeloidExpansionPattern = true;
    output.finalClassification =
      "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN";
    output.morphologicRiskClass =
      "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN";
    output.riskLevel =
      "Expansão mieloide/granulocítica relevante com maturação preservada";
    output.normalityBlocked = true;
    output.requiresHumanReview = true;
  }

  else if (discrimination.strongPhysiologicPattern) {
    output.findings.blastSuspicion = false;
    output.findings.blastEvidenceState = "NOT_OBSERVED_IN_EVALUABLE_FIELD";
    output.findings.monomorphicPopulation = false;
    // Physiologic precursors may be immature; do not use that fact as a blast flag.
    output.findings.immatureCells = false;
    output.finalClassification = "MARROW_PHYSIOLOGIC_MATURATION_PATTERN";
    output.morphologicRiskClass = "MARROW_PHYSIOLOGIC_MATURATION_PATTERN";
    output.riskLevel = "Sem alerta blastoide sustentado — maturação medular heterogênea";
    output.mainFinding =
      "Padrão de maturação medular heterogênea com continuidade maturativa e formas precursoras/maduras coexistentes. A presença de precursores fisiológicos, isoladamente, não sustenta promoção para população blastoide.";
    output.primaryFinding = output.mainFinding;
    output.finalConclusion = output.mainFinding;
    output.overallAssessment.riskCategory = "MARROW_PHYSIOLOGIC_MATURATION_PATTERN";
    output.overallAssessment.mainImpression = output.mainFinding;
    output.structuredReport.conclusion = output.mainFinding;
    output.structuredReport.hematologicMeaning =
      "O campo mostra arquitetura maturativa heterogênea, achado esperado em medula óssea. A imagem isolada não autoriza conclusão de normalidade global, mas não há evidência estruturada suficiente para classificar uma população blastoide suspeita.";
    output.structuredReport.recommendation =
      "Correlacionar com mielograma representativo, hemograma e revisão microscópica conforme rotina clínica; sem indicação de alerta blastoide apenas por imaturidade fisiológica.";
    output.morphologyAnalysis.summary = output.mainFinding;
    output.morphologyAnalysis.overview =
      "Campo medular com diversidade de estágios maturativos e ausência de monomorfismo blastoide estruturado.";
    output.morphologyAnalysis.leukocyteReview =
      "A coexistência de precursores e formas mais maduras favorece maturação hematopoética fisiológica em vez de população blastoide dominante.";
    output.hematologicReasoning.whatISee =
      "Heterogeneidade maturativa com continuidade entre precursores e formas mais maduras.";
    output.hematologicReasoning.whatItResembles =
      "Padrão de maturação hematopoética medular fisiológica/ordenada no campo analisado.";
    output.hematologicReasoning.whatICannotConfirm =
      "Uma imagem isolada não confirma normalidade global, percentuais medulares ou ausência absoluta de doença em toda a amostra.";
    output.hematologicReasoning.finalInterpretation = output.mainFinding;
    output.whatAISees.dominantFinding = "Maturação medular heterogênea sem monomorfismo blastoide sustentado.";
    return output;
  }

  if (discrimination.ambiguousPrecursorVsBlast) {
    output.findings.blastSuspicion = false;
    output.findings.blastEvidenceState = "NOT_ASSESSABLE";
    output.finalClassification = "MARROW_IMMATURE_POPULATION_INDETERMINATE";
    output.morphologicRiskClass = "MARROW_IMMATURE_POPULATION_INDETERMINATE";
    output.riskLevel = "População imatura indeterminada — revisão recomendada";
    output.mainFinding =
      "Elementos imaturos estão presentes, porém a imagem não separa com segurança precursor fisiológico de blastoidia verdadeira. Não promover para população blastoide sem arquitetura/citologia sustentada.";
    output.primaryFinding = output.mainFinding;
    output.finalConclusion = output.mainFinding;
    output.overallAssessment.requiresHumanReview = true;
    output.overallAssessment.riskCategory = "MARROW_IMMATURE_POPULATION_INDETERMINATE";
    output.overallAssessment.mainImpression = output.mainFinding;
    output.structuredReport.conclusion = output.mainFinding;
    output.structuredReport.recommendation =
      "Revisar múltiplos campos e correlacionar com mielograma, hemograma e métodos complementares quando indicados.";
    output.hematologicReasoning.whatICannotConfirm =
      "Não é possível confirmar população blastoide, LLA, LMA ou linhagem pela imagem isolada.";
    output.hematologicReasoning.finalInterpretation = output.mainFinding;
    return output;
  }

  return output;
}

export default applyMarrowPrecursorDiscrimination;
