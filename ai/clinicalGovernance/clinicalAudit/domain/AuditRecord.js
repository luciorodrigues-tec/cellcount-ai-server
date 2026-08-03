import {
  assertAuditStatus,
} from "./AuditStatus.js";

import {
  createAuditTimeline,
} from "./AuditTimeline.js";

import {
  mergeAuditPolicy,
} from "./AuditPolicy.js";

export const AUDIT_RECORD_SCHEMA_VERSION =
  "CGL-000001-S1-v1";

export class AuditRecord {
  constructor({
    auditId,
    caseReference,
    actor,
    status = "OPEN",
    events = [],
    steps = [],
    engineReferences = [],
    evidenceReferences = [],
    decisionReferences = [],
    reviewReferences = [],
    snapshots = [],
    metrics = null,
    integrity = null,
    signature = null,
    policy = {},
    metadata = {},
  } = {}) {
    if (!auditId) {
      throw new TypeError("AuditRecord.auditId is required.");
    }

    if (!caseReference) {
      throw new TypeError(
        "AuditRecord.caseReference is required.",
      );
    }

    if (!actor) {
      throw new TypeError("AuditRecord.actor is required.");
    }

    this.schemaVersion = AUDIT_RECORD_SCHEMA_VERSION;
    this.auditId = auditId;
    this.caseReference = caseReference;
    this.actor = actor;
    this.status = assertAuditStatus(status);
    this.events = Object.freeze([...events]);
    this.steps = Object.freeze([...steps]);
    this.engineReferences =
      Object.freeze([...engineReferences]);
    this.evidenceReferences =
      Object.freeze([...evidenceReferences]);
    this.decisionReferences =
      Object.freeze([...decisionReferences]);
    this.reviewReferences =
      Object.freeze([...reviewReferences]);
    this.snapshots =
      Object.freeze([...snapshots]);
    this.metrics = metrics;
    this.integrity = integrity;
    this.signature = signature;
    this.policy = mergeAuditPolicy(policy);
    this.timeline = createAuditTimeline(this.events);
    this.metadata = Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    });

    this.#validate();
    Object.freeze(this);
  }

  #validate() {
    if (
      this.events.length >
      this.policy.maximumEvents
    ) {
      throw new Error(
        "AuditRecord exceeds maximumEvents.",
      );
    }

    if (
      this.steps.length >
      this.policy.maximumSteps
    ) {
      throw new Error(
        "AuditRecord exceeds maximumSteps.",
      );
    }

    if (
      this.snapshots.length >
      this.policy.maximumSnapshots
    ) {
      throw new Error(
        "AuditRecord exceeds maximumSnapshots.",
      );
    }

    if (
      this.policy.requirePseudonymizedPatientId &&
      !this.caseReference.pseudonymizedPatientId
    ) {
      throw new Error(
        "AuditRecord requires pseudonymizedPatientId.",
      );
    }

    if (
      this.status === "SEALED" &&
      this.policy.requireEngineReferences &&
      this.engineReferences.length === 0
    ) {
      throw new Error(
        "Sealed AuditRecord requires engine references.",
      );
    }

    if (
      this.status === "SEALED" &&
      this.policy.requireDecisionReferenceBeforeSeal &&
      this.decisionReferences.length === 0
    ) {
      throw new Error(
        "Sealed AuditRecord requires a decision reference.",
      );
    }

    if (
      this.status === "SEALED" &&
      this.policy.requireIntegrityBeforeSeal &&
      !this.integrity
    ) {
      throw new Error(
        "Sealed AuditRecord requires integrity data.",
      );
    }
  }

  isSealed() {
    return this.status === "SEALED";
  }

  canMutate() {
    return (
      !this.isSealed() ||
      this.policy.allowMutationAfterSeal
    );
  }
}
