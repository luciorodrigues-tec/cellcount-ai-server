export function normalizeConfidenceScore(
  value,
  {
    clamp = true,
  } = {},
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  if (!clamp) {
    return number;
  }

  return Math.max(
    0,
    Math.min(1, number),
  );
}
