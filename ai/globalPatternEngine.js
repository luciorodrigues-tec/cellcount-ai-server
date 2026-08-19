// ============================================================================
// GLOBAL PATTERN ENGINE
// CELLCOUNT HEMATOLOGY AI — V2 / BE-FIX-005.16 + BE-FIX-005.17.1 + BE-FIX-005.30
// ============================================================================

import { evaluateReactiveLymphoidEvidence } from "./reactiveLymphoidEvidenceSentinel.js";
import {
  evaluateMarrowPositiveBlastEvidenceSemanticSupersession,
  MARROW_POSITIVE_BLAST_EVIDENCE_SEMANTIC_SUPERSESSION_VERSION,
} from "./boneMarrow/marrowPositiveBlastEvidenceSemanticSupersessionEngine.js";

export const MARROW_GLOBAL_PATTERN_COHERENCE_RECONCILIATION_VERSION = "BE-FIX-005.43";
export const MARROW_FOCAL_BLASTOID_SCOPE_GLOBAL_PATTERN_PROPAGATION_VERSION =
  "BE-FIX-005.50.20";
export const MARROW_FOCAL_BLASTOID_GLOBAL_PATTERN_SEMANTIC_COHERENCE_VERSION =
  "BE-FIX-005.50.20";
export const MARROW_FOCAL_BLASTOID_POPULATION_SEMANTIC_NON_PROMOTION_VERSION =
  "BE-FIX-005.50.20";

export const MARROW_TERMINAL_CLINICAL_AUTHORITY_CONVERGENCE_VERSION =
  "BE-FIX-005.50.22";
export const MARROW_TERMINAL_GLOBAL_PATTERN_RECOMPUTATION_VERSION =
  "BE-FIX-005.50.22";


function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeEvidenceState(value) {
  return String(value || "").trim().toUpperCase();
}

function hasIndependentQualifiedPopulationEvidence(result = {}) {
  const rawBlast = asObject(result?.rawResponse?.blastAssessment);
  const directBlast = asObject(result?.blastAssessment);
  const lmeBlast = asObject(
    result?.localMorphologyEvidence?.marrow?.blastPopulationEvidence,
  );
  const projected = asObject(result?.marrowBlastPopulationEvidence);

  const states = [
    rawBlast.evidenceState,
    directBlast.evidenceState,
    lmeBlast.evidenceState,
  ].map(normalizeEvidenceState);

  if (
    states.includes("OBSERVED_POPULATION") ||
    states.includes("SUSPICIOUS_POPULATION")
  ) {
    return true;
  }

  // Projected population booleans alone are not enough when a trusted
  // 005.50.18 focal cell-level authority explicitly says that architecture
  // was not established. This is the late-writer re-promotion case.
  const recovery = asObject(
    result?.marrowTrueAmlPositiveCytomorphologyRecovery,
  );
  const focalRecovery =
    recovery.active === true &&
    recovery.cellLevelPositiveCytology === true &&
    normalizeEvidenceState(recovery.recoveredEvidenceState) ===
      "FOCAL_SUSPICION" &&
    recovery.preExistingArchitectureQualified !== true &&
    recovery.populationPromotionAllowedByThisEngine === false;

  if (focalRecovery) return false;

  return (
    projected.observedPopulation === true ||
    (
      projected.suspiciousPopulation === true &&
      normalizeEvidenceState(projected.evidenceState) ===
        "SUSPICIOUS_POPULATION"
    )
  );
}

