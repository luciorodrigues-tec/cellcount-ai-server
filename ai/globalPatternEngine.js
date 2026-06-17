// ============================================================================
// GLOBAL PATTERN ENGINE
// CELLCOUNT HEMATOLOGY AI — V1
// Analisa o padrão global antes da classificação celular específica
// ============================================================================

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

  const reactivePattern =
    findings.reactiveLymphocytes === true ||
    findings.mononucleosisSuspicion === true ||
    findings.downeyLikeCells === true;

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
    result.normalityBlocked !== true;

  let dominantPattern = "GLOBAL_UNREMARKABLE_PATTERN";

    if (reactivePattern) {
      dominantPattern = "REACTIVE_LYMPHOID_PATTERN";
    } else if (monomorphic) {
      dominantPattern = "MONOMORPHIC_MONONUCLEAR_POPULATION";
    } else if (atypical) {
      dominantPattern = "ATYPICAL_MONONUCLEAR_PATTERN";
    } else if (blastLike) {
      dominantPattern = "IMMATURE_OR_BLAST_LIKE_PATTERN";
    }

  return {
    dominantPattern,
    populationDistribution: monomorphic ? "REPETITIVE_OR_UNIFORM" : "SCATTERED_OR_NOT_DEFINED",
    physiologicAppearance,
    normalityBlocked: !physiologicAppearance,
    normalityReason: reasons,
    globalSummary: physiologicAppearance
      ? "Padrão global sem alterações morfológicas relevantes no campo analisado."
      : "A avaliação global identifica padrão morfológico não plenamente fisiológico, com necessidade de correlação microscópica, hematimétrica e clínica.",
    globalInterpretation:
      morphology.overview ||
      morphology.summary ||
      "",
    ruleVersion: "GLOBAL_PATTERN_ENGINE_V1",
  };
}

export default analyzeGlobalPattern;