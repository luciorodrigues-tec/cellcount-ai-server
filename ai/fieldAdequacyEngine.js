// ============================================================================
// CELLCOUNT ENTERPRISE
// FIELD ADEQUACY ENGINE V3 — LIMITED FIELD + HEMOPARASITE STRUCTURE SAFE LOCK
// ============================================================================

function normalizeText(value = "") {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function includesAny(text = "", terms = []) {
  const normalized = normalizeText(text);
  return terms.some((term) => normalized.includes(normalizeText(term)));
}

export function evaluateFieldAdequacy(analysis = {}) {
  const raw = normalizeText(JSON.stringify(analysis || ""));

  const leukocyteTerms = [
    "leucocito",
    "leucócito",
    "neutrofilo",
    "neutrófilo",
    "segmentado",
    "linfocito",
    "linfócito",
    "monocito",
    "monócito",
    "eosinofilo",
    "eosinófilo",
    "basofilo",
    "basófilo",
  ];

  let visibleLeukocytes = 0;

  for (const term of leukocyteTerms) {
    if (raw.includes(normalizeText(term))) visibleLeukocytes++;
  }

  visibleLeukocytes = Math.min(visibleLeukocytes, 5);

  const unusualStructureSignal = includesAny(raw, [
    "estrutura incomum",
    "estrutura extracelular",
    "estrutura alongada",
    "estrutura curvilinea",
    "estrutura curvilínea",
    "estrutura filamentosa",
    "estrutura serpiginosa",
    "estrutura flagelada",
    "forma extracelular",
    "forma alongada",
    "forma flagelada",
    "organismo extracelular",
    "filamento extracelular",
    "elemento extracelular",
  ]);

  const parasiteSignal = includesAny(raw, [
    "parasita",
    "hemoparasita",
    "protozoario",
    "protozoário",
    "plasmodium",
    "babesia",
    "trypanosoma",
    "tripanossoma",
    "tripomastigota",
    "microfilaria",
    "microfilária",
    "filaria",
    "filária",
    "flagelo",
    "flagelado",
    "membrana ondulante",
    "cinetoplasto",
    "intraeritrocitario",
    "intraeritrocitário",
  ]) || unusualStructureSignal;

  const singleCellConcern =
    includesAny(raw, [
      "celula mononuclear grande",
      "célula mononuclear grande",
      "linfocito reativo",
      "linfócito reativo",
      "linfocito atipico",
      "linfócito atípico",
      "plasmocito",
      "plasmócito",
      "plasmoblasto",
      "blasto",
    ]) || parasiteSignal;

  return {
    visibleLeukocytes,
    singleCellConcern,
    parasiteSignal,
    unusualStructureSignal,
    adequateForLeukocyteAnalysis: visibleLeukocytes >= 3 || singleCellConcern,
    adequateForBlastScreening: visibleLeukocytes >= 1 || singleCellConcern,
    adequateForPopulationAssessment: visibleLeukocytes >= 8,
    limitedField: visibleLeukocytes < 8,
    limitationReason:
      visibleLeukocytes >= 8
        ? ""
        : "Campo com baixa representatividade celular; não permite conclusão morfológica global.",
  };
}

export function applyFieldAdequacyRules(analysis = {}) {
  const fieldAdequacy = evaluateFieldAdequacy(analysis);

  analysis.fieldAdequacy = fieldAdequacy;

  analysis.findings = {
    ...(analysis.findings || {}),
  };

  analysis.morphologyAnalysis = {
    ...(analysis.morphologyAnalysis || {}),
  };

  analysis.whatAISees = {
    ...(analysis.whatAISees || {}),
  };

  analysis.patternRecognition = {
    ...(analysis.patternRecognition || {}),
  };

  analysis.overallAssessment = {
    ...(analysis.overallAssessment || {}),
  };

  analysis.structuredReport = {
    ...(analysis.structuredReport || {}),
  };

  if (fieldAdequacy.parasiteSignal || fieldAdequacy.unusualStructureSignal) {
    analysis.normalityBlocked = true;
    analysis.requiresHumanReview = true;

    analysis.findings.parasiteSuspected = true;
    analysis.findings.unusualStructureSuspected = true;

    analysis.riskLevel =
      "Campo com estrutura incomum/hemoparasita suspeito";

    analysis.blockNormalReason = [
      ...new Set([
        ...(Array.isArray(analysis.blockNormalReason)
          ? analysis.blockNormalReason
          : []),
        "Estrutura incomum suspeita para hemoparasita ou artefato",
        "Não afirmar normalidade global diante de estrutura incomum",
      ]),
    ];

    analysis.whatAISees.unusualStructures =
      analysis.whatAISees.unusualStructures ||
      "Estrutura incomum/hemoparasitária suspeita deve ser considerada e validada em múltiplos campos.";

    analysis.patternRecognition.overallPattern =
      "Estrutura incomum/hemoparasita suspeito";

    analysis.overallAssessment.requiresHumanReview = true;
    analysis.overallAssessment.riskCategory =
      "CLASS_2_UNUSUAL_HEMOPARASITE_STRUCTURE";

    analysis.structuredReport.recommendation =
      "Confirmar por revisão microscópica profissional, múltiplos campos, gota espessa/esfregaço seriado e métodos complementares conforme protocolo.";
  }

  if (!fieldAdequacy.limitedField) return analysis;

  analysis.normalityBlocked = true;
  analysis.requiresHumanReview = true;
  analysis.finalClassification = "CLASS_1_LIMITED_FIELD";
  analysis.morphologicRiskClass = "CLASS_1_LIMITED_FIELD";

  analysis.riskLevel =
    fieldAdequacy.parasiteSignal || fieldAdequacy.unusualStructureSignal
      ? "Campo limitado com estrutura incomum/hemoparasita suspeito"
      : "Campo limitado";

  analysis.blockNormalReason = [
    ...new Set([
      ...(Array.isArray(analysis.blockNormalReason)
        ? analysis.blockNormalReason
        : []),
      "Baixa representatividade celular",
      "Campo insuficiente para afirmar normalidade global",
    ]),
  ];

  analysis.findings = {
    ...(analysis.findings || {}),
    immatureCells: false,
    blastSuspicion: false,
  };

  analysis.morphologyAnalysis = {
    ...(analysis.morphologyAnalysis || {}),
    overview:
      "Campo microscópico limitado para conclusão morfológica global. A baixa representatividade celular impede afirmar morfologia preservada, estado hematológico normal ou padrão populacional sustentado.",
    erythrocyteReview:
      "Hemácias visíveis no campo, porém a imagem isolada não permite afirmar normocitose, normocromia ou preservação eritrocitária global.",
    leukocyteReview:
      "Poucos leucócitos maduros visíveis. Não há evidência inequívoca de blastos ou células imaturas críticas neste campo analisado.",
    plateletReview:
      "Plaquetas podem ser visualizadas no campo, porém a imagem isolada não permite afirmar número adequado, preservação global ou ausência de alteração plaquetária.",
    biologicalInterpretation:
      fieldAdequacy.parasiteSignal || fieldAdequacy.unusualStructureSignal
        ? "A baixa representatividade celular limita a interpretação e a presença de estrutura incomum exige exclusão de hemoparasita ou artefato por revisão microscópica profissional."
        : "A baixa representatividade celular limita a interpretação. O campo analisado não demonstra elementos críticos inequívocos, mas também não permite conclusão global sobre normalidade hematológica.",
    differentialDiagnosis:
      fieldAdequacy.parasiteSignal || fieldAdequacy.unusualStructureSignal
        ? "Estrutura inespecífica possível; considerar artefato, precipitado de corante ou material extracelular. Não classificar automaticamente como hemoparasita sem critérios morfológicos fortes."
        : "",
    summary:
      fieldAdequacy.parasiteSignal || fieldAdequacy.unusualStructureSignal
        ? "Campo microscópico limitado com estrutura incomum/hemoparasita suspeito. Recomenda-se revisão de múltiplos campos e confirmação laboratorial."
        : "Campo microscópico limitado contendo poucos leucócitos maduros. Não há evidência inequívoca de blastos ou células imaturas críticas. Recomenda-se avaliação de múltiplos campos e correlação com hemograma.",
    absentFindings:
      "Blastos inequívocos, bastonetes de Auer e células imaturas críticas não evidenciados neste campo; a baixa representatividade não permite exclusão global.",
  };

  analysis.patternRecognition = {
    ...(analysis.patternRecognition || {}),
    erythrocytePattern: "Avaliação limitada",
    leukocytePattern: "Baixa representatividade leucocitária",
    plateletPattern: "Avaliação limitada",
    artifactPattern:
      fieldAdequacy.parasiteSignal || fieldAdequacy.unusualStructureSignal
        ? "Artefato permanece no diferencial da estrutura incomum"
        : analysis.patternRecognition?.artifactPattern || "",
    overallPattern:
      fieldAdequacy.parasiteSignal || fieldAdequacy.unusualStructureSignal
        ? "Campo limitado com estrutura incomum/hemoparasita suspeito"
        : "Campo limitado para conclusão populacional",
  };

  analysis.whatAISees = {
    ...(analysis.whatAISees || {}),
    globalField: "Campo microscópico limitado para avaliação global.",
    cellularity:
      "Baixa representatividade leucocitária para análise populacional confiável.",
    erythrocytes:
      "Hemácias visíveis, sem base para afirmar padrão eritrocitário global.",
    leukocytes:
      "Poucos leucócitos maduros visíveis; sem blastos inequívocos.",
    platelets:
      "Plaquetas visíveis, porém com avaliação quantitativa limitada.",
    dominantFinding:
      fieldAdequacy.parasiteSignal || fieldAdequacy.unusualStructureSignal
        ? "Estrutura incomum/hemoparasita suspeito em campo limitado."
        : "Baixa representatividade celular.",
    unusualStructures:
      fieldAdequacy.parasiteSignal || fieldAdequacy.unusualStructureSignal
        ? "Estrutura incomum/hemoparasitária suspeita requer validação específica."
        : analysis.whatAISees?.unusualStructures || "",
    negativeFindings:
      "Blastos inequívocos e bastonetes de Auer não evidenciados neste campo.",
    imageLimitations:
      "Campo único/limitado; não permite conclusão hematológica global.",
    freeNarrative:
      fieldAdequacy.parasiteSignal || fieldAdequacy.unusualStructureSignal
        ? "Campo microscópico limitado com estrutura incomum que exige exclusão de hemoparasita ou artefato. Não há blastos inequívocos neste campo. Recomenda-se avaliação de múltiplos campos, hemograma completo e revisão microscópica profissional."
        : "Campo microscópico limitado. A imagem permite triagem morfológica inicial, mas não permite afirmar morfologia preservada, estado hematológico normal ou padrão populacional sustentado.",
  };

  analysis.interpretiveSynthesis =
    fieldAdequacy.parasiteSignal || fieldAdequacy.unusualStructureSignal
      ? "A imagem mostra campo limitado com estrutura incomum/hemoparasita suspeito. A interpretação não permite diagnóstico definitivo e exige confirmação por revisão microscópica profissional e métodos complementares."
      : "A baixa representatividade celular limita a interpretação. O campo analisado não demonstra blastos inequívocos ou células imaturas críticas, porém não permite conclusão global sobre normalidade hematológica.";

  analysis.clinicalMeaning =
    fieldAdequacy.parasiteSignal || fieldAdequacy.unusualStructureSignal
      ? "Achado suspeito para hemoparasita ou artefato. A imagem isolada não permite identificação definitiva, espécie, parasitemia ou gravidade. Requer correlação clínico-laboratorial."
      : "Campo limitado. A imagem isolada não permite afirmar estado hematológico normal ou morfologia preservada global. Recomenda-se correlação com hemograma completo, dados clínicos e revisão microscópica profissional.";

  analysis.hematologicReasoning = {
    whatISee:
      fieldAdequacy.parasiteSignal || fieldAdequacy.unusualStructureSignal
        ? "Campo microscópico limitado com estrutura incomum/hemoparasitária suspeita e poucos leucócitos maduros visíveis."
        : "Campo microscópico com poucos leucócitos maduros visíveis e fundo eritrocitário predominante.",
    whatItResembles:
      fieldAdequacy.parasiteSignal || fieldAdequacy.unusualStructureSignal
        ? "Estrutura incomum que pode corresponder a hemoparasita extracelular/intraeritrocitário ou artefato."
        : "Campo limitado para avaliação populacional. Não há base suficiente para afirmar padrão normal, reacional ou clonal sustentado.",
    whatICannotConfirm:
      "Não é possível confirmar normalidade global, espécie parasitária, parasitemia, clonalidade, malignidade ou diagnóstico definitivo pela imagem isolada.",
    finalInterpretation:
      fieldAdequacy.parasiteSignal || fieldAdequacy.unusualStructureSignal
        ? "Campo limitado com estrutura incomum/hemoparasita suspeito; requer confirmação laboratorial e revisão microscópica profissional."
        : "Campo microscópico limitado contendo poucos leucócitos maduros. Não há evidência inequívoca de blastos ou células imaturas críticas.",
  };

  analysis.overallAssessment = {
    ...(analysis.overallAssessment || {}),
    requiresHumanReview: true,
    riskCategory:
      fieldAdequacy.parasiteSignal || fieldAdequacy.unusualStructureSignal
        ? "CLASS_2_UNUSUAL_HEMOPARASITE_STRUCTURE"
        : "CLASS_1_LIMITED_FIELD",
    mainImpression:
      fieldAdequacy.parasiteSignal || fieldAdequacy.unusualStructureSignal
        ? "Campo microscópico limitado com estrutura incomum/hemoparasita suspeito. Recomenda-se avaliação de múltiplos campos, confirmação laboratorial e revisão microscópica profissional."
        : "Campo microscópico limitado contendo poucos leucócitos maduros. Não há evidência inequívoca de blastos ou células imaturas críticas. Recomenda-se avaliação de múltiplos campos e correlação com hemograma.",
  };

  analysis.structuredReport = {
    ...(analysis.structuredReport || {}),
    conclusion:
      fieldAdequacy.parasiteSignal || fieldAdequacy.unusualStructureSignal
        ? "Campo microscópico limitado com estrutura incomum/hemoparasita suspeito."
        : "Campo microscópico limitado contendo poucos leucócitos maduros. Não há evidência inequívoca de blastos ou células imaturas críticas.",
    hematologicMeaning:
      fieldAdequacy.parasiteSignal || fieldAdequacy.unusualStructureSignal
        ? "A imagem isolada não permite identificação definitiva da estrutura, espécie parasitária ou relevância clínica."
        : "A imagem isolada não permite afirmar estado hematológico normal ou morfologia preservada global.",
    recommendation:
      fieldAdequacy.parasiteSignal || fieldAdequacy.unusualStructureSignal
        ? "Correlacionar com hemograma completo, gota espessa/esfregaço seriado, métodos complementares conforme protocolo e revisão microscópica profissional."
        : "Correlacionar com hemograma completo, dados clínicos e revisão microscópica profissional.",
  };

  return analysis;
}