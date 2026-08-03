function round(value) {
  return Number(
    Number(value || 0)
      .toFixed(6),
  );
}

export function buildAlternativeExplanations(
  rankingResult,
  policy,
) {
  return Object.freeze(
    (rankingResult?.ranking || [])
      .slice(
        1,
        1 +
        policy.maxAlternativeCandidates,
      )
      .map(
        (candidate) =>
          Object.freeze({
            rank:
              candidate.rank,
            cellId:
              candidate.cellId,
            score:
              round(candidate.score),
            normalizedScore:
              round(
                candidate.normalizedScore,
              ),
            coverage:
              round(candidate.coverage),
            requiredCoverage:
              round(
                candidate.requiredCoverage,
              ),
            marginFromWinner:
              round(
                candidate.marginFromWinner,
              ),
            reason:
              candidate.marginFromWinner <= 0.03
                ? "Hipótese diferencial muito próxima do vencedor."
                : "Hipótese diferencial com menor pontuação ou cobertura.",
          }),
      ),
  );
}
