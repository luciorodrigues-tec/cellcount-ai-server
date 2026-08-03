export const BAYESIAN_MATH_VERSION =
  "CRR-000008-v1.0.0";

export function probabilityToOdds(probability) {
  const value = Number(probability);

  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    value >= 1
  ) {
    throw new TypeError(
      "Probability must be greater than 0 and less than 1.",
    );
  }

  return value / (1 - value);
}

export function oddsToProbability(odds) {
  const value = Number(odds);

  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(
      "Odds must be a non-negative finite number.",
    );
  }

  if (value === Number.POSITIVE_INFINITY) {
    return 1;
  }

  return value / (1 + value);
}

export function applyLikelihoodRatio({
  priorProbability,
  likelihoodRatio,
} = {}) {
  const priorOdds =
    probabilityToOdds(priorProbability);
  const lr = Number(likelihoodRatio);

  if (!Number.isFinite(lr) || lr <= 0) {
    throw new TypeError(
      "Likelihood ratio must be greater than zero.",
    );
  }

  const posteriorOdds = priorOdds * lr;

  return Object.freeze({
    priorProbability,
    priorOdds,
    likelihoodRatio: lr,
    posteriorOdds,
    posteriorProbability:
      oddsToProbability(posteriorOdds),
  });
}

export function confidenceAdjustedLikelihoodRatio({
  likelihoodRatio,
  confidence = 1,
} = {}) {
  const lr = Number(likelihoodRatio);
  const c = Number(confidence);

  if (!Number.isFinite(lr) || lr <= 0) {
    throw new TypeError(
      "Likelihood ratio must be greater than zero.",
    );
  }

  if (
    !Number.isFinite(c) ||
    c < 0 ||
    c > 1
  ) {
    throw new TypeError(
      "Confidence must be between 0 and 1.",
    );
  }

  // Shrinks uncertain evidence toward LR=1 in log space.
  return Math.exp(Math.log(lr) * c);
}
