function pickPrimaryRecommendation(
  recommendationResults = [],
) {
  const all =
    recommendationResults.flatMap(
      (result) => result?.recommendations || [],
    );

  return (
    all
      .filter((item) => item?.cell)
      .sort(
        (a, b) =>
          Number(b.priorityScore || 0) -
          Number(a.priorityScore || 0),
      )[0] || null
  );
}

function uniqueAlternatives(
  recommendationResults,
  primaryCell,
  maximumAlternatives,
) {
  const map = new Map();

  for (const result of recommendationResults || []) {
    for (const item of result?.recommendations || []) {
      if (!item?.cell || item.cell === primaryCell) {
        continue;
      }

      const current = map.get(item.cell);
      if (
        !current ||
        Number(item.priorityScore || 0) >
          Number(current.priorityScore || 0)
      ) {
        map.set(item.cell, item);
      }
    }
  }

  return [...map.values()]
    .sort(
      (a, b) =>
        Number(b.priorityScore || 0) -
        Number(a.priorityScore || 0),
    )
    .slice(0, maximumAlternatives);
}

export function aggregateFinalDiagnosisInput(
  recommendationAnalysis,
  policy,
) {
  const recommendations =
    recommendationAnalysis?.recommendations || [];

  const conflictAnalysis =
    recommendationAnalysis?.conflictAnalysis || {};

  const exclusiveResults =
    conflictAnalysis
      ?.exclusiveAnalysis
      ?.exclusiveFeatures || [];

  const evidenceResults =
    conflictAnalysis
      ?.exclusiveAnalysis
      ?.evidenceAnalysis
      ?.evidence || [];

  const similarityAnalysis =
    conflictAnalysis
      ?.exclusiveAnalysis
      ?.evidenceAnalysis
      ?.similarityAnalysis || {};

  const pairAnalysis =
    similarityAnalysis?.pairAnalysis || {};

  const explanation =
    pairAnalysis
      ?.graphAnalysis
      ?.explained
      ?.explanation || {};

  const primary =
    pickPrimaryRecommendation(
      recommendations,
    );

  const primaryCell =
    primary?.cell ||
    explanation?.winner?.cellId ||
    null;

  return Object.freeze({
    specimenType:
      recommendationAnalysis?.specimenType || null,
    primaryRecommendation:
      primary,
    primaryCell,
    alternatives:
      Object.freeze(
        uniqueAlternatives(
          recommendations,
          primaryCell,
          policy.maximumAlternatives,
        ),
      ),
    recommendations:
      Object.freeze([...recommendations]),
    conflicts:
      Object.freeze([
        ...(conflictAnalysis?.conflicts || []),
      ]),
    exclusiveFeatureResults:
      Object.freeze([...exclusiveResults]),
    evidenceResults:
      Object.freeze([...evidenceResults]),
    similarityResults:
      Object.freeze([
        ...(similarityAnalysis?.similarities || []),
      ]),
    ranking:
      explanation?.ranking || null,
    winner:
      explanation?.winner || null,
    runnerUp:
      explanation?.runnerUp || null,
    confidence:
      explanation?.confidence || null,
    explanation,
    graph:
      pairAnalysis?.graphAnalysis?.graph || null,
    pairStatistics:
      pairAnalysis?.pairs?.statistics || null,
  });
}
