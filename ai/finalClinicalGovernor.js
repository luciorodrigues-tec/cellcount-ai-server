// ============================================================================
// FINAL CLINICAL GOVERNOR
// CELLCOUNT HEMATOLOGY AI
// Única autoridade final para classe, risco e narrativa
// ============================================================================

function safeBool(value) {
  return value === true;
}

function ensureObjects(result) {
  result.findings = result.findings || {};
  result.overallAssessment = result.overallAssessment || {};
  result.morphologyAnalysis = result.morphologyAnalysis || {};
  result.structuredReport = result.structuredReport || {};
  result.confidenceAnalysis = result.confidenceAnalysis || {};
  result.blockNormalReason = Array.isArray(result.blockNormalReason)
    ? result.blockNormalReason
    : [];

  return result;
}

export function applyFinalClinicalGovernor(result = {}) {
  const final = ensureObjects({ ...result });

  const f = final.findings || {};
  const field = final.fieldAdequacy || {};
  const lymphoid = final.lymphoidPatternAnalysis || {};

  const visibleLeukocytes =
    Number(field.visibleLeukocytes || 0);

  const adequatePopulation =
    field.adequateForPopulationAssessment === true;

  const reactivePattern =
    safeBool(f.reactiveLymphocytes) ||
    safeBool(f.mononucleosisSuspicion) ||
    safeBool(f.downeyLikeCells) ||
    lymphoid.lymphoidPattern === "REACTIVE_LYMPHOID_PATTERN" ||
    lymphoid.forceDowngrade === true;

  const strongBlastEvidence =
    safeBool(f.blastSuspicion) &&
    safeBool(f.immatureCells) &&
    !reactivePattern &&
    !safeBool(f.downeyLikeCells) &&
    !safeBool(f.reactiveLymphocytes);

  const highNeoplasticEvidence =
    safeBool(f.plasmablasts) &&
    safeBool(f.monomorphicPopulation) &&
    !reactivePattern;

  const sustainedAtypicalPopulation =
    adequatePopulation &&
    visibleLeukocytes >= 8 &&
    !reactivePattern &&
    (
      safeBool(f.largeMononuclearCells) ||
      safeBool(f.atypicalLymphocytes) ||
      safeBool(f.plasmacytoidCells) ||
      safeBool(f.plasmocytes) ||
      safeBool(f.monomorphicPopulation)
    );

  const limitedField =
    field.adequateForPopulationAssessment === false ||
    field.limitedField === true ||
    final.morphologicRiskClass === "CLASS_1_LIMITED_FIELD" ||
    final.morphologicRiskClass === "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL";

  let finalClass = "CLASS_0_NORMAL";
  let riskLevel = "Sem alterações morfológicas relevantes";
  let mainFinding = "Campo sem alterações morfológicas relevantes no material analisado.";
  let requiresHumanReview = false;

  if (strongBlastEvidence) {
    finalClass = "CLASS_4_BLAST_SUSPICION";
    riskLevel = "Suspeita de células imaturas";
    mainFinding =
      "Suspeita morfológica de células imaturas. Requer revisão microscópica profissional e correlação com hemograma.";
    requiresHumanReview = true;
  } else if (highNeoplasticEvidence) {
    finalClass = "CLASS_5_HIGH_NEOPLASTIC_SUSPICION";
    riskLevel = "Alta suspeita morfológica";
    mainFinding =
      "Padrão monomórfico/plasmoblástico sustentado. Requer revisão hematológica especializada.";
    requiresHumanReview = true;
  } else if (reactivePattern) {
    finalClass = "CLASS_2_ATYPICAL_REACTIVE_PATTERN";
    riskLevel = "Padrão linfoide reacional/atípico";
    mainFinding =
      "Achado compatível com ativação linfoide reacional/atípica, sem critérios inequívocos de blasto no campo analisado.";
    requiresHumanReview = true;
  } else if (sustainedAtypicalPopulation) {
    finalClass = "CLASS_3_SUSPICIOUS_ATYPICAL_POPULATION";
    riskLevel = "População mononuclear atípica sustentada";
    mainFinding =
      "População mononuclear atípica sustentada no campo analisado, sem critérios definitivos de blasto.";
    requiresHumanReview = true;
  } else if (limitedField) {
    finalClass = "CLASS_1_LIMITED_FIELD";
    riskLevel = "Campo limitado";
    mainFinding =
      "Campo microscópico limitado para conclusão populacional confiável. Recomenda-se avaliação de múltiplos campos.";
    requiresHumanReview = true;
  }

  final.finalClassification = finalClass;
  final.morphologicRiskClass = finalClass;
  final.riskLevel = riskLevel;
  final.mainFinding = mainFinding;
  final.primaryFinding = mainFinding;
  final.finalConclusion = mainFinding;
  final.normalityBlocked = finalClass !== "CLASS_0_NORMAL";
  final.requiresHumanReview = requiresHumanReview;

  final.overallAssessment.requiresHumanReview = requiresHumanReview;
  final.overallAssessment.riskCategory = finalClass;
  final.overallAssessment.mainImpression = mainFinding;

  final.morphologyAnalysis.summary = mainFinding;

  final.morphologyAnalysis.leukocyteReview =
    finalClass === "CLASS_0_NORMAL"
      ? (final.morphologyAnalysis.leukocyteReview || "Série leucocitária sem alterações relevantes no campo analisado.")
      : mainFinding;

  final.structuredReport.conclusion = mainFinding;
  final.structuredReport.hematologicMeaning =
    finalClass === "CLASS_0_NORMAL"
      ? "A interpretação deve ser correlacionada com hemograma completo e contexto clínico."
      : "Achado morfológico educacionalmente relevante. Requer correlação com hemograma completo, contexto clínico e revisão microscópica profissional.";

  final.structuredReport.recommendation =
    requiresHumanReview
      ? "Correlacionar com hemograma completo e revisão microscópica profissional."
      : "Correlação clínico-laboratorial conforme contexto.";

  final.clinicalMeaning = final.structuredReport.hematologicMeaning;
  final.interpretiveSynthesis = mainFinding;

  final.blockNormalReason =
    final.normalityBlocked
      ? [
          ...new Set([
            ...final.blockNormalReason,
            mainFinding,
          ]),
        ]
      : [];

  return final;
}

export default applyFinalClinicalGovernor;