function uniqueCandidates(
  candidates = [],
) {
  const seen = new Set();
  const result = [];

  for (const candidate of candidates) {
    const cellId =
      candidate?.cellId;

    if (
      !cellId ||
      seen.has(cellId)
    ) {
      continue;
    }

    seen.add(cellId);
    result.push(candidate);
  }

  return result;
}

export function collectDifferentialAlternatives(
  explanation,
  policy,
) {
  const candidates = [];

  if (
    policy.includeRunnerUp === true &&
    explanation?.runnerUp
  ) {
    candidates.push({
      ...explanation.runnerUp,
      source:
        "RUNNER_UP",
    });
  }

  if (
    policy
      .includeRankedAlternatives ===
      true
  ) {
    for (
      const alternative
      of explanation
        ?.alternatives || []
    ) {
      candidates.push({
        ...alternative,
        source:
          "RANKED_ALTERNATIVE",
      });
    }
  }

  if (
    policy
      .includeRejectedCandidates ===
      true
  ) {
    for (
      const rejected
      of explanation
        ?.rejectedCandidates || []
    ) {
      candidates.push({
        ...rejected,
        source:
          "REJECTED_CANDIDATE",
      });
    }
  }

  return uniqueCandidates(
    candidates,
  ).slice(
    0,
    policy.maxAlternatives,
  );
}
