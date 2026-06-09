export function applyAntiOvercallingRules({
  findings = {},
  reactiveLymphocyteAnalysis = {},
  blastMimicAnalysis = {},
  visualEvidence = {},
} = {}) {
  const adjustedFindings = {
    ...findings,
  };

  const warnings = [];
  const adjustments = [];

  const reactiveScore =
    Number(reactiveLymphocyteAnalysis.reactiveScore || 0);

  const blastMimicScore =
    Number(blastMimicAnalysis.blastMimicScore || 0);

  const favorsReactiveMorphology =
    visualEvidence.erythrocyteMolding === true &&
    visualEvidence.irregularCellBorders === true &&
    visualEvidence.abundantBasophilicCytoplasm === true;

  const weakBlastEvidence =
    visualEvidence.prominentNucleolus !== true &&
    adjustedFindings.immatureCells !== true &&
    adjustedFindings.plasmablasts !== true;

  if (
    adjustedFindings.blastSuspicion === true &&
    reactiveScore >= 8 &&
    blastMimicScore <= 5 &&
    favorsReactiveMorphology &&
    weakBlastEvidence
  ) {
    adjustedFindings.blastSuspicion = false;
    adjustedFindings.atypicalLymphocytes = true;
    adjustedFindings.reactiveLymphocytes = true;

    adjustedFindings.atypicalLymphocyteSubtype =
      adjustedFindings.atypicalLymphocyteSubtype &&
      adjustedFindings.atypicalLymphocyteSubtype !== "none"
        ? adjustedFindings.atypicalLymphocyteSubtype
        : "REACTIVE_LYMPHOCYTE_TYPICAL";

    adjustments.push(
      "Suspeita blástica reduzida por padrão morfológico favorecendo linfócito reativo."
    );

    warnings.push(
      "Ajuste conservador aplicado: achados favorecem reatividade linfoide sobre blasto verdadeiro."
    );
  }

  return {
    adjustedFindings,
    antiOvercallingApplied: adjustments.length > 0,
    adjustments,
    warnings,
    ruleVersion: "ANTI_OVERCALLING_V1_REACTIVE_VS_BLAST",
  };
}