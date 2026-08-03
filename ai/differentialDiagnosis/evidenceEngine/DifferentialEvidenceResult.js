export function createDifferentialEvidenceResult({
  pair,
  similarity,
  sharedEvidence = [],
  winnerEvidence = [],
  alternativeEvidence = [],
  missingEvidence = [],
  conflictEvidence = [],
  summary = {},
  statistics = {},
  metadata = {},
} = {}) {
  return Object.freeze({
    pair,
    pairId:
      pair?.id || null,
    primaryCell:
      pair?.primaryCell || null,
    alternativeCell:
      pair?.alternativeCell || null,
    similarity,
    sharedEvidence:
      Object.freeze([
        ...sharedEvidence,
      ]),
    winnerEvidence:
      Object.freeze([
        ...winnerEvidence,
      ]),
    alternativeEvidence:
      Object.freeze([
        ...alternativeEvidence,
      ]),
    missingEvidence:
      Object.freeze([
        ...missingEvidence,
      ]),
    conflictEvidence:
      Object.freeze([
        ...conflictEvidence,
      ]),
    summary:
      Object.freeze({
        ...summary,
      }),
    statistics:
      Object.freeze({
        ...statistics,
      }),
    metadata:
      Object.freeze({
        ...(metadata &&
        typeof metadata === "object"
          ? metadata
          : {}),
      }),
  });
}
