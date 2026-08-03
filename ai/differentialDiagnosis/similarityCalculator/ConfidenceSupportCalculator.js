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

export function calculateConfidenceSupport(
  confidenceResult,
) {
  if (
    !confidenceResult ||
    confidenceResult.available === false
  ) {
    return Object.freeze({
      score: 0,
      available: false,
      level:
        confidenceResult
          ?.level ||
        "UNAVAILABLE",
    });
  }

  return Object.freeze({
    score:
      clamp01(
        confidenceResult.score,
      ),
    available: true,
    level:
      confidenceResult.level ||
      "UNAVAILABLE",
  });
}
