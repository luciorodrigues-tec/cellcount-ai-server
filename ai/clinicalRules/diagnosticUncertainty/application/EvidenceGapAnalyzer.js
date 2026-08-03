export const EVIDENCE_GAP_ANALYZER_VERSION =
  "CRR-000031-v1.0.0";

export class EvidenceGapAnalyzer {
  analyze({
    evidenceScores = [],
    missingData = [],
  } = {}) {
    const evidence =
      Array.isArray(evidenceScores)
        ? evidenceScores
        : [];

    const missing =
      Array.isArray(missingData)
        ? missingData
        : [];

    const noEvidence =
      evidence.length === 0;

    const abstained =
      evidence.some(
        (item) =>
          item.status === "ABSTAINED",
      );

    const insufficient =
      evidence.some(
        (item) =>
          item.status ===
          "INSUFFICIENT_EVIDENCE",
      );

    const missingPenalty =
      Math.min(
        1,
        missing.length * 0.15,
      );

    const evidencePenalty =
      noEvidence
        ? 1
        : abstained
          ? 0.85
          : insufficient
            ? 0.6
            : 0;

    return Object.freeze({
      uncertaintyScore:
        Number(
          Math.max(
            evidencePenalty,
            missingPenalty,
          ).toFixed(8),
        ),
      missingCount:
        missing.length,
      noEvidence,
      abstained,
      insufficient,
      unresolvedQuestions:
        Object.freeze(
          missing.map(
            (item) =>
              String(
                item.question ||
                item.description ||
                item,
              ),
          ),
        ),
    });
  }
}
