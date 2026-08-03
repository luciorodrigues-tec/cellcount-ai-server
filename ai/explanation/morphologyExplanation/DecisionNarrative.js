function percent(value) {
  return `${Math.round(
    Number(value || 0) * 100,
  )}%`;
}

export function buildDecisionNarrative({
  rankingResult,
  confidenceResult,
  evidence,
  alternatives,
  policy,
}) {
  const winner =
    rankingResult?.winner || null;

  if (!winner) {
    return Object.freeze({
      headline:
        "Nenhuma hipótese morfológica elegível foi identificada.",
      conclusion:
        "O conjunto de evidências não atingiu os critérios mínimos para classificação morfológica.",
      rationale:
        "A análise deve permanecer inconclusiva e requer revisão humana.",
      safetyStatement:
        "Não emitir classificação celular definitiva com base neste resultado.",
    });
  }

  const runnerUp =
    rankingResult?.runnerUp || null;

  const supportingCount =
    evidence
      .supportingEvidence
      .length;

  const contradictoryCount =
    evidence
      .contradictoryEvidence
      .length;

  const missingCount =
    evidence
      .missingRequiredEvidence
      .length;

  const margin =
    rankingResult
      ?.summary
      ?.absoluteMargin || 0;

  const headline =
    `${winner.cellId} ocupa a primeira posição com confiança ${confidenceResult.level}.`;

  const conclusion =
    runnerUp
      ? `${winner.cellId} superou ${runnerUp.cellId} por margem absoluta de ${percent(margin)}.`
      : `${winner.cellId} foi a única hipótese elegível.`

  const rationaleParts = [
    `${supportingCount} evidências de suporte foram identificadas.`,
  ];

  if (contradictoryCount > 0) {
    rationaleParts.push(
      `${contradictoryCount} evidências contraditórias ou limitantes reduziram a confiança.`,
    );
  }

  if (missingCount > 0) {
    rationaleParts.push(
      `${missingCount} critérios obrigatórios permaneceram ausentes.`,
    );
  }

  if (
    rankingResult
      ?.summary
      ?.ambiguous === true
  ) {
    rationaleParts.push(
      "Os dois primeiros candidatos estão dentro do limiar de ambiguidade.",
    );
  }

  if (
    alternatives.length > 0
  ) {
    rationaleParts.push(
      `${alternatives.length} hipóteses diferenciais permanecem disponíveis para comparação.`,
    );
  }

  const safetyStatement =
    policy
      .includeClinicalSafetyLanguage
      ? "Resultado destinado a apoio educacional e à decisão; requer correlação com o contexto clínico, hemograma, demais exames e revisão profissional."
      : "";

  return Object.freeze({
    headline,
    conclusion,
    rationale:
      rationaleParts.join(" "),
    safetyStatement,
  });
}
