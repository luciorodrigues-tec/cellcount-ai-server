export function buildFinalDiagnosisExecutiveSummary({
  aggregate,
  consistency,
  confidenceFusion,
} = {}) {
  const primary =
    aggregate.primaryCell ||
    "hipótese não resolvida";

  const alternatives =
    aggregate.alternatives
      .map((item) => item.cell)
      .filter(Boolean);

  const confidencePercent =
    Math.round(
      confidenceFusion.overallConfidence *
      100,
    );

  const consistencyPercent =
    Math.round(
      consistency.overallConsistency *
      100,
    );

  const headline =
    `Os achados morfológicos favorecem ${primary} como hipótese predominante.`;

  const differentialStatement =
    alternatives.length
      ? `Permanecem como diferenciais: ${alternatives.join(", ")}.`
      : "Não foram mantidas hipóteses alternativas elegíveis.";

  const confidenceStatement =
    `A confiança global foi estimada em ${confidencePercent}%, com consistência interna de ${consistencyPercent}%.`;

  const conflictStatement =
    consistency.conflictIndex > 0.5
      ? "Conflitos morfológicos relevantes reduzem a estabilidade da conclusão."
      : consistency.conflictIndex > 0
        ? "Foram observados conflitos morfológicos de impacto limitado."
        : "Não foram identificados conflitos morfológicos relevantes.";

  const correlation =
    aggregate.recommendations
      .flatMap(
        (item) =>
          item?.summary
            ?.recommendedCorrelation || [],
      );

  return Object.freeze({
    headline,
    differentialStatement,
    confidenceStatement,
    conflictStatement,
    recommendedCorrelation:
      Object.freeze(correlation),
    fullText:
      [
        headline,
        differentialStatement,
        confidenceStatement,
        conflictStatement,
        "Recomenda-se correlação com o contexto clínico, hemograma, exames complementares e revisão profissional.",
      ].join(" "),
  });
}