function readFocalBlastoidScopeAuthority(result = {}) {
  const terminal = asObject(result?.marrowFocalBlastoidTerminalAuthority);
  if (terminal.active === true) {
    return {
      active: true,
      cellLevelPositiveBlastoidCytology: true,
      populationInferenceAllowed: false,
      populationPositiveAllowed: false,
      blastPercentageInferenceAllowed: false,
      effectiveEvidenceState: "FOCAL_SUSPICION",
      source: "BE-FIX-005.50.21_TERMINAL_AUTHORITY",
      version: terminal.version || "BE-FIX-005.50.21",
      convergenceVersion:
        MARROW_TERMINAL_CLINICAL_AUTHORITY_CONVERGENCE_VERSION,
    };
  }

  const lock = asObject(result?.marrowPositiveCellLevelBlastoidScopeLock);
  const governance = asObject(result?.evidenceGovernance);
  const lockActive =
    lock.active === true &&
    lock.cellLevelPositiveBlastoidCytology === true &&
    (
      lock.populationInferenceForbidden === true ||
      lock.populationPositiveAllowed === false ||
      governance.populationInferenceAllowed === false ||
      governance.populationPositiveAllowed === false
    );

  if (lockActive) {
    return {
      active: true,
      cellLevelPositiveBlastoidCytology: true,
      populationInferenceAllowed: false,
      populationPositiveAllowed: false,
      blastPercentageInferenceAllowed: false,
      effectiveEvidenceState: "FOCAL_SUSPICION",
      source: "BE-FIX-005.50.19_SCOPE_LOCK",
      version:
        lock.version ||
        MARROW_FOCAL_BLASTOID_SCOPE_GLOBAL_PATTERN_PROPAGATION_VERSION,
      convergenceVersion:
        MARROW_TERMINAL_CLINICAL_AUTHORITY_CONVERGENCE_VERSION,
    };
  }

  // BE-FIX-005.50.22 — terminal convergence recovery.
  // 005.50.18 is an upstream cell-level acquisition authority. If it explicitly
  // preserved positive blastoid cytology as FOCAL_SUSPICION and explicitly
  // denied population promotion, later rebuilt containers are not allowed to
  // erase that scope. This fallback is disabled when an independent qualified
  // population state exists.
  const recovery = asObject(
    result?.marrowTrueAmlPositiveCytomorphologyRecovery,
  );
  const trustedFocalRecovery =
    recovery.active === true &&
    recovery.cellLevelPositiveCytology === true &&
    recovery.directCellLevelPositive === true &&
    normalizeEvidenceState(recovery.recoveredEvidenceState) ===
      "FOCAL_SUSPICION" &&
    recovery.preExistingArchitectureQualified !== true &&
    recovery.populationPositiveFabricated === false &&
    recovery.populationPromotionAllowedByThisEngine === false &&
    !hasIndependentQualifiedPopulationEvidence(result);

  if (trustedFocalRecovery) {
    return {
      active: true,
      cellLevelPositiveBlastoidCytology: true,
      populationInferenceAllowed: false,
      populationPositiveAllowed: false,
      blastPercentageInferenceAllowed: false,
      effectiveEvidenceState: "FOCAL_SUSPICION",
      source: "BE-FIX-005.50.18_TRUSTED_CELL_LEVEL_RECOVERY",
      version: MARROW_TERMINAL_CLINICAL_AUTHORITY_CONVERGENCE_VERSION,
      convergenceVersion:
        MARROW_TERMINAL_CLINICAL_AUTHORITY_CONVERGENCE_VERSION,
    };
  }

  return {
    active: false,
    cellLevelPositiveBlastoidCytology: false,
    populationInferenceAllowed: null,
    populationPositiveAllowed: null,
    blastPercentageInferenceAllowed: null,
    effectiveEvidenceState: null,
    source: null,
    version: MARROW_FOCAL_BLASTOID_SCOPE_GLOBAL_PATTERN_PROPAGATION_VERSION,
    convergenceVersion:
      MARROW_TERMINAL_CLINICAL_AUTHORITY_CONVERGENCE_VERSION,
  };
}

function hasPositiveMarrowBlastEvidence(result = {}) {
  if (readFocalBlastoidScopeAuthority(result).active === true) {
    return false;
  }
  const semanticSupersession =
    evaluateMarrowPositiveBlastEvidenceSemanticSupersession(result);

  if (semanticSupersession.active === true) {
    return false;
  }

  const rawBlast = asObject(result?.rawResponse?.blastAssessment);
  const directBlast = asObject(result?.blastAssessment);
  const lmeBlast = asObject(result?.localMorphologyEvidence?.marrow?.blastPopulationEvidence);
  const projected = asObject(result?.marrowBlastPopulationEvidence);
  const recoveredLock = asObject(result?.marrowPositiveBlastEvidenceLock);
  const recovered = asObject(result?.marrowRecoveredCytologyProjection);
  const states = [
    rawBlast.evidenceState,
    directBlast.evidenceState,
    lmeBlast.evidenceState,
    projected.evidenceState,
  ].map((value) => String(value || "").trim().toUpperCase());

  return states.some((state) => [
    "OBSERVED_POPULATION",
    "SUSPICIOUS_POPULATION",
    "FOCAL_SUSPICION",
  ].includes(state)) || lmeBlast.positive === true ||
    projected.observedPopulation === true ||
    projected.suspiciousPopulation === true ||
    projected.focalSuspicion === true ||
    recoveredLock.active === true ||
    recovered.structuredPositive === true;
}

