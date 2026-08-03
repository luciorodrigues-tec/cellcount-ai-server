import assert from "node:assert/strict";
import test from "node:test";

import {
  DiagnosticNarrativeIntelligenceEngine,
  DiagnosticNarrativeRenderer,
  createDiagnosticNarrativeContext,
  createDiagnosticNarrativeLibrary,
} from "../ai/clinicalRules/index.js";

const synthesis = (overrides = {}) => ({
  caseId: "CASE-001",
  status: "SYNTHESIZED",
  leadingHypothesis: {
    hypothesisId: "H-1",
    hypothesisLabel: "Hipótese de teste",
  },
  selectedClassification: {
    candidateId: "C-1",
    label: "Classificação de teste",
  },
  criteriaSummary: {
    total: 1,
    met: 1,
    excluded: 0,
    indeterminate: 0,
  },
  evidenceSummary: {
    total: 1,
    supported: 1,
    opposed: 0,
    conflicted: 0,
    abstained: 0,
    leading: {
      hypothesisId: "H-1",
      normalizedScore: 0.8,
    },
  },
  recommendationSummary: {
    total: 1,
    highestPriority: "ROUTINE",
  },
  morphologySummary: {
    riskClass: "CLASS_2",
    patternRecognition: "Padrão de teste",
  },
  conflicts: [],
  alerts: [],
  requiresHumanReview: false,
  automationBlocked: false,
  ...overrides,
});

test("narrative context is immutable", () => {
  const value =
    createDiagnosticNarrativeContext({
      caseSynthesis: synthesis(),
    });

  assert.equal(Object.isFrozen(value), true);
});

test("engine requires valid context", () => {
  assert.throws(
    () =>
      new DiagnosticNarrativeIntelligenceEngine()
        .generate(),
    /requires a valid narrative context/,
  );
});

test("engine generates portuguese narrative", () => {
  const context =
    createDiagnosticNarrativeContext({
      caseSynthesis: synthesis(),
      locale: "pt-BR",
    });

  const result =
    new DiagnosticNarrativeIntelligenceEngine({
      clock: () =>
        new Date("2026-07-29T12:00:00.000Z"),
    }).generate(context);

  assert.match(
    result.executiveSummary,
    /Hipótese de teste/,
  );
  assert.equal(result.metadata.locale, "pt-BR");
});

test("engine generates english narrative", () => {
  const context =
    createDiagnosticNarrativeContext({
      caseSynthesis: synthesis(),
      locale: "en-US",
    });

  const result =
    new DiagnosticNarrativeIntelligenceEngine()
      .generate(context);

  assert.match(
    result.executiveSummary,
    /leading hypothesis/i,
  );
});

test("missing hypothesis is stated as limitation", () => {
  const context =
    createDiagnosticNarrativeContext({
      caseSynthesis: synthesis({
        leadingHypothesis: null,
      }),
    });

  const result =
    new DiagnosticNarrativeIntelligenceEngine()
      .generate(context);

  assert.ok(result.limitations.length > 0);
});

test("conflict requires human review", () => {
  const context =
    createDiagnosticNarrativeContext({
      caseSynthesis: synthesis({
        status: "CONFLICTED",
        conflicts: [
          { id: "CONFLICT-1" },
        ],
      }),
    });

  const result =
    new DiagnosticNarrativeIntelligenceEngine()
      .generate(context);

  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("automation block is preserved", () => {
  const context =
    createDiagnosticNarrativeContext({
      caseSynthesis: synthesis({
        automationBlocked: true,
      }),
    });

  const result =
    new DiagnosticNarrativeIntelligenceEngine()
      .generate(context);

  assert.equal(result.automationBlocked, true);
});

test("evidence score is included", () => {
  const context =
    createDiagnosticNarrativeContext({
      caseSynthesis: synthesis(),
    });

  const result =
    new DiagnosticNarrativeIntelligenceEngine()
      .generate(context);

  assert.match(
    result.evidenceInterpretation,
    /0\.8000/,
  );
});

test("renderer exports JSON", () => {
  const context =
    createDiagnosticNarrativeContext({
      caseSynthesis: synthesis(),
    });

  const narrative =
    new DiagnosticNarrativeIntelligenceEngine()
      .generate(context);

  const output =
    new DiagnosticNarrativeRenderer()
      .toJSON(narrative);

  assert.match(output, /CASE-001/);
});

test("renderer exports Markdown", () => {
  const context =
    createDiagnosticNarrativeContext({
      caseSynthesis: synthesis(),
    });

  const narrative =
    new DiagnosticNarrativeIntelligenceEngine()
      .generate(context);

  const output =
    new DiagnosticNarrativeRenderer()
      .toMarkdown(narrative);

  assert.match(
    output,
    /Resumo executivo/,
  );
});

test("library exposes engine and renderer", () => {
  const library =
    createDiagnosticNarrativeLibrary();

  assert.ok(library.engine);
  assert.ok(library.renderer);
});

test("safety statement avoids diagnostic finality", () => {
  const context =
    createDiagnosticNarrativeContext({
      caseSynthesis: synthesis(),
    });

  const result =
    new DiagnosticNarrativeIntelligenceEngine()
      .generate(context);

  assert.match(
    result.safetyStatement,
    /does not establish a definitive diagnosis/i,
  );
});
