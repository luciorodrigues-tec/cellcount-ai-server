import {
  DiagnosticConsensusVoteBuilder,
} from "./DiagnosticConsensusVoteBuilder.js";

import {
  DiagnosticConsensusEngine,
} from "./DiagnosticConsensusEngine.js";

export const DIAGNOSTIC_CONSENSUS_ORCHESTRATOR_VERSION =
  "CRR-000029-v1.0.0";

export class DiagnosticConsensusOrchestrator {
  constructor({
    engine = new DiagnosticConsensusEngine(),
    voteBuilder =
      new DiagnosticConsensusVoteBuilder(),
  } = {}) {
    this.engine = engine;
    this.voteBuilder = voteBuilder;
  }

  run({
    reasoningResult = null,
    classificationResult = null,
    evidenceScores = [],
    additionalVotes = [],
  } = {}) {
    const votes = [
      ...this.voteBuilder.fromReasoning(
        reasoningResult,
      ),
      ...this.voteBuilder.fromClassification(
        classificationResult,
      ),
      ...this.voteBuilder.fromEvidenceScores(
        evidenceScores,
      ),
      ...(Array.isArray(additionalVotes)
        ? additionalVotes
        : []),
    ];

    return this.engine.evaluate({
      votes,
    });
  }
}
