import assert from "node:assert/strict";
import test from "node:test";

import {
  DiagnosticHypothesisRankingEngine,
  RankingHypothesisRepository,
  createDiagnosticHypothesisRankingLibrary,
  createRankingHypothesis,
} from "../ai/clinicalRules/index.js";

const hypothesis = (overrides = {}) =>
  createRankingHypothesis({
    id: "HYP-001",
    label: "Test hypothesis",
    competingHypothesisIds: [],
    requiredSourceTypes: [],
    ...overrides,
  });

const fusion = (
  targetId,
  status = "SUPPORTED",
  supportRatio = 1,
) => ({
  targetId,
  status,
  supportRatio,
});

const bayesian = (
  hypothesisId,
  status = "SUPPORTED",
  calibratedProbability = 0.8,
) => ({
  hypothesisId,
  status,
  calibratedProbability,
});

const differential = (
  candidateId,
  status = "SUPPORTED",
  normalizedScore = 0.7,
) => ({
  candidateId,
  status,
  normalizedScore,
});

const consensus = (
  hypothesisId,
  status = "SUPPORTED",
  supportRatio = 0.9,
) => ({
  hypothesisId,
  status,
  supportRatio,
});

test("ranking hypothesis is immutable", () => {
  const value = hypothesis();
  assert.equal(Object.isFrozen(value), true);
  assert.equal(
    Object.isFrozen(
      value.competingHypothesisIds,
    ),
    true,
  );
});

test("repository rejects duplicate hypotheses", () => {
  const repository =
    new RankingHypothesisRepository();
  repository.register(hypothesis());

  assert.throws(
    () => repository.register(hypothesis()),
    /already registered/,
  );
});

test("composite score makes complete hypothesis rankable", () => {
  const repository =
    new RankingHypothesisRepository();
  repository.register(hypothesis());

  const result =
    new DiagnosticHypothesisRankingEngine({
      hypothesisRepository: repository,
    }).evaluateHypothesis({
      hypothesisId: "HYP-001",
      fusionResults: [fusion("HYP-001")],
      bayesianResults: [
        bayesian("HYP-001"),
      ],
      differentialResults: [
        differential("HYP-001"),
      ],
      consensusResults: [
        consensus("HYP-001"),
      ],
    });

  assert.equal(result.status, "RANKABLE");
  assert.ok(result.compositeScore > 0);
});

test("missing required source penalizes hypothesis", () => {
  const repository =
    new RankingHypothesisRepository();

  repository.register(
    hypothesis({
      requiredSourceTypes: [
        "FUSION",
        "BAYESIAN",
      ],
    }),
  );

  const result =
    new DiagnosticHypothesisRankingEngine({
      hypothesisRepository: repository,
    }).evaluateHypothesis({
      hypothesisId: "HYP-001",
      fusionResults: [fusion("HYP-001")],
    });

  assert.deepEqual(
    result.missingRequiredSourceTypes,
    ["BAYESIAN"],
  );
});

