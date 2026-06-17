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
      ]),
    ];

    result.riskLevel =
      result.findings?.parasiteSuspected === true
        ? "Campo limitado com achado parasitário suspeito"
        : "Classificação morfológica indeterminada";

    result.morphologyAnalysis.overview =
      "Campo microscópico limitado para conclusão morfológica global. A baixa representatividade celular impede afirmar morfologia preservada, estado hematológico normal ou padrão populacional sustentado.";

    result.morphologyAnalysis.erythrocyteReview =
      "Avaliação eritrocitária limitada ao campo enviado. Não afirmar normocitose, normocromia ou preservação eritrocitária global pela imagem isolada.";

    result.morphologyAnalysis.leukocyteReview =
      "Avaliação leucocitária limitada pela representatividade do campo. A imagem isolada não permite caracterização populacional confiável nem exclusão global de células imaturas.";

    result.morphologyAnalysis.plateletReview =
      "Avaliação plaquetária limitada pela representatividade do campo. Não afirmar número adequado ou preservação plaquetária global.";

    result.morphologyAnalysis.summary =
      "Avaliação leucocitária limitada pela representatividade do campo. A imagem isolada não permite caracterização populacional confiável nem exclusão global de células imaturas."
    result.interpretiveSynthesis =
      "A baixa representatividade celular limita a interpretação. O campo analisado não demonstra blastos inequívocos ou células imaturas críticas, porém não permite conclusão global sobre normalidade hematológica.";

    result.clinicalMeaning =
      "Campo limitado. A imagem isolada não permite afirmar estado hematológico normal ou morfologia preservada global. Recomenda-se correlação com hemograma completo, dados clínicos e revisão microscópica profissional.";

    result.hematologicReasoning = {
      whatISee:
        "Avaliação leucocitária limitada pela representatividade do campo. A imagem isolada não permite caracterização populacional confiável nem exclusão global de células imaturas.",
      whatItResembles:
        "Campo limitado para avaliação populacional. Não há base suficiente para afirmar padrão normal, reacional ou clonal sustentado.",
      whatICannotConfirm:
        "Não é possível confirmar normalidade global, morfologia preservada, estado hematológico normal, clonalidade, malignidade ou diagnóstico definitivo pela imagem isolada.",
      finalInterpretation:
        "Avaliação leucocitária limitada pela representatividade do campo. A imagem isolada não permite caracterização populacional confiável nem exclusão global de células imaturas."
    };

    result.overallAssessment.requiresHumanReview = true;
    result.overallAssessment.riskCategory = "CLASS_1_LIMITED_FIELD";
    result.overallAssessment.mainImpression =
      result.morphologyAnalysis.summary;
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