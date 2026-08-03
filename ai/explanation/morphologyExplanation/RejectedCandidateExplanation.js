export function buildRejectedCandidateExplanations(
  rankingResult,
  policy,
) {
  if (
    policy
      .includeRejectedCandidates !== true
  ) {
    return Object.freeze([]);
  }

  return Object.freeze(
    (rankingResult?.rejected || [])
      .map(
        (candidate) =>
          Object.freeze({
            cellId:
              candidate.cellId,
            score:
              candidate.score,
            normalizedScore:
              candidate.normalizedScore,
            coverage:
              candidate.coverage,
            rejectedReasons:
              Object.freeze([
                ...(
                  candidate
                    .rejectedReasons || []
                ),
              ]),
            statement:
              `${candidate.cellId} foi rejeitada pelos critérios: ${(candidate.rejectedReasons || []).join(", ") || "sem elegibilidade suficiente"}.`,
          }),
      ),
  );
}
