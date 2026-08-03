export function buildConflictSummary({
  exclusiveFeatureResult,
  evidenceAnalysis,
  severity,
  probabilities,
  resolution,
} = {}) {
  return Object.freeze({
    headline:
      evidenceAnalysis
        .conflicts
        .length > 0
        ? `Foram identificados ${evidenceAnalysis.conflicts.length} conflitos diagnósticos com gravidade ${severity.severity}.`
        : "Nenhum conflito diagnóstico relevante foi identificado.",
    narrative:
      resolution.winnerMaintained
        ? `${exclusiveFeatureResult.primaryCell} foi mantido, com probabilidade recalibrada de ${Math.round(probabilities.winnerProbability * 100)}%.`
        : resolution.winnerChanged
          ? `${exclusiveFeatureResult.alternativeCell} foi promovido após reavaliação das evidências discriminativas.`
          : resolution.diagnosticTie
            ? "As hipóteses permaneceram em equilíbrio diagnóstico."
            : "A evidência disponível foi insuficiente para resolução segura.",
    safetyStatement:
      "A resolução representa apoio à decisão morfológica e deve ser correlacionada com o contexto clínico, hemograma, exames complementares e revisão profissional.",
  });
}
