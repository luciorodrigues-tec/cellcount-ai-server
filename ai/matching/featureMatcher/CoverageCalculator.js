function ratio(matched, total) {
  if (!total) {
    return 1;
  }

  return matched / total;
}

export function calculateCoverage({
  requiredMatched = 0,
  requiredTotal = 0,
  supportiveMatched = 0,
  supportiveTotal = 0,
  negativeMatched = 0,
  negativeTotal = 0,
  exclusionMatched = 0,
  exclusionTotal = 0,
} = {}) {
  const positiveMatched =
    requiredMatched +
    supportiveMatched;

  const positiveTotal =
    requiredTotal +
    supportiveTotal;

  const requiredCoverage =
    ratio(
      requiredMatched,
      requiredTotal,
    );

  const supportiveCoverage =
    ratio(
      supportiveMatched,
      supportiveTotal,
    );

  const negativeCoverage =
    ratio(
      negativeMatched,
      negativeTotal,
    );

  const exclusionCoverage =
    ratio(
      exclusionMatched,
      exclusionTotal,
    );

  const overallCoverage =
    ratio(
      positiveMatched,
      positiveTotal,
    );

  return Object.freeze({
    requiredCoverage,
    supportiveCoverage,
    negativeCoverage,
    exclusionCoverage,
    overallCoverage,
  });
}
