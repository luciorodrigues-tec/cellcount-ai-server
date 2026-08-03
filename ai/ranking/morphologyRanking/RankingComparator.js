function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function requiredCoverage(candidate) {
  return number(
    candidate.sourceScore
      ?.summary
      ?.requiredMatched,
  ) /
  Math.max(
    1,
    number(
      candidate.sourceScore
        ?.summary
        ?.requiredTotal,
    ),
  );
}

export function compareRankedCandidates(
  first,
  second,
) {
  const normalizedDifference =
    number(
      second.normalizedScore,
    ) -
    number(
      first.normalizedScore,
    );

  if (normalizedDifference !== 0) {
    return normalizedDifference;
  }

  const coverageDifference =
    number(second.coverage) -
    number(first.coverage);

  if (coverageDifference !== 0) {
    return coverageDifference;
  }

  const scoreDifference =
    number(second.score) -
    number(first.score);

  if (scoreDifference !== 0) {
    return scoreDifference;
  }

  const requiredDifference =
    requiredCoverage(second) -
    requiredCoverage(first);

  if (requiredDifference !== 0) {
    return requiredDifference;
  }

  return String(first.cellId)
    .localeCompare(
      String(second.cellId),
    );
}
