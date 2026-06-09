export function sanitizeHematologyLanguage(result = {}) {
  const findings = result.findings || {};
  const visualEvidence = result.visualEvidence || {};
  const fieldAdequacy = result.fieldAdequacy || {};

  const hasPopulationSignal =
    findings.monomorphicPopulation === true ||
    findings.plasmacytoidCells === true ||
    findings.plasmablasts === true ||
    findings.largeMononuclearCells === true;

  const hasStrongBlastEvidence =
    findings.blastSuspicion === true &&
    visualEvidence.prominentNucleolus === true &&
    visualEvidence.cellSizeIncrease === true &&
    fieldAdequacy.adequateForBlastScreening === true;

  result.morphologyAnalysis = normalizeObject(result.morphologyAnalysis);
  result.patternRecognition = normalizeObject(result.patternRecognition);
  result.overallAssessment = normalizeObject(result.overallAssessment);
  result.structuredReport = normalizeObject(result.structuredReport);

  if (hasPopulationSignal) {
    result.normalityBlocked = true;

    result.riskLevel =
      "População mononuclear atípica / indeterminada";

    result.morphologicRiskClass =
      hasStrongBlastEvidence
        ? "CLASS_4_BLAST_SUSPICION"
        : "CLASS_2_ATYPICAL_POPULATION";

    result.morphologyAnalysis.overview =
      "População mononuclear atípica observada. A amostra não deve ser classificada como morfologia preservada.";

    result.morphologyAnalysis.leukocyteReview =
      "Observa-se população mononuclear relativamente uniforme com características atípicas. O campo isolado não permite definir com segurança se o padrão é reacional, clonal ou imaturo.";

    result.morphologyAnalysis.biologicalInterpretation =
      "O achado indica alteração morfológica leucocitária relevante, exigindo correlação com hemograma completo, avaliação de múltiplos campos da lâmina e revisão microscópica profissional.";

    result.morphologyAnalysis.differentialDiagnosis =
      "Hipóteses educacionais amplas: população linfoide reacional exuberante, população linfoplasmocitoide/plasmocitoide, processo hematológico clonal ou artefato de campo. A imagem isolada não permite diagnóstico definitivo.";

    result.morphologyAnalysis.summary =
      "População mononuclear atípica observada. Recomenda-se correlação hematológica especializada.";

    result.patternRecognition.leukocytePattern =
      "População mononuclear atípica";

    result.patternRecognition.overallPattern =
      "Campo com população mononuclear atípica, sem conclusão diagnóstica definitiva.";

    result.interpretiveSynthesis =
      "A imagem demonstra população mononuclear relativamente uniforme com aspecto atípico. Esse padrão não deve ser descrito como célula isolada nem como morfologia preservada. A interpretação deve permanecer conservadora: há alteração morfológica relevante, porém a imagem isolada não permite definir linhagem, clonalidade ou imaturidade de forma conclusiva.";

    result.clinicalMeaning =
      "A presença de população mononuclear atípica pode ter diferentes significados hematológicos e não deve ser interpretada isoladamente como diagnóstico. O achado requer correlação com hemograma completo, diferencial leucocitário, contexto clínico e revisão microscópica profissional. Citometria de fluxo ou outros exames podem ser considerados conforme indicação clínica.";

    result.hematologicReasoning =
      "O raciocínio hematológico diferencia uma população mononuclear atípica de uma célula reacional isolada. Neste campo há múltiplas células com semelhança morfológica, o que impede classificar o achado como evento focal isolado. Ao mesmo tempo, a imagem não confirma blastos inequívocos nem natureza neoplásica. A conclusão adequada é população atípica indeterminada com necessidade de correlação.";

    result.overallAssessment.requiresHumanReview = true;
    result.overallAssessment.riskCategory = result.morphologicRiskClass;
    result.overallAssessment.mainImpression =
      "População mononuclear atípica observada em campo limitado. O achado impede classificação como morfologia preservada e requer correlação com hemograma completo, múltiplos campos da lâmina e revisão profissional.";

    result.structuredReport.leukocyteFindings =
      "População mononuclear atípica observada.";
    result.structuredReport.blastSuspicion =
      hasStrongBlastEvidence;
    result.structuredReport.recommendation =
      "Correlacionar com hemograma completo, revisão microscópica profissional e exames complementares conforme contexto clínico.";
  }

  if (!hasStrongBlastEvidence) {
    findings.blastSuspicion = false;

    if (result.morphologicRiskClass === "CLASS_4_BLAST_SUSPICION") {
      result.morphologicRiskClass =
        hasPopulationSignal
          ? "CLASS_2_ATYPICAL_POPULATION"
          : "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL";
    }
  }

  result.findings = findings;

  replaceEverywhere(
    result,
    [
      "célula mononuclear isolada",
      "celula mononuclear isolada",
      "achado mononuclear isolado",
    ],
    hasPopulationSignal
      ? "população mononuclear atípica"
      : "possível reatividade celular isolada",
  );

  replaceEverywhere(
    result,
    [
      "possível atipia/reatividade",
      "possível reatividade/reatividade",
      "possível padrão reacional/atípico",
    ],
    hasPopulationSignal
      ? "padrão mononuclear atípico"
      : "possível reatividade celular isolada",
  );

  return result;
}

function normalizeObject(value) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
}

function replaceEverywhere(obj, searchTerms, replacement) {
  if (!obj || typeof obj !== "object") return;

  Object.keys(obj).forEach((key) => {
    const value = obj[key];

    if (typeof value === "string") {
      let text = value;

      for (const term of searchTerms) {
        text = text.replace(
          new RegExp(term, "gi"),
          replacement,
        );
      }

      obj[key] = text;
    } else if (typeof value === "object") {
      replaceEverywhere(value, searchTerms, replacement);
    }
  });
}