export function createCandidateList({
  version,
  specimenType = null,
  eligible = [],
  rejected = [],
  statistics = {},
  thresholds = {},
} = {}) {
  return Object.freeze({
    version,
    specimenType,
    eligible:
      Object.freeze([
        ...eligible,
      ]),
    rejected:
      Object.freeze([
        ...rejected,
      ]),
    statistics:
      Object.freeze({
        ...statistics,
      }),
    thresholds:
      Object.freeze({
        ...thresholds,
      }),
  });
}
