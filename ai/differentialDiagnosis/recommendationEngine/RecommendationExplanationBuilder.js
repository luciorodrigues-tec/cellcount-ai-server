export function buildRecommendationExplanation({
  primaryCell,
  alternativeCell,
  primaryProbability,
  alternativeProbability,
  resolution,
  evidence,
} = {}) {
  const primaryText =
    `${primaryCell} permanece como hipótese morfológica predominante, com probabilidade recalibrada de ${Math.round(primaryProbability * 100)}%.`;

  const alternativeText =
    `${alternativeCell} permanece como hipótese diferencial, com probabilidade recalibrada de ${Math.round(alternativeProbability * 100)}%.`;

  const conflictText =
    resolution?.diagnosticTie
      ? "As hipóteses permanecem próximas após a análise dos conflitos."
      : resolution?.winnerChanged
        ? "A hipótese alternativa foi promovida após ponderação das evidências discriminativas."
        : resolution?.insufficientEvidence
          ? "A cobertura de evidências foi insuficiente para resolução segura."
          : "A hipótese principal foi mantida após ponderação dos conflitos.";

  const evidenceText =
    `${evidence.primary.length} achados favorecem a hipótese principal e ${evidence.alternative.length} favorecem a alternativa.`;

  return Object.freeze({
    primaryText,
    alternativeText,
    conflictText,
    evidenceText,
    fullText:
      [
        primaryText,
        alternativeText,
        conflictText,
        evidenceText,
      ].join(" "),
  });
}
