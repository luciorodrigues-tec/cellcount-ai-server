import {
  createDiagnosticConsensusVote,
} from "../domain/DiagnosticConsensusVote.js";

export const DIAGNOSTIC_CONSENSUS_VOTE_BUILDER_VERSION =
  "CRR-000029-v1.0.0";

let sequence = 0;

function nextId(prefix) {
  sequence += 1;
  return `${prefix}-${sequence}`;
}

export class DiagnosticConsensusVoteBuilder {
  fromReasoning(reasoningResult) {
    return Object.freeze(
      (reasoningResult?.rankedHypotheses || []).map(
        (item) =>
          createDiagnosticConsensusVote({
            id: nextId("REASONING"),
            hypothesisId: item.diseaseId,
            sourceType: "HEMATOLOGIC_REASONING",
            sourceId:
              reasoningResult.caseId ||
              "reasoning",
            direction:
              item.abstained
                ? "ABSTAIN"
                : item.supported
                  ? "SUPPORT"
                  : "OPPOSE",
            confidence:
              Math.max(
                0,
                Math.min(
                  1,
                  Number(item.compositeScore || 0),
                ),
              ),
            weight: 1,
            blocking:
              item.abstained === true,
            rationale:
              `Composite reasoning score ${Number(item.compositeScore || 0).toFixed(4)}.`,
          }),
      ),
    );
  }

  fromClassification(classificationResult) {
    const selected =
      classificationResult?.selectedClassification;

    if (!selected) {
      return Object.freeze([]);
    }

    const hypothesisId =
      selected.diseaseEntityId ||
      selected.diseaseId ||
      selected.candidateId;

    if (!hypothesisId) {
      return Object.freeze([]);
    }

    return Object.freeze([
      createDiagnosticConsensusVote({
        id: nextId("CLASSIFICATION"),
        hypothesisId,
        sourceType: "DIAGNOSTIC_CLASSIFICATION",
        sourceId:
          selected.candidateId ||
          classificationResult.classificationId ||
          "classification",
        direction: "SUPPORT",
        confidence: 1,
        weight: 1,
        blocking: false,
        rationale:
          "Selected by diagnostic classification engine.",
      }),
    ]);
  }

  fromEvidenceScores(evidenceScores = []) {
    return Object.freeze(
      (Array.isArray(evidenceScores)
        ? evidenceScores
        : []
      ).map((item) =>
        createDiagnosticConsensusVote({
          id: nextId("EVIDENCE"),
          hypothesisId: item.hypothesisId,
          sourceType: "EVIDENCE_SCORING",
          sourceId:
            item.hypothesisId,
          direction:
            item.status === "ABSTAINED"
              ? "ABSTAIN"
              : Number(item.normalizedScore || 0) >= 0
                ? "SUPPORT"
                : "OPPOSE",
          confidence:
            Math.max(
              0,
              Math.min(
                1,
                Math.abs(
                  Number(item.normalizedScore || 0),
                ),
              ),
            ),
          weight: 1,
          blocking:
            item.status === "ABSTAINED",
          rationale:
            `Evidence status ${item.status || "UNKNOWN"}.`,
        }),
      ),
    );
  }
}
