export function compareCandidates(
  first,
  second,
) {
  const normalizedDifference =
    Number(
      second.normalizedScore || 0,
    ) -
    Number(
      first.normalizedScore || 0,
    );

  if (normalizedDifference !== 0) {
    return normalizedDifference;
  }

  const coverageDifference =
    Number(second.coverage || 0) -
    Number(first.coverage || 0);

  if (coverageDifference !== 0) {
    return coverageDifference;
  }

  const scoreDifference =
    Number(second.score || 0) -
    Number(first.score || 0);

  if (scoreDifference !== 0) {
    return scoreDifference;
  }

  return String(first.cellId)
    .localeCompare(
      String(second.cellId),
    );
}