function readPhysiologicPrecursorDiscrimination(result = {}) {
  const candidates = [
    asObject(result?.marrowPhysiologicPrecursorCoherence),
    asObject(result?.marrowPrecursorDiscrimination),
    asObject(result?.marrowBlastPopulationEvidence?.precursorDiscrimination),
    asObject(result?.localMorphologyEvidence?.marrow?.precursorDiscrimination),
  ];

  for (const candidate of candidates) {
    if (candidate.classification || candidate.physiologicDominance === true) {
      return candidate;
    }
  }
  return {};
}


function readPathologicMyeloidExpansion(result = {}) {
  const candidates = [
    asObject(result?.marrowDominantPatternStateReconciliation),
    asObject(result?.marrowDominantPatternReconciliation),
    asObject(result?.marrowMyeloidExpansionDiscrimination),
    asObject(result?.marrowPrecursorDiscrimination),
    asObject(result?.marrowBlastPopulationEvidence?.precursorDiscrimination),
    asObject(result?.localMorphologyEvidence?.marrow?.blastPopulationEvidence?.precursorDiscrimination),
  ];

  for (const candidate of candidates) {
    const classification =
      candidate?.classification ||
      candidate?.dominantClassification ||
      "";

    if (
      classification === "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION" ||
      candidate?.pathologicMyeloidExpansionProtected === true ||
      candidate?.protectedMyeloidExpansion === true ||
      candidate?.pathologicMyeloidExpansionSupported === true
    ) {
      return {
        ...candidate,
        classification: "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
        protected: true,
      };
    }
  }

  return {};
}

