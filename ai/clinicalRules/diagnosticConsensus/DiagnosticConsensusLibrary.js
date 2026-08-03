import {
  DiagnosticConsensusEngine,
} from "./application/DiagnosticConsensusEngine.js";

import {
  DiagnosticConsensusVoteBuilder,
} from "./application/DiagnosticConsensusVoteBuilder.js";

import {
  DiagnosticConsensusOrchestrator,
} from "./application/DiagnosticConsensusOrchestrator.js";

export function createDiagnosticConsensusLibrary({
  policy = {},
} = {}) {
  const engine =
    new DiagnosticConsensusEngine({
      policy,
    });

  const voteBuilder =
    new DiagnosticConsensusVoteBuilder();

  return Object.freeze({
    engine,
    voteBuilder,
    orchestrator:
      new DiagnosticConsensusOrchestrator({
        engine,
        voteBuilder,
      }),
  });
}
