function clamp01(value) {
  const n = Number(value);
  return Number.isFinite(n)
    ? Math.max(0, Math.min(1, n))
    : 0;
}

export function checkFinalDiagnosisConsistency(
  aggregate,
) {
  const target = aggregate.primaryCell;
  const votes = [];

  if (aggregate.winner?.cellId) {
    votes.push({
      module: "RANKING",
      cell: aggregate.winner.cellId,
    });
  }

  for (const result of aggregate.conflicts) {
    const cell =
      result?.resolution?.finalCell ||
      (
        result?.resolution?.winnerMaintained
          ? result.primaryCell
          : null
      );

    if (cell) {
      votes.push({
        module: "CONFLICT",
        cell,
      });
    }
  }

  for (const result of aggregate.recommendations) {
    const cell =
      result?.summary
        ?.primaryRecommendation
        ?.cell ||
      result?.recommendations?.[0]?.cell;

    if (cell) {
      votes.push({
        module: "RECOMMENDATION",
        cell,
      });
    }
  }

  const agreeing =
    votes.filter(
      (item) => item.cell === target,
    ).length;

  const agreementIndex =
    votes.length
      ? agreeing / votes.length
      : target
        ? 1
        : 0;

  const conflictIndex =
    aggregate.conflicts.length
      ? aggregate.conflicts.reduce(
          (sum, item) =>
            sum +
            Number(item?.severity?.score || 0),
          0,
        ) / aggregate.conflicts.length
      : 0;

  const overallConsistency =
    clamp01(
      agreementIndex * 0.75 +
      (1 - conflictIndex) * 0.25,
    );

  return Object.freeze({
    targetCell: target,
    votes:
      Object.freeze(votes),
    agreementIndex:
      Number(agreementIndex.toFixed(6)),
    conflictIndex:
      Number(conflictIndex.toFixed(6)),
    overallConsistency:
      Number(overallConsistency.toFixed(6)),
    stable:
      overallConsistency >= 0.60,
    disagreements:
      Object.freeze(
        votes.filter(
          (item) => item.cell !== target,
        ),
      ),
  });
}
