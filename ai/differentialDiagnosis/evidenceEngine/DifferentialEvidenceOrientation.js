export function resolveOrientedDifferentialFeatures(
  pair,
) {
  const rule =
    pair?.rule || {};

  if (
    pair?.reverseOrientation === true
  ) {
    return Object.freeze({
      shared:
        Object.freeze([
          ...(rule.sharedFeatures || []),
        ]),
      winnerExclusive:
        Object.freeze([
          ...(rule.differentialExclusiveFeatures || []),
        ]),
      alternativeExclusive:
        Object.freeze([
          ...(rule.primaryExclusiveFeatures || []),
        ]),
      winnerExclusion:
        Object.freeze([
          ...(rule.differentialExclusionFeatures || []),
        ]),
      alternativeExclusion:
        Object.freeze([
          ...(rule.primaryExclusionFeatures || []),
        ]),
    });
  }

  return Object.freeze({
    shared:
      Object.freeze([
        ...(rule.sharedFeatures || []),
      ]),
    winnerExclusive:
      Object.freeze([
        ...(rule.primaryExclusiveFeatures || []),
      ]),
    alternativeExclusive:
      Object.freeze([
        ...(rule.differentialExclusiveFeatures || []),
      ]),
    winnerExclusion:
      Object.freeze([
        ...(rule.primaryExclusionFeatures || []),
      ]),
    alternativeExclusion:
      Object.freeze([
        ...(rule.differentialExclusionFeatures || []),
      ]),
  });
}
