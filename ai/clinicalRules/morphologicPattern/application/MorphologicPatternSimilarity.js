export const MORPHOLOGIC_PATTERN_SIMILARITY_VERSION =
  "CRR-000026-v1.0.0";

function union(valuesA, valuesB) {
  return new Set([
    ...valuesA,
    ...valuesB,
  ]);
}

function intersection(valuesA, valuesB) {
  const right = new Set(valuesB);
  return valuesA.filter(
    (value) => right.has(value),
  );
}

export class MorphologicPatternSimilarity {
  compare(left, right) {
    const leftFeatures = [
      ...left.requiredFeatureIds,
      ...left.supportiveFeatureIds,
    ];

    const rightFeatures = [
      ...right.requiredFeatureIds,
      ...right.supportiveFeatureIds,
    ];

    const shared =
      intersection(leftFeatures, rightFeatures);

    const all =
      union(leftFeatures, rightFeatures);

    const score =
      all.size > 0
        ? shared.length / all.size
        : 0;

    return Object.freeze({
      similarityVersion:
        MORPHOLOGIC_PATTERN_SIMILARITY_VERSION,
      leftPatternId: left.id,
      rightPatternId: right.id,
      similarityScore:
        Number(score.toFixed(8)),
      sharedFeatureIds:
        Object.freeze(shared),
      leftOnlyFeatureIds:
        Object.freeze(
          leftFeatures.filter(
            (featureId) =>
              !rightFeatures.includes(featureId),
          ),
        ),
      rightOnlyFeatureIds:
        Object.freeze(
          rightFeatures.filter(
            (featureId) =>
              !leftFeatures.includes(featureId),
          ),
        ),
    });
  }
}
