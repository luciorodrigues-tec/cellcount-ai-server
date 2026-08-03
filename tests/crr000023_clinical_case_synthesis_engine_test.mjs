import assert from "node:assert/strict";
import test from "node:test";

import {
  ClinicalCaseSynthesisEngine,
  createClinicalCaseSynthesisInput,
  createClinicalCaseSynthesisLibrary,
} from "../ai/clinicalRules/index.js";

const input = (overrides = {}) =>
  createClinicalCaseSynthesisInput({
    caseId: "CASE-001",
    hypothesisRanking: {
      rankedHypotheses: [
        {
          hypothesisId: "H-1",
          normalizedScore: 0.9,
        },
      ],
    },
    classificationResult: {
      selectedClassification: {
        candidateId: "C-1",
      },
      requiresHumanReview: false,
    },
    criteriaResults: [
      {
        status: "MET",
        requiresHumanReview: false,
      },
    ],
    evidenceScores: [
      {
        hypothesisId: "H-1",
        status: "SUPPORTED",
        normalizedScore: 0.8,
        requiresHumanReview: false,
      },
    ],
    recommendations: [
      {
        priority: "ROUTINE",
        requiresHumanReview: false,
        automationBlocked: false,
      },
    ],
    alerts: [],
    conflicts: [],
    ...overrides,
  });

test("synthesis input is immutable", () => {
  const value = input();
  assert.equal(Object.isFrozen(value), true);
  assert.equal(
    Object.isFrozen(value.criteriaResults),
    true,
  );
});

test("engine requires valid input", () => {
  assert.throws(
    () =>
      new ClinicalCaseSynthesisEngine()
        .synthesize(),
    /requires a valid input/,
  );
});

test("engine synthesizes leading hypothesis", () => {
  const result =
    new ClinicalCaseSynthesisEngine({
      clock: () =>
        new Date("2026-07-29T12:00:00.000Z"),
    }).synthesize(input());

  assert.equal(
    result.leadingHypothesis.hypothesisId,
    "H-1",
  );
  assert.equal(result.status, "SYNTHESIZED");
});

test("missing evidence requires review by default", () => {
  const result =
    new ClinicalCaseSynthesisEngine()
      .synthesize(
        input({
          evidenceScores: [],
        }),
      );

  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("conflicted evidence marks case conflicted", () => {
  const result =
    new ClinicalCaseSynthesisEngine()
      .synthesize(
        input({
          evidenceScores: [
            {
              hypothesisId: "H-1",
              status: "CONFLICTED",
              conflictDetected: true,
              requiresHumanReview: true,
            },
          ],
        }),
      );

  assert.equal(result.status, "CONFLICTED");
  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("abstained evidence blocks automation", () => {
  const result =
    new ClinicalCaseSynthesisEngine()
      .synthesize(
        input({
          evidenceScores: [
            {
              hypothesisId: "H-1",
              status: "ABSTAINED",
              requiresHumanReview: true,
            },
          ],
        }),
      );

  assert.equal(result.status, "ABSTAINED");
  assert.equal(result.automationBlocked, true);
});

test("recommendation can block automation", () => {
  const result =
    new ClinicalCaseSynthesisEngine()
      .synthesize(
        input({
          recommendations: [
            {
              priority: "CRITICAL",
              requiresHumanReview: true,
              automationBlocked: true,
            },
          ],
        }),
      );

  assert.equal(result.automationBlocked, true);
});

test("criteria summary counts statuses", () => {
  const result =
    new ClinicalCaseSynthesisEngine()
      .synthesize(
        input({
          criteriaResults: [
            { status: "MET" },
            { status: "EXCLUDED" },
            { status: "INDETERMINATE" },
          ],
        }),
      );

  assert.equal(result.criteriaSummary.met, 1);
  assert.equal(result.criteriaSummary.excluded, 1);
  assert.equal(result.criteriaSummary.indeterminate, 1);
});

test("classification conflict is preserved", () => {
  const result =
    new ClinicalCaseSynthesisEngine()
      .synthesize(
        input({
          classificationResult: {
            selectedClassification: null,
            competitionConflicts: [
              { candidateIds: ["C-1", "C-2"] },
            ],
            requiresHumanReview: true,
          },
        }),
      );

  assert.equal(result.conflicts.length, 1);
});

test("morphology summary is mapped", () => {
  const result =
    new ClinicalCaseSynthesisEngine()
      .synthesize(
        input({
          morphology: {
            morphologicRiskClass: "CLASS_2",
            patternRecognition: "Pattern",
          },
        }),
      );

  assert.equal(
    result.morphologySummary.riskClass,
    "CLASS_2",
  );
});

test("library exposes engine", () => {
  const library =
    createClinicalCaseSynthesisLibrary();

  assert.ok(library.engine);
});

test("safety statement avoids diagnostic finality", () => {
  const result =
    new ClinicalCaseSynthesisEngine()
      .synthesize(input());

  assert.match(
    result.safetyStatement,
    /not a definitive diagnosis/i,
  );
});
