// ============================================================================
// GLOBAL PATTERN ENGINE
// CELLCOUNT HEMATOLOGY AI — V2 / BE-FIX-005.16 + BE-FIX-005.17.1
// ============================================================================

import { evaluateReactiveLymphoidEvidence } from "./reactiveLymphoidEvidenceSentinel.js";

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
  const blastLike = findings.blastSuspicion === true || findings.immatureCells === true;

  if (monomorphic) reasons.push("Presença de população mononuclear relativamente uniforme/repetitiva no campo.");
  if (reactiveMorphology) reasons.push("Morfologia linfoide reacional sustentada por evidência estruturada.");
  if (atypical) reasons.push("Há elementos celulares atípicos que impedem classificar a lâmina como morfologia preservada.");
  if (blastLike) reasons.push("Há sinal de imaturidade/blasto informado, exigindo interpretação conservadora.");
  if ((atypical || reactiveMorphology) && !blastAssessable) reasons.push("A triagem morfológica de blastos não é avaliável com segurança; não promover classificação reacional tranquilizadora.");

  const physiologicAppearance = !monomorphic && !atypical && !blastLike && !reactiveMorphology &&
    result.normalityBlocked !== true && blastAssessable;

  let dominantPattern = "GLOBAL_UNREMARKABLE_PATTERN";
  if (blastLike) dominantPattern = "IMMATURE_OR_BLAST_LIKE_PATTERN";
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
    // BE-FIX-005.17.2 — explicit compatibility projection for 005.15/005.16 consumers.
    blastAssessmentIndeterminate: !blastAssessable,
    blastAssessmentState: blastAssessable ? "EVALUABLE" : "NOT_ASSESSABLE",
    globalSummary: physiologicAppearance
      ? "Padrão global sem alterações morfológicas relevantes no campo analisado."
      : (!blastAssessable && (atypical || reactiveMorphology)
          ? "Achado mononuclear atípico/reacional no campo, com avaliação de blastos indeterminada; requer revisão microscópica."
          : reactiveClassification
            ? "Padrão linfoide reacional morfologicamente sustentado no campo analisado; etiologia específica depende de correlação."
            : "A avaliação global identifica alteração morfológica não plenamente fisiológica, sem promover padrão reacional além da evidência visual disponível."),
    globalInterpretation: morphology.overview || morphology.summary || "",
    ruleVersion: "GLOBAL_PATTERN_ENGINE_V2_BE_FIX_005_16",
    compatibilityGovernanceVersion: "BE-FIX-005.17.2",
  };
}
export default analyzeGlobalPattern;
