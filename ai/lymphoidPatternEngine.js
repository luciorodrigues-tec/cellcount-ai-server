// ============================================================================
// LYMPHOID PATTERN ENGINE
// CELLCOUNT ENTERPRISE — REACTIVE vs INDETERMINATE vs MONOMORPHIC
// ============================================================================

export function classifyLymphoidPattern({
  findings = {},
  visualEvidence = {},
  fieldAdequacy = {},
} = {}) {
  const reasoning = [];

  const hasReactiveSignal =
    findings.reactiveLymphocytes === true ||
    findings.atypicalLymphocytes === true ||
    findings.downeyLikeCells === true ||
    findings.monocytoidAtypicalLymphocytes === true ||
    findings.lymphocytoidAtypicalLymphocytes === true ||
    visualEvidence.erythrocyteMolding === true ||
    visualEvidence.irregularCellBorders === true ||
    visualEvidence.abundantBasophilicCytoplasm === true;

  const hasPlasmablasticSignal =
    findings.plasmablasts === true ||
    findings.plasmocytes === true ||
    findings.plasmacytoidCells === true;

  const hasBlastSignal =
    findings.blastSuspicion === true ||
    findings.immatureCells === true;

  const populationAdequate =
    fieldAdequacy.adequateForPopulationAssessment === true;

  const monomorphicConfirmed =
    populationAdequate &&
    findings.monomorphicPopulation === true &&
    (hasPlasmablasticSignal || hasBlastSignal);

  if (!populationAdequate) {
    reasoning.push(
      "Campo limitado: não permite concluir população linfoide monomórfica sustentada."
    );
  }

  if (hasReactiveSignal) {
    reasoning.push(
      "Há sinal morfológico reacional/linfoide atípico."
    );
  }

  if (hasPlasmablasticSignal) {
    reasoning.push(
      "Há sinal plasmocitoide/plasmoblástico informado, exigindo validação por múltiplos campos."
    );
  }

  if (hasBlastSignal) {
    reasoning.push(
      "Há sinal de imaturidade/blasto informado."
    );
  }

  if (monomorphicConfirmed) {
    return {
      lymphoidPattern: "LYMPHOID_MONOMORPHIC",
      riskCeiling: "CLASS_5_HIGH_NEOPLASTIC_SUSPICION",
      allowHighSuspicion: true,
      forceDowngrade: false,
      reasoning,
      ruleVersion: "LYMPHOID_PATTERN_ENGINE_V1",
    };
  }

  if (hasReactiveSignal || hasPlasmablasticSignal || hasBlastSignal) {
    return {
      lymphoidPattern: "LYMPHOID_INDETERMINATE",
      riskCeiling: "CLASS_2_ATYPICAL_REACTIVE_PATTERN",
      allowHighSuspicion: false,
      forceDowngrade: true,
      reasoning,
      ruleVersion: "LYMPHOID_PATTERN_ENGINE_V1",
    };
  }

  return {
    lymphoidPattern: "LYMPHOID_REACTIVE_OR_UNREMARKABLE",
    riskCeiling: "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL",
    allowHighSuspicion: false,
    forceDowngrade: false,
    reasoning,
    ruleVersion: "LYMPHOID_PATTERN_ENGINE_V1",
  };
}

export default classifyLymphoidPattern;