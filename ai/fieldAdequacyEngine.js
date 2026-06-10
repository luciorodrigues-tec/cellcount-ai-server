// ============================================================================
// CELLCOUNT ENTERPRISE
// FIELD ADEQUACY ENGINE V1
// ============================================================================

export function evaluateFieldAdequacy(analysis = {}) {
  const raw = JSON.stringify(analysis || {}).toLowerCase();

  let visibleLeukocytes = 0;

  if (raw.includes("linfócito") || raw.includes("linfocito")) {
    visibleLeukocytes += 1;
  }

  if (raw.includes("neutrófilo") || raw.includes("neutrofilo")) {
    visibleLeukocytes += 1;
  }

  if (raw.includes("monócito") || raw.includes("monocito")) {
    visibleLeukocytes += 1;
  }

  if (raw.includes("eosinófilo") || raw.includes("eosinofilo")) {
    visibleLeukocytes += 1;
  }

  if (raw.includes("basófilo") || raw.includes("basofilo")) {
    visibleLeukocytes += 1;
  }

  const singleCellConcern =
    raw.includes("célula mononuclear grande") ||
    raw.includes("celula mononuclear grande") ||
    raw.includes("single atypical") ||
    raw.includes("um linfócito atípico") ||
    raw.includes("um linfocito atipico");

  return {
    visibleLeukocytes,
    singleCellConcern,
    adequateForLeukocyteAnalysis: visibleLeukocytes >= 3,
    adequateForBlastScreening: visibleLeukocytes >= 5,
    adequateForPopulationAssessment: visibleLeukocytes >= 8,
  };
}

export function applyFieldAdequacyRules(analysis = {}) {
  const fieldAdequacy = evaluateFieldAdequacy(analysis);

  analysis.fieldAdequacy = fieldAdequacy;

  if (
    fieldAdequacy.visibleLeukocytes <= 3
  ) {
    analysis.mononucleosisSuspicion = false;
    analysis.reactiveLymphoidPattern = false;

    analysis.morphologicRiskClass =
      "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL";

    analysis.riskLevel =
      "Achado celular isolado";

    analysis.morphologyAnalysis = {
      ...(analysis.morphologyAnalysis || {}),
      leukocyteReview:
        "Observa-se célula mononuclear isolada com possível atipia/reatividade. O campo é limitado para afirmar ativação linfoide populacional.",
      summary:
        "Campo limitado com célula mononuclear isolada. Recomenda-se avaliação de múltiplos campos e correlação com hemograma.",
    };

    analysis.patternRecognition = {
      ...(analysis.patternRecognition || {}),
      leukocytePattern:
        "Achado mononuclear isolado",
      overallPattern:
        "Campo limitado para caracterização populacional",
    };
  }

  if (
    fieldAdequacy.singleCellConcern &&
    !fieldAdequacy.adequateForPopulationAssessment
  ) {
    analysis.normalityBlocked = true;

    analysis.morphologicRiskClass =
      "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL";

    analysis.requiresHumanReview = true;

    analysis.blockNormalReason = [
      ...(analysis.blockNormalReason || []),
      "Célula mononuclear isolada em campo limitado",
      "Campo insuficiente para caracterização populacional confiável",
    ];

    analysis.findings = {
      ...(analysis.findings || {}),
      largeMononuclearCells: true,
      atypicalLymphocytes: false,
      monomorphicPopulation: false,
      immatureCells: false,
      blastSuspicion: false,
    };

    analysis.morphologyAnalysis = {
      ...(analysis.morphologyAnalysis || {}),
      leukocyteReview:
        "Observa-se célula mononuclear isolada com possível atipia/reactividade. O campo é limitado para afirmar ativação linfoide populacional.",
      summary:
        "Campo limitado com célula mononuclear isolada. Recomenda-se avaliação de múltiplos campos e correlação com hemograma.",
    };

    analysis.overallAssessment = {
      ...(analysis.overallAssessment || {}),
      mainImpression:
        "Campo limitado para caracterização leucocitária conclusiva. Há célula mononuclear isolada com possível aspecto reacional, sem critérios para blastos ou população neoplásica neste campo.",
    };
  }

  return analysis;
}