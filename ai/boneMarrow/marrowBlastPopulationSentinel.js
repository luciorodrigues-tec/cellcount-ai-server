import {
  applyMarrowPrecursorDiscrimination,
  evaluateMarrowPrecursorDiscrimination,
  MARROW_PRECURSOR_DISCRIMINATION_VERSION,
  MARROW_PRECURSOR_REBALANCING_VERSION,
  MARROW_DUAL_AXIS_SCORING_VERSION,
} from "./marrowPrecursorDiscriminationEngine.js";

// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.24 — MARROW BLAST-POPULATION RECOGNITION & FINDING-FIRST GOVERNANCE
//
// Scientific invariants:
//   1. Positive marrow blastoid morphology is independent of representativity.
//   2. LIMITED FIELD qualifies prevalence/generalization; it cannot erase a
//      structured positive blastoid population finding.
//   3. Population-level blastoid concern requires repeated/structured evidence,
//      never free-text matching alone.
//   4. Morphology alone must not assign lineage or diagnose ALL/AML/leukemia.
// ============================================================================

export const MARROW_BLAST_POPULATION_GOVERNANCE_VERSION = "BE-FIX-005.24";
export const MARROW_POSITIVE_EVIDENCE_PRIORITY_LOCK_VERSION = "BE-FIX-005.26";
export const MARROW_PRECURSOR_FALSE_POSITIVE_CONTAINMENT_VERSION = MARROW_PRECURSOR_DISCRIMINATION_VERSION;
export const MARROW_CALIBRATED_SUBPOPULATION_ESCALATION_VERSION = MARROW_DUAL_AXIS_SCORING_VERSION;

const MARROW_TYPES = new Set([
  "BONE_MARROW_ASPIRATE",
  "BONE_MARROW_BIOPSY",
  "HEMODILUTED_BONE_MARROW",
]);

function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function truthyCount(values) {
  return values.filter((value) => value === true).length;
}

function normalizeEvidenceState(value) {
  const state = text(value).toUpperCase();
  const allowed = new Set([
    "OBSERVED_POPULATION",
    "SUSPICIOUS_POPULATION",
    "FOCAL_SUSPICION",
    "NOT_OBSERVED_IN_EVALUABLE_FIELD",
    "NOT_ASSESSABLE",
  ]);
  return allowed.has(state) ? state : "NOT_ASSESSABLE";
}

export function evaluateMarrowBlastPopulationEvidence(result = {}) {
  const specimenType = text(result.specimenType).toUpperCase();
  const marrow = MARROW_TYPES.has(specimenType);
  const assessment = obj(result.blastAssessment);
  const rawAssessment = obj(obj(result.rawResponse).blastAssessment);
  const support = obj(assessment.morphologySupport);
  const rawSupport = obj(rawAssessment.morphologySupport);

  const evidenceState = normalizeEvidenceState(
    assessment.evidenceState ?? rawAssessment.evidenceState,
  );
  const count =
    num(assessment.approximateBlastLikeCells) ??
    num(rawAssessment.approximateBlastLikeCells) ??
    num(assessment.observedBlastLikeCount) ??
    num(rawAssessment.observedBlastLikeCount);
  const pattern = text(
    assessment.populationPattern ?? rawAssessment.populationPattern,
  ).toLowerCase();

  const features = {
    highNCRatio:
      support.highNCRatio === true || rawSupport.highNCRatio === true,
    openFineChromatin:
      support.openFineChromatin === true || rawSupport.openFineChromatin === true,
    nucleoli:
      support.nucleoli === true || rawSupport.nucleoli === true,
    scantBasophilicCytoplasm:
      support.scantBasophilicCytoplasm === true ||
      rawSupport.scantBasophilicCytoplasm === true,
    monomorphism:
      support.monomorphism === true || rawSupport.monomorphism === true,
    repeatedAcrossField:
      support.repeatedAcrossField === true ||
      rawSupport.repeatedAcrossField === true,
  };

  const featureCount = truthyCount(Object.values(features));
  const repeatedPopulation =
    features.repeatedAcrossField ||
    pattern === "repeated" ||
    pattern === "dominant" ||
    (count !== null && count >= 3);

  const precursorDiscrimination =
    evaluateMarrowPrecursorDiscrimination(result);

  const suppressBlastPromotion =
    precursorDiscrimination.suppressBlastPromotion === true;

  const capAtIndeterminate =
    precursorDiscrimination.capBlastPromotionAtIndeterminate === true;

  const explicitObserved =
    assessment.observed === true ||
    rawAssessment.observed === true ||
    evidenceState === "OBSERVED_POPULATION";

  const dualAxis = precursorDiscrimination.dualAxis || {};

  const observedPopulation =
    marrow &&
    explicitObserved &&
    repeatedPopulation &&
    featureCount >= 2 &&
    dualAxis.observedEscalation === true &&
    !suppressBlastPromotion;

  const suspiciousPopulation =
    marrow &&
    !observedPopulation &&
    !suppressBlastPromotion &&
    !capAtIndeterminate &&
    dualAxis.suspiciousEscalation === true;

  const focalSuspicion =
    marrow &&
    !observedPopulation &&
    !suspiciousPopulation &&
    evidenceState === "FOCAL_SUSPICION";

  return {
    version: MARROW_BLAST_POPULATION_GOVERNANCE_VERSION,
    priorityLockVersion: MARROW_POSITIVE_EVIDENCE_PRIORITY_LOCK_VERSION,
    marrow,
    evidenceState,
    approximateBlastLikeCells: count,
    populationPattern: pattern || "indeterminate",
    morphologySupport: features,
    morphologySupportCount: featureCount,
    repeatedPopulation,
    observedPopulation,
    suspiciousPopulation,
    focalSuspicion,
    positivePopulationFinding:
      observedPopulation || suspiciousPopulation,
    precursorDiscrimination,
    dualAxisScoring: precursorDiscrimination.dualAxis || null,
    physiologicPrecursorPattern:
      precursorDiscrimination.strongPhysiologicPattern === true,
    indeterminatePrecursorVsBlast:
      precursorDiscrimination.ambiguousPrecursorVsBlast === true,
  };
}

