// ============================================================================
// LYMPHOID PATTERN ENGINE
// CELLCOUNT ENTERPRISE — REACTIVE vs INDETERMINATE vs MONOMORPHIC
// ============================================================================

function classifyLymphoidPattern({
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

  const hasPlasmacytoidSignal =
    findings.plasmablasts === true ||
    findings.plasmocytes === true ||
    findings.plasmacytoidCells === true ||
    findings.monomorphicPopulation === true;

  const hasBlastSignal =
    findings.blastSuspicion === true ||
    findings.immatureCells === true;

  const populationAdequate =
    fieldAdequacy.adequateForPopulationAssessment === true;

  if (!populationAdequate) {
    reasoning.push(
      "Campo limitado: não permite concluir população linfoide monomórfica sustentada."
    );
  }

  if (hasReactiveSignal) {
    reasoning.push("Há sinal morfológico reacional/linfoide atípico.");
  }

  if (hasPlasmacytoidSignal) {
    reasoning.push(
      "Há sinal monomórfico/plasmocitoide/plasmoblástico que impede classificação como morfologia preservada."
    );
  }

  if (hasBlastSignal) {
    reasoning.push("Há sinal de imaturidade/blasto informado.");
  }

  if (
    populationAdequate &&
    findings.monomorphicPopulation === true &&
    (
      findings.plasmablasts === true ||
      findings.plasmocytes === true ||
      findings.plasmacytoidCells === true ||
      hasBlastSignal
    )
  ) {
    return {
      lymphoidPattern: "LYMPHOID_MONOMORPHIC",
      riskCeiling: "CLASS_5_HIGH_NEOPLASTIC_SUSPICION",
      allowHighSuspicion: true,
      forceDowngrade: false,
      reasoning,
      ruleVersion: "LYMPHOID_PATTERN_ENGINE_V2",
    };
  }

  if (hasPlasmacytoidSignal) {
    return {
      lymphoidPattern: "ATYPICAL_MONOMORPHIC_OR_PLASMACYTOID_POPULATION",
      riskCeiling: "CLASS_2_ATYPICAL_POPULATION",
      allowHighSuspicion: false,
      forceDowngrade: false,
      reasoning,
      ruleVersion: "LYMPHOID_PATTERN_ENGINE_V2",
    };
  }

  if (hasReactiveSignal || hasBlastSignal) {
    return {
      lymphoidPattern: "LYMPHOID_INDETERMINATE",
      riskCeiling: "CLASS_2_ATYPICAL_REACTIVE_PATTERN",
      allowHighSuspicion: false,
      forceDowngrade: true,
      reasoning,
      ruleVersion: "LYMPHOID_PATTERN_ENGINE_V2",
    };
  }

  const hasMonomorphicOrPlasmacytoidSignal =
    findings?.monomorphicPopulation === true ||
    findings?.plasmacytoidCells === true ||
    findings?.plasmocytes === true ||
    findings?.plasmablasts === true;

  if (hasMonomorphicOrPlasmacytoidSignal) {
    reasoning.push(
      "Sinal monomórfico/plasmocitoide detectado; não deve ser classificado como padrão reacional simples."
    );

    return {
      lymphoidPattern: "ATYPICAL_MONOMORPHIC_OR_PLASMACYTOID_POPULATION",
      riskCeiling: "CLASS_2_ATYPICAL_POPULATION",
      allowHighSuspicion: false,
      forceDowngrade: false,
      reasoning,
      ruleVersion: "LYMPHOID_PATTERN_ENGINE_V2",
    };
  }

  return {
    lymphoidPattern: "LYMPHOID_REACTIVE_OR_UNREMARKABLE",
    riskCeiling: "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL",
    allowHighSuspicion: false,
    forceDowngrade: false,
    reasoning,
    ruleVersion: "LYMPHOID_PATTERN_ENGINE_V2",
  };
  }

  export {
    classifyLymphoidPattern,
  };

  export default classifyLymphoidPattern;