export function analyzeGlobalPattern(result = {}) {
  const findings = result.findings || {};
  const visualEvidence = result.visualEvidence || {};
  const morphology = result.morphologyAnalysis || {};
  const reasons = [];

  const monomorphic =
    findings.monomorphicPopulation === true || findings.plasmacytoidCells === true ||
    findings.plasmablasts === true || findings.plasmocytes === true ||
    visualEvidence.repetitiveMononuclearCells === true || visualEvidence.uniformAtypicalCells === true;

  const reactiveEvidence = evaluateReactiveLymphoidEvidence(result);
  const reactiveMorphology = reactiveEvidence.reactivePatternSupported === true;
  const reactiveClassification = reactiveEvidence.reactiveClassificationAllowed === true;
  const blastAssessable = reactiveEvidence.blastAssessable === true;
  const precursorDiscrimination = readPhysiologicPrecursorDiscrimination(result);
  const pathologicMyeloidExpansion = readPathologicMyeloidExpansion(result);
  const pathologicMyeloidExpansionPattern =
    pathologicMyeloidExpansion.protected === true;
  const physiologicPrecursorPattern =
    precursorDiscrimination.classification === "PHYSIOLOGIC_PRECURSOR_PATTERN" &&
    (precursorDiscrimination.strongPhysiologicPattern === true ||
      precursorDiscrimination.physiologicDominance === true) &&
    precursorDiscrimination.strongBlastoidPattern !== true &&
    precursorDiscrimination.coherentBlastoidSubpopulation !== true;
  const limitedMarrow =
    result?.fieldAdequacy?.limitedField === true ||
    result?.fieldAdequacy?.adequateForPopulationAssessment === false;

  const atypical = findings.atypicalLymphocytes === true || findings.largeMononuclearCells === true ||
    findings.atypicalPopulation === true || monomorphic;
  const marrowPositiveBlastEvidence = hasPositiveMarrowBlastEvidence(result);
  const focalBlastoidScopeAuthority =
    readFocalBlastoidScopeAuthority(result);
  const focalPositiveBlastoidCytology =
    focalBlastoidScopeAuthority.active === true;
  const marrowBlastSemanticSupersession =
    evaluateMarrowPositiveBlastEvidenceSemanticSupersession(result);
  const blastLike = marrowPositiveBlastEvidence || findings.blastSuspicion === true ||
    (findings.immatureCells === true && !physiologicPrecursorPattern);

  if (monomorphic) reasons.push("Presença de população mononuclear relativamente uniforme/repetitiva no campo.");
  if (reactiveMorphology) reasons.push("Morfologia linfoide reacional sustentada por evidência estruturada.");
  if (atypical) reasons.push("Há elementos celulares atípicos que impedem classificar a lâmina como morfologia preservada.");
  if (pathologicMyeloidExpansionPattern) reasons.push(
    "Há expansão mieloide/granulocítica desproporcional com espectro maturativo preservado; o padrão não deve colapsar para normalidade global nem ser convertido automaticamente em população blastoide."
  );
  if (blastLike) reasons.push(
    marrowPositiveBlastEvidence
      ? "Há evidência medular positiva estruturada de população blastoide/imatura; a assessabilidade negativa não pode apagar esse achado."
      : "Há sinal de imaturidade/blasto informado, exigindo interpretação conservadora."
  );
  if ((atypical || reactiveMorphology) && !blastAssessable) reasons.push("A triagem morfológica de blastos não é avaliável com segurança; não promover classificação reacional tranquilizadora.");

  const physiologicAppearance = !monomorphic && !atypical && !blastLike && !reactiveMorphology &&
    !pathologicMyeloidExpansionPattern &&
    result.normalityBlocked !== true && blastAssessable;

  let dominantPattern = "GLOBAL_UNREMARKABLE_PATTERN";
  if (focalPositiveBlastoidCytology) dominantPattern = "MARROW_FOCAL_POSITIVE_BLASTOID_CYTOLOGY_PATTERN";
  else if (marrowPositiveBlastEvidence) dominantPattern = "MARROW_POSITIVE_BLASTOID_POPULATION_PATTERN";
  else if (pathologicMyeloidExpansionPattern)
    dominantPattern = "MARROW_PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION";
  else if (physiologicPrecursorPattern) dominantPattern = limitedMarrow || !blastAssessable
    ? "MARROW_PHYSIOLOGIC_MATURATION_LIMITED_PATTERN"
    : "MARROW_PHYSIOLOGIC_MATURATION_PATTERN";
  else if (blastLike) dominantPattern = "IMMATURE_OR_BLAST_LIKE_PATTERN";
  else if ((atypical || reactiveMorphology) && !blastAssessable)
    dominantPattern = "ATYPICAL_MONONUCLEAR_PATTERN_BLAST_ASSESSMENT_INDETERMINATE";
  else if (monomorphic) dominantPattern = "MONOMORPHIC_MONONUCLEAR_POPULATION";
  else if (reactiveClassification) dominantPattern = "REACTIVE_LYMPHOID_PATTERN";
  else if (atypical) dominantPattern = "ATYPICAL_MONONUCLEAR_PATTERN";

  return {
    dominantPattern,
    populationDistribution: monomorphic ? "REPETITIVE_OR_UNIFORM" : "SCATTERED_OR_NOT_DEFINED",
    physiologicAppearance,
    normalityBlocked: !physiologicAppearance,
    normalityReason: reasons,
    reactiveEvidence,
    blastAssessable,
    // BE-FIX-005.29 — assessability is a NEGATIVE-screening property.
    // A structured positive marrow blast signal remains positive even when a
    // field is inadequate for global negative exclusion.
    marrowPositiveBlastEvidence,
    marrowPositiveBlastoidCytology: focalPositiveBlastoidCytology,
    marrowPopulationBlastEvidence:
      focalPositiveBlastoidCytology ? false : marrowPositiveBlastEvidence,
    focalBlastoidScopeAuthority,
    populationInferenceAllowed:
      focalPositiveBlastoidCytology ? false : null,
    populationPositiveAllowed:
      focalPositiveBlastoidCytology ? false : null,
    blastPercentageInferenceAllowed:
      focalPositiveBlastoidCytology ? false : null,
    focalBlastoidFindingDoesNotEstablishPopulation:
      focalPositiveBlastoidCytology,
    marrowFocalBlastoidScopeGlobalPatternPropagationVersion:
      MARROW_FOCAL_BLASTOID_SCOPE_GLOBAL_PATTERN_PROPAGATION_VERSION,
    marrowFocalBlastoidGlobalPatternSemanticCoherenceVersion:
      MARROW_FOCAL_BLASTOID_GLOBAL_PATTERN_SEMANTIC_COHERENCE_VERSION,
    marrowFocalBlastoidPopulationSemanticNonPromotionVersion:
      MARROW_FOCAL_BLASTOID_POPULATION_SEMANTIC_NON_PROMOTION_VERSION,
    marrowTerminalClinicalAuthorityConvergenceVersion:
      MARROW_TERMINAL_CLINICAL_AUTHORITY_CONVERGENCE_VERSION,
    marrowTerminalGlobalPatternRecomputationVersion:
      MARROW_TERMINAL_GLOBAL_PATTERN_RECOMPUTATION_VERSION,
    physiologicPrecursorPattern,
    pathologicMyeloidExpansionPattern,
    marrowPositiveBlastEvidenceSemanticSupersession:
      marrowBlastSemanticSupersession,
    marrowPositiveBlastEvidenceSemanticSupersessionVersion:
      MARROW_POSITIVE_BLAST_EVIDENCE_SEMANTIC_SUPERSESSION_VERSION,
    marrowFinalConfidenceReconciliationVersion: "BE-FIX-005.43",
    marrowGlobalPatternCoherenceReconciliationVersion: MARROW_GLOBAL_PATTERN_COHERENCE_RECONCILIATION_VERSION,
    globalPatternCoherenceVersion: MARROW_GLOBAL_PATTERN_COHERENCE_RECONCILIATION_VERSION,
    blastAssessmentIndeterminate: !blastAssessable && !marrowPositiveBlastEvidence,
    blastAssessmentState: focalPositiveBlastoidCytology
      ? "FOCAL_POSITIVE_CYTOLOGY_POPULATION_NOT_ESTABLISHED"
      : marrowPositiveBlastEvidence
        ? "POSITIVE_EVIDENCE_PRESERVED"
        : (blastAssessable ? "EVALUABLE" : "NOT_ASSESSABLE"),
    globalSummary: focalPositiveBlastoidCytology
      ? "Citomorfologia blastoide positiva preservada em escopo focal; a representatividade limitada impede inferência populacional e estimativa percentual de blastos."
      : marrowPositiveBlastEvidence
      ? "Evidência medular positiva de população blastoide/imatura preservada; a limitação do campo restringe exclusões e quantificação global, não o achado positivo."
      : pathologicMyeloidExpansionPattern
        ? "Padrão medular dominante de expansão mieloide/granulocítica desproporcional com maturação preservado. O achado é morfológico e requer correlação clínico-laboratorial; não estabelece etiologia nem entidade hematológica específica."
      : physiologicPrecursorPattern
        ? (limitedMarrow || !blastAssessable
            ? "Padrão medular maturativo heterogêneo em campo limitado; sem alerta blastoide estruturado e sem autorização para afirmar normalidade global."
            : "Padrão medular maturativo heterogêneo sem alerta blastoide estruturado no campo analisado.")
      : physiologicAppearance
      ? "Padrão global sem alterações morfológicas relevantes no campo analisado."
      : (!blastAssessable && (atypical || reactiveMorphology)
          ? "Achado mononuclear atípico/reacional no campo, com avaliação de blastos indeterminada; requer revisão microscópica."
          : reactiveClassification
            ? "Padrão linfoide reacional morfologicamente sustentado no campo analisado; etiologia específica depende de correlação."
            : "A avaliação global identifica alteração morfológica não plenamente fisiológica, sem promover padrão reacional além da evidência visual disponível."),
    globalInterpretation: morphology.overview || morphology.summary || "",
    ruleVersion: "GLOBAL_PATTERN_ENGINE_V2_BE_FIX_005_16",
    compatibilityGovernanceVersion: MARROW_GLOBAL_PATTERN_COHERENCE_RECONCILIATION_VERSION,
    marrowPositiveBlastE2ELockVersion: "BE-FIX-005.34",
  };
}
export default analyzeGlobalPattern;