function ensureContainers(result) {
  result.findings = obj(result.findings);
  result.overallAssessment = obj(result.overallAssessment);
  result.structuredReport = obj(result.structuredReport);
  result.morphologyAnalysis = obj(result.morphologyAnalysis);
  result.hematologicReasoning = obj(result.hematologicReasoning);
  result.whatAISees = obj(result.whatAISees);
  result.blockNormalReason = Array.isArray(result.blockNormalReason)
    ? result.blockNormalReason
    : [];
  return result;
}

export function applyMarrowBlastPopulationGovernance(result = {}) {
  const evidence = evaluateMarrowBlastPopulationEvidence(result);
  if (!evidence.marrow) return result;

  const precursorGoverned =
    applyMarrowPrecursorDiscrimination(result);

  const output = ensureContainers({ ...precursorGoverned });
  output.marrowBlastPopulationEvidence = evidence;
  output.marrowBlastPopulationGovernance = {
    version: MARROW_BLAST_POPULATION_GOVERNANCE_VERSION,
    positiveEvidencePriorityLockVersion: MARROW_POSITIVE_EVIDENCE_PRIORITY_LOCK_VERSION,
    precursorFalsePositiveContainmentVersion: MARROW_PRECURSOR_DISCRIMINATION_VERSION,
    precursorBlastRebalancingVersion: MARROW_PRECURSOR_REBALANCING_VERSION,
    dualAxisBlastScoringVersion: MARROW_DUAL_AXIS_SCORING_VERSION,
    applied: true,
  };

  if (evidence.physiologicPrecursorPattern) {
    output.marrowBlastPopulationEvidence = {
      ...evidence,
      positivePopulationFinding: false,
      observedPopulation: false,
      suspiciousPopulation: false,
      focalSuspicion: false,
    };
    output.localMorphologyEvidence = {
      ...obj(output.localMorphologyEvidence),
      marrow: {
        ...obj(obj(output.localMorphologyEvidence).marrow),
        precursorDiscrimination:
          evidence.precursorDiscrimination,
        blastPopulationEvidence: {
          ...evidence,
          positivePopulationFinding: false,
          observedPopulation: false,
          suspiciousPopulation: false,
          focalSuspicion: false,
        },
      },
    };
    return output;
  }

  if (evidence.indeterminatePrecursorVsBlast) {
    output.marrowBlastPopulationEvidence = {
      ...evidence,
      positivePopulationFinding: false,
      observedPopulation: false,
      suspiciousPopulation: false,
      focalSuspicion: false,
    };
    return output;
  }

  if (!evidence.positivePopulationFinding && !evidence.focalSuspicion) {
    return output;
  }

  output.normalityBlocked = true;
  output.requiresHumanReview = true;
  output.overallAssessment.requiresHumanReview = true;

  // BE-FIX-005.26 — project marrow-positive evidence into the canonical local
  // evidence namespace so AMR/final governors do not interpret a medullary
  // positive finding as evidenceAvailable=false merely because peripheral WBC
  // counters are absent.
  output.localMorphologyEvidence = {
    ...obj(output.localMorphologyEvidence),
    evidenceAvailable: true,
    marrow: {
      ...obj(obj(output.localMorphologyEvidence).marrow),
      projectionVersion: MARROW_POSITIVE_EVIDENCE_PRIORITY_LOCK_VERSION,
      blastPopulationEvidence: evidence,
    },
  };

  if (evidence.observedPopulation) {
    const finding =
      "POPULAÇÃO BLASTOIDE/IMATURA OBSERVADA: múltiplos elementos nucleados com morfologia imatura/blastoide estão presentes no campo medular. A limitação de representatividade não invalida esse achado positivo. Requer revisão hematológica urgente e caracterização complementar.";

    output.finalClassification = "MARROW_BLASTOID_POPULATION_OBSERVED";
    output.morphologicRiskClass = "MARROW_BLASTOID_POPULATION_OBSERVED";
    output.riskLevel = "Achado medular crítico — população blastoide/imatura";
    output.findings.blastSuspicion = true;
    output.findings.immatureCells = true;
    output.findings.monomorphicPopulation =
      evidence.morphologySupport.monomorphism ||
      output.findings.monomorphicPopulation === true;
    output.mainFinding = finding;
    output.primaryFinding = finding;
    output.finalConclusion = finding;
    output.overallAssessment.riskCategory = "MARROW_BLASTOID_POPULATION_OBSERVED";
    output.overallAssessment.mainImpression = finding;
    output.structuredReport.conclusion = finding;
    output.structuredReport.hematologicMeaning =
      "Achado morfológico medular de alta relevância. A imagem sustenta uma população imatura/blastoide, mas não permite definir linhagem, subtipo ou diagnóstico de leucemia pela morfologia isolada.";
    output.structuredReport.recommendation =
      "Revisão hematológica urgente; correlacionar com mielograma representativo, hemograma, citometria de fluxo/imunofenotipagem e demais estudos indicados.";
    output.morphologyAnalysis.summary = finding;
    output.morphologyAnalysis.overview =
      "Campo medular contendo população repetida/dominante de elementos nucleados imaturos/blastoides. A representatividade do campo limita estimativas percentuais globais, não a existência do achado positivo.";
    output.morphologyAnalysis.leukocyteReview =
      "Múltiplos elementos apresentam conjunto de características de imaturidade/blastoidia. A classificação de linhagem não é autorizada apenas pela imagem.";
    output.clinicalMeaning = output.structuredReport.hematologicMeaning;
    output.interpretiveSynthesis = finding;
    output.hematologicReasoning.whatISee =
      "População repetida de células nucleadas com características imaturas/blastoides no aspirado medular.";
    output.hematologicReasoning.whatItResembles =
      "População de precursores/blastoides que exige caracterização hematológica complementar.";
    output.hematologicReasoning.whatICannotConfirm =
      "A imagem isolada não confirma LLA, LMA, linhagem, clonalidade, subtipo genético nem percentual global de blastos.";
    output.hematologicReasoning.finalInterpretation = finding;
    output.whatAISees.dominantFinding =
      "População blastoide/imatura morfologicamente relevante.";
    output.blockNormalReason = [
      ...new Set([
        ...output.blockNormalReason,
        "População blastoide/imatura observada no campo medular",
        "Achado positivo não pode ser apagado por representatividade limitada",
        "Necessária revisão hematológica urgente",
      ]),
    ];
    return output;
  }

  const finding = evidence.suspiciousPopulation
    ? "SUSPEITA DE POPULAÇÃO BLASTOIDE/IMATURA: há múltiplos elementos com características de imaturidade/blastoidia no campo medular, sem critérios suficientes para confirmação morfológica populacional. A limitação do campo não invalida a suspeita observada."
    : "SUSPEITA FOCAL DE ELEMENTO BLASTOIDE/IMATURO: achado focal requer revisão especializada; não permite inferir população global.";

  output.finalClassification = evidence.suspiciousPopulation
    ? "MARROW_BLASTOID_POPULATION_SUSPICIOUS"
    : "MARROW_BLASTOID_FOCAL_SUSPICION";
  output.morphologicRiskClass = output.finalClassification;
  output.riskLevel = evidence.suspiciousPopulation
    ? "Alta prioridade — suspeita de população blastoide/imatura"
    : "Prioridade de revisão — suspeita focal blastoide/imatura";
  output.findings.blastSuspicion = true;
  output.findings.immatureCells = true;
  output.mainFinding = finding;
  output.primaryFinding = finding;
  output.finalConclusion = finding;
  output.overallAssessment.riskCategory = output.finalClassification;
  output.overallAssessment.mainImpression = finding;
  output.structuredReport.conclusion = finding;
  output.structuredReport.hematologicMeaning =
    "A morfologia levanta suspeita de imaturidade/blastoidia e exige confirmação em avaliação medular representativa; não permite atribuição de linhagem ou diagnóstico definitivo.";
  output.structuredReport.recommendation =
    "Revisão hematológica prioritária e correlação com mielograma, hemograma e imunofenotipagem/citometria de fluxo quando indicada.";
  output.morphologyAnalysis.summary = finding;
  output.interpretiveSynthesis = finding;
  output.hematologicReasoning.whatISee = evidence.suspiciousPopulation
    ? "População repetida de elementos medulares com características de imaturidade/blastoidia."
    : "Elemento focal com características de imaturidade/blastoidia.";
  output.hematologicReasoning.whatItResembles =
    "Morfologia de precursores/blastoides que requer caracterização complementar.";
  output.hematologicReasoning.whatICannotConfirm =
    "A imagem isolada não confirma LLA, LMA, linhagem, clonalidade, subtipo genético nem percentual global de blastos.";
  output.hematologicReasoning.finalInterpretation = finding;
  output.blockNormalReason = [
    ...new Set([
      ...output.blockNormalReason,
      "Suspeita morfológica blastoide/imatura em material medular",
      "Representatividade limitada não autoriza apagar achado positivo",
    ]),
  ];
  return output;
}
