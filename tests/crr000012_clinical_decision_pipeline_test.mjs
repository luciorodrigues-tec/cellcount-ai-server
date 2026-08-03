import assert from "node:assert/strict";
import test from "node:test";

import {
  AnalyzeSlideClinicalDecisionAdapter,
  ClinicalDecisionPipeline,
  createClinicalDecisionPipelineLibrary,
  createClinicalDecisionRequest,
  validateClinicalDecisionRequest,
} from "../ai/clinicalRules/index.js";

const fixedClock = () => {
  const values = [
    new Date("2026-07-29T10:00:00.000Z"),
    new Date("2026-07-29T10:00:00.010Z"),
  ];
  let index = 0;
  return () => values[index++] || values.at(-1);
};

test("clinical decision request is immutable", () => {
  const request =
    createClinicalDecisionRequest({
      requestId: "REQ-001",
      input: { value: 1 },
    });

  assert.equal(
    Object.isFrozen(request),
    true,
  );
  assert.equal(
    Object.isFrozen(request.images),
    true,
  );
});

test("request validation enforces maximum images", () => {
  const request =
    createClinicalDecisionRequest({
      requestId: "REQ-001",
      input: {},
      images: [1, 2, 3, 4, 5],
    });

  const validation =
    validateClinicalDecisionRequest(
      request,
      {
        maximumImages: 4,
        allowEmptyImages: true,
        requireManualCountsObject: false,
      },
    );

  assert.equal(validation.valid, false);
});

test("pipeline requires an orchestrator", () => {
  assert.throws(
    () => new ClinicalDecisionPipeline(),
    /requires an orchestrator/,
  );
});

test("pipeline executes orchestrator and maps output", async () => {
  const pipeline =
    new ClinicalDecisionPipeline({
      orchestrator: {
        async execute(context) {
          return {
            executionId:
              context.executionId,
            requiresHumanReview: false,
            finalRanking: {
              rankedHypotheses: [],
            },
            synthesis: {
              summary: "safe synthesis",
              alerts: [],
            },
          };
        },
      },
      clock: fixedClock(),
      idFactory: () => "EXEC-001",
    });

  const request =
    createClinicalDecisionRequest({
      requestId: "REQ-001",
      input: { value: 1 },
    });

  const result =
    await pipeline.execute(request);

  assert.equal(result.status, "COMPLETED");
  assert.equal(
    result.structuredOutput
      .interpretiveSynthesis,
    "safe synthesis",
  );
  assert.equal(result.durationMs, 10);
});

test("pipeline returns warnings for no images", async () => {
  const pipeline =
    new ClinicalDecisionPipeline({
      orchestrator: {
        async execute() {
          return {
            executionId: "EXEC-001",
            requiresHumanReview: false,
          };
        },
      },
      clock: fixedClock(),
      idFactory: () => "EXEC-001",
    });

  const result =
    await pipeline.execute(
      createClinicalDecisionRequest({
        requestId: "REQ-001",
        input: {},
      }),
    );

  assert.equal(result.warnings.length, 1);
});

test("pipeline captures orchestration failure", async () => {
  const pipeline =
    new ClinicalDecisionPipeline({
      orchestrator: {
        async execute() {
          throw new Error(
            "orchestration failure",
          );
        },
      },
      clock: fixedClock(),
      idFactory: () => "EXEC-001",
    });

  const result =
    await pipeline.execute(
      createClinicalDecisionRequest({
        requestId: "REQ-001",
        input: {},
      }),
    );

  assert.equal(
    result.status,
    "COMPLETED_WITH_ERRORS",
  );
  assert.equal(result.errors.length, 1);
  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("pipeline can omit orchestration payload", async () => {
  const pipeline =
    new ClinicalDecisionPipeline({
      orchestrator: {
        async execute() {
          return {
            executionId: "EXEC-001",
            requiresHumanReview: false,
          };
        },
      },
      clock: fixedClock(),
      idFactory: () => "EXEC-001",
      policy: {
        includeOrchestration: false,
      },
    });

  const result =
    await pipeline.execute(
      createClinicalDecisionRequest({
        requestId: "REQ-001",
        input: {},
      }),
    );

  assert.equal(result.orchestration, null);
});

test("analyze-slide adapter maps body and files", async () => {
  let captured = null;

  const adapter =
    new AnalyzeSlideClinicalDecisionAdapter({
      pipeline: {
        async execute(request) {
          captured = request;
          return { ok: true };
        },
      },
    });

  const result =
    await adapter.execute({
      requestId: "REQ-001",
      body: {
        manualCounts: {
          segmented: 50,
        },
      },
      files: [
        { filename: "slide.jpg" },
      ],
    });

  assert.equal(result.ok, true);
  assert.equal(captured.images.length, 1);
  assert.equal(
    captured.manualCounts.segmented,
    50,
  );
});

test("library exposes pipeline and adapter", () => {
  const library =
    createClinicalDecisionPipelineLibrary({
      orchestrator: {
        execute() {},
      },
    });

  assert.ok(library.pipeline);
  assert.ok(library.analyzeSlideAdapter);
});

test("result safety statement avoids diagnostic finality", async () => {
  const pipeline =
    new ClinicalDecisionPipeline({
      orchestrator: {
        async execute() {
          return {
            executionId: "EXEC-001",
            requiresHumanReview: false,
          };
        },
      },
      clock: fixedClock(),
      idFactory: () => "EXEC-001",
    });

  const result =
    await pipeline.execute(
      createClinicalDecisionRequest({
        requestId: "REQ-001",
        input: {},
      }),
    );

  assert.match(
    result.safetyStatement,
    /not a definitive diagnosis/i,
  );
});
