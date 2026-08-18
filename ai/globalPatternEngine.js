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

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function hasPositiveMarrowBlastEvidence(result = {}) {
  if (result?.marrowPositiveCellLevelBlastoidScopeLock?.active === true) {
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
  const focalPositiveBlastoidCytology =
    result?.marrowPositiveCellLevelBlastoidScopeLock?.active === true &&
    result?.marrowPositiveCellLevelBlastoidScopeLock?.cellLevelPositiveBlastoidCytology === true;
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
    marrowPopulationBlastEvidence: marrowPositiveBlastEvidence,
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
    blastAssessmentState: marrowPositiveBlastEvidence
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