test("conflict signal creates conflicted status", () => {
  const repository =
    new RankingHypothesisRepository();
  repository.register(hypothesis());

  const result =
    new DiagnosticHypothesisRankingEngine({
      hypothesisRepository: repository,
    }).evaluateHypothesis({
      hypothesisId: "HYP-001",
      consensusResults: [
        consensus(
          "HYP-001",
          "CONFLICTED",
          0.5,
        ),
      ],
    });

  assert.equal(result.status, "CONFLICTED");
  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("abstention signal creates abstained status", () => {
  const repository =
    new RankingHypothesisRepository();
  repository.register(hypothesis());

  const result =
    new DiagnosticHypothesisRankingEngine({
      hypothesisRepository: repository,
    }).evaluateHypothesis({
      hypothesisId: "HYP-001",
      bayesianResults: [
        bayesian(
          "HYP-001",
          "ABSTAINED",
          0,
        ),
      ],
    });

  assert.equal(result.status, "ABSTAINED");
});

test("exclusion signal excludes hypothesis", () => {
  const repository =
    new RankingHypothesisRepository();
  repository.register(hypothesis());

  const result =
    new DiagnosticHypothesisRankingEngine({
      hypothesisRepository: repository,
    }).evaluateHypothesis({
      hypothesisId: "HYP-001",
      differentialResults: [
        differential(
          "HYP-001",
          "EXCLUDED",
          0,
        ),
      ],
    });

  assert.equal(result.status, "EXCLUDED");
});

test("ranking orders higher composite score first", () => {
  const repository =
    new RankingHypothesisRepository();

  repository.register(
    hypothesis({ id: "HYP-001" }),
  );
  repository.register(
    hypothesis({ id: "HYP-002" }),
  );

  const result =
    new DiagnosticHypothesisRankingEngine({
      hypothesisRepository: repository,
    }).rank({
      fusionResults: [
        fusion("HYP-001", "SUPPORTED", 1),
        fusion("HYP-002", "SUPPORTED", 0.5),
      ],
    });

  assert.equal(
    result.rankedHypotheses[0]
      .hypothesisId,
    "HYP-001",
  );
});

test("positive rankable scores normalize to one", () => {
  const repository =
    new RankingHypothesisRepository();

  repository.register(
    hypothesis({ id: "HYP-001" }),
  );
  repository.register(
    hypothesis({ id: "HYP-002" }),
  );

  const result =
    new DiagnosticHypothesisRankingEngine({
      hypothesisRepository: repository,
    }).rank({
      fusionResults: [
        fusion("HYP-001", "SUPPORTED", 1),
        fusion("HYP-002", "SUPPORTED", 1),
      ],
    });

  const total =
    result.rankedHypotheses.reduce(
      (sum, item) =>
        sum + item.normalizedScore,
      0,
    );

  assert.equal(
    Number(total.toFixed(8)),
    1,
  );
});

test("competing rankable hypotheses require review", () => {
  const repository =
    new RankingHypothesisRepository();

  repository.register(
    hypothesis({
      id: "HYP-001",
      competingHypothesisIds: [
        "HYP-002",
      ],
    }),
  );
  repository.register(
    hypothesis({
      id: "HYP-002",
      competingHypothesisIds: [
        "HYP-001",
      ],
    }),
  );

  const result =
    new DiagnosticHypothesisRankingEngine({
      hypothesisRepository: repository,
    }).rank({
      fusionResults: [
        fusion("HYP-001"),
        fusion("HYP-002"),
      ],
    });

  assert.equal(
    result.competitionConflicts.length,
    1,
  );
  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("top tie requires review", () => {
  const repository =
    new RankingHypothesisRepository();

  repository.register(
    hypothesis({ id: "HYP-001" }),
  );
  repository.register(
    hypothesis({ id: "HYP-002" }),
  );

  const result =
    new DiagnosticHypothesisRankingEngine({
      hypothesisRepository: repository,
    }).rank({
      fusionResults: [
        fusion("HYP-001"),
        fusion("HYP-002"),
      ],
    });

  assert.equal(result.topTie, true);
  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("safety statement avoids diagnostic finality", () => {
  const repository =
    new RankingHypothesisRepository();

  repository.register(hypothesis());

  const result =
    new DiagnosticHypothesisRankingEngine({
      hypothesisRepository: repository,
    }).rank({
      fusionResults: [
        fusion("HYP-001"),
      ],
    });

  assert.match(
    result.synthesis.safetyStatement,
    /not a definitive diagnosis/i,
  );
});

test("library exposes repository and engine", () => {
  const library =
    createDiagnosticHypothesisRankingLibrary({
      hypotheses: [hypothesis()],
    });

  assert.ok(library.hypothesisRepository);
  assert.ok(library.engine);
  assert.equal(
    library.hypotheses.length,
    1,
  );
});
