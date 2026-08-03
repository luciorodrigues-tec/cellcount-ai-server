function clamp01(value) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(1, number),
  );
}

function round(value) {
  return Number(
    Number(value || 0)
      .toFixed(6),
  );
}

export function calculateRankingSupport(
  pair,
) {
  const primary =
    clamp01(
      pair
        ?.primaryNormalizedScore || 0,
    );

  const alternative =
    clamp01(
      pair
        ?.alternativeNormalizedScore || 0,
    );

  const margin =
    clamp01(
      pair
        ?.marginFromWinner || 0,
    );

  const closeness =
    1 - margin;

  const score =
    (
      alternative * 0.60
    ) +
    (
      primary * 0.20
    ) +
    (
      closeness * 0.20
    );

  return Object.freeze({
    score:
      round(
        clamp01(score),
      ),
    primary,
    alternative,
    margin,
    closeness:
      round(closeness),
  });
}
