// ============================================================================
// BLAST MIMIC ENGINE
// CELLCOUNT ENTERPRISE — REACTIVE / IMMUNOBLASTOID / BLAST DIFFERENTIATION
// ============================================================================

function clamp(value, min = 0, max = 12) {
  return Math.max(min, Math.min(max, value));
}

function classifyBlastMimicRisk(score) {
  if (score >= 9) return "ALTO_RISCO_DE_MIMETISMO";
  if (score >= 6) return "RISCO_MODERADO_DE_MIMETISMO";
  if (score >= 3) return "BAIXO_RISCO_DE_MIMETISMO";
  return "SEM_MIMETISMO_RELEVANTE";
}

export function calculateBlastMimicRisk({
  findings = {},
  visualEvidence = {},
} = {}) {
  let blastMimicScore = 0;
  const reasoning = [];

  if (findings.immunoblastoidCells === true) {
    blastMimicScore += 3;
    reasoning.push("Célula imunoblastoide informada.");
  }

  if (findings.plasmablasts === true) {
    blastMimicScore += 4;
    reasoning.push("Plasmoblastos informados.");
  }

  if (findings.immatureCells === true) {
    blastMimicScore += 3;
    reasoning.push("Células imaturas informadas.");
  }

  if (findings.blastSuspicion === true) {
    blastMimicScore += 5;
    reasoning.push("Suspeita blástica informada.");
  }

  if (visualEvidence.cellSizeIncrease === true) {
    blastMimicScore += 1;
    reasoning.push("Aumento do tamanho celular.");
  }

  if (visualEvidence.prominentNucleolus === true) {
    blastMimicScore += 3;
    reasoning.push("Nucléolo evidente.");
  }

  if (visualEvidence.abundantBasophilicCytoplasm === true) {
    blastMimicScore += 1;
    reasoning.push("Citoplasma basofílico abundante.");
  }

  if (visualEvidence.eccentricNucleus === true) {
    blastMimicScore += 1;
    reasoning.push("Núcleo excêntrico/plasmocitoide.");
  }

  const favorsReactiveOverBlast =
    visualEvidence.erythrocyteMolding === true &&
    visualEvidence.irregularCellBorders === true &&
    findings.blastSuspicion !== true;

  if (favorsReactiveOverBlast) {
    reasoning.push(
      "Moldagem às hemácias e bordas irregulares favorecem padrão reacional sobre blasto verdadeiro."
    );
  }

  blastMimicScore = clamp(blastMimicScore);

  return {
    blastMimicScore,
    blastMimicRisk: classifyBlastMimicRisk(blastMimicScore),
    requiresBlastDifferentiation:
      blastMimicScore >= 6 ||
      findings.blastSuspicion === true ||
      findings.plasmablasts === true,
    favorsReactiveOverBlast,
    reasoning,
    ruleVersion: "BLAST_MIMIC_ENGINE_V1",
  };
}

export default calculateBlastMimicRisk;
