import assert from "node:assert/strict";
import test from "node:test";

import {
  BayesianDiagnosticConfidenceEngine,
  BayesianHypothesisProfileRepository,
  applyLikelihoodRatio,
  confidenceAdjustedLikelihoodRatio,
  createBayesianDiagnosticConfidenceLibrary,
  createBayesianEvidence,
  createBayesianHypothesisProfile,
  oddsToProbability,
  probabilityToOdds,
} from "../ai/clinicalRules/index.js";

const profile = (overrides = {}) =>
  createBayesianHypothesisProfile({
    hypothesisId: "HYP-001",
    label: "Test hypothesis",
    priorProbability: 0.2,
    minimumEvidenceCount: 1,
    minimumPosteriorProbability: 0.5,
    ...overrides,
  });

const evidence = (overrides = {}) =>
  createBayesianEvidence({
    id: "EVID-001",
    hypothesisId: "HYP-001",
    sourceId: "TEST",
    direction: "SUPPORT",
    likelihoodRatio: 4,
    confidence: 1,
    ...overrides,
  });

test("probability and odds conversions are reversible", () => {
  const probability = 0.2;
  const odds = probabilityToOdds(probability);
  assert.equal(
    Number(
      oddsToProbability(odds).toFixed(8),
    ),
    probability,
  );
});

test("likelihood ratio updates prior probability", () => {
  const result = applyLikelihoodRatio({
    priorProbability: 0.2,
    likelihoodRatio: 4,
  });

  assert.equal(
    Number(
      result.posteriorProbability.toFixed(8),
    ),
    0.5,
  );
});

test("confidence adjustment shrinks LR toward one", () => {
  assert.equal(
    Number(
      confidenceAdjustedLikelihoodRatio({
        likelihoodRatio: 4,
        confidence: 0.5,
      }).toFixed(8),
    ),
    2,
  );
});

test("evidence rejects invalid likelihood ratio", () => {
  assert.throws(
    () =>
      evidence({
        likelihoodRatio: 0,
      }),
    /greater than zero/,
  );
});

test("hypothesis profile rejects invalid prior", () => {
  assert.throws(
    () =>
      profile({
        priorProbability: 1,
      }),
    /less than 1/,
  );
});

test("profile repository rejects duplicates", () => {
  const repository =
    new BayesianHypothesisProfileRepository();
  repository.register(profile());

  assert.throws(
    () => repository.register(profile()),
    /already registered/,
  );
});

test("engine supports hypothesis when posterior threshold is met", () => {
  const repository =
    new BayesianHypothesisProfileRepository();
  repository.register(profile());

  const result =
    new BayesianDiagnosticConfidenceEngine({
      profileRepository: repository,
    }).evaluateHypothesis({
      hypothesisId: "HYP-001",
      evidence: [evidence()],
    });

  assert.equal(result.status, "SUPPORTED");
  assert.equal(result.posteriorProbability, 0.5);
});

test("engine does not support hypothesis below threshold", () => {
  const repository =
    new BayesianHypothesisProfileRepository();
  repository.register(profile());

  const result =
    new BayesianDiagnosticConfidenceEngine({
      profileRepository: repository,
    }).evaluateHypothesis({
      hypothesisId: "HYP-001",
      evidence: [
        evidence({
          direction: "OPPOSE",
          likelihoodRatio: 0.5,
        }),
      ],
    });

  assert.equal(
    result.status,
    "NOT_SUPPORTED",
  );
});

test("engine abstains when human review evidence is present", () => {
  const repository =
    new BayesianHypothesisProfileRepository();
  repository.register(profile());

  const result =
    new BayesianDiagnosticConfidenceEngine({
      profileRepository: repository,
    }).evaluateHypothesis({
      hypothesisId: "HYP-001",
      evidence: [
        evidence({
          requiresHumanReview: true,
        }),
      ],
    });

  assert.equal(result.status, "ABSTAINED");
  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("engine abstains when profile is missing", () => {
  const repository =
    new BayesianHypothesisProfileRepository();

  const result =
    new BayesianDiagnosticConfidenceEngine({
      profileRepository: repository,
    }).evaluateHypothesis({
      hypothesisId: "UNKNOWN",
      evidence: [],
    });

  assert.equal(result.status, "ABSTAINED");
  assert.equal(
    result.reason,
    "MISSING_BAYESIAN_PROFILE",
  );
});

test("library exposes repository builder and engine", () => {
  const library =
    createBayesianDiagnosticConfidenceLibrary({
      profiles: [profile()],
    });

  assert.ok(library.profileRepository);
  assert.ok(library.evidenceBuilder);
  assert.ok(library.engine);
  assert.equal(library.profiles.length, 1);
});
