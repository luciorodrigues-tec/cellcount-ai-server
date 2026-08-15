// ============================================================================
// GLOBAL PATTERN ENGINE
// CELLCOUNT HEMATOLOGY AI — V2 / BE-FIX-005.16 + BE-FIX-005.17.1
// ============================================================================

import { evaluateReactiveLymphoidEvidence } from "./reactiveLymphoidEvidenceSentinel.js";

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function hasPositiveMarrowBlastEvidence(result = {}) {
  const rawBlast = asObject(result?.rawResponse?.blastAssessment);
  const directBlast = asObject(result?.blastAssessment);
  const lmeBlast = asObject(result?.localMorphologyEvidence?.marrow?.blastPopulationEvidence);
  const projected = asObject(result?.marrowBlastPopulationEvidence);
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
    projected.focalSuspicion === true;
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

  const atypical = findings.atypicalLymphocytes === true || findings.largeMononuclearCells === true ||
    findings.atypicalPopulation === true || monomorphic;
  const marrowPositiveBlastEvidence = hasPositiveMarrowBlastEvidence(result);
  const blastLike = marrowPositiveBlastEvidence || findings.blastSuspicion === true || findings.immatureCells === true;

  if (monomorphic) reasons.push("Presença de população mononuclear relativamente uniforme/repetitiva no campo.");
  if (reactiveMorphology) reasons.push("Morfologia linfoide reacional sustentada por evidência estruturada.");
  if (atypical) reasons.push("Há elementos celulares atípicos que impedem classificar a lâmina como morfologia preservada.");
  if (blastLike) reasons.push(
    marrowPositiveBlastEvidence
      ? "Há evidência medular positiva estruturada de população blastoide/imatura; a assessabilidade negativa não pode apagar esse achado."
      : "Há sinal de imaturidade/blasto informado, exigindo interpretação conservadora."
  );
  if ((atypical || reactiveMorphology) && !blastAssessable) reasons.push("A triagem morfológica de blastos não é avaliável com segurança; não promover classificação reacional tranquilizadora.");

  const physiologicAppearance = !monomorphic && !atypical && !blastLike && !reactiveMorphology &&
    result.normalityBlocked !== true && blastAssessable;

  let dominantPattern = "GLOBAL_UNREMARKABLE_PATTERN";
  if (marrowPositiveBlastEvidence) dominantPattern = "MARROW_POSITIVE_BLASTOID_POPULATION_PATTERN";
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
    blastAssessmentIndeterminate: !blastAssessable && !marrowPositiveBlastEvidence,
    blastAssessmentState: marrowPositiveBlastEvidence
      ? "POSITIVE_EVIDENCE_PRESERVED"
      : (blastAssessable ? "EVALUABLE" : "NOT_ASSESSABLE"),
    globalSummary: marrowPositiveBlastEvidence
      ? "Evidência medular positiva de população blastoide/imatura preservada; a limitação do campo restringe exclusões e quantificação global, não o achado positivo."
      : physiologicAppearance
      ? "Padrão global sem alterações morfológicas relevantes no campo analisado."
      : (!blastAssessable && (atypical || reactiveMorphology)
          ? "Achado mononuclear atípico/reacional no campo, com avaliação de blastos indeterminada; requer revisão microscópica."
          : reactiveClassification
            ? "Padrão linfoide reacional morfologicamente sustentado no campo analisado; etiologia específica depende de correlação."
            : "A avaliação global identifica alteração morfológica não plenamente fisiológica, sem promover padrão reacional além da evidência visual disponível."),
    globalInterpretation: morphology.overview || morphology.summary || "",
    ruleVersion: "GLOBAL_PATTERN_ENGINE_V2_BE_FIX_005_16",
    compatibilityGovernanceVersion: "BE-FIX-005.29",
  };
}
export default analyzeGlobalPattern;
