import {
  AuditRecord,
} from "../domain/AuditRecord.js";

import {
  createAuditMetrics,
} from "../domain/AuditMetrics.js";

import {
  ClinicalAuditReferenceMapper,
} from "./ClinicalAuditReferenceMapper.js";

export const CLINICAL_AUDIT_INTEGRATION_SERVICE_VERSION =
  "CGL-000001-S3-v1.0.0";

export class ClinicalAuditIntegrationService {
  constructor({
    auditEngine,
    repository,
    referenceMapper =
      new ClinicalAuditReferenceMapper(),
    clock = () => new Date(),
  } = {}) {
    if (!auditEngine) {
      throw new TypeError(
        "ClinicalAuditIntegrationService.auditEngine is required.",
      );
    }

    if (!repository) {
      throw new TypeError(
        "ClinicalAuditIntegrationService.repository is required.",
      );
    }

    this.auditEngine = auditEngine;
    this.repository = repository;
    this.referenceMapper =
      referenceMapper;
    this.clock = clock;
  }

  captureClinicalCase({
    auditId,
    caseReference,
    actor,
    engineVersions,
    evidenceItems = [],
    safetyGateResult,
    confidenceCalibrationResult = null,
    uncertaintyResult = null,
    reviews = [],
    startedAt = null,
    completedAt = null,
    durationMs = null,
    policy = {},
    metadata = {},
    replace = false,
  } = {}) {
    if (!safetyGateResult) {
      throw new TypeError(
        "ClinicalAuditIntegrationService.safetyGateResult is required.",
      );
    }

    let record =
      this.auditEngine.open({
        auditId,
        caseReference,
        actor,
        policy,
        metadata,
      });

    const events = [
      {
        type: "ENGINE_STARTED",
        payload: {
          engineCount:
            Object.keys(engineVersions || {}).length,
        },
      },
      {
        type: "EVIDENCE_REGISTERED",
        payload: {
          evidenceCount:
            evidenceItems.length,
        },
      },
      {
        type: "SAFETY_GATE_DECIDED",
        payload: {
          decision:
            safetyGateResult.decision,
          releaseAllowed:
            safetyGateResult.releaseAllowed === true,
          automationAllowed:
            safetyGateResult.automationAllowed === true,
        },
      },
    ];

    for (let index = 0; index < events.length; index += 1) {
      const event = events[index];

      record =
        this.auditEngine.appendEvent(
          record,
          {
            eventId:
              `${record.auditId.toString()}-EVT-${String(index + 2).padStart(4, "0")}`,
            type: event.type,
            payload: event.payload,
          },
        );
    }

    record =
      this.auditEngine.addSnapshot(
        record,
        {
          snapshotId:
            `${record.auditId.toString()}-SNAP-0001`,
          sequence:
            record.events.at(-1)?.sequence ||
            1,
          state: {
            safetyGateResult,
            confidenceCalibrationResult,
            uncertaintyResult,
          },
        },
      );

    const engineReferences =
      this.referenceMapper.mapEngines(
        engineVersions,
      );

    const evidenceReferences =
      this.referenceMapper.mapEvidence(
        evidenceItems,
      );

    const decisionReference =
      this.referenceMapper.mapDecision({
        safetyGateResult,
        confidenceCalibrationResult,
        uncertaintyResult,
      });

    const reviewReferences =
      this.referenceMapper.mapReviews(
        reviews,
      );

    const metrics =
      createAuditMetrics({
        startedAt:
          startedAt ||
          record.events[0].occurredAt,
        completedAt:
          completedAt ||
          this.clock().toISOString(),
        durationMs,
      });

    const ready =
      new AuditRecord({
        auditId: record.auditId,
        caseReference:
          record.caseReference,
        actor:
          record.actor,
        status: "OPEN",
        events:
          record.events,
        steps:
          record.steps,
        engineReferences,
        evidenceReferences,
        decisionReferences: [
          decisionReference,
        ],
        reviewReferences,
        snapshots:
          record.snapshots,
        metrics,
        policy:
          record.policy,
        metadata:
          record.metadata,
      });

    const sealed =
      this.auditEngine.seal(ready);

    this.repository.save(
      sealed,
      { replace },
    );

    return sealed;
  }
}
