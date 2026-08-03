import assert from "node:assert/strict";
import test from "node:test";

import {
  createHematologicDiagnosticReasoningInput,
} from "../ai/clinicalRules/hematologicReasoning/domain/HematologicDiagnosticReasoningInput.js";

import {
  HematologicDiagnosticReasoningEngine,
} from "../ai/clinicalRules/hematologicReasoning/application/HematologicDiagnosticReasoningEngine.js";

import {
  createHematologicDiagnosticReasoningLibrary,
} from "../ai/clinicalRules/hematologicReasoning/HematologicDiagnosticReasoningLibrary.js";

const input = (overrides = {}) =>
  createHematologicDiagnosticReasoningInput({
    caseId: "CASE-001",
    patternResult: {
      rankedMatches: [
        {
          patternId: "P-1",
          score: 0.8,
          relatedDiseaseIds: ["D-1"],
        },
      ],
    },
    syndromeResult: {
      selectedSyndrome: {
        id: "S-1",
        relatedDiseaseIds: ["D-1"],
      },
      rankedSyndromes: [
        {
          syndromeId: "S-1",
          score: 0.9,
        },
      ],
    },
    diseaseCandidates: [
      { diseaseId: "D-1" },
      { diseaseId: "D-2" },
    ],
    criteriaResults: [
      {
        diseaseEntityId: "D-1",
        status: "MET",
      },
    ],
    evidenceScores: [
      {
        hypothesisId: "D-1",
        status: "SUPPORTED",
        normalizedScore: 0.8,
      },
    ],
    classificationResult: {
      selectedClassification: {
        diseaseEntityId: "D-1",
      },
    },
    ...overrides,
  });

test("reasoning input is immutable", () => {
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
      new HematologicDiagnosticReasoningEngine()
        .reason(),
    /requires a valid input/,
  );
});

test("engine integrates all reasoning sources", () => {
  const result =
    new HematologicDiagnosticReasoningEngine()
      .reason(input());

  assert.equal(
    result.selectedHypothesis.diseaseId,
    "D-1",
  );
  assert.ok(
    result.selectedHypothesis.compositeScore >
      0.5,
  );
});

test("criteria status contributes to score", () => {
  const result =
    new HematologicDiagnosticReasoningEngine()
      .reason(
        input({
          patternResult: null,
          syndromeResult: null,
          evidenceScores: [],
          classificationResult: null,
        }),
      );

  const d1 =
    result.rankedHypotheses.find(
      (item) => item.diseaseId === "D-1",
    );

  assert.equal(d1.criteriaScore, 1);
});

test("classification contributes to score", () => {
  const result =
    new HematologicDiagnosticReasoningEngine()
      .reason(
        input({
          patternResult: null,
          syndromeResult: null,
          criteriaResults: [],
          evidenceScores: [],
        }),
      );

  const d1 =
    result.rankedHypotheses.find(
      (item) => item.diseaseId === "D-1",
    );

  assert.equal(
    d1.classificationScore,
    1,
  );
});

test("conflict applies penalty and review", () => {
  const result =
    new HematologicDiagnosticReasoningEngine()
      .reason(
        input({
          evidenceScores: [
            {
              hypothesisId: "D-1",
              status: "CONFLICTED",
              normalizedScore: 0.8,
            },
          ],
        }),
      );

  assert.equal(
    result.conflictDetected,
    true,
  );
  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("abstention blocks automation", () => {
  const result =
    new HematologicDiagnosticReasoningEngine()
      .reason(
        input({
          evidenceScores: [
            {
              hypothesisId: "D-1",
              status: "ABSTAINED",
              normalizedScore: 0,
            },
          ],
        }),
      );

  assert.equal(
    result.abstentionDetected,
    true,
  );
  assert.equal(
    result.automationBlocked,
    true,
  );
});

test("higher composite score ranks first", () => {
  const result =
    new HematologicDiagnosticReasoningEngine()
      .reason(
        input({
          diseaseCandidates: [
            { diseaseId: "D-1" },
            { diseaseId: "D-2" },
          ],
          criteriaResults: [
            {
              diseaseEntityId: "D-1",
              status: "MET",
            },
            {
              diseaseEntityId: "D-2",
              status: "NOT_MET",
            },
          ],
        }),
      );

  assert.equal(
    result.rankedHypotheses[0].diseaseId,
    "D-1",
  );
});

test("top tie requires review", () => {
  const result =
    new HematologicDiagnosticReasoningEngine()
      .reason(
        createHematologicDiagnosticReasoningInput({
          caseId: "CASE-TIE",
          diseaseCandidates: [
            { diseaseId: "D-1" },
            { diseaseId: "D-2" },
          ],
        }),
      );

  assert.equal(result.topTie, true);
  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("unsupported hypothesis remains unselected", () => {
  const result =
    new HematologicDiagnosticReasoningEngine()
      .reason(
        createHematologicDiagnosticReasoningInput({
          caseId: "CASE-LOW",
          diseaseCandidates: [
            { diseaseId: "D-1" },
          ],
        }),
      );

  assert.equal(
    result.selectedHypothesis,
    null,
  );
});

test("custom policy changes support threshold", () => {
  const result =
    new HematologicDiagnosticReasoningEngine({
      policy: {
        minimumSupportScore: 0,
      },
    }).reason(
      createHematologicDiagnosticReasoningInput({
        caseId: "CASE-CUSTOM",
        diseaseCandidates: [
          { diseaseId: "D-1" },
        ],
      }),
    );

  assert.equal(
    result.selectedHypothesis.diseaseId,
    "D-1",
  );
});

test("library exposes engine", () => {
  const library =
    createHematologicDiagnosticReasoningLibrary();

  assert.ok(library.engine);
});

test("safety statement avoids diagnostic finality", () => {
  const result =
    new HematologicDiagnosticReasoningEngine()
      .reason(input());

  assert.match(
    result.explanation.safetyStatement,
    /does not establish a definitive diagnosis/i,
  );
});
