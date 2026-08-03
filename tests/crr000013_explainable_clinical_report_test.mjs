import assert from "node:assert/strict";
import test from "node:test";

import {
  ClinicalReportRenderer,
  ExplainableClinicalReportGenerator,
  createClinicalReportSection,
  createExplainableClinicalReportLibrary,
  validateClinicalReport,
} from "../ai/clinicalRules/index.js";

const decisionResult = (overrides = {}) => ({
  requestId: "REQ-001",
  executionId: "EXEC-001",
  status: "COMPLETED",
  warnings: [],
  errors: [],
  requiresHumanReview: false,
  safetyStatement:
    "This result is clinical decision support and not a definitive diagnosis.",
  structuredOutput: {
    interpretiveSynthesis:
      "Síntese segura.",
    morphologicRiskClass:
      "CLASS_0_NORMAL",
    patternRecognition:
      "Padrão preservado.",
    hematologicReasoning:
      "Raciocínio estruturado.",
    clinicalMeaning:
      "Significado clínico educacional.",
    educationalImpact:
      "Correlacionar clinicamente.",
    alerts: [],
  },
  orchestration: {
    orchestratorVersion:
      "CRR-000011-v1.0.0",
    stages: [],
    finalRanking: {
      rankedHypotheses: [
        {
          hypothesisId: "HYP-001",
          hypothesisLabel:
            "Hipótese de teste",
          normalizedScore: 1,
          status: "RANKABLE",
        },
      ],
      synthesis: {
        leadingHypothesis: {
          hypothesisId: "HYP-001",
          hypothesisLabel:
            "Hipótese de teste",
          normalizedScore: 1,
          status: "RANKABLE",
        },
      },
    },
  },
  ...overrides,
});

test("report section is immutable", () => {
  const section =
    createClinicalReportSection({
      id: "section-1",
      type: "EXECUTIVE_SUMMARY",
      title: "Resumo",
      content: "Texto",
    });

  assert.equal(
    Object.isFrozen(section),
    true,
  );
  assert.equal(
    Object.isFrozen(section.items),
    true,
  );
});

test("report section rejects unsupported type", () => {
  assert.throws(
    () =>
      createClinicalReportSection({
        id: "section-1",
        type: "UNKNOWN",
        title: "Resumo",
      }),
    /Unsupported report section type/,
  );
});

test("generator creates ordered clinical report", () => {
  const generator =
    new ExplainableClinicalReportGenerator({
      idFactory: () => "REPORT-001",
      clock: () =>
        new Date(
          "2026-07-29T12:00:00.000Z",
        ),
    });

  const report =
    generator.generate(decisionResult());

  assert.equal(
    report.reportId,
    "REPORT-001",
  );
  assert.equal(
    report.sections[0].type,
    "EXECUTIVE_SUMMARY",
  );
  assert.equal(
    report.sections.at(-1).type,
    "AUDIT_TRAIL",
  );
});

test("generator includes primary hypothesis", () => {
  const report =
    new ExplainableClinicalReportGenerator({
      idFactory: () => "REPORT-001",
      clock: () => new Date(),
    }).generate(decisionResult());

  const primary =
    report.sections.find(
      (section) =>
        section.type ===
        "PRIMARY_HYPOTHESIS",
    );

  assert.equal(
    primary.content.id,
    "HYP-001",
  );
});

test("missing ranking requires human review", () => {
  const report =
    new ExplainableClinicalReportGenerator({
      idFactory: () => "REPORT-001",
      clock: () => new Date(),
    }).generate(
      decisionResult({
        orchestration: {
          stages: [],
          finalRanking: null,
        },
      }),
    );

  assert.equal(
    report.requiresHumanReview,
    true,
  );
});

test("pipeline errors require human review", () => {
  const report =
    new ExplainableClinicalReportGenerator({
      idFactory: () => "REPORT-001",
      clock: () => new Date(),
    }).generate(
      decisionResult({
        status:
          "COMPLETED_WITH_ERRORS",
        errors: ["failure"],
      }),
    );

  assert.equal(
    report.requiresHumanReview,
    true,
  );
});

test("validator accepts generated report", () => {
  const report =
    new ExplainableClinicalReportGenerator({
      idFactory: () => "REPORT-001",
      clock: () => new Date(),
    }).generate(decisionResult());

  const validation =
    validateClinicalReport(report);

  assert.equal(validation.valid, true);
});

test("renderer exports JSON", () => {
  const report =
    new ExplainableClinicalReportGenerator({
      idFactory: () => "REPORT-001",
      clock: () => new Date(),
    }).generate(decisionResult());

  const value =
    new ClinicalReportRenderer()
      .toJSON(report);

  assert.match(value, /REPORT-001/);
});

test("renderer exports Markdown", () => {
  const report =
    new ExplainableClinicalReportGenerator({
      idFactory: () => "REPORT-001",
      clock: () => new Date(),
    }).generate(decisionResult());

  const value =
    new ClinicalReportRenderer()
      .toMarkdown(report);

  assert.match(
    value,
    /Resumo executivo/,
  );
  assert.match(
    value,
    /not a definitive diagnosis/i,
  );
});

test("library exposes generator and renderer", () => {
  const library =
    createExplainableClinicalReportLibrary();

  assert.ok(library.generator);
  assert.ok(library.renderer);
});

test("report safety statement avoids diagnostic finality", () => {
  const report =
    new ExplainableClinicalReportGenerator({
      idFactory: () => "REPORT-001",
      clock: () => new Date(),
    }).generate(decisionResult());

  assert.match(
    report.safetyStatement,
    /not a definitive diagnosis/i,
  );
});
