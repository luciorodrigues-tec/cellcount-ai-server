function validateConsistency(result = {}) {
  result.findings = result.findings || {};
  result.overallAssessment = result.overallAssessment || {};
  result.criticalFlags = Array.isArray(result.criticalFlags)
    ? result.criticalFlags
    : [];
  result.blockNormalReason = Array.isArray(result.blockNormalReason)
    ? result.blockNormalReason
    : [];

  const f = result.findings;

  const hasAtypia =
    Boolean(f.largeMononuclearCells) ||
    Boolean(f.plasmacytoidCells) ||
    Boolean(f.plasmocytes) ||
    Boolean(f.plasmablasts) ||
    Boolean(f.atypicalLymphocytes) ||
    Boolean(f.reactiveLymphocytes) ||
    Boolean(f.downeyLikeCells) ||
    Boolean(f.mononucleosisSuspicion) ||
    Boolean(f.monomorphicPopulation) ||
    Boolean(f.immatureCells) ||
    Boolean(f.blastSuspicion);

  if (!hasAtypia) {
    return result;
  }

  result.normalityBlocked = true;
  result.overallAssessment.requiresHumanReview = true;

  if (f.largeMononuclearCells) {
    result.blockNormalReason.push("Células mononucleares grandes");
  }

  if (f.reactiveLymphocytes) {
    result.blockNormalReason.push("Linfócitos reativos");
  }

  if (f.atypicalLymphocytes) {
    result.blockNormalReason.push("Linfócitos atípicos");
  }

  if (f.downeyLikeCells || f.mononucleosisSuspicion) {
    result.blockNormalReason.push("Padrão linfoide reacional/Downey");
  }

  if (f.plasmacytoidCells) {
    result.blockNormalReason.push("Células plasmocitoides");
  }

  if (f.plasmocytes) {
    result.blockNormalReason.push("Plasmócitos visíveis");
  }

  if (f.plasmablasts) {
    result.blockNormalReason.push("Plasmoblastos suspeitos");
  }

  if (f.monomorphicPopulation) {
    result.blockNormalReason.push("População monomórfica");
  }

  if (f.immatureCells) {
    result.blockNormalReason.push("Células imaturas");
  }

  if (f.blastSuspicion) {
    result.blockNormalReason.push("Suspeita blástica");
  }

  result.blockNormalReason = [...new Set(result.blockNormalReason)];

  if (
    !result.morphologicRiskClass ||
    result.morphologicRiskClass === "CLASS_0_NORMAL"
  ) {
    result.morphologicRiskClass = "CLASS_2_ATYPICAL_POPULATION";
  }

  result.overallAssessment.safetyMessage =
    "Há achados morfológicos que impedem classificação como normalidade morfológica. Recomenda-se revisão por profissional habilitado.";

  return result;
}

export default validateConsistency;