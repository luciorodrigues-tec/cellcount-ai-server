export function sanitizeHematologyLanguage(result = {}) {
  if (!result || typeof result !== "object") return result;

  result.findings = result.findings || {};
  result.morphologyAnalysis = normalizeObject(result.morphologyAnalysis);
  result.patternRecognition = normalizeObject(result.patternRecognition);
  result.overallAssessment = normalizeObject(result.overallAssessment);
  result.structuredReport = normalizeObject(result.structuredReport);

  const findings = result.findings;
  const visualEvidence = result.visualEvidence || {};
  const fieldAdequacy = result.fieldAdequacy || {};

  const limitedField =
    result.finalClassification === "CLASS_1_LIMITED_FIELD" ||
    result.morphologicRiskClass === "CLASS_1_LIMITED_FIELD" ||
    result.morphologicRiskClass === "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL" ||
    fieldAdequacy.adequateForPopulationAssessment === false ||
    fieldAdequacy.limitedField === true;

  const hasPopulationSignal =
    findings.monomorphicPopulation === true ||
    findings.plasmacytoidCells === true ||
    findings.plasmablasts === true ||
    findings.largeMononuclearCells === true ||
    findings.atypicalLymphocytes === true ||
    findings.reactiveLymphocytes === true;

  const hasStrongBlastEvidence =
    findings.blastSuspicion === true &&
    visualEvidence.prominentNucleolus === true &&
    visualEvidence.cellSizeIncrease === true &&
    fieldAdequacy.adequateForBlastScreening === true;

  if (
    limitedField &&
    !hasPopulationSignal
  ) {
    // BE-FIX — preserve morphology; sanitize only unsafe global inference.
    result.normalityBlocked = true;
    result.requiresHumanReview = true;
    result.morphologicRiskClass = "CLASS_1_LIMITED_FIELD";
    result.finalClassification = "CLASS_1_LIMITED_FIELD";

    result.blockNormalReason = [
      ...new Set([
        ...(result.blockNormalReason || []),
        "Campo microscópico limitado",
        "Baixa representatividade celular",
        "Não afirmar normalidade global",
        "Não converter não visualização em exclusão global",
      ]),
    ];

    result.riskLevel = result.riskLevel || "Campo limitado";

    // Keep upstream morphologyAnalysis/whatAISees/hematologicReasoning intact.
    // Add only missing safety context.
    result.morphologyAnalysis.overview =
      result.morphologyAnalysis.overview ||
      "Campo limitado para conclusão global; preservar os achados morfológicos observados sem generalizá-los para toda a lâmina.";
    result.morphologyAnalysis.summary =
      result.morphologyAnalysis.summary ||
      "Campo limitado: achados morfológicos observados preservados, com representatividade insuficiente para conclusão populacional global.";
    result.morphologyAnalysis.absentFindings =
      result.morphologyAnalysis.absentFindings ||
      "A não visualização de um elemento neste campo não permite sua exclusão global na lâmina.";

    result.interpretiveSynthesis = result.interpretiveSynthesis ||
      "A baixa representatividade limita inferências populacionais, mas não invalida os achados morfológicos positivos observados no campo.";
    result.clinicalMeaning = result.clinicalMeaning ||
      "Campo limitado. Correlacionar os achados observados com hemograma completo, múltiplos campos e revisão microscópica profissional.";

    result.overallAssessment.requiresHumanReview = true;
    result.overallAssessment.riskCategory = "CLASS_1_LIMITED_FIELD";
    result.overallAssessment.mainImpression =
      result.overallAssessment.mainImpression || result.morphologyAnalysis.summary;
  }

  if (hasPopulationSignal && !limitedField) {
    result.normalityBlocked = true;
    result.riskLevel = "População mononuclear atípica / indeterminada";

    result.morphologicRiskClass = hasStrongBlastEvidence
      ? "CLASS_4_BLAST_SUSPICION"
      : "CLASS_2_ATYPICAL_POPULATION";

    result.morphologyAnalysis.overview =
      "População mononuclear atípica observada. A amostra não deve ser classificada como morfologia preservada.";

    result.morphologyAnalysis.leukocyteReview =
      "Observa-se população mononuclear relativamente uniforme com características atípicas. O campo isolado não permite definir com segurança se o padrão é reacional, clonal ou imaturo.";

    result.morphologyAnalysis.summary =
      "População mononuclear atípica observada. Recomenda-se correlação hematológica especializada.";

    result.overallAssessment.requiresHumanReview = true;
    result.overallAssessment.riskCategory = result.morphologicRiskClass;
    result.overallAssessment.mainImpression =
      "População mononuclear atípica observada. Requer correlação com hemograma completo, múltiplos campos da lâmina e revisão profissional.";
  }

  if (!hasStrongBlastEvidence) {
    findings.blastSuspicion = false;

    if (result.morphologicRiskClass === "CLASS_4_BLAST_SUSPICION") {
      result.morphologicRiskClass = hasPopulationSignal
        ? "CLASS_2_ATYPICAL_POPULATION"
        : "CLASS_1_LIMITED_FIELD";
    }
  }

  result.findings = findings;

  scrubUnsafeNormalLanguage(result, limitedField || hasPopulationSignal);

  return result;
}

function normalizeObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  return {};
}

function scrubUnsafeNormalLanguage(obj, shouldScrub = true) {
  if (!shouldScrub || !obj || typeof obj !== "object") return;

  const replacements = [
    [/estado hematológico normal/gi, "estado hematológico global não confirmado"],
    [/padrão hematológico normal/gi, "padrão hematológico global não confirmado"],
    [/esfregaço sanguíneo normal/gi, "campo microscópico sem elementos críticos inequívocos"],
    [/morfologia normal/gi, "morfologia global não confirmada"],
    [/morfologia preservada/gi, "morfologia global não confirmada"],
    [/sem alterações patológicas significativas/gi, "sem elementos críticos inequívocos neste campo"],
    [/eritrócitos normocíticos e normocrômicos/gi, "hemácias visíveis sem avaliação global conclusiva"],
    [/normocítico e normocrômico/gi, "avaliação eritrocitária global limitada"],
    [/normocíticos e normocrômicos/gi, "sem base para afirmar normocitose/normocromia global"],
    [/plaquetas em quantidade adequada/gi, "plaquetas visíveis com avaliação quantitativa limitada"],
    [/plaquetas normais/gi, "avaliação plaquetária global limitada"],
    [/avaliação confiável/gi, "avaliação limitada ao campo enviado"],
  ];

  for (const key of Object.keys(obj)) {
    const value = obj[key];

    if (typeof value === "string") {
      let text = value;

      for (const [pattern, replacement] of replacements) {
        text = text.replace(pattern, replacement);
      }

      obj[key] = text;
    } else if (value && typeof value === "object") {
      scrubUnsafeNormalLanguage(value, shouldScrub);
    }
  }
}