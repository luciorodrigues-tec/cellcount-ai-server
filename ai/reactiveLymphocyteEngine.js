function scoreLabel(score) {
  if (score >= 9) return "ALTAMENTE_PROVAVEL";
  if (score >= 6) return "PROVAVEL";
  if (score >= 3) return "POSSIVEL";
  return "IMPROVAVEL";
}

export function calculateReactiveLymphocyteScore({
  findings = {},
  visualEvidence = {},
} = {}) {
  let reactiveScore = 0;
  const reasoning = [];

  if (findings.reactiveLymphocytes === true) {
    reactiveScore += 2;
    reasoning.push("Linfócito reativo informado.");
  }

  if (findings.atypicalLymphocytes === true) {
    reactiveScore += 2;
    reasoning.push("Linfócito atípico informado.");
  }

  if (findings.largeMononuclearCells === true) {
    reactiveScore += 1;
    reasoning.push("Célula mononuclear grande observada.");
  }

  if (visualEvidence.cellSizeIncrease === true) {
    reactiveScore += 1;
    reasoning.push("Aumento do tamanho celular.");
  }

  if (visualEvidence.abundantBasophilicCytoplasm === true) {
    reactiveScore += 2;
    reasoning.push("Citoplasma basofílico abundante.");
  }

  if (visualEvidence.erythrocyteMolding === true) {
    reactiveScore += 3;
    reasoning.push("Moldagem às hemácias.");
  }

  if (visualEvidence.irregularCellBorders === true) {
    reactiveScore += 2;
    reasoning.push("Bordas citoplasmáticas irregulares.");
  }

  if (visualEvidence.eccentricNucleus === true) {
    reactiveScore += 1;
    reasoning.push("Núcleo excêntrico/plasmocitoide.");
  }

  if (visualEvidence.prominentNucleolus === true) {
    reactiveScore += 1;
    reasoning.push("Nucléolo evidente; exige cautela contra blasto/imunoblasto.");
  }

  reactiveScore = Math.max(0, Math.min(12, reactiveScore));

  return {
    reactiveScore,
    reactiveConfidence: scoreLabel(reactiveScore),
    supportsReactivePattern: reactiveScore >= 6,
    requiresCautionForBlastMimic:
      visualEvidence.prominentNucleolus === true ||
      findings.immunoblastoidCells === true,
    reasoning,
  };
}