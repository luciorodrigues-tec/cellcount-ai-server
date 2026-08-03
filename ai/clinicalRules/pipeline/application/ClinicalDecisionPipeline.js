import {
  randomUUID,
} from "node:crypto";

import {
  createDiagnosticOrchestrationContext,
} from "../../index.js";

import {
  createClinicalDecisionResult,
} from "../domain/ClinicalDecisionResult.js";

import {
  mergeClinicalDecisionPipelinePolicy,
} from "../domain/ClinicalDecisionPipelinePolicy.js";

import {
  validateClinicalDecisionRequest,
} from "./ClinicalDecisionRequestValidator.js";

import {
  ClinicalDecisionOutputMapper,
} from "./ClinicalDecisionOutputMapper.js";

export const CLINICAL_DECISION_PIPELINE_VERSION =
  "CRR-000012-v1.0.0";

export class ClinicalDecisionPipeline {
  constructor({
    orchestrator,
    outputMapper =
      new ClinicalDecisionOutputMapper(),
    clock = () => new Date(),
    idFactory = randomUUID,
    policy = {},
  } = {}) {
    if (!orchestrator) {
      throw new TypeError(
        "ClinicalDecisionPipeline requires an orchestrator.",
      );
    }

    this.orchestrator = orchestrator;
    this.outputMapper = outputMapper;
    this.clock = clock;
    this.idFactory = idFactory;
    this.policy =
      mergeClinicalDecisionPipelinePolicy(policy);
  }

  async execute(request) {
    const startedAt = this.clock();
    const validation =
      validateClinicalDecisionRequest(
        request,
        this.policy,
      );

    if (
      !validation.valid &&
      this.policy.failOnValidationError
    ) {
      throw new TypeError(
        `Invalid clinical decision request: ${validation.errors.join(" | ")}`,
      );
    }

    const executionId =
      this.idFactory();

    const orchestrationContext =
      createDiagnosticOrchestrationContext({
        executionId,
        input: request.input,
        targetIds:
          request.metadata?.targetIds || [],
        metadata: {
          ...request.metadata,
          images: request.images,
          manualCounts:
            request.manualCounts,
          morphology: request.morphology,
          patientContext:
            request.patientContext,
          bayesianEvidence:
            request.metadata
              ?.bayesianEvidence || [],
          fusionSignals:
            request.metadata
              ?.fusionSignals || null,
        },
      });

    let orchestration = null;
    const errors = [
      ...validation.errors,
    ];

    try {
      orchestration =
        await this.orchestrator.execute(
          orchestrationContext,
        );
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : String(cause);
      errors.push(message);
    }

    const structuredOutput =
      orchestration
        ? this.outputMapper.map({
            request,
            orchestration,
          })
        : null;

    const completedAt = this.clock();

    return createClinicalDecisionResult({
      requestId: request.requestId,
      executionId,
      status:
        errors.length === 0
          ? "COMPLETED"
          : "COMPLETED_WITH_ERRORS",
      orchestration:
        this.policy.includeOrchestration
          ? orchestration
          : null,
      structuredOutput,
      warnings: validation.warnings,
      errors,
      startedAt:
        startedAt.toISOString(),
      completedAt:
        completedAt.toISOString(),
      durationMs:
        Math.max(
          0,
          completedAt.getTime() -
            startedAt.getTime(),
        ),
    });
  }
}
