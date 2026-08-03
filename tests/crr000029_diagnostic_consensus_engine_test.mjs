import assert from "node:assert/strict";
import test from "node:test";

import {
  createDiagnosticConsensusVote,
} from "../ai/clinicalRules/diagnosticConsensus/domain/DiagnosticConsensusVote.js";

import {
  DiagnosticConsensusEngine,
} from "../ai/clinicalRules/diagnosticConsensus/application/DiagnosticConsensusEngine.js";

import {
  DiagnosticConsensusVoteBuilder,
} from "../ai/clinicalRules/diagnosticConsensus/application/DiagnosticConsensusVoteBuilder.js";

import {
  DiagnosticConsensusOrchestrator,
} from "../ai/clinicalRules/diagnosticConsensus/application/DiagnosticConsensusOrchestrator.js";

import {
  createDiagnosticConsensusLibrary,
} from "../ai/clinicalRules/diagnosticConsensus/DiagnosticConsensusLibrary.js";

const vote = (
  id,
  hypothesisId,
  direction,
  overrides = {},
) =>
  createDiagnosticConsensusVote({
    id,
    hypothesisId,
    sourceType: "HEMATOLOGIC_REASONING",
    sourceId: id,
    direction,
    ...overrides,
  });

test("consensus vote is immutable", () => {
  const value =
    vote("V-1", "H-1", "SUPPORT");

  assert.equal(Object.isFrozen(value), true);
});

test("vote rejects unsupported source type", () => {
  assert.throws(
    () =>
      vote(
        "V-1",
        "H-1",
        "SUPPORT",
        { sourceType: "UNKNOWN" },
      ),
    /Unsupported diagnostic consensus source type/,
  );
});

test("engine reaches consensus", () => {
  const result =
    new DiagnosticConsensusEngine()
      .evaluate({
        votes: [
          vote("V-1", "H-1", "SUPPORT"),
          vote("V-2", "H-1", "SUPPORT"),
        ],
      });

  assert.equal(
    result.selectedConsensus.hypothesisId,
    "H-1",
  );
});

test("opposing votes create divergence", () => {
  const result =
    new DiagnosticConsensusEngine()
      .evaluate({
        votes: [
          vote("V-1", "H-1", "SUPPORT"),
          vote("V-2", "H-1", "OPPOSE"),
        ],
      });

  assert.equal(
    result.divergenceDetected,
    true,
  );
  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("blocking abstention blocks automation", () => {
  const result =
    new DiagnosticConsensusEngine()
      .evaluate({
        votes: [
          vote(
            "V-1",
            "H-1",
            "ABSTAIN",
            { blocking: true },
          ),
        ],
      });

  assert.equal(
    result.automationBlocked,
    true,
  );
});

test("duplicate vote ids are counted once", () => {
  const duplicate =
    vote("V-1", "H-1", "SUPPORT");

  const result =
    new DiagnosticConsensusEngine()
      .evaluate({
        votes: [
          duplicate,
          duplicate,
        ],
      });

  assert.equal(result.voteCount, 1);
});

test("higher consensus score ranks first", () => {
  const result =
    new DiagnosticConsensusEngine()
      .evaluate({
        votes: [
          vote("V-1", "H-1", "SUPPORT"),
          vote("V-2", "H-1", "SUPPORT"),
          vote("V-3", "H-2", "SUPPORT", {
            confidence: 0.7,
          }),
        ],
      });

  assert.equal(
    result.rankedConsensus[0].hypothesisId,
    "H-1",
  );
});

test("top tie requires review", () => {
  const result =
    new DiagnosticConsensusEngine()
      .evaluate({
        votes: [
          vote("V-1", "H-1", "SUPPORT"),
          vote("V-2", "H-2", "SUPPORT"),
        ],
      });

  assert.equal(result.topTie, true);
  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("vote builder adapts reasoning result", () => {
  const builder =
    new DiagnosticConsensusVoteBuilder();

  const votes =
    builder.fromReasoning({
      caseId: "CASE-1",
      rankedHypotheses: [
        {
          diseaseId: "D-1",
          supported: true,
          compositeScore: 0.8,
        },
      ],
    });

  assert.equal(votes.length, 1);
  assert.equal(
    votes[0].hypothesisId,
    "D-1",
  );
});

test("vote builder adapts classification", () => {
  const builder =
    new DiagnosticConsensusVoteBuilder();

  const votes =
    builder.fromClassification({
      selectedClassification: {
        candidateId: "C-1",
        diseaseEntityId: "D-1",
      },
    });

  assert.equal(votes.length, 1);
  assert.equal(
    votes[0].hypothesisId,
    "D-1",
  );
});

test("orchestrator combines sources", () => {
  const orchestrator =
    new DiagnosticConsensusOrchestrator();

  const result =
    orchestrator.run({
      reasoningResult: {
        caseId: "CASE-1",
        rankedHypotheses: [
          {
            diseaseId: "D-1",
            supported: true,
            compositeScore: 0.9,
          },
        ],
      },
      classificationResult: {
        selectedClassification: {
          diseaseEntityId: "D-1",
          candidateId: "C-1",
        },
      },
      evidenceScores: [
        {
          hypothesisId: "D-1",
          status: "SUPPORTED",
          normalizedScore: 0.8,
        },
      ],
    });

  assert.equal(
    result.selectedConsensus.hypothesisId,
    "D-1",
  );
});

test("library exposes engine, builder and orchestrator", () => {
  const library =
    createDiagnosticConsensusLibrary();

  assert.ok(library.engine);
  assert.ok(library.voteBuilder);
  assert.ok(library.orchestrator);
});

test("safety statement avoids diagnostic finality", () => {
  const result =
    new DiagnosticConsensusEngine()
      .evaluate({
        votes: [
          vote("V-1", "H-1", "SUPPORT"),
        ],
      });

  assert.match(
    result.explanation.safetyStatement,
    /does not establish a definitive diagnosis/i,
  );
});
