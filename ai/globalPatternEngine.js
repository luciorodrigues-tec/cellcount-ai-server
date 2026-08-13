// ============================================================================
// GLOBAL PATTERN ENGINE
// CELLCOUNT HEMATOLOGY AI — V2 / BE-FIX-005.16
// Evidence-grounded global pattern classification.
// ============================================================================

import {
  evaluateReactiveLymphoidEvidence,
} from "./reactiveLymphoidEvidenceSentinel.js";

export function analyzeGlobalPattern(result = {}) {
  const findings = result.findings || {};
  const visualEvidence = result.visualEvidence || {};
  const morphology = result.morphologyAnalysis || {};

  const reasons = [];

  const monomorphic =
    findings.monomorphicPopulation === true ||
    findings.plasmacytoidCells === true ||
    findings.plasmablasts === true ||
    findings.plasmocytes === true ||
    visualEvidence.repetitiveMononuclearCells === true ||
    visualEvidence.uniformAtypicalCells === true;

  const reactiveEvidence =
    evaluateReactiveLymphoidEvidence(result);

  const reactivePattern =
    reactiveEvidence.reactivePatternSupported === true &&
    reactiveEvidence.reactiveClassificationAllowed !== false;

  const blastAssessmentIndeterminate =
    reactiveEvidence.blastAssessable === false ||
    result.singleBlastSentinel?.negativeEvidenceState === "NOT_ASSESSABLE" ||
    result.localMorphologyEvidence?.criticalMorphology?.blastLikeMorphology ===
      "NOT_ASSESSABLE";

  const atypical =
    findings.atypicalLymphocytes === true ||
    findings.largeMononuclearCells === true ||
    findings.atypicalPopulation === true ||
    monomorphic;

  const blastLike =
    findings.blastSuspicion === true ||
    findings.immatureCells === true;

  if (monomorphic) {
    reasons.push(
      "Presença de população mononuclear relativamente uniforme/repetitiva no campo."
    );
  }

  if (reactivePattern) {
    reasons.push(
      "Padrão linfoide reacional sustentado por achado estruturado e características morfológicas de suporte."
    );
  }

  if (atypical) {
    reasons.push(
      "Há elementos celulares atípicos que impedem classificar a lâmina como morfologia preservada."
    );
  }

  if (blastLike) {
    reasons.push(
      "Há sinal de imaturidade/blasto informado, exigindo interpretação conservadora."
    );
  }

  const physiologicAppearance =
    !monomorphic &&
    !atypical &&
    !blastLike &&
    !reactivePattern &&
    result.normalityBlocked !== true;

  let dominantPattern = "GLOBAL_UNREMARKABLE_PATTERN";

  if (blastLike) {
    dominantPattern = "IMMATURE_OR_BLAST_LIKE_PATTERN";
  } else if (
    blastAssessmentIndeterminate &&
    (atypical || reactiveEvidence.reactivePatternSupported === true)
  ) {
    dominantPattern =
      "ATYPICAL_MONONUCLEAR_PATTERN_BLAST_ASSESSMENT_INDETERMINATE";
  } else if (monomorphic) {
    dominantPattern = "MONOMORPHIC_MONONUCLEAR_POPULATION";
  } else if (reactivePattern) {
    dominantPattern = "REACTIVE_LYMPHOID_PATTERN";
  } else if (atypical) {
    dominantPattern = "ATYPICAL_MONONUCLEAR_PATTERN";
  }

  return {
    dominantPattern,
    populationDistribution:
      monomorphic
        ? "REPETITIVE_OR_UNIFORM"
        : "SCATTERED_OR_NOT_DEFINED",
    physiologicAppearance,
    normalityBlocked: !physiologicAppearance,
    normalityReason: reasons,
    reactiveEvidence,
    blastAssessmentIndeterminate,
    globalSummary: physiologicAppearance
      ? "Padrão global sem alterações morfológicas relevantes no campo analisado."
      : (
          blastAssessmentIndeterminate &&
          (atypical || reactiveEvidence.reactivePatternSupported === true)
            ? "Alteração mononuclear atípica/reacional possível, porém a exclusão morfológica de blastos é indeterminada neste campo."
            : (
                reactivePattern
                  ? "Padrão linfoide reacional morfologicamente sustentado no campo analisado; etiologia específica depende de correlação."
                  : "A avaliação global identifica alteração morfológica não plenamente fisiológica, sem promover padrão reacional além da evidência visual disponível."
              )
        ),
    globalInterpretation:
      morphology.overview ||
      morphology.summary ||
      "",
    ruleVersion: "GLOBAL_PATTERN_ENGINE_V2_BE_FIX_005_16",
  };
}

export default analyzeGlobalPattern;
