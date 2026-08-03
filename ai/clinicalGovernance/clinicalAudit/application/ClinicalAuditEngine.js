import {
  AuditId,
} from "../domain/AuditId.js";

import {
  AuditRecord,
} from "../domain/AuditRecord.js";

import {
  createAuditEvent,
} from "../domain/AuditEvent.js";

import {
  createAuditIntegrity,
} from "../domain/AuditIntegrity.js";

import {
  AuditTimelineBuilder,
} from "./AuditTimelineBuilder.js";

import {
  AuditIntegrityCalculator,
} from "./AuditIntegrityCalculator.js";

import {
  AuditSnapshotBuilder,
} from "./AuditSnapshotBuilder.js";

import {
  AuditValidationService,
} from "./AuditValidationService.js";

export const CLINICAL_AUDIT_ENGINE_VERSION =
  "CGL-000001-S2-v1.0.0";

function cloneRecord(record, overrides = {}) {
  return new AuditRecord({
    auditId: record.auditId,
    caseReference: record.caseReference,
    actor: record.actor,
    status: record.status,
    events: record.events,
    steps: record.steps,
    engineReferences:
      record.engineReferences,
    evidenceReferences:
      record.evidenceReferences,
    decisionReferences:
      record.decisionReferences,
    reviewReferences:
      record.reviewReferences,
    snapshots: record.snapshots,
    metrics: record.metrics,
    integrity: record.integrity,
    signature: record.signature,
    policy: record.policy,
    metadata: record.metadata,
    ...overrides,
  });
}

export class ClinicalAuditEngine {
  constructor({
    timelineBuilder =
      new AuditTimelineBuilder(),
    integrityCalculator =
      new AuditIntegrityCalculator(),
    snapshotBuilder =
      new AuditSnapshotBuilder(),
    validationService =
      new AuditValidationService(),
    clock = () => new Date(),
  } = {}) {
    this.timelineBuilder =
      timelineBuilder;
    this.integrityCalculator =
      integrityCalculator;
    this.snapshotBuilder =
      snapshotBuilder;
    this.validationService =
      validationService;
    this.clock = clock;
  }

  open({
    auditId,
    caseReference,
    actor,
    policy = {},
    metadata = {},
  } = {}) {
    const id =
      auditId instanceof AuditId
        ? auditId
        : new AuditId(auditId);

    const openedEvent =
      createAuditEvent({
        eventId:
          `${id.toString()}-EVT-0001`,
        type: "CASE_OPENED",
        occurredAt:
          this.clock().toISOString(),
        sequence: 1,
        actor,
        payload: {
          caseId:
            caseReference.caseId,
        },
      });

    return new AuditRecord({
      auditId: id,
      caseReference,
      actor,
      status: "OPEN",
      events: [openedEvent],
      policy,
      metadata,
    });
  }

  appendEvent(
    record,
    {
      eventId,
      type,
      actor = record.actor,
      occurredAt =
        this.clock().toISOString(),
      payload = {},
      metadata = {},
    } = {},
  ) {
    if (!record.canMutate()) {
      throw new Error(
        "AuditRecord is sealed and cannot be mutated.",
      );
    }

    const result =
      this.timelineBuilder.append({
        events: record.events,
        eventId,
        type,
        actor,
        occurredAt,
        payload,
        metadata,
      });

    return cloneRecord(record, {
      events: result.events,
    });
  }

  addSnapshot(
    record,
    {
      snapshotId,
      sequence,
      state,
    } = {},
  ) {
    if (!record.canMutate()) {
      throw new Error(
        "AuditRecord is sealed and cannot be mutated.",
      );
    }

    const snapshot =
      this.snapshotBuilder.build({
        snapshotId,
        sequence,
        state,
      });

    return cloneRecord(record, {
      snapshots: [
        ...record.snapshots,
        snapshot,
      ],
    });
  }

  seal(record, {
    integrityTarget = null,
    signature = null,
  } = {}) {
    if (record.isSealed()) {
      return record;
    }

    const target =
      integrityTarget || {
        auditId:
          record.auditId.toString(),
        caseReference:
          record.caseReference,
        events: record.events,
        steps: record.steps,
        engineReferences:
          record.engineReferences,
        evidenceReferences:
          record.evidenceReferences,
        decisionReferences:
          record.decisionReferences,
        reviewReferences:
          record.reviewReferences,
        snapshots:
          record.snapshots,
      };

    const calculated =
      this.integrityCalculator.calculate(
        target,
      );

    const integrity =
      createAuditIntegrity({
        algorithm:
          calculated.algorithm,
        hash: calculated.hash,
        previousHash:
          calculated.previousHash,
        verified: true,
        verifiedAt:
          this.clock().toISOString(),
      });

    const sealed =
      cloneRecord(record, {
        status: "SEALED",
        integrity,
        signature,
      });

    const validation =
      this.validationService.validate(
        sealed,
      );

    if (!validation.valid) {
      throw new Error(
        `Cannot seal audit record: ${validation.issues.join(", ")}`,
      );
    }

    return sealed;
  }
}
