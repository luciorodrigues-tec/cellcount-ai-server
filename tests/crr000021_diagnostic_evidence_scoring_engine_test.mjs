import assert from "node:assert/strict";
import test from "node:test";

import {
  DiagnosticEvidenceScoringEngine,
  createDiagnosticEvidenceScoringLibrary,
  createDiagnosticEvidenceSignal,
} from "../ai/clinicalRules/index.js";

const signal = (
  id,
  hypothesisId,
  direction,
  overrides = {},
) =>
  createDiagnosticEvidenceSignal({
    id,
    hypothesisId,
    sourceType: "MORPHOLOGY",
    sourceId: id,
    direction,
    ...overrides,
  });

test("evidence signal is immutable", () => {
  const value =
    signal("S-1", "H-1", "SUPPORT");

  assert.equal(Object.isFrozen(value), true);
  assert.equal(
    Object.isFrozen(
      value.evidenceSourceIds,
    ),
    true,
  );
});

test("signal rejects unsupported source type", () => {
  assert.throws(
    () =>
      signal(
        "S-1",
        "H-1",
        "SUPPORT",
        { sourceType: "UNKNOWN" },
      ),
    /Unsupported diagnostic evidence source type/,
  );
});

test("supporting evidence produces supported status", () => {
  const result =
    new DiagnosticEvidenceScoringEngine()
      .scoreHypothesis({
        hypothesisId: "H-1",
        signals: [
          signal(
            "S-1",
            "H-1",
            "SUPPORT",
          ),
        ],
      });

  assert.equal(result.status, "SUPPORTED");
  assert.ok(result.normalizedScore > 0);
});

test("opposing evidence produces opposed status", () => {
  const result =
    new DiagnosticEvidenceScoringEngine()
      .scoreHypothesis({
        hypothesisId: "H-1",
        signals: [
          signal(
            "S-1",
            "H-1",
            "OPPOSE",
          ),
        ],
      });

  assert.equal(result.status, "OPPOSED");
  assert.ok(result.normalizedScore < 0);
});

test("balanced support and opposition create conflict", () => {
  const result =
    new DiagnosticEvidenceScoringEngine()
      .scoreHypothesis({
        hypothesisId: "H-1",
        signals: [
          signal(
            "S-1",
            "H-1",
            "SUPPORT",
          ),
          signal(
            "S-2",
            "H-1",
            "OPPOSE",
          ),
        ],
      });

  assert.equal(result.status, "CONFLICTED");
  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("blocking signal causes abstention", () => {
  const result =
    new DiagnosticEvidenceScoringEngine()
      .scoreHypothesis({
        hypothesisId: "H-1",
        signals: [
          signal(
            "S-1",
            "H-1",
            "SUPPORT",
            { blocking: true },
          ),
        ],
      });

  assert.equal(result.status, "ABSTAINED");
});

test("duplicate signal ids are counted once", () => {
  const duplicate =
    signal(
      "S-1",
      "H-1",
      "SUPPORT",
    );

  const result =
    new DiagnosticEvidenceScoringEngine()
      .scoreHypothesis({
        hypothesisId: "H-1",
        signals: [
          duplicate,
          duplicate,
        ],
      });

  assert.equal(result.signalCount, 1);
});

test("source type weights affect score", () => {
  const engine =
    new DiagnosticEvidenceScoringEngine({
      policy: {
        sourceTypeWeights: {
          MORPHOLOGY: 0.5,
        },
      },
    });

  const result =
    engine.scoreHypothesis({
      hypothesisId: "H-1",
      signals: [
        signal(
          "S-1",
          "H-1",
          "SUPPORT",
        ),
      ],
    });

  assert.equal(result.supportScore, 0.5);
});

test("scoreAll ranks highest score first", () => {
  const result =
    new DiagnosticEvidenceScoringEngine()
      .scoreAll({
        signals: [
          signal(
            "S-1",
            "H-1",
            "SUPPORT",
          ),
          signal(
            "S-2",
            "H-2",
            "SUPPORT",
            { strength: 0.2 },
          ),
        ],
      });

  assert.equal(
    result.rankedResults[0]
      .hypothesisId,
    "H-1",
  );
});

test("scoreAll aggregates status counts", () => {
  const result =
    new DiagnosticEvidenceScoringEngine()
      .scoreAll({
        signals: [
          signal(
            "S-1",
            "H-1",
            "SUPPORT",
          ),
          signal(
            "S-2",
            "H-2",
            "OPPOSE",
          ),
        ],
      });

  assert.equal(result.supportedCount, 1);
  assert.equal(result.opposedCount, 1);
});

test("library exposes engine", () => {
  const library =
    createDiagnosticEvidenceScoringLibrary();

  assert.ok(library.engine);
});

test("explanation avoids diagnostic finality", () => {
  const result =
    new DiagnosticEvidenceScoringEngine()
      .scoreHypothesis({
        hypothesisId: "H-1",
        signals: [
          signal(
            "S-1",
            "H-1",
            "SUPPORT",
          ),
        ],
      });

  assert.match(
    result.explanation.safetyStatement,
    /not a definitive diagnosis/i,
  );
});
